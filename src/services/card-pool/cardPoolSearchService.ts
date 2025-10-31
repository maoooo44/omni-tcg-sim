/**
 * src/services/card-pools/CardPoolSearchService.ts
 *
 * * CardPool（ユーザーの所有カード資産）データに関する**検索/参照**のロジックを担うサービス層モジュール。
 * * 責務:
 * 1. DBコア層（db.cardPool）を介した 'cardPool' テーブルからのデータ参照操作（クエリ実行）を担う。
 * 2. 取得したDBエントリ（DBCardPool[]）を、アプリケーションで利用しやすい形式（Map<cardId, count>）に変換して提供する。
 * 3. データ永続化（CRUD）の責務は CardPoolDataService に委譲する。
 */

import { db } from "../database/db";
import type { DBCardPool } from '../../models/db-types';

/**
 * IndexedDB (Dexie) の 'cardPool' テーブルに対する参照操作を扱うサービス
 */
export const cardPoolSearchService = {

    /**
     * 現在のカードプール全体をDBから取得し、Map形式（cardId -> count）で返す。
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
            // 失敗時は空のMapを返すことで、呼び出し元がnullチェックなどをせずに安全に処理を継続できるようにする
            return new Map();
        }
    },
};