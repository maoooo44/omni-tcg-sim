/**
 * src/services/card-pools/CardPoolService.ts
 *
 * * CardPool（ユーザーの所有カード資産）データに関する**ドメインロジック**と**データ永続化（IndexedDB）**を担うサービス層モジュール。
 * * 責務:
 * 1. DBからのデータロードと**グローバルキャッシュ（cardPoolCache）**の構築・提供。
 * 2. 所有枚数の**更新/削除（CRUD）**ロジックの実行。
 * 3. IndexedDB（Dexie）を介した永続化層への直接的な書き込み操作（put/delete/bulkPut/bulkDelete/clear）を実行する。
 * 4. DBとキャッシュ（cardPoolCache）の整合性を保つ。
 */

import { db } from "../database/db";
import type { DBCardPool } from '../../models/db-types';
import { cardPoolSearchService } from './cardPoolSearchService';

// キャッシュ層を導入 (Map<cardId, count>)
let cardPoolCache: Map<string, number> | null = null;

// ----------------------------------------------------
// 責務: DB/キャッシュ操作と更新ロジック
// ----------------------------------------------------
export const cardPoolService = {

    /**
     * [Service Logic] DBから全カードプールをロードし、キャッシュを構築する。
     */
    async loadAllCardPoolFromCache(): Promise<boolean> {
        console.log(`[CardPoolService] 🚀 START loading all card pool data.`);
        try {
            // SearchService経由でDBから取得
            cardPoolCache = await cardPoolSearchService.getOwnedCardsMap();
            console.log(`[CardPoolService] ✅ Loaded ${cardPoolCache.size} unique cards.`);
            return true;
        } catch (error) {
            console.error("[CardPoolService] ❌ Failed to load card pool:", error);
            cardPoolCache = new Map();
            return false;
        }
    },

    /**
     * キャッシュから全カードプールを取得する
     */
    getAllCardPoolFromCache(): Map<string, number> {
        return cardPoolCache || new Map();
    },

    /**
     * カードの所有枚数を更新/新規作成/削除する (単一エントリ)
     */
    async saveCardPoolEntry(cardId: string, newCount: number): Promise<void> {
        try {
            if (newCount > 0) {
                const data: DBCardPool = { cardId: cardId, count: newCount };
                // 1. DB更新 (put)
                await db.cardPool.put(data);
                // 2. キャッシュ更新
                cardPoolCache?.set(cardId, newCount);
            } else {
                // 1. DB削除 (delete)
                await db.cardPool.delete(cardId);
                // 2. キャッシュ削除
                cardPoolCache?.delete(cardId);
            }
        } catch (error) {
            console.error(`Failed to save card pool entry for Card ID ${cardId}:`, error);
            throw new Error("カード資産のDB更新に失敗しました。");
        }
    },

    /**
     * 複数のカードの所有枚数をトランザクション内で一括更新する (バルク処理)
     */
    async bulkSaveCardPoolEntries(updates: Map<string, number>): Promise<void> {
        if (updates.size === 0) return;

        const dataToPut: DBCardPool[] = [];
        const idsToDelete: string[] = [];

        // 1. 更新内容を分類
        for (const [cardId, newCount] of updates.entries()) {
            if (newCount > 0) {
                dataToPut.push({ cardId: cardId, count: newCount } as DBCardPool);
            } else {
                idsToDelete.push(cardId);
            }
        }

        try {
            // 2. トランザクション内で一括実行 (bulkPut/bulkDelete)
            await db.transaction('rw', db.cardPool, async () => {
                if (dataToPut.length > 0) {
                    await db.cardPool.bulkPut(dataToPut);
                }
                if (idsToDelete.length > 0) {
                    await db.cardPool.bulkDelete(idsToDelete);
                }
            });

            // 3. キャッシュ更新
            dataToPut.forEach(data => cardPoolCache?.set(data.cardId, data.count));
            idsToDelete.forEach(id => cardPoolCache?.delete(id));

        } catch (error) {
            console.error("Failed to bulk update card pool:", error);
            throw new Error("カード資産の一括DB更新に失敗しました。");
        }
    },

    /**
     * カードプール全体をDBから物理的にクリアする
     */
    async deleteCardPool(): Promise<void> {
        try {
            await db.cardPool.clear();
            cardPoolCache = new Map(); // キャッシュもクリア
            console.log("[CardPoolService] IndexedDB cardPool cleared.");
        } catch (error) {
            console.error("Failed to clear card pool in DB:", error);
            throw new Error("カードプールのDBクリアに失敗しました。");
        }
    },

    /**
     * Deck削除時のCardPoolエントリ削除ロジック（現時点では実装保留）
     */
    async bulkDeleteCardPoolEntriesByDeckId(_deckId: string): Promise<void> {
        // DeckServiceからの呼び出しに備え、アクション名は定義。
        console.warn(`[CardPoolService] bulkDeleteCardPoolEntriesByDeckId: The logic for deleting/adjusting owned cards based on deck removal is complex and currently unimplemented.`);
    }
};