/**
* src/services/database/dbCore.ts
*
* IndexedDB (Dexie) の**コアなデータ永続化層**への低レベルな汎用アクセス、
* 採番ユーティリティ、およびガベージコレクションロジックを提供します。
*
* このファイルは、dbUtils.tsから切り分けられました。
*/

import { db } from './db';
import type { Collection, Table } from 'dexie';
import type { ArchiveItemType } from '../../models/db-types'; 

// DBコレクション名の共通型
export type DbCollectionName = 'cards' | 'packs' | 'cardPool' | 'decks' | 'userSettings' | 'presets' | 'history' | 'trash'; 


// =========================================================================
// 1. 汎用的なDBアクセス関数 (CRUD - 取得)
// =========================================================================

/**
 * 汎用的なコレクションから全アイテムを取得し、適切なアプリケーションモデルに変換します。
 */
export const fetchAllItemsFromCollection = async <T, D>(
    collectionName: DbCollectionName,
    converter: (dbRecord: D) => T
): Promise<T[]> => {
    try {
        const table = (db as any)[collectionName] as Table<D, any> | undefined;
        if (!table) {
            console.error(`[dbCore] Collection not found: ${collectionName}`);
            return [];
        }

        const dbRecords = await table.toArray();
        const items = dbRecords.map(converter);
        
        return items;
    } catch (error) {
        console.error(`[dbCore] Error fetching all items from ${collectionName}:`, error);
        throw error;
    }
};


/**
 * 汎用的なコレクションから単一アイテムをID指定で取得し、適切なアプリケーションモデルに変換します。
 */
export const fetchItemByIdFromCollection = async <T, D>(
    itemId: string, 
    collectionName: DbCollectionName, 
    converter: (dbRecord: D) => T
): Promise<T | null> => {
    try {
        const table = (db as any)[collectionName] as Table<D, any> | undefined;
        if (!table) {
            console.error(`[dbCore] Collection not found: ${collectionName}`);
            return null;
        }

        const dbRecord = await table.get(itemId);
        
        if (!dbRecord) return null;

        return converter(dbRecord);
        
    } catch (error) {
        console.error(`[dbCore] Error fetching item ${itemId} from ${collectionName}:`, error);
        throw error;
    }
};

/**
 * 汎用的なコレクションから複数アイテムをID配列で一括取得し、適切なアプリケーションモデルに変換します。
 * @param itemIds 取得するレコードの主キーの配列
 * @param collectionName 対象のDBコレクション名
 * @param converter DBレコードをドメインモデルに変換する関数
 */
export const bulkFetchItemsByIdsFromCollection = async <T, D>(
    itemIds: string[],
    collectionName: DbCollectionName,
    converter: (dbRecord: D) => T
): Promise<(T | null)[]> => {
    if (itemIds.length === 0) return [];
    
    try {
        const table = (db as any)[collectionName] as Table<D, any> | undefined;
        if (!table) {
            console.error(`[dbCore] Collection not found: ${collectionName}`);
            // null埋めされた配列を返す
            return itemIds.map(() => null); 
        }

        // DexieのbulkGet操作を実行
        const dbRecords = await table.bulkGet(itemIds);
        
        // 取得されたレコードを変換
        const items = dbRecords.map(dbRecord => dbRecord ? converter(dbRecord) : null);

        return items;
        
    } catch (error) {
        console.error(`[dbCore] Error fetching items with IDs [${itemIds.slice(0, 3).join(', ')}, ...] from ${collectionName}:`, error);
        throw error;
    }
};


// =========================================================================
// 2. 汎用的なDBアクセス関数 (CRUD - 保存/削除) 
// =========================================================================

/**
 * 単一のDBレコードを指定されたコレクションに保存（Upsert）します。
 * @param collectionName 対象のDBコレクション名
 * @param item 保存するDBレコード (主キーを含む)
 * @returns 保存されたDBレコード
 */
export const putItemToCollection = async <T extends { [key: string]: any }>(
    collectionName: DbCollectionName,
    item: T
): Promise<T> => {
    try {
        const collection = (db as any)[collectionName] as Table<T, any> | undefined;
        if (!collection) throw new Error(`Collection ${collectionName} not found.`);

        // Dexieのput操作を実行
        await collection.put(item); 
        return item;
    } catch (error) {
        console.error(`[dbCore] Failed to put item to ${collectionName}:`, error);
        throw error;
    }
};

