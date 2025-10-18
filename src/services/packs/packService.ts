/**
* src/services/packs/packService.ts
*
* Pack（パック）データ、PackBundle（パックと関連カードのセット）のデータベースアクセス、ローカルキャッシュ管理、および関連するロジックを管理するサービス層モジュール。
* * 責務:
* 1. Pack / PackBundle の CRUD 操作を担う（バルク操作に統一）。
* 2. メインコレクション（'packs'）では Pack のローカルキャッシュ（_packCache）を管理し、パフォーマンスを向上させる。
* 3. 履歴（'history'）やゴミ箱（'trash'）などアーカイブコレクションへの操作（保存、削除）は **archiveService** に委譲する。
* 4. 関連カードの操作（物理削除、復元時の登録）は **cardService** に委譲することで、責務の分離を徹底する。
* 5. Packの復元処理をオーケストレーションする（Pack/Cardのメインコレクションへの登録と、アーカイブからの削除）。
* 6. `CollectionKey` (main/archive) に応じた Pack データ（Pack[]）の取得インターフェースを提供する。
* 7. Archive専用の PackBundle（Packと関連CardをまとめたDTO/Domain Model）の取得インターフェースを提供する。
*/
import type { Pack, PackBundle } from "../../models/pack";
import type { Card } from "../../models/card";
import { 
    fetchAllItemsFromCollection, 
    bulkPutItemsToCollection, 
    bulkDeleteItemsFromCollection, 
    bulkFetchItemsByIdsFromCollection, 
} from '../database/dbCore'; // 修正の痕跡（コメントアウト）を削除
import { cardService } from '../cards/cardService'; 
import { 
    packToDBPack, 
    dbPackToPack, 
    dbArchiveToPack, 
    dbArchiveToPackBundle, 
    packBundleToDBArchive 
} from '../database/dbMappers'; 
import type { DBPack, DBArchive, ArchiveItemType } from "../../models/db-types"; 
import { 
    archiveService, 
    type ArchiveCollectionKey
} from '../archive/archiveService'; 

let _packCache: Map<string, Pack> | null = null; 

export type CollectionKey = 'packs' | ArchiveCollectionKey; 
const ARCHIVE_ITEM_TYPE: ArchiveItemType = 'packBundle';

// ----------------------------------------

// 修正の痕跡を削除（コメントアウトされていたヘルパー関数を完全に削除）
// const prepareDBPackRecord = (pack: Pack): DBPack => {
//     return packToDBPack(pack);
// };


