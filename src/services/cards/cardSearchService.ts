/**
 * src/services/cards/CardSearchService.ts
 *
 * Card（カード）データに関する**検索/クエリ**のロジックを担うサービス層。
 * 責務は、UIや他のドメインロジックからの要求に基づき、**IndexedDB (db.cards)**に対して特定の条件でクエリを実行し、結果を返すことです。
 *
 * - キャッシングやCRUDロジックは**CardDataService**に委譲します。
 * - 主に、特定のパック、レアリティ、または検索条件に基づくカードリストの取得を提供します。
 */

import type { Card } from '../../models/card';
import { db } from '../database/db'; 

export const cardSearchService = {
    
    /**
     * [DB連携] パックIDとレアリティに基づいてカードデータを取得する
     */
    async getCardsByPackAndRarity(packId: string, rarity: string): Promise<Card[]> {
        try {
            return await db.cards
                .where({ packId: packId, rarity: rarity })
                .sortBy('registrationSequence'); 
        } catch (error) {
            console.error("[CardSearchService] Failed to fetch cards by pack and rarity:", error);
            return [];
        }
    },

    /**
     * [DB連携] 特定のパックに収録されている全てのカードを、登録順で取得する
     */
    async getCardsByPackId(packId: string): Promise<Card[]> {
        try {
            return await db.cards
                .where('packId').equals(packId)
                .sortBy('registrationSequence'); 
        } catch (error) {
            console.error("[CardSearchService] Failed to fetch cards by pack ID:", error);
            return [];
        }
    },

    // 💡 [追加] 全てのカードを登録順で取得するアクション（汎用検索のベース）
    async getAllCardsOrdered(): Promise<Card[]> {
        try {
            return await db.cards.orderBy('registrationSequence').toArray();
        } catch (error) {
            console.error("[CardSearchService] Failed to fetch all cards ordered:", error);
            return [];
        }
    },
};