/**
 * 複数のDBレコードを指定されたコレクションに一括で保存（Bulk Upsert）します。
 * @param collectionName 対象のDBコレクション名
 * @param items 保存するDBレコードの配列
 */
export const bulkPutItemsToCollection = async <T>(
    collectionName: DbCollectionName,
    items: T[]
): Promise<void> => {
    if (items.length === 0) return;
    try {
        const collection = (db as any)[collectionName] as Table<T, any> | undefined;
        if (!collection) throw new Error(`Collection ${collectionName} not found.`);

        // DexieのbulkPut操作を実行
        await collection.bulkPut(items);
    } catch (error) {
        console.error(`[dbCore] Failed to bulk put items to ${collectionName}:`, error);
        throw error;
    }
};

/**
 * IDを指定して単一のレコードをコレクションから物理削除します。
 * @param collectionName 対象のDBコレクション名
 * @param itemId 削除するレコードの主キー
 */
export const deleteItemFromCollection = async (
    collectionName: DbCollectionName,
    itemId: string
): Promise<void> => {
    try {
        const collection = (db as any)[collectionName] as Table<any, any> | undefined;
        if (!collection) throw new Error(`Collection ${collectionName} not found.`);

        // Dexieのdelete操作を実行
        await collection.delete(itemId);
    } catch (error) {
        console.error(`[dbCore] Failed to delete item ${itemId} from ${collectionName}:`, error);
        throw error;
    }
};

/**
 * IDの配列を指定して複数のレコードをコレクションから一括で物理削除します。
 * @param collectionName 対象のDBコレクション名
 * @param itemIds 削除するレコードの主キーの配列
 */
export const bulkDeleteItemsFromCollection = async (
    collectionName: DbCollectionName,
    itemIds: string[]
): Promise<void> => {
    if (itemIds.length === 0) return;
    try {
        const collection = (db as any)[collectionName] as Table<any, any> | undefined;
        if (!collection) throw new Error(`Collection ${collectionName} not found.`);

        // DexieのbulkDelete操作を実行
        await collection.bulkDelete(itemIds);
    } catch (error) {
        console.error(`[dbCore] Failed to bulk delete items from ${collectionName}:`, error);
        throw error;
    }
};


// =========================================================================
// 3. 汎用的なフィールド更新関数
// =========================================================================

/**
 * 単一のアイテムの特定のフィールドを更新します。
 * @param id 更新するレコードの主キー
 * @param collectionName 対象のDBコレクション名
 * @param field 更新するフィールド名 ('updatedAt'など)
 * @param value 設定する新しい値
 */
export const updateItemFieldToCollection = async (
    id: string, 
    collectionName: DbCollectionName, 
    field: string, 
    value: any
): Promise<boolean> => {
    try {
        const table = (db as any)[collectionName] as Table<any, any> | undefined;
        if (!table) {
            console.error(`[dbCore] Collection not found: ${collectionName}`);
            return false;
        }

        // DexieのTable.update(key, changes)を使用
        const numUpdated = await table.update(id, { [field]: value });
        
        // 更新されたレコード数が1であれば成功
        return numUpdated === 1;
        
    } catch (error) {
        console.error(`[dbCore] Error updating field ${field} for item ${id} in ${collectionName}:`, error);
        throw error;
    }
};

/**
 * 複数のアイテムの特定のフィールドを、すべて同じ値で一括更新します。
 * @param ids 更新するレコードの主キーの配列
 * @param collectionName 対象のDBコレクション名
 * @param field 更新するフィールド名 ('updatedAt'など)
 * @param value 設定する新しい値 (全IDに適用)
 * @returns 更新されたレコードの総数
 */
