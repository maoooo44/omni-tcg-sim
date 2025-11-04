/**
 * src/services/archive/archiveService.ts
 *
 * * アーカイブコレクション（'trash' および 'history'）に対するデータベース操作を管理するサービス層モジュール。
 * * 責務:
 * 1. DBコア層（dbCore）を介した 'trash' / 'history' コレクションへの CRUD 操作（バルク操作を基本とする）。
 * 2. 履歴アイテムの生成（createDBArchiveRecord）。
 * 3. ユーザー設定とデフォルト値に基づきGC設定値を解決し、アイテムタイプに応じたガベージコレクション（GC）の実行をトリガーする。
 * 4. 主キーとして archiveId のみを使用する統一的なインターフェースの提供。
 */
import type { ArchiveItemToSave, ArchiveCollectionKey, ArchiveItemType, DBArchive } from "../../models/models";
import {
    fetchAllItemsFromCollection,
    bulkFetchItemsByIdsFromCollection,
    bulkPutItemsToCollection,
    bulkDeleteItemsFromCollection,
    bulkUpdateItemsSingleFieldToCollection,
    runGarbageCollectionForCollection,
    type DbCollectionName
} from '../database/dbCore';
import type { PersistedUserSettings, GCSetting } from "../../models/models";
import { userDataService } from '../user-data/userDataService';
import { generateId } from '../../utils/dataUtils';
import { resolveNumberWithFallback } from '../../utils/valueResolver';
import { ARCHIVE_GC_CONFIGS } from '../../configs/configs';

// ARCHIVE_GC_CONFIGS に GCSetting 型をキャストして保持
const GC_DEFAULTS = ARCHIVE_GC_CONFIGS as unknown as GCSetting;

// ----------------------------------------
// プライベートヘルパー関数
// ----------------------------------------

/**
 * DBArchiveレコード本体を生成する汎用ヘルパー関数
 */
const createDBArchiveRecord = (
    itemId: string,
    itemType: ArchiveItemType,
    itemData: any,
    collectionKey: ArchiveCollectionKey,
    isManual: boolean = false,
): DBArchive => {

    const archivedAt = new Date().toISOString();
    const isFavorite = false;

    return {
        archiveId: generateId(),
        itemId: itemId,
        itemType: itemType,
        collectionKey: collectionKey,
        archivedAt: archivedAt,
        itemData: itemData,
        isFavorite: isFavorite,
        isManual: isManual,
    };
};

/**
 * 特定のアーカイブコレクションに対してGC設定値を解決し、GCを実行するヘルパー関数
 */
const _runGCForCollection = async (
    collectionKey: ArchiveCollectionKey,
    itemType: ArchiveItemType,
    settings: PersistedUserSettings,
): Promise<number> => {

    // 1. GC設定値の解決
    // ユーザー設定 -> デフォルト設定 の順に解決
    const timeLimit = resolveNumberWithFallback(
        settings.gcSettings?.[collectionKey]?.[itemType]?.['timeLimit'],
        GC_DEFAULTS[collectionKey][itemType]['timeLimit']!
    );

    const maxSize = resolveNumberWithFallback(
        settings.gcSettings?.[collectionKey]?.[itemType]?.['maxSize'],
        GC_DEFAULTS[collectionKey][itemType]['maxSize']!
    );

    // 2. GC 実行
    const deletedCount = await runGarbageCollectionForCollection(
        collectionKey as DbCollectionName,
        'archivedAt',
        timeLimit,
        maxSize,
        itemType
    );
    console.log(`[ArchiveService:runGC] ${collectionKey} GC completed. Deleted: ${deletedCount} (Type: ${itemType})`);
    return deletedCount;
};


// ----------------------------------------
// ArchiveService
// ----------------------------------------

/**
 * アーカイブコレクション（trash/history）に対するデータ操作サービス
 */
