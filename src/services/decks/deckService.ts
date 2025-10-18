/**
 * src/services/decks/deckService.ts
 *
 * Deck（デッキ）データに関するサービス層。
 * 責務:
 * 1. メインコレクション（'decks'）における Deck データの CRUD 操作（キャッシュ同期を含む）。
 * 2. DBコア層（dbCore）とデータマッパー（dbMappers）の橋渡し。
 * 3. ゴミ箱（'trash'）および履歴（'history'）コレクションへの操作を archiveService に委譲し、Deck データとしての入出力を調整する。
 * 4. ID指定または全件取得時のキャッシュからの高速アクセスを提供。
 * 5. 論理削除/復元のオーケストレーション。
 * 6. 全ての永続化・削除操作を**バルク処理**に一本化する。
 */
import type { Deck } from "../../models/deck";
import { 
    fetchAllItemsFromCollection, 
    bulkPutItemsToCollection,
    bulkDeleteItemsFromCollection,
    bulkFetchItemsByIdsFromCollection,
    // DbCollectionName は使用しないため削除
} from '../database/dbCore';
import { 
    deckToDBDeck, 
    dbDeckToDeck, 
    dbArchiveToDeck,
} from '../database/dbMappers';
import type { DBDeck, DBArchive, ArchiveItemType } from "../../models/db-types";
import { 
    archiveService, 
    type ArchiveCollectionKey 
} from '../archive/archiveService'; 

let _deckCache: Map<string, Deck> | null = null; 

export type CollectionKey = 'decks' | ArchiveCollectionKey;
const ARCHIVE_ITEM_TYPE: ArchiveItemType = 'deck'; 


