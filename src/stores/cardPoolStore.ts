/**
 * src/stores/cardPoolStore.ts
 *
 * * ユーザーのカード資産（Card Pool）の状態管理を行うZustandストア。
 * 責務は、所有カードの枚数データ（ownedCards: Map<cardId, count>）と総枚数（totalOwnedCards）をグローバルに保持し、
 * 各アクション（追加、更新、インポート）の実行時に、対応するデータ永続化ロジックをサービス層に委譲することです。
 *
 * * 責務:
 * 1. カード資産データの状態（Map）とロード状態（isLoading）を保持する。
 * 2. サービス層（cardPoolService）を介したDBからのデータロード（fetchCardPool）を管理する。
 * 3. カード枚数の追加・更新・削除ロジックを実行し、同時にサービス層を呼び出してDBへの変更を永続化する。
 * 4. カードプールの全体的な削除およびインポート（DB上書き）ロジックを提供する。
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
            // サービス層のキャッシュロードアクションを呼び出し、DBからのロードとキャッシュの構築を保証
            await cardPoolService.loadAllCardPoolFromCache();
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
                // 負の枚数を防ぐ
                const newCount = Math.max(0, currentCount + count);

                // 純粋な増分を計算し、合計を更新
                const countDelta = newCount - currentCount;

                if (newCount > 0) {
                    newOwnedCards.set(cardId, newCount);
                } else {
                    newOwnedCards.delete(cardId);
                }

                countsToUpdate.set(cardId, newCount);
                newTotal += countDelta;
            });

            // ロジックエラー対策: 合計が負にならないよう Math.max を適用
            return {
                ownedCards: newOwnedCards,
                totalOwnedCards: Math.max(0, newTotal)
            };
        });

        // DBへ変更を保存 (非同期)
        try {
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
            // 総枚数を正確に計算: (現行の総枚数 - 古い枚数 + 新しい枚数)
            newTotal = newTotal - oldCount + newCount;

            if (newCount > 0) {
                newOwnedCards.set(cardId, newCount);
            } else {
                newOwnedCards.delete(cardId);
            }

            return {
                ownedCards: newOwnedCards,
                totalOwnedCards: Math.max(0, newTotal) // ロジックエラー対策
            };
        });

        // DBへ変更を保存 (非同期)
        try {
            await cardPoolService.saveCardPoolEntry(cardId, newCount);
            console.log(`[CardPoolStore] Card count for ${cardId} saved to DB.`);
        } catch (error) {
            console.error('Failed to save card pool after setting count:', error);
        }
    },

    // カードプール全体を削除する
    deleteCardPool: async () => {
        await cardPoolService.deleteCardPool();
        set(initialState);
        console.log("Card pool delete completed.");
    },


    // ZIPインポート機能
    importCardPool: async (importedOwnedCards) => {
        // 1. DBを完全に上書き (クリアしてから新しいデータをセット)
        try {
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