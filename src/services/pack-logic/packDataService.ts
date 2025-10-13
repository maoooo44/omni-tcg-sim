/**
 * src/services/pack-logic/packDataService.ts
 *
 * IndexedDB (Dexie) の 'packs' テーブルおよび 'cards' テーブルと連携し、
 * パックデータおよび特定の条件（パックIDとレアリティ）に合致する
 * カードデータを非同期で取得・更新するデータサービス。
 */

import type { Pack } from '../../models/pack';
import type { Card } from '../../models/card';
import { db } from '../database/db'; // データベースインスタンスをインポート
// ★ 追加: データベースの最大値を取得する汎用関数
import { getMaxNumberByCollection } from '../database/dbUtils';
// ★ 追加: 次の番号を計算する汎用関数
import { getNextNumber } from '../../utils/numberingUtils';

/**
 * [DB連携] パックIDとレアリティに基づいてカードデータを取得する
 */
export const getCardsByPackAndRarity = async (packId: string, rarity: string): Promise<Card[]> => {
    try {
        // db.cards (新しいテーブル) を検索
        return await db.cards
            .where({ packId: packId, rarity: rarity })
            // 💡 修正: レアリティごとのリストでも、登録順でソート
            .sortBy('registrationSequence'); 
    } catch (error) {
        console.error("Failed to fetch cards by pack and rarity:", error);
        return [];
    }
};

/**
 * 💡 追加: [DB連携] 特定のパックに収録されている全てのカードを、登録順で取得する
 */
export const getCardsByPackId = async (packId: string): Promise<Card[]> => {
    try {
        return await db.cards
            .where('packId').equals(packId)
            // 💡 registrationSequenceの昇順でソート（デフォルトの表示順）
            .sortBy('registrationSequence'); 
    } catch (error) {
        console.error("Failed to fetch cards by pack ID:", error);
        return [];
    }
};


/**
 * [DB連携] 全パックデータを取得する
 */
export const getAllPacks = async (): Promise<Pack[]> => {
    try {
        return await db.packs.toArray(); // db.packs から全件取得
    } catch (error) {
        console.error("Failed to fetch all packs:", error);
        return [];
    }
};

/**
 * [DB連携] 単一パックデータをIDで取得する
 */
export const getPackById = async (packId: string): Promise<Pack | undefined> => {
    try {
        return await db.packs.get(packId); // IDで単一取得
    } catch (error) {
        console.error("Failed to fetch pack by ID:", error);
        return undefined;
    }
};

/**
 * [DB連携] パックデータをDBに追加/更新し、自動採番を処理する。
 */
export const putPack = async (pack: Pack): Promise<void> => {
    // number が undefined または null の場合に自動採番を実行
    if (pack.number === undefined || pack.number === null) {
        // 1. numberフィールドの現在の最大値を取得 (全パックから取得)
        // パックの番号はパック全体でユニークな「図鑑番号」として扱う
        const maxNumber = await getMaxNumberByCollection('packs', 'number');
        
        // 2. 次の番号を計算 (デフォルト開始値 1)
        const nextNumber = getNextNumber(maxNumber, 1); 

        // 3. number を付与
        pack.number = nextNumber;
    }
    
    try {
        await db.packs.put(pack); // DB書き込み（追加/更新）
    } catch (error) {
        console.error("Failed to put pack:", error);
        throw error; // エラーを上位にスロー
    }
};