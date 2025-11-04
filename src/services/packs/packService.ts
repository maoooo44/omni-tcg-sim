/**
 * src/services/packs/packService.ts
 *
 * * Pack（パック）データのデータベースアクセス、ローカルキャッシュ管理、および関連するロジックを管理するサービス層モジュール。
 * * 責務:
 * 1. Pack の CRUD 操作を担う（**バルク操作に統一**）。
 * 2. メインコレクション（'packs'）において Pack のローカルキャッシュ（_packCache）を管理し、パフォーマンスを向上させる。
 * 3. Packの物理削除時、関連するCardデータも物理削除する処理を **cardService** に委譲することで、責務の分離とカスケード処理を行う。
 * 4. DB操作のロギングとエラーハンドリングを行う。
 */
import type { Pack } from "../../models/models";
import {
    fetchAllItemsFromCollection,
    bulkPutItemsToCollection,
    bulkDeleteItemsFromCollection,
    bulkFetchItemsByIdsFromCollection,
    bulkUpdateItemsSingleFieldToCollection,
    bulkUpdateItemsMultipleFieldsToCollection,
} from '../database/dbCore';
import { cardService } from '../cards/cardService';
import {
    packToDBPack,
    dbPackToPack,
} from '../database/dbMappers';
import type { DBPack } from "../../models/models";

let _packCache: Map<string, Pack> | null = null;

export type CollectionKey = 'packs';


