/**
 * src/services/cards/CardSearchService.ts
 *
 * * Card（カード）データに関する**検索/クエリ**のロジックを担うサービス層モジュール。
 * * 責務:
 * 1. IndexedDB（db.cards）に対し、複合条件（packId & rarity）やバルク条件（packIds）に基づく高度な検索クエリを実行する。
 * 2. クエリ結果をアプリケーション層（UI/ストアなど）に利用しやすい形式（Card[]）で提供する。
 * 3. 取得したデータに対して、クライアント側でのソート（登録順 number）を適用する。
 * 4. キャッシュ層（cardService）を介さず、DBから最新のデータを取得する手段を提供する。
 */

import type { Card } from '../../models/card';
import { db } from '../database/db';

export const cardSearchService = {

    /**
     * 単一のパックIDとレアリティに基づいてカードデータを取得します。
     * @param packId - 検索対象のパックID
     * @param rarity - 検索対象のレアリティ名
     * @returns Card[]
     */
    async fetchCardsByPackIdAndRarity(packId: string, rarity: string): Promise<Card[]> {
        try {
            const results = await db.cards
                .where({ packId: packId, rarity: rarity })
                .toArray();

            // numberでクライアント側ソート
            return results.sort((a, b) => (a.number ?? Infinity) - (b.number ?? Infinity));
        } catch (error) {
            console.error("[CardSearchService:fetchCardsByPackIdAndRarity] ❌ Failed to fetch cards:", error);
            return [];
        }
    },

    /**
     * 複数のパックIDに収録されている全てのカードを、登録順（number）で取得します。（バルク検索用）
     * @param packIds - 検索対象の Pack ID の配列
     * @returns Card[]
     */
    async fetchCardsBulkByPackIdsOrdered(packIds: string[]): Promise<Card[]> {
        if (packIds.length === 0) return [];

        try {
            const results = await db.cards
                .where('packId').anyOf(packIds)
                .toArray();

            // numberでクライアント側ソート
            return results.sort((a, b) => (a.number ?? Infinity) - (b.number ?? Infinity));
        } catch (error) {
            console.error("[CardSearchService:fetchCardsBulkByPackIdsOrdered] ❌ Failed to fetch cards by pack IDs:", error);
            return [];
        }
    },

    /**
     * 全てのカードを登録順（number）で取得します。（汎用的なフィルタリング検索のベース）
     * @returns Card[]
     */
    async fetchAllCardsOrdered(): Promise<Card[]> {
        try {
            return await db.cards.orderBy('number').toArray();
        } catch (error) {
            console.error("[CardSearchService:fetchAllCardsOrdered] ❌ Failed to fetch all cards ordered:", error);
            return [];
        }
    },
};