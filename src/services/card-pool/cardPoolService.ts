/**
 * src/service/card-pool/cardPoolService.ts
 * 
 * IndexedDB (Dexie) の 'cardPool' テーブルに対する操作を扱うサービス。
 * カードプールの取得、個別の所有枚数更新、および複数のカードの一括更新を
 * 非同期で実行する。
 */
import { db } from "../database/db";
import type { DBCardPool } from '../../models/db-types'; 

/**
 * IndexedDB (Dexie) の 'cardPool' テーブルに対する操作を扱うサービス
 */
export const cardPoolService = {

    /**
     * 現在のカードプール全体をDBから取得する。
     * @returns cardIdをキー、所有枚数を値とするMap
     */
    async getOwnedCardsMap(): Promise<Map<string, number>> {
        try {
            // 型を明確にするため、db.cardPool.toArray() の型を明示
            const dbEntries: DBCardPool[] = await db.cardPool.toArray();
            const cardMap = new Map<string, number>();

            dbEntries.forEach(entry => {
                // key: cardId, value: count をマップに格納
                cardMap.set(entry.cardId, entry.count);
            });

            return cardMap;
        } catch (error) {
            console.error("Failed to load card pool from DB:", error);
            // 失敗時は空のマップを返す
            return new Map();
        }
    },

    /**
     * 指定されたカードIDの所有枚数をDB上で更新または新規作成する。
     * @param cardId - 更新または作成するカードのID
     * @param newCount - 新しい所有枚数 (0の場合は削除)
     */
    async updateCardCount(cardId: string, newCount: number): Promise<void> {
        try {
            if (newCount > 0) {
                // 枚数が1以上の場合: 更新または追加 (put)
                await db.cardPool.put({ 
                    cardId: cardId, 
                    count: newCount 
                } as DBCardPool); // 型アサーションを追加
            } else {
                // 枚数が0の場合: 削除
                await db.cardPool.delete(cardId);
            }
        } catch (error) {
            console.error(`Failed to update count for Card ID ${cardId}:`, error);
            throw new Error("カード資産のDB更新に失敗しました。");
        }
    },

    /**
     * 複数のカードの所有枚数をトランザクション内で一括更新する。
     * @param updates - cardIdをキー、新しい所有枚数を値とするMap
     */
    async bulkUpdateCardCounts(updates: Map<string, number>): Promise<void> {
        try {
            // トランザクションを使用し、一連の操作を原子的に行う
            await db.transaction('rw', db.cardPool, async () => {
                for (const [cardId, newCount] of updates.entries()) {
                    if (newCount > 0) {
                        await db.cardPool.put({ 
                            cardId: cardId, 
                            count: newCount 
                        } as DBCardPool); // 型アサーションを追加
                    } else {
                        await db.cardPool.delete(cardId);
                    }
                }
            });
        } catch (error) {
            console.error("Failed to bulk update card pool:", error);
            throw new Error("カード資産の一括DB更新に失敗しました。");
        }
    },
    
    // ----------------------------------------------------
    // 新規追加: カードプール全体をDBに保存する汎用メソッド
    // ----------------------------------------------------
    /**
     * カードプール全体をDBに保存する（MapをIndexedDB形式に変換して保存）。
     * 全件を上書きするのではなく、更新分のみを反映します。
     * @param ownedCards - 保存するカードプールのMap
     */
    async saveCardPool(_ownedCards: Map<string, number>): Promise<void> {
        // 結論: 新規メソッドは不要とし、storeから bulkUpdateCardCounts を呼び出します。
    },

    /**
     * [DB連携] カードプールの所有枚数テーブル（cardPool）を完全にクリアする (TRUNCATE相当)
     */
    async clearCardPool(): Promise<void> {
        try {
            await db.cardPool.clear(); // ★ Dexieの全件削除メソッド
            console.log("IndexedDB cardPool table cleared successfully.");
        } catch (error) {
            console.error("Failed to clear card pool in DB:", error);
            throw new Error("カードプールのDBクリアに失敗しました。");
        }
    }
};