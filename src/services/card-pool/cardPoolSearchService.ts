/**
 * src/services/card-pools/CardPoolSearchService.ts
 *
 * CardPool（所有カード資産）データに関する**検索/参照**のロジックを担うサービス層。
 * 責務は、**IndexedDB (db.cardPool)**に対してクエリを実行し、結果を特定の形式（Map）で返すことです。
 *
 * - データ永続化（CRUD）は**CardPoolDataService**に委譲します。
 */

import { db } from "../database/db";
import type { DBCardPool } from '../../models/db-types'; 

/**
 * IndexedDB (Dexie) の 'cardPool' テーブルに対する参照操作を扱うサービス
 */
export const cardPoolSearchService = {

    /**
     * [DB連携] 現在のカードプール全体をDBから取得し、Map形式で返す。
     * @returns cardIdをキー、所有枚数を値とする Map<string, number>
     */
    async getOwnedCardsMap(): Promise<Map<string, number>> {
        try {
            // DBから全エントリを取得
            const dbEntries: DBCardPool[] = await db.cardPool.toArray();
            
            // Map<cardId, count> に変換
            const cardMap = new Map<string, number>();
            dbEntries.forEach(entry => {
                cardMap.set(entry.cardId, entry.count);
            });

            console.log(`[CardPoolSearchService] Fetched ${cardMap.size} unique owned cards from DB.`);
            return cardMap;
        } catch (error) {
            console.error("[CardPoolSearchService] Failed to load card pool from DB:", error);
            return new Map();
        }
    },
};