export const archiveService = {

    async fetchAllItemsFromArchive<T>(
        collectionKey: ArchiveCollectionKey,
        converter: (dbRecord: DBArchive) => T
    ): Promise<T[]> {
        console.log(`[ArchiveService:fetchAll] 🔍 Fetching from archive: ${collectionKey}`);

        try {
            const items = await fetchAllItemsFromCollection<T, DBArchive>(
                collectionKey as DbCollectionName,
                converter as (dbRecord: DBArchive) => T
            );
            return items;
        } catch (error) {
            console.error(`[ArchiveService:fetchAll] ❌ Failed to fetch from archive ${collectionKey}:`, error);
            throw error;
        }
    },

    async fetchItemsByIdsFromArchive<T>(
        archiveIds: string[],
        collectionKey: ArchiveCollectionKey,
        converter: (dbRecord: DBArchive) => T,
    ): Promise<(T | null)[]> {

        if (archiveIds.length === 0) return [];

        console.log(`[ArchiveService:fetchByIds] 🔍 Fetching ${archiveIds.length} converted items from archive ${collectionKey} (Bulk).`);

        try {
            const items = await bulkFetchItemsByIdsFromCollection<T, DBArchive>(
                archiveIds,
                collectionKey as DbCollectionName,
                converter
            );

            return items;

        } catch (error) {
            const idList = archiveIds.slice(0, 3).join(', ');
            console.error(`[ArchiveService:fetchByIds] ❌ Failed to fetch items [${idList}...] from archive ${collectionKey}:`, error);
            throw error;
        }
    },

    async fetchRawItemsByIdsFromArchive(
        archiveIds: string[],
        collectionKey: ArchiveCollectionKey,
    ): Promise<(DBArchive | null)[]> {

        if (archiveIds.length === 0) return [];

        console.log(`[ArchiveService:fetchRawByIds] 🔍 Fetching ${archiveIds.length} raw items from archive ${collectionKey} (Bulk).`);

        // bulkFetchItemsByIdsFromCollection を呼び出す
        try {
            const items = await bulkFetchItemsByIdsFromCollection<DBArchive, DBArchive>(
                archiveIds,
                collectionKey as DbCollectionName,
                (dbRecord: DBArchive) => dbRecord // 変換関数としてそのまま返す
            );
            return items;
        } catch (error) {
            const idList = archiveIds.slice(0, 3).join(', ');
            console.error(`[ArchiveService:fetchRawByIds] ❌ Failed to fetch raw items [${idList}...] from archive ${collectionKey}:`, error);
            throw error;
        }
    },

    /**
     * アーカイブコレクションにアイテムを一括保存する
     */
    async saveItemsToArchive(
        itemsToArchive: ArchiveItemToSave<any>[],
        collectionKey: ArchiveCollectionKey
    ): Promise<void> {
        if (itemsToArchive.length === 0) return;

        console.log(`[ArchiveService:saveItems] 💾 Saving ${itemsToArchive.length} items to archive ${collectionKey} (Bulk)...`);

        try {
            // 1. DBArchiveレコードの配列を生成
            const recordsToSave: DBArchive[] = itemsToArchive.map(item =>
                createDBArchiveRecord(
                    item.itemId,
                    item.itemType,
                    item.data,
                    collectionKey,
                    // isManual があれば true を渡す。なければ createDBArchiveRecord のデフォルト (false) が適用される
                    item.meta.isManual === true
                )
            );

            // 2. bulkPutItemsToCollection を使用して一括保存
            await bulkPutItemsToCollection(
                collectionKey as DbCollectionName,
                recordsToSave
            );

            console.log(`[ArchiveService:saveItems] ✅ Successfully saved ${itemsToArchive.length} items to archive ${collectionKey}.`);
        } catch (error) {
            console.error(`[ArchiveService:saveItems] ❌ Failed to save items to archive ${collectionKey}:`, error);
            throw error;
        }
    },

    /**
     * アーカイブコレクションからアイテムを一括削除する
     */
    async deleteItemsFromArchive(
        archiveIds: string[],
        collectionKey: ArchiveCollectionKey,
    ): Promise<void> {
        if (archiveIds.length === 0) return;

        console.log(`[ArchiveService:deleteItems] 🗑️ Deleting ${archiveIds.length} items from archive ${collectionKey} (Bulk).`);
        try {
            // bulkDeleteItemsFromCollection を使用して一括削除
            await bulkDeleteItemsFromCollection(collectionKey as DbCollectionName, archiveIds);

            console.log(`[ArchiveService:deleteItems] ✅ Deleted ${archiveIds.length} items from archive ${collectionKey}.`);
        } catch (error) {
            console.error(`[ArchiveService:deleteItems] ❌ Failed to delete items from archive ${collectionKey}:`, error);
            throw error;
        }
    },

    /**
     * 複数のアーカイブアイテムの特定のフィールドを、すべて同じ値で一括更新します。
     * 主キーは archiveId です。
     * @param archiveIds 更新するArchiveの主キーの配列
     * @param collectionKey 'trash' または 'history'
     * @param field 更新するフィールド名 ('isFavorite', 'archivedAt'など)
     * @param value 設定する新しい値 (全IDに適用)
     * @returns 更新されたレコードの総数
     */
    async updateItemsSingleFieldToArchive(
        archiveIds: string[],
        collectionKey: ArchiveCollectionKey,
        field: string,
        value: any
    ): Promise<number> {
        if (archiveIds.length === 0) return 0;
        
        // DbCollectionName と ArchiveCollectionKey は互換性がある
        const dbCollectionKey: DbCollectionName = collectionKey; 
        
        console.log(`[ArchiveService:
        rchive] ⚡️ Bulk updating field '${field}' on ${collectionKey} for ${archiveIds.length} items.`);
        
        try {
            // dbCoreの汎用バルク更新関数をコレクション名とIDリストを指定して呼び出す
            const numUpdated = await bulkUpdateItemsSingleFieldToCollection(
                archiveIds,
                dbCollectionKey,
                field,
                value
            );
            
            // アーカイブデータはキャッシュしないため、キャッシュ更新ロジックは不要
            
            return numUpdated;

        } catch (error) {
            console.error(`[ArchiveService:updateItemsSingleFieldToArchive] ❌ Failed to update field ${field} in ${collectionKey}:`, error);
            throw error;
        }
    },         

    /**
     * 特定のアイテムタイプに対して、trashとhistory両方のコレクションでGCを実行する
     */
    async runArchiveGarbageCollection(
        itemType: ArchiveItemType
    ): Promise<void> {
        const trashCollectionKey: ArchiveCollectionKey = 'trash';
        const historyCollectionKey: ArchiveCollectionKey = 'history';

        console.log(`[ArchiveService:runGC] 🧹 START running garbage collection for ${itemType}...`);

        // 1. ユーザー設定全体をロード
        const settings: PersistedUserSettings = await userDataService.getUserSettings();

        // 2. Trash コレクションの GC 実行 (ヘルパー関数を使用)
        await _runGCForCollection(
            trashCollectionKey,
            itemType,
            settings
        );

        // 3. History コレクションの GC 実行 (ヘルパー関数を使用)
        await _runGCForCollection(
            historyCollectionKey,
            itemType,
            settings
        );

        console.log(`[ArchiveService:runGC] ✅ Garbage collection complete.`);
    }
};