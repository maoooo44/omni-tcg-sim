/**
 * src/services/currency/currencyService.ts
 *
 * IndexedDB (Dexie) の 'userSettings' テーブル内の通貨データ (コイン)
 * に対する操作を扱うサービス。コインのロードと保存のロジックを提供する。
 */

import { db } from '../database/db';
import type { DBSetting } from '../../models/db-types'; 

const COINS_KEY = 'coins';

/**
 * IndexedDB (Dexie) の 'userSettings' テーブル内の通貨データに対する操作を扱うサービス
 */
export const currencyService = {

    /**
     * DBからコイン数をロードする。
     * @returns コイン数 (number)。DBにレコードがない場合は undefined を返す。
     */
    async loadCoins(): Promise<number | undefined> {
        try {
            // key: 'coins' のレコードを検索
            const entry = await db.userSettings.get(COINS_KEY);
            
            if (entry) {
                // 値を number 型にキャストして返す
                return entry.value as number;
            }
            // レコードがない場合は undefined
            return undefined; 
        } catch (error) {
            console.error("Failed to load coins from DB:", error);
            return undefined; // エラー時も undefined を返す
        }
    },

    /**
     * 現在のコイン数をDBに保存する（更新または新規作成）。
     * @param coins - 保存するコイン数
     */
    async saveCoins(coins: number): Promise<void> {
        try {
            const setting: DBSetting = {
                key: COINS_KEY,
                value: coins
            };
            // put で更新または新規作成
            await db.userSettings.put(setting);
        } catch (error) {
            console.error("Failed to save coins to DB:", error);
        }
    },
};