export const bulkUpdateItemFieldToCollection = async (
    ids: string[], 
    collectionName: DbCollectionName, 
    field: string, 
    value: any
): Promise<number> => {
    if (ids.length === 0) return 0;
    
    try {
        const table = (db as any)[collectionName] as Table<any, any> | undefined;
        if (!table) {
            console.error(`[dbCore] Collection not found: ${collectionName}`);
            return 0;
        }

        // DexieのCollection.modify(changes)またはTable.where().anyOf().modify(changes)を使用
        // 主キー配列での一括指定には、where().anyOf()が効率的
        const numUpdated = await table
            .where(':id') // 主キーインデックスを使用
            .anyOf(ids)
            .modify({ [field]: value });
            
        return numUpdated;
        
    } catch (error) {
        console.error(`[dbCore] Error bulk updating field ${field} in ${collectionName}:`, error);
        throw error;
    }
};


// =========================================================================
// 4. 採番ユーティリティ (getMaxNumberByCollection)
// =========================================================================

/**
 * IndexedDBのコレクションから、特定のフィールドの最大値（number）を非同期で取得します。
 *
 * NOTE: 複合インデックスが張られたコレクションに対しては、filterConditionsのキーが
 * 複合インデックスの最初のキーと一致する場合、where句による効率的な検索が可能です。
 *
 * @param collectionName - 対象のDBコレクション名 ('packs', 'cards', 'decks'のみ)
 * @param numberFieldName - 最大値を取得するフィールド名 (デフォルトは 'number')
 * @param filterConditions - 絞り込み条件 (例: { packId: 'abc' })。複合インデックスの先頭キーが推奨。
 * @returns 最大値。データがない場合は 0 を返します。
 */
export const getMaxNumberByCollection = async (
    collectionName: DbCollectionName,
    numberFieldName: string = 'number',
    filterConditions: { [key: string]: any } = {}
): Promise<number> => {
    // 採番が必要なコレクションのみを対象とするチェック
    if (collectionName !== 'packs' && collectionName !== 'cards' && collectionName !== 'decks') {
        console.warn(`[dbCore] getMaxNumber called on non-numbering collection: ${collectionName}. Returning 0.`);
        return 0;
    }
    
    const table = db.table(collectionName);
    if (!table) {
        console.error(`[dbCore] Collection not found: ${collectionName}`);
        return 0;
    }

    try {
        let collection: Collection<any, any> | Table<any, any> = table;

        // フィルタリング処理を where 句で適用し、インデックスの使用を試みる
        const filterKeys = Object.keys(filterConditions);
        if (filterKeys.length > 0) {
            const key = filterKeys[0];
            const value = filterConditions[key];
            
            // where句でインデックス検索を実行
            collection = table.where(key).equals(value); 
        }

        // フィルタリング後のコレクションに対して、numberFieldNameで逆順にソートし、最初の1件を取得
        // numberFieldNameでソートする前に、null/undefinedでないことをフィルタリング
        const item = await (collection as Collection<any, any>)
            .filter((item: any) =>
                item[numberFieldName] !== undefined &&
                item[numberFieldName] !== null &&
                typeof item[numberFieldName] === 'number'
            )
            .reverse() // 降順ソート
            .sortBy(numberFieldName) // numberFieldName でのソート (数値の最大値取得に最適化)
            .then(records => records[0]); // 配列の最初の要素を取得

        if (item && item[numberFieldName] !== undefined && item[numberFieldName] !== null) {
            const maxValue = item[numberFieldName];
            if (typeof maxValue === 'number' && !isNaN(maxValue)) {
                return maxValue;
            }
        }
        
        return 0;
        
    } catch (error) {
        console.error(`[dbCore] Error fetching max number from ${collectionName}:`, error);
        // エラー発生時も 0 を返す
        return 0;
    }
};


// =========================================================================
// 5. 汎用的なガベージコレクション (GC) ユーティリティ 
// =========================================================================

/**
 * 指定されたコレクションに対して、サイズ制限と時間経過によるガベージコレクションを実行します。
 * この関数は、isFavorite=falseのレコードのみを削除対象とし、時間経過による削除を優先し、
 * その後サイズ制限を超過した場合に古いレコードを削除します。
 * * @param collectionName 対象のDBコレクション名 ('trash' or 'history'などの履歴系コレクション)
 * @param dateKey 日付フィールドのキー ('archivedAt'を想定)
 * @param timeLimitDays 期間による削除のしきい値（日数）。この値を超えた isFavorite=false のレコードを削除。
 * @param maxSizeCount サイズによる削除のしきい値（レコード数）。この値を超過した場合に isFavorite=false の古い順に削除。
 * @param itemType GCの対象とするアイテムのタイプ ('packBundle' | 'deck')
 * @returns 物理削除されたレコードの総数
 */
