/**
 * src/services/pack-logic/CardDataService.ts
 *
 * TCGカードの定義データを管理するシングルトンサービス。
 * IndexedDB (cardsテーブル) へのアクセス、キャッシュ、および検索機能を提供する。
 */

import type { Card } from '../../models/card';
import { db } from '../database/db'; // IndexedDBインスタンスのインポート

// const CARD_DATA_SOURCE_URL = '/data/tcg-cards.json';
let cardCache: Map<string, Card> | null = null;

// 💡 追加: 特定パック内の現在の最大登録連番を取得するユーティリティ関数
const getMaxRegistrationSequence = async (packId: string): Promise<number> => {
    // packIdでフィルタリングし、registrationSequenceの降順で最初のレコードを取得
    const maxCard = await db.cards
        .where('packId').equals(packId)
        .reverse() // registrationSequence の降順ソート
        .sortBy('registrationSequence') // 明示的に registrationSequence でソート
        .then(result => result.length > 0 ? result[0] : null);

    return maxCard ? maxCard.registrationSequence : -1; // カードがなければ -1 を返す
};

export const cardDataService = {

    // --- キャッシュ・検索ロジック ---

    async loadAllCardsFromCache(): Promise<boolean> {
        if (cardCache) return true;

        console.log('カードデータをIndexedDBからロード中...');
        try {
            // IndexedDBから全データを取得
            const allCards = await db.cards.toArray();
            const cardMap = new Map(allCards.map(card => [card.cardId, card]));
            cardCache = cardMap;
            
            // 初回ロード時、データがない場合はダミーデータを追加（デバッグ用）
            if (allCards.length === 0) {
                console.log('DBが空のため、ダミーデータをキャッシュに追加...');
                // フェーズ3用のダミーデータ (DBには書き込まずキャッシュのみ)
                const dummyCardArray: Card[] = [
                    // 💡 修正: registrationSequence を追加
                    { cardId: 'tcg-0001', packId: 'tcg', name: 'ダミーカードA', imageUrl: '', rarity: 'Common', userCustom: {}, registrationSequence: 0 },
                    { cardId: 'tcg-0002', packId: 'tcg', name: 'ダミーカードB', imageUrl: '', rarity: 'Rare', userCustom: {}, registrationSequence: 1 },
                ];
                dummyCardArray.forEach(card => cardCache?.set(card.cardId, card));
            }
            
            return true;
        } catch (error) {
            console.error('カードデータのロードに失敗しました:', error);
            return false;
        }
    },

    getAllCards(): Card[] {
        if (!cardCache) {
            this.loadAllCardsFromCache();
            return [];
        }
        return Array.from(cardCache.values());
    },
    
    /**
     * 💡 追加: エラー3対応。IDを指定してカードを取得するロジック
     */
    getCardById(cardId: string): Card | undefined {
        return cardCache?.get(cardId);
    },


    // --- CRUD ロジック (連番付与ロジック込み) ---
    
    /**
     * 新しいカードをDBに追加し、キャッシュを更新する。
     * 💡 登録順連番 (registrationSequence) の付与ロジックを追加
     */
    async addCard(newCard: Card): Promise<void> {
        // 1. 新しい連番を取得
        const maxSequence = await getMaxRegistrationSequence(newCard.packId);
        const sequence = maxSequence + 1;

        // 2. 連番を付与したカードデータを作成
        const cardWithSequence: Card = {
            // 💡 TSエラー回避のため、newCardがregistrationSequenceを持っていても上書きする
            ...newCard,
            registrationSequence: sequence,
        };

        await db.cards.put(cardWithSequence); // DB書き込み
        cardCache?.set(cardWithSequence.cardId, cardWithSequence); // キャッシュ更新
    },

    /**
     * 既存のカードをDBで更新し、キャッシュを更新する。
     */
    async updateCard(updatedCard: Card): Promise<void> {
        // 💡 既存カードの更新では registrationSequence の値は変更しない
        await db.cards.put(updatedCard); // DB書き込み
        cardCache?.set(updatedCard.cardId, updatedCard); // キャッシュ更新
    },

    /**
     * カードをDBから削除し、キャッシュを更新する。
     */
    async deleteCard(cardId: string): Promise<void> {
        await db.cards.delete(cardId); // DB削除
        cardCache?.delete(cardId); // キャッシュ更新
    },

    /**
     * 指定されたパックIDに紐づくカードを一括でDBから削除する。
     * @param packId - 対象のパックID
     * @returns 削除されたカードのID配列
     */
    async deleteCardsByPackId(packId: string): Promise<string[]> {
        const targetCardIds = this.getAllCards()
            .filter(card => card.packId === packId)
            .map(card => card.cardId);

        if (targetCardIds.length > 0) {
            await db.cards.bulkDelete(targetCardIds); // DB一括削除
            targetCardIds.forEach(id => cardCache?.delete(id)); // キャッシュ削除
        }
        
        return targetCardIds;
    },

    /**
     * カードリストを一括でDBに追加または更新し、キャッシュを更新する。
     * CSVインポートや外部データ連携で使用されます。
     * 💡 登録順連番 (registrationSequence) の付与ロジックを追加
     */
    async bulkPutCards(cards: Card[]): Promise<void> {
        if (cards.length === 0) return;

        // packId ごとに連番を採番する必要があるため、データをパックIDでグループ化
        const cardsByPackId = cards.reduce((acc, card) => {
            if (!acc[card.packId]) {
                acc[card.packId] = [];
            }
            acc[card.packId].push(card);
            return acc;
        }, {} as Record<string, Card[]>);

        const cardsToPut: Card[] = [];

        for (const packId of Object.keys(cardsByPackId)) {
            const packCards = cardsByPackId[packId];
            
            // 1. 現在の最大連番を取得
            let currentMaxSequence = await getMaxRegistrationSequence(packId);

            // 2. 連番を付与
            for (let i = 0; i < packCards.length; i++) {
                // 新規のカード (cardCacheに存在しない) の場合、連番を付与
                const isNew = !cardCache?.has(packCards[i].cardId);
                
                if (isNew) {
                    currentMaxSequence++;
                    packCards[i].registrationSequence = currentMaxSequence;
                }
                
                // 💡 update/add どちらでも対応できるよう、すべてのカードをリストに追加
                cardsToPut.push(packCards[i]); 
            }
        }
        
        // 3. DBへ一括書き込み
        await db.cards.bulkPut(cardsToPut);

        // 4. キャッシュを更新
        cardsToPut.forEach(card => cardCache?.set(card.cardId, card));
    },

};