export const packService = {

    // ----------------------------------------
    // [1] Cache Load / Read (キャッシュ/DBからの取得)
    // ----------------------------------------

    getAllPacksFromCache(): Pack[] { 
        return _packCache ? Array.from(_packCache.values()) : []; 
    },
    
    getPackByIdFromCache(packId: string): Pack | undefined { 
        return _packCache?.get(packId); 
    },
    
    /**
     * IDを指定して複数のパックを一括取得します。（バルク処理に一本化）
     * @param ids - 'packs'の場合は Pack IDの配列。 'trash', 'history'の場合は Archive IDの配列。
     * @param collectionKey - 'packs' (メイン), 'trash', または 'history'
     * @returns Pack | null の配列。結果配列の順序は ids の順序と一致します。
     */
    async fetchPacksByIdsFromCollection(ids: string[], collectionKey: CollectionKey = 'packs'): Promise<(Pack | null)[]> {
        if (ids.length === 0) return [];
        
        console.log(`[PackService:fetchPacksByIdsFromCollection] 🔍 Fetching ${ids.length} items from ${collectionKey} (Bulk).`);

        if (collectionKey === 'packs') {
            
            // 1. キャッシュヒットしたPackと、DBからフェッチが必要なIDを分離
            const resultsMap = new Map<string, Pack>(); // キャッシュとDBからの結果を保持
            const idsToFetchFromDB: string[] = [];

            for (const packId of ids) {
                const cachedPack = this.getPackByIdFromCache(packId);
                if (cachedPack) {
                    resultsMap.set(packId, cachedPack);
                } else {
                    idsToFetchFromDB.push(packId);
                }
            }

            // 2. DBからのバルク取得が必要な場合
            if (idsToFetchFromDB.length > 0) {
                console.log(`[PackService:fetchPacksByIdsFromCollection] ➡️ Cache miss for ${idsToFetchFromDB.length} IDs. Fetching from DB...`);
                
                // dbCore の正式なバルク取得関数を使用
                const fetchedPacksOrNull = await bulkFetchItemsByIdsFromCollection<Pack, DBPack>(
                    idsToFetchFromDB, 
                    collectionKey,
                    dbPackToPack 
                );
                
                // 3. 取得結果を Pack に変換し、キャッシュと結果Mapに追加
                fetchedPacksOrNull.forEach(pack => {
                    if (pack) {
                        // DBから取得したPackをキャッシュに追加
                        _packCache?.set(pack.packId, pack); 
                        // 結果Mapに追加
                        resultsMap.set(pack.packId, pack);
                    }
                });
            }

            // 4. 元の ids の順序で結果配列を再構成（resultsMapにはキャッシュヒット分とDB取得分が入っている）
            const finalPacks: (Pack | null)[] = ids.map(id => resultsMap.get(id) ?? null);
            
            return finalPacks;

        } else if (collectionKey === 'trash' || collectionKey === 'history') {
            // archiveService から取得し、dbArchiveToPack で Pack データのみ抽出を委譲
            // ここで渡す ids はアーカイブコレクションの主キー (Archive ID) である
            return archiveService.fetchItemsByIdsFromArchive<Pack>( 
                ids, // Archive IDの配列
                collectionKey, 
                dbArchiveToPack as (dbRecord: DBArchive) => Pack
            );
        } else {
            console.error(`[PackService:fetchPacksByIdsFromCollection] ❌ Invalid collection key: ${collectionKey}`);
            return ids.map(() => null);
        }
    },

    /**
     * 指定されたコレクションから全ての Pack データを取得します。アーカイブでもリスト表示する際はこちらを使用．
     */
    async fetchAllPacksFromCollection(collectionKey: CollectionKey): Promise<Pack[]> {
        console.log(`[PackService:fetchAllPacksFromCollection] 🔍 Fetching from collection: ${collectionKey}`);
        
        if (collectionKey === 'packs' && _packCache) { 
            console.log(`[PackService:fetchAllPacksFromCollection] ✅ Cache hit (all packs).`);
            return this.getAllPacksFromCache(); 
        }

        if (collectionKey === 'packs') {
            const converter = dbPackToPack as (dbRecord: DBPack) => Pack;
            
            try {
                // dbCore.fetchAllItemsFromCollection はコレクション全体を取得するバルク操作
                const packs = await fetchAllItemsFromCollection<Pack, DBPack>(
                    collectionKey,
                    converter
                );
                
                if (!_packCache) { 
                    _packCache = new Map(packs.map(p => [p.packId, p])); 
                }
                return packs;
            } catch (error) {
                console.error(`[PackService:fetchAllPacksFromCollection] ❌ Failed to fetch from ${collectionKey}:`, error);
                throw error;
            }

        } else if (collectionKey === 'trash' || collectionKey === 'history') {
             // archiveService から取得し、dbArchiveToPack で Pack データのみ抽出を委譲
            return archiveService.fetchAllItemsFromArchive<Pack>(
                collectionKey, 
                dbArchiveToPack as (dbRecord: DBArchive) => Pack
            );
        } else {
            console.error(`[PackService:fetchAllPacksFromCollection] ❌ Invalid collection key: ${collectionKey}`);
            return [];
        }
    },

    /**
     * history/trashコレクションから PackBundle 全体を取得します。（バルク対応）
     * アーカイブから個別のパックにアクセスするときはこちらを使用．
     * @param archiveIds - 取得するアーカイブレコードの主キー (DBArchive.archiveId) の配列
     * @param collectionKey - 'trash' または 'history'
     * @returns 復元された PackBundle の配列。見つからないIDに対応する要素は null になる可能性がある。
     */
    async fetchPackBundlesFromCollection(archiveIds: string[], collectionKey: ArchiveCollectionKey): Promise<(PackBundle | null)[]> {
        if (collectionKey !== 'history' && collectionKey !== 'trash') {
            throw new Error("この関数は 'history' または 'trash' のみに使用されます。");
        }

        if (archiveIds.length === 0) {
            return [];
        }
        
        // archiveService.fetchItemsByIdsFromArchive を使用（DBArchiveの配列を取得）
        const dbArchiveRecords = await archiveService.fetchItemsByIdsFromArchive<DBArchive>(
            archiveIds, 
            collectionKey, 
            (dbRecord) => dbRecord // コンバータとしてそのまま返す関数を使用
        ); 

        // DBArchiveレコードの配列をPackBundleの配列に変換（nullを含む可能性がある）
        const bundles = dbArchiveRecords.map(dbRecord => {
            if (!dbRecord) return null;
            // dbArchiveToPackBundle は DBArchive を PackBundle に変換するマッパー
            return dbArchiveToPackBundle(dbRecord);
        });

        return bundles;
    },


    // ----------------------------------------
    // [2] CRUD (保存・更新の一本化 - バルク対応)
    // ----------------------------------------

    /**
     * @param itemsToSave - 'packs' の場合は Pack[]。 'history'/'trash' の場合は PackBundle[]。
     */
    async savePacksToCollection(
        itemsToSave: Pack[] | PackBundle[], 
        collectionKey: CollectionKey
    ): Promise<Pack[] | void> { 
        
        if (itemsToSave.length === 0) return collectionKey === 'packs' ? [] : undefined;
        
        console.log(`[PackService:savePacksToCollection] 💾 Saving ${itemsToSave.length} items to ${collectionKey}...`);
        
        // packs コレクションへの保存 (Pack[]として扱う)
        if (collectionKey === 'packs') {
            const packDataArray = itemsToSave as Pack[]; 
            
            // PackモデルをそのままDBPackに変換
            const recordsToSave = packDataArray.map(packToDBPack); 

            try {
                // DBに一括保存
                await bulkPutItemsToCollection<DBPack>('packs', recordsToSave);

                // DBレコードからPackモデルを再構成し、キャッシュと戻り値に使用する
                const savedPacks = recordsToSave.map(dbPackToPack);
                savedPacks.forEach(pack => _packCache?.set(pack.packId, pack));
                
                console.log(`[PackService:savePacksToCollection] ✅ Successfully saved ${savedPacks.length} packs to 'packs'.`);
                return savedPacks; // 正確な Pack[] を返す

            } catch (error) {
                console.error(`[PackService:savePacksToCollection] ❌ Failed to save packs to 'packs':`, error);
                throw error;
            }

        } else if (collectionKey === 'history' || collectionKey === 'trash') {
            // history/trash コレクションへの保存（PackBundle[]として扱う）
            const bundlesToSave = itemsToSave as PackBundle[]; 
            const collection: ArchiveCollectionKey = collectionKey;

            try {
                // PackBundle[] を archiveService のバルクAPIが期待する形式に変換
                const itemsForArchiveService = bundlesToSave.map(bundle => {
                    // PackBundleをDBArchiveモデルに変換し、マッパーに責務を委譲
                    const dbArchiveRecord = packBundleToDBArchive(bundle);
                    
                    // archiveService.saveItemsToArchive が期待する ArchiveItem 形式に合わせる
                    return {
                        itemType: ARCHIVE_ITEM_TYPE, // 'packBundle'
                        itemId: dbArchiveRecord.itemId, // DBArchiveが持つID (PackId)
                        data: dbArchiveRecord.itemData // DBArchiveのitemData部分 (DBPackBundle)
                    };
                });
                
                // archiveService.saveItemsToArchive はバルク関数
                await archiveService.saveItemsToArchive(
                    collection, // ArchiveCollectionKey
                    itemsForArchiveService 
                );
                
                console.log(`[PackService:savePacksToCollection] ✅ Successfully saved ${bundlesToSave.length} bundles to '${collectionKey}'.`);
                return; 

            } catch (error) {
                console.error(`[PackService:savePacksToCollection] ❌ Failed to save bundles to '${collectionKey}':`, error);
                throw error;
            }
        } else {
             console.error(`[PackService:savePacksToCollection] ❌ Invalid collection key: ${collectionKey}`);
             throw new Error("無効なコレクションキーです。");
        }
    },
    
    // ----------------------------------------
    // [3] Logical Deletion/Restore (論理削除/復元)
    // ----------------------------------------

    /**
     * 指定されたアーカイブアイテム（PackBundle）群をメインコレクションに復元します。（バルク対応）
     */
    async restorePackBundlesFromArchive(archiveIds: string[], collectionKey: ArchiveCollectionKey): Promise<Pack[]> {
        if (archiveIds.length === 0) return [];

        console.log(`[PackService:restorePackBundlesFromArchive] 🔄 Restoring ${archiveIds.length} items from ${collectionKey} (Bulk)...`);

        if (collectionKey !== 'trash' && collectionKey !== 'history') {
             throw new Error(`Invalid archive collection key for restore: ${collectionKey}`);
        }

        try {
            // 1. PackBundle群をアーカイブから一括フェッチ
            const bundles = await this.fetchPackBundlesFromCollection(archiveIds, collectionKey);
            
            // nullを除外し、有効なBundleのみを抽出
            const validBundles = bundles.filter((b): b is PackBundle => b !== null);
            const numValidBundles = validBundles.length;

            if (numValidBundles === 0) {
                 console.log(`[PackService:restorePackBundlesFromArchive] ⚠️ No valid archive items found among ${archiveIds.length} requested IDs.`);
                 return []; 
            }

            const packsToRestore: Pack[] = [];
            const cardsToRestore: Card[] = [];
            
            // 2. PackとCardを分離
            validBundles.forEach(bundle => {
                packsToRestore.push(bundle.packData);
                if (bundle.cardsData) {
                    cardsToRestore.push(...bundle.cardsData);
                }
            });

            // 3. Pack群をメインコレクションにバルク登録
            // savePacksToCollectionは 'packs' の場合 Pack[] を返すことが保証されている
            const savedPacksOrVoid = await this.savePacksToCollection(packsToRestore, 'packs');
            const savedPacks = savedPacksOrVoid as Pack[];

            // 4. 関連する Card 群を CardService に委譲してメインコレクションにバルク登録
            if (cardsToRestore.length > 0) {
                await cardService.saveCardsToCollection(cardsToRestore); // cardServiceに登録を委譲
            }
            
            // 5. 元のアーカイブレコードを削除 (履歴の場合は残す)
            if (collectionKey === 'trash') {
               // trash の場合のみ削除を実行
               await archiveService.deleteItemsFromArchive(archiveIds, collectionKey);
               console.log(`[PackService:restorePackBundlesFromArchive] Deleted ${archiveIds.length} items from ${collectionKey}.`);
            } else if (collectionKey === 'history') {
             // history の場合は削除しない (スナップショットを保持)
              console.log(`[PackService:restorePackBundlesFromArchive] Retained ${archiveIds.length} items in ${collectionKey} as historical record.`);
            }

            console.log(`[PackService:restorePackBundlesFromArchive] ✅ Successfully restored ${numValidBundles} packs and ${cardsToRestore.length} cards from ${collectionKey}.`);
            
            return savedPacks;

        } catch (error) {
            const idList = archiveIds.slice(0, 3).join(', ');
            console.error(`[PackService:restorePackBundlesFromArchive] ❌ Failed to restore archive items [${idList}...] from ${collectionKey}:`, error);
            // 処理を呼び出し元（Store）に伝えるため、エラーを再スロー
            throw error;
        }
    },


    /**
     * 指定されたコレクションから Pack データを ID 指定で物理削除します。（バルク対応）
     * @param ids - 'packs'の場合は Pack IDの配列。 'trash', 'history'の場合は Archive IDの配列。
     * @param collectionKey - 削除対象のコレクション ('packs', 'trash', または 'history')
     */
    async deletePacksFromCollection(ids: string[], collectionKey: CollectionKey): Promise<void> { 
        if (ids.length === 0) return;
        
        console.log(`[PackService:deletePacksFromCollection] 🗑️ Deleting ${ids.length} items from ${collectionKey}.`);
        
        if (collectionKey === 'packs') {
             try {
                 // 1. PackをDBから一括削除
                 await bulkDeleteItemsFromCollection('packs', ids);

                 // 2. キャッシュを更新
                 ids.forEach(id => _packCache?.delete(id)); 
                 
                 // 3. 物理カスケード: packs から削除する場合は、関連カードも物理削除
                 await cardService.deleteCardsByPackId(ids); 

                 console.log(`[PackService:deletePacksFromCollection] ✅ Deleted ${ids.length} packs from ${collectionKey} and physically deleted associated cards.`);
             } catch (error) {
                 console.error(`[PackService:deletePacksFromCollection] ❌ Failed to delete from ${collectionKey}:`, error);
                 throw error;
             }
        } else if (collectionKey === 'trash' || collectionKey === 'history') {
             // archiveService に処理を委譲（PackBundleの一括削除）
             // ids はアーカイブコレクションでは Archive IDとして扱われる
             const collection: ArchiveCollectionKey = collectionKey as ArchiveCollectionKey;
             await archiveService.deleteItemsFromArchive(ids, collection);

             console.log(`[PackService:deletePacksFromCollection] ✅ Deleted ${ids.length} bundles from ${collectionKey}.`);
        } else {
             console.error(`[PackService:deletePacksFromCollection] ❌ Invalid collection key: ${collectionKey}`);
             throw new Error("無効なコレクションキーです。");
        }
    },


    // ----------------------------------------
    // [4] Maintenance (クリーンアップ)
    // ----------------------------------------

    /**
     * ガベージコレクションを実行します。（全ロジックを archiveService に委譲）
     */
    async runPackGarbageCollection(): Promise<void> {
        
        console.log(`[PackService:runPackGarbageCollection] 🧹 START running garbage collection for ${ARCHIVE_ITEM_TYPE}...`);

        // archiveService の汎用 GC 関数を呼び出す
        await archiveService.runArchiveGarbageCollection(ARCHIVE_ITEM_TYPE);
        
        console.log(`[PackService:runPackGarbageCollection] ✅ Garbage collection complete.`);
    }
};