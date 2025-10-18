/**
* src/services/archive/archiveService.ts
*
* アーカイブコレクション（'trash' および 'history'）に対するデータベース操作を管理するサービス層モジュール。
* * 責務:
* 1. DBコア層（dbCore）を介した 'trash' / 'history' コレクションへの CRUD 操作（バルク操作を基本とする）。
* 2. 履歴アイテムの生成（createDBArchiveRecord）。
* 3. ユーザー設定とデフォルト値に基づきGC設定値を解決し、アイテムタイプに応じたガベージコレクション（GC）の実行をトリガーする。
* 4. 主キーとして archiveId のみを使用する統一的なインターフェースの提供。
*/
import type { DBArchive, ArchiveItemType } from "../../models/db-types";
import { 
    fetchAllItemsFromCollection, 
    bulkFetchItemsByIdsFromCollection, 
    bulkPutItemsToCollection, 
    bulkDeleteItemsFromCollection, 
    runGarbageCollectionForCollection, 
    type DbCollectionName 
} from '../database/dbCore';
import { 
    userDataService, 
    type PersistedUserSettings, 
} from '../user-data/userDataService'; 
import { generateId } from '../../utils/dataUtils'; 
import { resolveNumberWithFallback } from '../../utils/valueResolver';
import { ARCHIVE_GC_DEFAULTS } from '../../config/defaults'; 

// ----------------------------------------
// プライベートヘルパー関数
// ----------------------------------------

/**
 * DBArchiveレコード本体を生成する汎用ヘルパー関数 (型安全性を向上)
 * isFavoriteは初期状態としてfalseを設定する。
 */
const createDBArchiveRecord = (
    itemId: string,
    itemType: ArchiveItemType, 
    itemData: any, // DBArchive.itemData の型は呼び出し側で担保
): DBArchive => {
    
    const archivedAt = new Date().toISOString();
    const isFavorite = false; 

    const commonFields = {
        itemId: itemId,
        itemType: itemType, 
        itemData: itemData,
        archivedAt: archivedAt,
        isFavorite: isFavorite,
    };

    return {
        ...commonFields,
        archiveId: generateId(), 
    };
};


// ----------------------------------------
// ArchiveService
// ----------------------------------------

export type ArchiveCollectionKey = 'trash' | 'history'; 

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
        archiveIds: string[], // 第一引数 (維持)
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
    
    /**
     * 生のDBArchiveレコードを一括取得するための専用メソッド
     * Converterを使用せず、DBArchiveレコードそのものを返す。
     */
    async fetchRawItemsByIdsFromArchive(
        archiveIds: string[], // 第一引数 (維持)
        collectionKey: ArchiveCollectionKey,
    ): Promise<(DBArchive | null)[]> {
        
        const rawConverter = (dbRecord: DBArchive) => dbRecord;
        
        // fetchItemsByIdFromArchive を呼び出す
        const results = await this.fetchItemsByIdsFromArchive<DBArchive>(
            archiveIds, 
            collectionKey, 
            rawConverter
        );
        
        return results;
    },
    
    async saveItemsToArchive(
        collectionKey: ArchiveCollectionKey,
        itemsToArchive: Array<{ 
            itemType: ArchiveItemType, 
            itemId: string, 
            data: any 
        }>
    ): Promise<void> {
        if (itemsToArchive.length === 0) return;

        console.log(`[ArchiveService:saveItems] 💾 Saving ${itemsToArchive.length} items to archive ${collectionKey} (Bulk)...`);
        
        try {
            // 1. DBArchiveレコードの配列を生成
            const recordsToSave: DBArchive[] = itemsToArchive.map(item => 
                createDBArchiveRecord(item.itemId, item.itemType, item.data)
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
    
    async deleteItemsFromArchive(
        archiveIds: string[], // 第一引数に移動
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
     * History および Trash コレクションの GC 実行 (汎用化)
     * @param itemType 対象アイテムタイプ ('packBundle' | 'deck')
     */
    async runArchiveGarbageCollection(
        itemType: ArchiveItemType 
    ): Promise<void> {
        const trashCollectionName: DbCollectionName = 'trash'; 
        const historyCollectionName: DbCollectionName = 'history';
        
        console.log(`[ArchiveService:runGC] 🧹 START running garbage collection for ${itemType}...`);

        // 1. ユーザー設定全体をロード
        const settings: PersistedUserSettings = await userDataService.getUserSettings();
        
        // 2. GC設定値の解決（resolveNumberWithFallback を使用してインライン化）
        
        // Trash の設定解決
        const trashTimeLimit = resolveNumberWithFallback(
            settings.gcSettings?.['trash']?.[itemType]?.['timeLimit'],
            ARCHIVE_GC_DEFAULTS['trash'][itemType]['timeLimit']
        );
        const trashMaxSize = resolveNumberWithFallback(
            settings.gcSettings?.['trash']?.[itemType]?.['maxSize'],
            ARCHIVE_GC_DEFAULTS['trash'][itemType]['maxSize']
        );
        
        // History の設定解決
        const historyTimeLimit = resolveNumberWithFallback(
            settings.gcSettings?.['history']?.[itemType]?.['timeLimit'],
            ARCHIVE_GC_DEFAULTS['history'][itemType]['timeLimit']
        );
        const historyMaxSize = resolveNumberWithFallback(
            settings.gcSettings?.['history']?.[itemType]?.['maxSize'],
            ARCHIVE_GC_DEFAULTS['history'][itemType]['maxSize']
        );

        // 3. Trash コレクションの GC 実行
        const deletedTrashCount = await runGarbageCollectionForCollection(
            trashCollectionName, 
            'archivedAt', 
            trashTimeLimit,
            trashMaxSize,
            itemType
        );
        console.log(`[ArchiveService:runGC] Trash GC completed. Deleted: ${deletedTrashCount} (Type: ${itemType})`);

        // 4. History コレクションの GC 実行
        const deletedHistoryCount = await runGarbageCollectionForCollection(
            historyCollectionName, 
            'archivedAt', 
            historyTimeLimit,
            historyMaxSize,
            itemType
        );
        console.log(`[ArchiveService:runGC] History GC completed. Deleted: ${deletedHistoryCount} (Type: ${itemType})`);
        
        console.log(`[ArchiveService:runGC] ✅ Garbage collection complete.`);
    }
};