export const packService = {

    // ----------------------------------------
    // Cache Load / Read (キャッシュ/DBからの取得)
    // ----------------------------------------

    getAllPacksFromCache(): Pack[] {
        return _packCache ? Array.from(_packCache.values()) : [];
    },

    getPackByIdFromCache(packId: string): Pack | undefined {
        return _packCache?.get(packId);
    },

    /**
     * Pack IDを指定して複数のパックを一括取得します。（バルク処理に一本化）
     * メインコレクション（'packs'）からのみ取得します。
     * @param ids - Pack IDの配列。
     * @returns Pack | null の配列。結果配列の順序は ids の順序と一致します。
     */
    async fetchPacksByIds(ids: string[]): Promise<(Pack | null)[]> {
        if (ids.length === 0) return [];

        const collectionKey: CollectionKey = 'packs';
        console.log(`[PackService:fetchPacksByIds] 🔍 Fetching ${ids.length} packs from ${collectionKey} (Bulk).`);

        // 1. キャッシュヒットしたPackと、DBからフェッチが必要なIDを分離
        const resultsMap = new Map<string, Pack>();
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
            console.log(`[PackService:fetchPacksByIds] ➡️ Cache miss for ${idsToFetchFromDB.length} IDs. Fetching from DB...`);

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
    },

    /**
     * メインコレクション（'packs'）から全ての Pack データを取得します。
     */
    async fetchAllPacks(): Promise<Pack[]> {
        const collectionKey: CollectionKey = 'packs';
        console.log(`[PackService:fetchAllPacks] 🔍 Fetching all packs from ${collectionKey}.`);

        if (_packCache) {
            console.log(`[PackService:fetchAllPacks] ✅ Cache hit (all packs).`);
            return this.getAllPacksFromCache();
        }

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
            console.error(`[PackService:fetchAllPacks] ❌ Failed to fetch from ${collectionKey}:`, error);
            throw error;
        }
    },


    // ----------------------------------------
    // CRUD (保存・更新の一本化 - バルク対応)
    // ----------------------------------------

    /**
     * Pack[] をメインコレクション（'packs'）に保存します。（バルク処理）
     */
    async savePacks(itemsToSave: Pack[]): Promise<Pack[]> {

        if (itemsToSave.length === 0) return [];

        const collectionKey: CollectionKey = 'packs';
        console.log(`[PackService:savePacks] 💾 Saving ${itemsToSave.length} packs to ${collectionKey}...`);

        const packDataArray = itemsToSave;

        // PackモデルをそのままDBPackに変換
        const recordsToSave = packDataArray.map(packToDBPack);

        try {
            // DBに一括保存
            await bulkPutItemsToCollection<DBPack>(collectionKey, recordsToSave);

            // DBレコードからPackモデルを再構成し、キャッシュと戻り値に使用する
            const savedPacks = recordsToSave.map(dbPackToPack);
            savedPacks.forEach(pack => _packCache?.set(pack.packId, pack));

            console.log(`[PackService:savePacks] ✅ Successfully saved ${savedPacks.length} packs to ${collectionKey}.`);
            return savedPacks;

        } catch (error) {
            console.error(`[PackService:savePacks] ❌ Failed to save packs to ${collectionKey}:`, error);
            throw error;
        }

    },

    // ----------------------------------------
    // Physical Deletion (物理削除)
    // ----------------------------------------

    /**
     * Pack IDを指定して Pack データをメインコレクションから物理削除します。（バルク対応）
     * @param ids - Pack IDの配列。
     */
    async deletePacks(ids: string[]): Promise<void> {
        if (ids.length === 0) return;

        const collectionKey: CollectionKey = 'packs';
        console.log(`[PackService:deletePacks] 🗑️ Deleting ${ids.length} packs from ${collectionKey}.`);

        try {
            // 1. PackをDBから一括削除
            await bulkDeleteItemsFromCollection(collectionKey, ids);

            // 2. キャッシュを更新
            ids.forEach(id => _packCache?.delete(id));

            // 3. 物理カスケード: packs から削除する場合は、関連カードも物理削除
            await cardService.deleteCardsByPackIds(ids);

            console.log(`[PackService:deletePacks] ✅ Deleted ${ids.length} packs from ${collectionKey} and physically deleted associated cards.`);
        } catch (error) {
            console.error(`[PackService:deletePacks] ❌ Failed to delete from ${collectionKey}:`, error);
            throw error;
        }

    },

    // ----------------------------------------
    // Field Update (ストアアクションから利用)
    // ----------------------------------------

    /**
     * 複数のPackアイテムの特定のフィールドを、すべて同じ値で一括更新します。
     * @param ids 更新するPackの主キーの配列
     * @param field 更新するフィールド名 ('isFavorite', 'updatedAt'など)
     * @param value 設定する新しい値 (全IDに適用)
     * @returns 更新されたレコードの総数
     */
    async updatePacksSingleField(
        ids: string[],
        field: string,
        value: any
    ): Promise<number> {
        const collectionKey: CollectionKey = 'packs';
        console.log(`[PackService:updatePacksSingleField] ⚡️ Bulk updating field '${field}' on ${collectionKey} for ${ids.length} items.`);
        
        try {
            // dbCoreの汎用バルク更新関数をコレクション名 'packs' 固定で呼び出す
            const numUpdated = await bulkUpdateItemsSingleFieldToCollection(
                ids,
                collectionKey,
                field,
                value
            );
            
            // ★キャッシュ更新ロジック: 更新されたフィールドが 'isFavorite' の場合、キャッシュも更新すべきだが、
            // 2. キャッシュ更新ロジックの修正: _cardCache が null でないことを確認
            if (numUpdated > 0 && _packCache) { // ★ 修正: _packCache が存在することを保証
                const cache = _packCache; // nullでないことが保証されたローカル変数に代入

                ids.forEach(id => {
                    const cachedPack = cache.get(id); // ローカル変数 'cache' を使用
                    if (cachedPack) {
                        // キャッシュ内のオブジェクトの新しいコピーを作成し、特定のフィールドを更新
                        const updatedPack: Pack = { 
                            ...cachedPack,
                            [field]: value 
                        } as Pack;
                        // キャッシュに上書き保存
                        cache.set(id, updatedPack); // ローカル変数 'cache' を使用
                        console.log(`[PackService:updatePacksSingleField] ✅ Cache updated for Pack ID: ${id}.`);
                    }
                });
            }
            
            return numUpdated;

        } catch (error) {
            console.error(`[PackService:updatePacksSingleField] ❌ Failed to update field ${field}:`, error);
            throw error;
        }
    },

    /**
     * 複数のPackアイテムに対して、同じフィールドを一括更新します。
     * @param ids 更新する Pack の ID 配列
     * @param fields 更新するフィールド（Partial<Pack>）。updatedAt はストア層で追加される前提
     * @returns 更新されたレコードの総数
     */
    async updatePacksMultipleFields(
        ids: string[],
        fields: Partial<Pack>
    ): Promise<number> {
        const collectionKey: CollectionKey = 'packs';
        console.log(`[PackService:updatePacksMultipleFields] ⚡️ Bulk updating multiple fields on ${collectionKey} for ${ids.length} items.`);
        
        try {
            // dbCoreの汎用バルク更新関数を呼び出す
            const updates = ids.map(id => ({ id, ...fields }));
            const numUpdated = await bulkUpdateItemsMultipleFieldsToCollection(
                ids,
                collectionKey,
                updates
            );
            
            // キャッシュ更新ロジック
            if (numUpdated > 0 && _packCache) {
                const cache = _packCache;

                ids.forEach(id => {
                    const cachedPack = cache.get(id);
                    if (cachedPack) {
                        // 更新内容をマージして新しいオブジェクトを作成
                        const updatedPack: Pack = { 
                            ...cachedPack,
                            ...fields
                        } as Pack;
                        cache.set(id, updatedPack);
                        console.log(`[PackService:updatePacksMultipleFields] ✅ Cache updated for Pack ID: ${id}.`);
                    }
                });
            }
            
            return numUpdated;

        } catch (error) {
            console.error(`[PackService:updatePacksMultipleFields] ❌ Failed to update multiple fields:`, error);
            throw error;
        }
    },
    
};