export const runGarbageCollectionForCollection = async (
    collectionName: DbCollectionName,
    dateKey: string, // 'archivedAt'を想定
    timeLimitDays: number,
    maxSizeCount: number,
    itemType: ArchiveItemType 
): Promise<number> => {
    
    const now = new Date();
    // ここでは DB コレクションの型を仮に Table<any, any> とします
    const collection = (db as any)[collectionName] as Table<any, any> | undefined;
    if (!collection) {
        console.warn(`[dbCore:GC] Collection ${collectionName} not found.`);
        return 0;
    }
    
    let deletedCount = 0;
    
    // 1. 時間による削除 (定数値を越えた場合)
    if (timeLimitDays > 0) {
        try {
            const timeLimit = new Date(now.getTime() - timeLimitDays * 24 * 60 * 60 * 1000);
            
            // itemTypeで絞り込み、isFavoriteがfalseかつdateKeyが期限より古いレコードの主キー(archiveId)を取得
            const timeLimitIso = timeLimit.toISOString();
            const oldRecordsKeys: any[] = await collection
                .where('itemType').equals(itemType) 
                // isFavorite=false で絞り込み、かつ dateKey が期限より古いレコードに限定
                .and(record => record.isFavorite === false && record[dateKey] < timeLimitIso)
                .primaryKeys(); // 主キー (archiveId) の配列を取得

            if (oldRecordsKeys.length > 0) {
                await collection.bulkDelete(oldRecordsKeys);
                deletedCount += oldRecordsKeys.length;
                console.log(`[dbCore:GC:${collectionName} (${itemType})] Time-based deletion: ${oldRecordsKeys.length} records removed (isFavorite=false, Older than ${timeLimitDays} days).`);
            }
        } catch (error) {
            console.error(`[dbCore:GC:${collectionName} (${itemType})] Error during time-based GC:`, error);
        }
    }


    // 2. サイズによる削除 (コレクションに存在する特定アイテムが定数値を越えた場合)
    if (maxSizeCount > 0) {
        try {
            // 2-1. 対象 itemType かつ isFavorite=false の総数を取得
            const currentItemCount = await collection
                .where('itemType')
                .equals(itemType)
                .and(record => record.isFavorite === false) // isFavorite=false のレコードのみカウント
                .count();
                
            const itemsToDelete = currentItemCount - maxSizeCount;
            
            if (itemsToDelete > 0) {
                // 2-2. 古い順にソート (dateKey asc) して超過分を取得し、削除
                // reverse() + sortBy(key) は最新順ソートになるため、古い順に取得するには逆のロジックが必要。
                // Dexieの仕様上、sortBy()は昇順。降順はreverse()が必要だが、ここでsortBy('dateKey')単独では昇順。
                
                // 正しいロジック： dateKeyで昇順ソートして、itemsToDelete分を取得
                const oldestRecordsKeys: any[] = await collection
                    .where('itemType')
                    .equals(itemType)
                    .and(record => record.isFavorite === false) // isFavorite=false のレコードのみ対象
                    .sortBy(dateKey) // dateKeyで昇順ソート（最も古いものが先頭）
                    .then(records => records.slice(0, itemsToDelete).map(r => r.archiveId)); // archiveIdを主キーとして使用

                if (oldestRecordsKeys.length > 0) {
                    await collection.bulkDelete(oldestRecordsKeys);
                    deletedCount += oldestRecordsKeys.length;
                    console.log(`[dbCore:GC:${collectionName} (${itemType})] Size-based deletion: ${oldestRecordsKeys.length} records removed (isFavorite=false, Exceeded size limit of ${maxSizeCount}).`);
                }
            }
        } catch (error) {
            console.error(`[dbCore:GC:${collectionName} (${itemType})] Error during size-based GC:`, error);
        }
    }
    
    return deletedCount;
};