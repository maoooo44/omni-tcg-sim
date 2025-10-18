/**
 * src/services/cards/cardService.ts
 *
 * Card（カード）データに関するデータベースアクセス、ローカルキャッシュ管理、および関連するロジックを管理するサービス層モジュール。
 *
 * * 責務:
 * 1. DBからのデータロードとグローバルなインメモリキャッシュ（cardCache）の構築・提供。
 * 2. メインコレクション（'cards'）の **CRUD 操作をバルク処理に統一して** 提供する。
 * 3. パック削除時の**関連カードの一括物理削除（カスケード削除の受け入れ）**を担う。
 * 4. DBコア層（dbCore）とデータマッパー（dbMappers）の橋渡し役を担う。
 * 5. アーカイブ、履歴、採番などのドメインロジックはPackServiceなどの上位層に**完全に**委譲する。
 */

import type { Card } from '../../models/card';
import type { DBCard } from "../../models/db-types"; 
import { 
    fetchAllItemsFromCollection, 
    bulkPutItemsToCollection, 
    bulkDeleteItemsFromCollection, 
    bulkFetchItemsByIdsFromCollection, 
} from '../database/dbCore';
import { 
    cardToDBCard, // Card -> DBCard 変換
    dbCardToCard, // DBCard -> Card 変換
} from '../database/dbMappers';

let cardCache: Map<string, Card> | null = null;


