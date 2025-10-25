/**
 * src/stores/cardPoolStore.ts
 *
 * ユーザーの**カード資産（Card Pool）**の状態管理を行うZustandストア。
 * 責務は、**所有カードの枚数データ（ownedCards）**と**総枚数（totalOwnedCards）**のグローバルな保持と、
 * DBへの永続化ロジックの実行です。
 *
 * - データアクセスは**cardPoolDataService**に完全に委譲され、Storeは状態の同期とビジネスロジック（枚数計算、DB連携）に集中します。
 */

import { create } from 'zustand';
import { cardPoolService } from '../services/card-pool/cardPoolService';

// ユーザーのカード資産の状態
export interface CardPoolState {
    // key: cardId (string), value: 所有枚数 (number)
    ownedCards: Map<string, number>;
    totalOwnedCards: number;
    isLoading: boolean; 
    
    // --- アクション ---
    /** DB/Cacheからデータをロードしてストアを初期化 */
    fetchCardPool: () => Promise<void>; 
    /** パック開封などによってカードを追加 */
    addCards: (cards: { cardId: string, count: number, packId: string }[]) => Promise<void>;
    /** デッキ構築などによってカードの枚数を更新 */
    setCardCount: (cardId: string, count: number) => Promise<void>;
    /** カードプールを完全にリセット（デバッグ用） */
    deleteCardPool: () => Promise<void>; 
    /** ZIPインポート: カードプールデータをDBとストアに上書きする */
    importCardPool: (importedOwnedCards: Map<string, number>) => Promise<void>;
}

const initialState = {
    ownedCards: new Map<string, number>(), // 型を明示
    totalOwnedCards: 0,
    isLoading: false, 
};

export const useCardPoolStore = create<CardPoolState>((set, _get) => ({
    ...initialState,
    
    // DB/Cacheからカードプールをロードする
    fetchCardPool: async () => { 
        set({ isLoading: true }); 
        try {
            // サービス層のキャッシュロードアクションを呼び出す
            // 💡 修正: cardPoolDataService.loadAllCardPoolFromCache() を実行し、DBからのロードとキャッシュの構築を保証
            await cardPoolService.loadAllCardPoolFromCache(); // 👈 修正点
            const ownedCards = cardPoolService.getAllCardPoolFromCache();

            
            // 総枚数を計算
            const newTotal = Array.from(ownedCards.values()).reduce((acc, count) => acc + count, 0);

            // ストアに反映
            set(state => ({
                ...state,
                ownedCards, 
                totalOwnedCards: newTotal,
            }));
            console.log(`✅ [CardPoolStore] Loaded ${ownedCards.size} unique cards, total ${newTotal} cards.`);

        } catch (error) {
            console.error('Failed to fetch card pool:', error);
            // 失敗時は初期状態を維持しつつ、ロード状態を解除
        } finally {
            set({ isLoading: false }); // ロード完了
        }
    },

    // カードを追加し、DBに保存する 
    addCards: async (cards) => {
        const countsToUpdate = new Map<string, number>();

        set(state => {
            const newOwnedCards = new Map(state.ownedCards);
            let newTotal = state.totalOwnedCards;

            cards.forEach(({ cardId, count }) => {
                const currentCount = newOwnedCards.get(cardId) || 0;
                const newCount = currentCount + count;
                
                newOwnedCards.set(cardId, newCount);
                countsToUpdate.set(cardId, newCount);
                newTotal += count;
            });

            return { 
                ownedCards: newOwnedCards, 
                totalOwnedCards: newTotal 
            };
        });

        // DBへ変更を保存 (非同期)
        try {
            // cardPoolDataServiceのbulkSaveCardPoolEntriesを呼び出す
            await cardPoolService.bulkSaveCardPoolEntries(countsToUpdate); 
            console.log('[CardPoolStore] Bulk update saved to DB.');
        } catch (error) {
            console.error('Failed to save card pool after adding cards:', error);
        }
    },

    // カード枚数を設定し、DBに保存する（売却や編集用）
    setCardCount: async (cardId, count) => {
        const newCount = Math.max(0, count);

        set(state => {
            const newOwnedCards = new Map(state.ownedCards);
            let newTotal = state.totalOwnedCards;

            const oldCount = newOwnedCards.get(cardId) || 0;
            newTotal = newTotal - oldCount + newCount;

            if (newCount > 0) {
                newOwnedCards.set(cardId, newCount);
            } else {
                newOwnedCards.delete(cardId);
            }

            return { 
                ownedCards: newOwnedCards, 
                totalOwnedCards: newTotal 
            };
        });

        // DBへ変更を保存 (非同期)
        try {
            // cardPoolDataServiceのsaveCardPoolEntryを呼び出す
            await cardPoolService.saveCardPoolEntry(cardId, newCount); 
            console.log(`[CardPoolStore] Card count for ${cardId} saved to DB.`);
        } catch (error) {
            console.error('Failed to save card pool after setting count:', error);
        }
    },

    // カードプール全体を削除する
    deleteCardPool: async () => {
        // cardPoolDataServiceのdeleteCardPoolを呼び出す
        await cardPoolService.deleteCardPool(); 
        set(initialState);
        console.log("Card pool delete completed.");
    },


    // ZIPインポート機能
    importCardPool: async (importedOwnedCards) => {
        // 1. DBを完全に上書き (クリアしてから新しいデータをセット)
        try {
            // cardPoolDataServiceのdeleteCardPoolとbulkSaveCardPoolEntriesを呼び出す
            await cardPoolService.deleteCardPool(); 
            await cardPoolService.bulkSaveCardPoolEntries(importedOwnedCards); 
        } catch (error) {
            console.error("Failed to overwrite card pool in DB:", error);
            throw new Error("カードプールのDB上書きに失敗しました。");
        }
        
        // 2. Zustandストアの状態を更新
        const newTotal = Array.from(importedOwnedCards.values()).reduce((acc, count) => acc + count, 0);

        set({
            ownedCards: importedOwnedCards, 
            totalOwnedCards: newTotal
        });
        console.log(`✅ Card pool imported. Total: ${newTotal} cards.`);
    },
}));