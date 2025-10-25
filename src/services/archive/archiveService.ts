/**
* src/services/archive/archiveService.ts
*
* アーカイブコレクション（'trash' および 'history'）に対するデータベース操作を管理するサービス層モジュール。
*/
import type { ArchiveItemToSave, ArchiveCollectionKey, ArchiveItemType } from "../../models/archive";
import type { DBArchive } from "../../models/db-types";
import { 
    fetchAllItemsFromCollection, 
    bulkFetchItemsByIdsFromCollection, 
    bulkPutItemsToCollection, 
    bulkDeleteItemsFromCollection, 
    runGarbageCollectionForCollection, 
    type DbCollectionName 
} from '../database/dbCore';
import type { PersistedUserSettings, GCSetting  } from "../../models/userData";
import { userDataService } from '../user-data/userDataService'; 
import { generateId } from '../../utils/dataUtils'; 
import { resolveNumberWithFallback } from '../../utils/valueResolver';
// 💡 修正: ARCHIVE_GC_DEFAULTS に GCSetting 型を付与するため、インポート時に型キャストを適用
import { ARCHIVE_GC_DEFAULTS } from '../../configs/defaults'; 

// 💡 修正: ARCHIVE_GC_DEFAULTS の型を GCSetting にキャストすることでインデックスアクセスを許可
const GC_DEFAULTS = ARCHIVE_GC_DEFAULTS as unknown as GCSetting; // 型ガードのため、ローカル定数にキャストして保持

// ----------------------------------------
// プライベートヘルパー関数
// ----------------------------------------

/**
 * DBArchiveレコード本体を生成する汎用ヘルパー関数 (型安全性を向上)
 * 💡 修正: collectionKey および isManual を受け取るように変更。
 */
const createDBArchiveRecord = (
    itemId: string,
    itemType: ArchiveItemType, 
    itemData: any,
    collectionKey: ArchiveCollectionKey, // 💡 追加: どのコレクションに保存するか
    isManual: boolean = false, // 💡 追加: 手動かどうか (デフォルトは自動/false)
): DBArchive => {
    
    const archivedAt = new Date().toISOString();
    const isFavorite = false; 

    return {
        archiveId: generateId(), 
        itemId: itemId,
        itemType: itemType, 
        // 💡 修正: collectionKey をセット
        collectionKey: collectionKey, 
        archivedAt: archivedAt,
        itemData: itemData,
        isFavorite: isFavorite,
        // 💡 修正: isManual をセット (undefined にならないようにデフォルト値を設定)
        isManual: isManual, 
    };
};

/**
 * 特定のアーカイブコレクションに対してGC設定値を解決し、GCを実行するヘルパー関数
 * runArchiveGarbageCollection メソッド内のロジックの重複解消のために定義
 */
const _runGCForCollection = async (
    collectionKey: ArchiveCollectionKey, // ArchiveCollectionKey を使用
    itemType: ArchiveItemType,
    settings: PersistedUserSettings,
): Promise<number> => {
    
    // 1. GC設定値の解決
    // 💡 修正: GC_DEFAULTSから取り出した値を、実行時にnumberであることを知っているため、非nullアサーションを追加する
    const timeLimit = resolveNumberWithFallback(
        settings.gcSettings?.[collectionKey]?.[itemType]?.['timeLimit'],
        GC_DEFAULTS[collectionKey][itemType]['timeLimit']! // 👈 修正箇所: 非nullアサーション (!) を追加
    ); // resolveNumberWithFallbackの戻り値は 'number'

    const maxSize = resolveNumberWithFallback(
        settings.gcSettings?.[collectionKey]?.[itemType]?.['maxSize'],
        GC_DEFAULTS[collectionKey][itemType]['maxSize']! // 👈 修正箇所: 非nullアサーション (!) を追加
    ); // resolveNumberWithFallbackの戻り値は 'number'

    // 2. GC 実行
    const deletedCount = await runGarbageCollectionForCollection(
        collectionKey as DbCollectionName, 
        'archivedAt', 
        timeLimit, // 型は number で確定
        maxSize,   // 型は number で確定
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
    
    async fetchRawItemsByIdsFromArchive(
        archiveIds: string[], // 第一引数 (維持)
        collectionKey: ArchiveCollectionKey,
    ): Promise<(DBArchive | null)[]> {
        
        if (archiveIds.length === 0) return [];

        console.log(`[ArchiveService:fetchRawByIds] 🔍 Fetching ${archiveIds.length} raw items from archive ${collectionKey} (Bulk).`);
        
        // 直接 bulkFetchItemsByIdsFromCollection を呼び出すことでロギングの重複とコールスタックの深さを削減
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
     * 💡 修正: itemsToArchive の型を ArchiveItemToSave に変更し、isManual を考慮
     */
    async saveItemsToArchive(
        itemsToArchive: ArchiveItemToSave<any>[], // 💡 型を修正 (any を使用)
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
                    collectionKey, // 💡 collectionKey を渡す
                    // isManual があれば true を渡す。なければ createDBArchiveRecord のデフォルト (false) が適用される
                    item.isManual === true 
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