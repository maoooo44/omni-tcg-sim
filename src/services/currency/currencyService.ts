/**
 * src/services/currency/currencyService.ts
 *
 * * ユーザー設定コレクション（'userSettings'）内に保存されている通貨（コイン）データに対するデータベース操作を管理するサービス層モジュール。
 * * 責務:
 * 1. 特定のキー（COINS_KEY）を用いて 'userSettings' コレクションからのコイン数のロード（取得）。
 * 2. コイン数の DB への保存（更新/新規作成）。
 * 3. データの型変換（DBからの取得時に任意の型を number へキャスト）。
 * 4. ドメインロジック（コインの増減計算など）は、このサービスを利用する上位層に委譲する。
 */

import { db } from '../database/db';
import type { DBSetting } from '../../models/db-types';

const COINS_KEY = 'coins';

export const currencyService = {

    /**
     * DBからコイン数をロードする。
     * @returns コイン数 (number)。DBにレコードがない場合は undefined を返す。
     */
    async loadCoins(): Promise<number | undefined> {
        try {
            const entry = await db.userSettings.get(COINS_KEY);

            if (entry) {
                return entry.value as number;
            }
            return undefined;
        } catch (error) {
            console.error("Failed to load coins from DB:", error);
            return undefined;
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
            await db.userSettings.put(setting);
        } catch (error) {
            console.error("Failed to save coins to DB:", error);
        }
    },
};