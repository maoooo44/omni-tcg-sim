/**
 * src/services/cards/CardSearchService.ts
 *
 * Card（カード）データに関する**検索/クエリ**のロジックを担うサービス層。
 * 責務は、UIや他のドメインロジックからの要求に基づき、IndexedDB (db.cards) に対して特定の条件でクエリを実行し、結果を返すことです。
 *
 * - キャッシング、基本的なCRUD/ID取得ロジックは**cardService**に完全に委譲します。
 * - 主に、複雑なカスタム条件や、キャッシュを介さない最新のDBデータが必要なクエリを提供します。
 * パックのナンバー->カードのナンバー順にするには，パックナンバーでソートしてから配列を渡す必要がある？
 */

import type { Card } from '../../models/card';
import { db } from '../database/db'; 

export const cardSearchService = {
    
    // ----------------------------------------
    // [1] Single Item Query (コンポーネント/ドメインロジックからの利用を想定)
    // ----------------------------------------
    
    /**
     * [DB連携] 単一のパックIDとレアリティに基づいてカードデータを取得します。
     * @param packId - 検索対象のパックID
     * @param rarity - 検索対象のレアリティ名
     * @returns Card[]
     */
    async fetchCardsByPackIdAndRarity(packId: string, rarity: string): Promise<Card[]> {
        try {
            // DB側で複合インデックスの利用を想定 (packId + rarity)
            const results = await db.cards
                .where({ packId: packId, rarity: rarity })
                .toArray();
            
            // numberでクライアント側ソート（orderByはCollectionにないため）
            return results.sort((a, b) => (a.number ?? Infinity) - (b.number ?? Infinity));
        } catch (error) {
            console.error("[CardSearchService:fetchCardsByPackIdAndRarity] ❌ Failed to fetch cards:", error);
            return [];
        }
    },
    
    // ----------------------------------------
    // [2] Bulk Query (ストア/汎用検索からの利用を想定)
    // ----------------------------------------

    /**
     * [DB連携] 複数のパックIDに収録されている全てのカードを、登録順（number）で取得します。（ストア連携用）
     * 💡 cardServiceのキャッシュを介さず、DBから最新のデータを一括で取得します。
     * @param packIds - 検索対象の Pack ID の配列
     * @returns Card[]
     */
    async fetchCardsBulkByPackIdsOrdered(packIds: string[]): Promise<Card[]> {
        if (packIds.length === 0) return [];
        
        try {
            // where('packId').anyOf(packIds) で条件を絞り込み、toArray()で取得。（バルク的なDB読み込み）
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
     * [DB連携] 全てのカードを登録順（number）で取得します。（汎用的なフィルタリング検索のベース）
     * @returns Card[]
     */
    async fetchAllCardsOrdered(): Promise<Card[]> {
        try {
            // テーブル全体から number 順で取得
            return await db.cards.orderBy('number').toArray();
        } catch (error) {
            console.error("[CardSearchService:fetchAllCardsOrdered] ❌ Failed to fetch all cards ordered:", error);
            return [];
        }
    },
};