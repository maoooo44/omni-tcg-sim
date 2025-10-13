/**
 * src/services/pack-logic/CardDataService.ts
 *
 * TCGカードの定義データを管理するシングルトンサービス。
 * IndexedDB (cardsテーブル) へのアクセス、キャッシュ、および検索機能を提供する。
 */

import type { Card } from '../../models/card';
import { db } from '../database/db'; 
import { getNextNumber } from '../../utils/numberingUtils';

let cardCache: Map<string, Card> | null = null;

// --- ユーティリティ: パック内の最大番号を取得 ---
/**
 * 指定した packId に紐づくカードのうち、最大の number を取得する。
 * @param packId - 対象のパックID
 * @returns 最大の number (見つからない場合は null)
 */
const getMaxNumberForPack = async (packId: string): Promise<number | null> => {
    // 1. 指定された packId でフィルタリングし、number が設定されているカードを対象とする
    const maxCard = await db.cards
        .where('packId').equals(packId)
        .filter(card => card.number !== undefined && card.number !== null)
        .reverse()
        // 'number'のインデックスがない場合、sortByはパフォーマンス上のボトルネックになる可能性がある
        // numberの降順で最初の要素を取得する（IndexedDBのキーを利用した方法が理想だが、ここでは汎用的なsortByを使用）
        .sortBy('number')
        .then(result => result.length > 0 ? result[0] : null);

    return maxCard?.number ?? null;
};


export const cardDataService = {

    // --- キャッシュ・検索ロジック (変更なし) ---
    // ... loadAllCardsFromCache, getAllCards, getCardById は省略 ...
    
    async loadAllCardsFromCache(): Promise<boolean> {
        // 既存の loadAllCardsFromCache ロジックをそのまま使用
        if (cardCache) return true;

        console.log('カードデータをIndexedDBからロード中...');
        try {
            const allCards = await db.cards.toArray();
            const cardMap = new Map(allCards.map(card => [card.cardId, card]));
            cardCache = cardMap;
            
            // デバッグ用ダミーデータはそのまま
            
            return true;
        } catch (error) {
            console.error('カードデータのロードに失敗しました:', error);
            return false;
        }
    },

    getAllCards(): Card[] {
        if (!cardCache) {
            // NOTE: ここで loadAllCardsFromCache を同期的に呼び出すのは非推奨。
            // 呼び出し元（useInitialLoadなど）で await されることを前提とする。
            this.loadAllCardsFromCache();
            return [];
        }
        return Array.from(cardCache.values());
    },
    
    getCardById(cardId: string): Card | undefined {
        return cardCache?.get(cardId);
    },


    // --- CRUD/一括処理ロジック ---
    
    /**
     * カードリストを一括でDBに追加または更新し、キャッシュを更新する。（編集画面の保存で使用）
     * number が未定義/nullの場合は、パック内の次の番号を自動採番する。
     * @param cards - 保存するカードオブジェクトの配列。
     */
    async bulkPutCards(cards: Card[]): Promise<void> {
        if (cards.length === 0) return;
        
        const cardsToSave: Card[] = [];
        const packMaxNumberMap = new Map<string, number>();

        for (const card of cards) {
            let cardToSave = card;
            
            // 💡 number の自動採番が必要な場合
            if (card.number === undefined || card.number === null) {
                const packId = card.packId;
                
                // 1. パックの最大番号を取得（またはマップから取得）
                let maxNumber = packMaxNumberMap.get(packId);
                if (maxNumber === undefined) {
                    // DBから最大番号を取得し、マップに保存
                    maxNumber = await getMaxNumberForPack(packId) ?? 0;
                }
                
                // 2. 次の番号を計算し、カードに付与
                const nextNumber = getNextNumber(maxNumber, 1);
                cardToSave = { ...card, number: nextNumber };
                
                // 3. 次の自動採番に備えて、マップの最大値を更新
                packMaxNumberMap.set(packId, nextNumber);
            }
            
            cardsToSave.push(cardToSave);
        }

        // 1. DBへ一括書き込み
        await db.cards.bulkPut(cardsToSave);

        // 2. キャッシュを更新
        cardsToSave.forEach(card => cardCache?.set(card.cardId, card));
    },
    
    /**
     * 個別のカードをDBで更新し、キャッシュを更新する。（主に単一カードの小さな更新に使用）
     * @deprecated bulkPutCardsの使用を推奨
     */
    async updateCard(updatedCard: Card): Promise<void> {
        // 💡 number の自動採番は bulkPutCards に任せる
        await db.cards.put(updatedCard); 
        cardCache?.set(updatedCard.cardId, updatedCard); 
    },

    /**
     * カードをDBから削除し、キャッシュを更新する。
     */
    async deleteCard(cardId: string): Promise<void> {
        await db.cards.delete(cardId); 
        cardCache?.delete(cardId); 
    },

    /**
     * 指定されたパックIDに紐づくカードを一括でDBから削除し、キャッシュを更新する。
     */
    async deleteCardsByPackId(packId: string): Promise<string[]> {
        const targetCardIds = this.getAllCards()
            .filter(card => card.packId === packId)
            .map(card => card.cardId);

        if (targetCardIds.length > 0) {
            await db.cards.bulkDelete(targetCardIds); 
            targetCardIds.forEach(id => cardCache?.delete(id)); 
        }
        
        return targetCardIds;
    },
};