export const deckService = {

    // ----------------------------------------
    // [1] Cache Load / Read (キャッシュ/DBからの取得)
    // ----------------------------------------

    getAllDecksFromCache(): Deck[] { 
        return _deckCache ? Array.from(_deckCache.values()) : []; 
    },
    
    getDeckByIdFromCache(deckId: string): Deck | undefined { 
        return _deckCache?.get(deckId); 
    },

    /**
     * IDを指定して複数のデッキを一括取得します。（バルク処理に一本化）
     * @param ids - 'decks'の場合は Deck IDの配列。 'trash', 'history'の場合は Archive IDの配列。
     * @param collectionKey - 'decks' (メイン), 'trash', または 'history'
     * @returns Deck | null の配列。結果配列の順序は ids の順序と一致します。
     */
    async fetchDecksByIdsFromCollection(ids: string[], collectionKey: CollectionKey = 'decks'): Promise<(Deck | null)[]> {
        if (ids.length === 0) return [];
        
        console.log(`[DeckService:fetchDecksByIdsFromCollection] 🔍 Fetching ${ids.length} items from ${collectionKey} (Bulk).`);

        if (collectionKey === 'decks') {
            
            // 1. キャッシュヒットしたDeckと、DBからフェッチが必要なIDを分離
            const resultsMap = new Map<string, Deck>();
            const idsToFetchFromDB: string[] = [];

            for (const deckId of ids) {
                const cachedDeck = this.getDeckByIdFromCache(deckId);
                if (cachedDeck) {
                    resultsMap.set(deckId, cachedDeck);
                } else {
                    idsToFetchFromDB.push(deckId);
                }
            }

            // 2. DBからのバルク取得が必要な場合
            if (idsToFetchFromDB.length > 0) {
                console.log(`[DeckService:fetchDecksByIdsFromCollection] ➡️ Cache miss for ${idsToFetchFromDB.length} IDs. Fetching from DB...`);
                
                // dbCore の正式なバルク取得関数を使用
                const fetchedDecksOrNull = await bulkFetchItemsByIdsFromCollection<Deck, DBDeck>(
                    idsToFetchFromDB, 
                    collectionKey,
                    dbDeckToDeck 
                );
                
                // 3. 取得結果を Deck に変換し、キャッシュと結果Mapに追加
                fetchedDecksOrNull.forEach(deck => {
                    if (deck) {
                        _deckCache?.set(deck.deckId, deck);
                        resultsMap.set(deck.deckId, deck);
                    }
                });
            }

            // 4. 元の ids の順序で結果配列を再構成
            const finalDecks: (Deck | null)[] = ids.map(id => resultsMap.get(id) ?? null);
            
            return finalDecks;

        } else if (collectionKey === 'trash' || collectionKey === 'history') {
            // archiveService から取得し、dbArchiveToDeck で Deck データのみ抽出を委譲
            return archiveService.fetchItemsByIdsFromArchive<Deck>( 
                ids, // Archive IDの配列
                collectionKey, 
                dbArchiveToDeck as (dbRecord: DBArchive) => Deck
            );
        } else {
            console.error(`[DeckService:fetchDecksByIdsFromCollection] ❌ Invalid collection key: ${collectionKey}`);
            return ids.map(() => null);
        }
    },


    /**
     * 指定されたコレクションから全ての Deck データを取得します。（バルク対応）
     */
    async fetchAllDecksFromCollection(collectionKey: CollectionKey): Promise<Deck[]> {
        console.log(`[DeckService:fetchAllDecksFromCollection] 🔍 Fetching from collection: ${collectionKey}`);
        
        if (collectionKey === 'decks' && _deckCache) {
            console.log(`[DeckService:fetchAllDecksFromCollection] ✅ Cache hit (all decks).`);
            return this.getAllDecksFromCache();
        }

        if (collectionKey === 'decks') {
            const converter = dbDeckToDeck as (dbRecord: DBDeck) => Deck;
            try {
                const decks = await fetchAllItemsFromCollection<Deck, DBDeck>(
                    collectionKey,
                    converter
                );
                if (!_deckCache) {
                    _deckCache = new Map(decks.map(d => [d.deckId, d]));
                }
                return decks;
            } catch (error) {
                console.error(`[DeckService:fetchAllDecksFromCollection] ❌ Failed to fetch from ${collectionKey}:`, error);
                throw error;
            }
        } else if (collectionKey === 'trash' || collectionKey === 'history') {
             // archiveService から取得し、dbArchiveToDeck で Deck データのみ抽出を委譲
            return archiveService.fetchAllItemsFromArchive<Deck>(
                collectionKey,
                dbArchiveToDeck as (dbRecord: DBArchive) => Deck
            );
        } else {
            console.error(`[DeckService:fetchAllDecksFromCollection] ❌ Invalid collection key: ${collectionKey}`);
            return [];
        }
    },

    // ----------------------------------------
    // [2] CRUD (保存・更新の一本化 - バルク対応)
    // ----------------------------------------

    /**
     * Deck データを指定されたコレクションに一括で保存（Upsert）します。
     * @param itemsToSave - 保存する Deck モデルの配列。updatedAtは呼び出し元が設定済みである必要があります。
     * @param collectionKey - 'decks', 'trash', または 'history'
     */
    async saveDecksToCollection(
        itemsToSave: Deck[],
        collectionKey: CollectionKey
    ): Promise<Deck[] | void> {
        
        if (itemsToSave.length === 0) return collectionKey === 'decks' ? [] : undefined;
        
        console.log(`[DeckService:saveDecksToCollection] 💾 Saving ${itemsToSave.length} items to ${collectionKey}...`);
        
        // decks コレクションへの保存 (Deck[]として扱う) 
        if (collectionKey === 'decks') {
            
            // updatedAtは呼び出し元（Store）で設定されている前提
            const recordsToSave = itemsToSave.map(deckToDBDeck);

            try {
                // DBに一括保存
                await bulkPutItemsToCollection<DBDeck>('decks', recordsToSave);

                // キャッシュと戻り値を準備
                const savedDecks = recordsToSave.map(dbRecord => dbDeckToDeck(dbRecord));
                savedDecks.forEach(deck => _deckCache?.set(deck.deckId, deck));
                
                console.log(`[DeckService:saveDecksToCollection] ✅ Successfully saved ${savedDecks.length} decks to 'decks'.`);
                return savedDecks;

            } catch (error) {
                console.error(`[DeckService:saveDecksToCollection] ❌ Failed to save decks to 'decks':`, error);
                throw error;
            }

        } else if (collectionKey === 'history' || collectionKey === 'trash') {
            // history/trash コレクションへの保存（Deck[]をArchiveItem[]に変換して委譲）
            const collection: ArchiveCollectionKey = collectionKey;

            try {
                // Deck[] を ArchiveItem 形式に変換
                const itemsForArchiveService = itemsToSave.map(deck => {
                    const dbDeckRecord = deckToDBDeck(deck);
                    
                    return {
                        itemType: ARCHIVE_ITEM_TYPE,
                        itemId: deck.deckId, 
                        data: dbDeckRecord // DBDeckをそのままitemDataとして格納
                    };
                });
                
                // archiveService.saveItemsToArchive はバルク関数
                await archiveService.saveItemsToArchive(
                    collection,
                    itemsForArchiveService
                );
                
                console.log(`[DeckService:saveDecksToCollection] ✅ Successfully saved ${itemsToSave.length} decks to '${collectionKey}' via archiveService.`);
                return; 

            } catch (error) {
                console.error(`[DeckService:saveDecksToCollection] ❌ Failed to save decks to '${collectionKey}' via archiveService:`, error);
                throw error;
            }
        } else {
            console.error(`[DeckService:saveDecksToCollection] ❌ Invalid collection key: ${collectionKey}`);
            throw new Error("無効なコレクションキーです。");
        }
    },
    
    // ----------------------------------------
    // [3] Logical Deletion/Restore (論理削除/復元)
    // ----------------------------------------

    /**
     * 指定されたアーカイブアイテム（Deck）群をメインコレクションに復元します。（バルク対応）
     * 復元後、元のアーカイブレコードを削除します。（historyからの復元時は削除しない）
     * @param archiveIds - 復元するアーカイブレコードの主キー (Archive ID) の配列。
     * @param collectionKey - 復元元のコレクション ('trash' または 'history')
     * @returns 復元された Deck モデルの配列
     */
    async restoreDecksFromArchive(archiveIds: string[], collectionKey: ArchiveCollectionKey): Promise<Deck[]> {
        if (archiveIds.length === 0) return [];

        console.log(`[DeckService:restoreDecksFromArchive] 🔄 Restoring ${archiveIds.length} items from ${collectionKey} (Bulk)...`);

        if (collectionKey !== 'trash' && collectionKey !== 'history') {
            throw new Error(`Invalid archive collection key for restore: ${collectionKey}`);
        }

        try {
            // 1. Deckをアーカイブから一括フェッチ (dbArchiveToDeckを使用)
            const restoredDecks = await archiveService.fetchItemsByIdsFromArchive<Deck>(
                archiveIds, // Archive ID の配列を渡す
                collectionKey,
                dbArchiveToDeck as (dbRecord: DBArchive) => Deck // Deckモデルに変換
            );
            
            // nullを除外し、有効なDeckのみを抽出
            const validDecks = restoredDecks.filter((d): d is Deck => d !== null);
            const numValidDecks = validDecks.length;

            if (numValidDecks === 0) {
                console.log(`[DeckService:restoreDecksFromArchive] ⚠️ No valid archive items found among ${archiveIds.length} requested IDs.`);
                return [];
            }

            // 2. Deck群をメインコレクションにバルク登録
            const savedDecks = await this.saveDecksToCollection(validDecks, 'decks') as Deck[];

            // 3. 元のアーカイブレコードを削除 (履歴の場合は残す)
            if (collectionKey === 'trash') {
                // trash の場合のみ削除を実行
                await archiveService.deleteItemsFromArchive(archiveIds, collectionKey);
                console.log(`[DeckService:restoreDecksFromArchive] Deleted ${archiveIds.length} items from ${collectionKey}.`);
            } else if (collectionKey === 'history') {
                // history の場合は削除しない (スナップショットを保持)
                console.log(`[DeckService:restoreDecksFromArchive] Retained ${archiveIds.length} items in ${collectionKey} as historical record.`);
            }

            console.log(`[DeckService:restoreDecksFromArchive] ✅ Successfully restored ${numValidDecks} decks from ${collectionKey}.`);
            
            return savedDecks;

        } catch (error) {
            const idList = archiveIds.slice(0, 3).join(', ');
            console.error(`[DeckService:restoreDecksFromArchive] ❌ Failed to restore archive items [${idList}...] from ${collectionKey}:`, error);
      　　　 throw error;
        }
    },


    /**
     * 指定されたコレクションから Deck データを ID 指定で**物理削除**します。（バルク対応）
     * @param ids - 削除するアイテムIDの配列 ('decks'ならDeckId, 'trash'/'history'ならArchiveId)
     * @param collectionKey - 'decks', 'trash', 'history' のいずれか
     */
    async deleteDecksFromCollection(ids: string[], collectionKey: CollectionKey): Promise<void> {
        if (ids.length === 0) return;
        
        console.log(`[DeckService:deleteDecksFromCollection] 🗑️ Deleting ${ids.length} items from ${collectionKey} (Bulk).`);
        
        if (collectionKey === 'decks') {
            try {
                // 1. DeckをDBから一括削除
                await bulkDeleteItemsFromCollection('decks', ids);

                // 2. キャッシュを更新
                ids.forEach(id => _deckCache?.delete(id)); 
                
                // 3. 物理カスケード: デッキには関連エンティティがないため、追加の削除処理は不要。
                
                console.log(`[DeckService:deleteDecksFromCollection] ✅ Deleted ${ids.length} decks from ${collectionKey}.`);
            } catch (error) {
                console.error(`[DeckService:deleteDecksFromCollection] ❌ Failed to delete from ${collectionKey}:`, error);
                throw error;
            }
        } else if (collectionKey === 'trash' || collectionKey === 'history') {
            // archiveService に処理を委譲（Deckアイテムの一括削除）
            const collection: ArchiveCollectionKey = collectionKey as ArchiveCollectionKey;
            await archiveService.deleteItemsFromArchive(ids, collection);

            console.log(`[DeckService:deleteDecksFromCollection] ✅ Deleted ${ids.length} decks from ${collectionKey}.`);
        } else {
            console.error(`[DeckService:deleteDecksFromCollection] ❌ Invalid collection key: ${collectionKey}`);
            throw new Error("無効なコレクションキーです。");
        }
    },

    // ----------------------------------------
    // [4] Maintenance (クリーンアップ)
    // ----------------------------------------

    /**
     * ガベージコレクションを実行します。（全ロジックを archiveService に委譲）
     */
    async runDeckGarbageCollection(): Promise<void> {
        
        console.log(`[DeckService:runDeckGarbageCollection] 🧹 START running garbage collection for ${ARCHIVE_ITEM_TYPE}...`);

        // archiveService の汎用 GC 関数を呼び出す
        await archiveService.runArchiveGarbageCollection(ARCHIVE_ITEM_TYPE); 
        
        console.log(`[DeckService:runDeckGarbageCollection] ✅ Garbage collection complete.`);
    }
};