export const cardService = {

    // ----------------------------------------
    // [1] Cache Load / Read (キャッシュ/DBからの取得)
    // ----------------------------------------

    getAllCardsFromCache(): Card[] {
        return cardCache ? Array.from(cardCache.values()) : [];
    },

    getCardByIdFromCache(cardId: string): Card | undefined {
        return cardCache?.get(cardId);
    },

    /**
     * キャッシュから指定されたパックIDに紐づくカード群を取得します。
     */
    getCardsByPackIdFromCache(packId: string): Card[] {
        return this.getAllCardsFromCache() 
            .filter(card => card.packId === packId);
    },

    // ----------------------------------------
    // [2] Bulk Read (バルク取得)
    // ----------------------------------------

    /**
     * メインコレクション（'cards'）から全ての Card データを取得します。
     * キャッシュが存在しない場合はDBからフェッチし、キャッシュを構築します。
     * @returns Card[]
     */
    async fetchAllCards(): Promise<Card[]> {
        
        console.log(`[CardService:fetchAllCards] 🔍 Fetching all cards.`);
        
        if (cardCache) { 
            console.log(`[CardService:fetchAllCards] ✅ Cache hit (all cards).`);
            return this.getAllCardsFromCache(); 
        }

        try {
            // dbCore.fetchAllItemsFromCollection はコレクション全体を取得するバルク操作
            const cards = await fetchAllItemsFromCollection<Card, DBCard>(
                'cards', 
                dbCardToCard as (dbRecord: DBCard) => Card 
            );
            
            // キャッシュが存在しない場合、DBから取得したデータでキャッシュを構築
            if (!cardCache) {
                cardCache = new Map(cards.map(c => [c.cardId, c]));
            }

            return cards;
        } catch (error) {
            console.error(`[CardService:fetchAllCards] ❌ Failed to fetch from 'cards':`, error);
            throw error;
        }
    },
    
    /**
     * IDを指定して複数のカードを一括取得します。（バルク処理に一本化）
     * @param ids Card IDの配列
     * @returns Card | null の配列。結果配列の順序は ids の順序と一致します。
     */
    async fetchCardsByIds(ids: string[]): Promise<(Card | null)[]> {
        if (ids.length === 0) return [];
        
        console.log(`[CardService:fetchCardsByIds] 🔍 Fetching ${ids.length} items from 'cards' (Bulk).`);

        const resultsMap = new Map<string, Card>();
        const idsToFetchFromDB: string[] = [];

        // 1. キャッシュヒットしたCardと、DBからフェッチが必要なIDを分離
        for (const cardId of ids) {
            const cachedCard = this.getCardByIdFromCache(cardId);
            if (cachedCard) {
                resultsMap.set(cardId, cachedCard);
            } else {
                idsToFetchFromDB.push(cardId);
            }
        }

        // 2. DBからのバルク取得
        if (idsToFetchFromDB.length > 0) {
            console.log(`[CardService:fetchCardsByIds] ➡️ Cache miss for ${idsToFetchFromDB.length} IDs. Fetching from DB...`);
            
            const fetchedCardsOrNull = await bulkFetchItemsByIdsFromCollection<Card, DBCard>(
                idsToFetchFromDB, 
                'cards', 
                dbCardToCard 
            );
            
            // 3. 取得結果をキャッシュと結果Mapに追加
            fetchedCardsOrNull.forEach(card => {
                if (card) {
                    cardCache?.set(card.cardId, card); 
                    resultsMap.set(card.cardId, card);
                }
            });
        }

        // 4. 元の ids の順序で結果配列を再構成
        return ids.map(id => resultsMap.get(id) ?? null);
    },

    // ----------------------------------------
    // [3] Bulk Write (一括保存・物理削除)
    // ----------------------------------------
    
    /**
     * カードリストを一括でDBに追加または更新し、キャッシュを更新する。（PackServiceからの委譲先）
     * @param cards Cardの配列
     * @returns 保存された Card の配列
     */
    async saveCards(cards: Card[]): Promise<Card[]> { 
        if (cards.length === 0) return [];
        
        console.log(`[CardService:saveCards] 💾 Saving ${cards.length} cards to 'cards' (Bulk)...`);
        
        // 1. DBCardに変換
        const dbCardsToSave = cards.map(cardToDBCard);
        
        try {
            // 2. DBに一括保存
            await bulkPutItemsToCollection('cards', dbCardsToSave);
            
            // 3. Cacheを更新 (Card型で)
            // DBに保存したデータと同一のはずなので、元の cards を使用
            cards.forEach(card => cardCache?.set(card.cardId, card));

            console.log(`[CardService:saveCards] ✅ Successfully saved ${cards.length} cards.`);
            return cards; 
        } catch (error) {
            console.error("[CardService:saveCards] ❌ Failed to bulk put cards:", error);
            throw new Error("カードの一括保存に失敗しました。");
        }
    },

    /**
     * 複数のカードIDを一括でDBから物理削除し、キャッシュを更新する。
     * @param cardIds - 物理削除対象の Card ID の配列
     */
    async deleteCards(cardIds: string[]): Promise<void> {
        if (cardIds.length === 0) return;
        
        console.log(`[CardService:deleteCards] 🗑️ Deleting ${cardIds.length} cards from 'cards' (Bulk).`);

        try {
            await bulkDeleteItemsFromCollection('cards', cardIds);
            cardIds.forEach(id => cardCache?.delete(id));
            console.log(`[CardService:deleteCards] ✅ Successfully deleted ${cardIds.length} cards.`);
        } catch (error) {
            console.error("[CardService:deleteCards] ❌ Failed to bulk delete cards:", error);
            throw error;
        }
    },

    /**
     * 指定されたパックIDに紐づくカード群を一括でDBから物理削除し、キャッシュを更新する。（カスケード削除の受け入れ）
     * @param packIds - 物理削除対象の Pack ID の配列
     */
    async deleteCardsByPackIds(packIds: string[]): Promise<void> {
        if (packIds.length === 0) return;
        
        console.log(`[CardService:deleteCardsByPackIds] 🗑️ Deleting cards for ${packIds.length} packs (Bulk).`);

        // 1. キャッシュから対象のカードIDを検索 (メインコレクションに存在するカードのみを対象)
        const targetCardIds: string[] = [];
        this.getAllCardsFromCache().forEach(card => {
            if (packIds.includes(card.packId)) {
                targetCardIds.push(card.cardId);
            }
        });

        // 2. 一括削除アクションに委譲
        if (targetCardIds.length > 0) {
            // 既存の deleteCards (bulk処理) に委譲
            await this.deleteCards(targetCardIds); 
        }
        
        console.log(`[CardService:deleteCardsByPackIds] Successfully deleted ${targetCardIds.length} cards across ${packIds.length} packs.`);
    },
};