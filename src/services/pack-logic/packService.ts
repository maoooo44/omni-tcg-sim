/**
* src/services/pack-logic/packService.ts
* * * IndexedDB (Dexie) の 'packs' テーブルに対する CRUD 操作、
* および関連するテーブル（cards, cardPool）のデータ削除操作を扱うサービス。
* パックの作成、取得、更新、トランザクションによる削除、一括インポート機能を提供する。
*
* 【適用した修正】
* deletePack内のカードID取得ロジックを修正。
* pluck() の型エラーを回避するため、toArray() で全オブジェクト取得後、map() で cardId を抽出するように変更。
*/
import { db } from "../database/db";
import type { Pack } from "../../models/pack";
// import { createDefaultPack } from "./packUtils"; // 💡 未使用だがインポートは維持

/**
* IndexedDB (Dexie) の 'packs' テーブルに対する CRUD 操作を扱うサービス
*/
export const packService = {

    /**
     * パックを新規作成/更新し、IndexedDBに保存する (Upsert)。
     * @param packData - 保存する Pack データ (UUIDを含む)
     * @returns 保存されたパックのID
     */
    async savePack(packData: Pack): Promise<string> {
        try {
            const id = await db.packs.put(packData); 
            console.log(`Pack saved/updated with ID: ${id}`);
            return id as string;
        } catch (error) {
            console.error("Failed to save pack:", error);
            throw new Error("パックの保存に失敗しました。");
        }
    },
    
    /**
     * IDを指定して特定のパックを取得する。
     * @param packId - 取得したいパックのID
     * @returns Pack オブジェクト、または見つからなかった場合は null
     */
    async getPackById(packId: string): Promise<Pack | null> {
        try {
            const pack = await db.packs.get(packId);
            return pack ?? null;
        } catch (error) {
            console.error("Failed to get pack:", error);
            return null;
        }
    },

    /**
     * 特定のパックを更新する。
     * @param packId - 更新対象のパックID
     * @param updateData - 更新データ
     */
    async updatePack(packId: string, updateData: Partial<Pack>): Promise<void> {
        try {
            await db.packs.update(packId, updateData);
        } catch (error) {
            console.error("Failed to update pack:", error);
            throw new Error("パックの更新に失敗しました。");
        }
    },

    /**
     * 💡 [新規] 複数のパックを関連データごと一括削除するメソッド
     * トランザクションを利用して原子性を保証する。
     * @param packIds - 削除したいパックのIDの配列
     */
    async bulkDeletePacks(packIds: string[]): Promise<void> {
        if (!packIds || packIds.length === 0) {
            return;
        }

        try {
            // トランザクションを開始し、packs, cards, cardPool の操作の原子性を保証
            await db.transaction('rw', db.packs, db.cards, db.cardPool, async () => {
                
                // 1. 削除対象となるすべてのカードIDを事前に取得
                const allCardsToDelete = await db.cards
                    .where('packId').anyOf(packIds)
                    .toArray(); 
                const cardIdsToDelete = allCardsToDelete.map(card => card.cardId);

                // 2. パック本体の一括削除
                await db.packs.bulkDelete(packIds);
                console.log(`[PackService] Bulk deleted ${packIds.length} packs.`);

                // 3. そのパックに収録されていたすべてのカード定義を削除 (cardsテーブル)
                await db.cards.where('packId').anyOf(packIds).delete();
                
                // 4. cardPool のアイテムを一括削除
                if (cardIdsToDelete.length > 0) {
                    await db.cardPool.bulkDelete(cardIdsToDelete);
                    console.log(`[PackService] Bulk deleted ${cardIdsToDelete.length} items from cardPool.`);
                }
            });
            console.log(`Packs (${packIds.length} items) and related data deleted successfully in transaction.`);
        } catch (error) {
            console.error("Failed to bulk delete packs and related data in transaction:", error);
            throw new Error("パックとその関連データの一括削除に失敗しました。");
        }
    },

     /**
     * 💡 [修正] 単一のパックを削除する。bulkDeletePacksを再利用して実装をシンプルにする。
     * @param packId - 削除したいパックのID
     */
    async deletePack(packId: string): Promise<void> {
        // bulkDeletePacks を単一IDで呼び出すことで、ロジックを共通化
        return this.bulkDeletePacks([packId]); 
    },

    /**
     * すべてのパックを取得する。
     * @returns すべての Pack オブジェクトの配列
     */
    async getAllPacks(): Promise<Pack[]> {
        try {
            return await db.packs.toArray();
        } catch (error) {
            console.error("Failed to get all packs:", error);
            return [];
        }
    },

    /**
     * 複数のパックを一括でインポートする (IDの重複はスキップ)。
     */
    async importPacks(packsToImport: Pack[]): Promise<{ importedCount: number, skippedIds: string[] }> {
        const existingPacks = await db.packs.toArray();
        const existingIds = new Set(existingPacks.map(p => p.packId));
        
        const newPacks: Pack[] = [];
        const skippedIds: string[] = [];

        // 1. 重複チェックと新規パックのフィルタリング
        packsToImport.forEach(pack => {
            // パックの必須フィールドチェック（IDと価格）
            if (!pack.packId || pack.price === undefined) {
                 console.warn("Skipping invalid pack data: Missing packId or price.");
                 return;
            }

            if (existingIds.has(pack.packId)) {
                skippedIds.push(pack.packId);
            } else {
                newPacks.push({
                    ...pack,
                    // インポートされたデータが isOpened を持たない場合を考慮し、デフォルトは false
                    isOpened: pack.isOpened ?? false, 
                });
            }
        });

        if (newPacks.length === 0) {
            return { importedCount: 0, skippedIds };
        }

        try {
            // 2. 新規パックを一括追加 (bulkAdd)
            await db.packs.bulkAdd(newPacks);
            console.log(`${newPacks.length} packs imported successfully.`);
            
            return { 
                importedCount: newPacks.length, 
                skippedIds 
            };
        } catch (error) {
            console.error("Failed to import packs:", error);
            throw new Error("パックデータの一括インポートに失敗しました。");
        }
    },
};