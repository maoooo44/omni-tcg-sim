/**
* src/stores/cardPoolStore.ts
*
* Zustandを使用してユーザーのカード所有資産を管理するストア。
* IndexedDB（cardPoolService）と連携し、所有カード（cardIdと枚数のMap）と
* 総枚数の状態を保持し、DBへのデータの永続化と同期を行う。
*/
import { create } from 'zustand';
import { cardPoolService } from '../services/card-pool/cardPoolService'; 

// ユーザーのカード資産の状態
export interface CardPoolState {
    // key: cardId (string), value: 所有枚数 (number)
    ownedCards: Map<string, number>;
    totalOwnedCards: number;
    isLoading: boolean; // 💡 追加: ロード状態を管理
    
    // --- アクション ---
    /** DBからデータをロードしてストアを初期化 */
    loadCardPool: () => Promise<void>; 
    /** パック開封などによってカードを追加 */
    addCards: (cards: { cardId: string, count: number, packId: string }[]) => Promise<void>;
    /** デッキ構築などによってカードの枚数を更新 */
    setCardCount: (cardId: string, count: number) => Promise<void>;
    /** カードプールを完全にリセット（デバッグ用） */
    resetPool: () => Promise<void>; 
    /** ZIPインポート: カードプールデータをDBとストアに上書きする */
    importCardPool: (importedOwnedCards: Map<string, number>) => Promise<void>;
}

const initialState = {
    ownedCards: new Map<string, number>(), // 型を明示
    totalOwnedCards: 0,
    isLoading: false, // 💡 初期値は false
};

export const useCardPoolStore = create<CardPoolState>((set, _get) => ({
    ...initialState,
    
    // DBからカードプールをロードする
    loadCardPool: async () => {
        set({ isLoading: true }); // 💡 ロード開始
        try {
            // DBからMap形式でデータを取得
            const ownedCards = await cardPoolService.getOwnedCardsMap();
            
            // 総枚数を計算
            let newTotal = 0;
            ownedCards.forEach(count => {
                newTotal += count;
            }
            );

            // ストアに反映
            set({ 
                ownedCards, 
                totalOwnedCards: newTotal,
                isLoading: false, // 💡 ロード完了 (成功)
            });
            console.log(`✅ [CardPoolStore] Loaded ${ownedCards.size} unique cards, total ${newTotal} cards.`);

        } catch (error) {
            console.error('Failed to load card pool:', error);
            // 失敗時は初期状態を維持しつつ、ロード状態を解除
            set({ isLoading: false }); // 💡 ロード完了 (失敗)
            // 失敗時にエラーを投げる場合は、UI側でもエラーをキャッチする必要がある
        }
    },

    // カードを追加し、DBに保存する
    addCards: async (cards) => {
// ... (中略。この後の addCards, setCardCount, resetPool, importCardPool のロジックは変更なし)
        const countsToUpdate = new Map<string, number>();

        set(state => {
            const newOwnedCards = new Map(state.ownedCards);
            let newTotal = state.totalOwnedCards;

            cards.forEach(({ cardId, count }) => {
                // 新しい所有枚数を計算
                const currentCount = newOwnedCards.get(cardId) || 0;
                const newCount = currentCount + count;
                
                // ストアのMapを更新
                newOwnedCards.set(cardId, newCount);
                // DBに更新すべきMapにも追加
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
            // cardPoolService.bulkUpdateCardCounts は Map のデータをそのまま DB に反映
            await cardPoolService.bulkUpdateCardCounts(countsToUpdate); 
        } catch (error) {
            console.error('Failed to save card pool after adding cards:', error);
            // 致命的なエラーだが、ストアは更新されているため、エラーログのみ
        }
    },

    // カード枚数を設定し、DBに保存する（売却や編集用）
    setCardCount: async (cardId, count) => {
        // count は 0 以上に制限
        const newCount = Math.max(0, count);

        set(state => {
            const newOwnedCards = new Map(state.ownedCards);
            let newTotal = state.totalOwnedCards;

            // 古い枚数を取得
            const oldCount = newOwnedCards.get(cardId) || 0;
            
            // 総枚数を更新
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
            // 1枚の更新も bulkUpdateCardCounts で処理可能
            const countsToUpdate = new Map<string, number>([[cardId, newCount]]);
            await cardPoolService.bulkUpdateCardCounts(countsToUpdate); 
        } catch (error) {
            console.error('Failed to save card pool after setting count:', error);
        }
    },

    // カードプール全体をリセットする
    resetPool: async () => {
        // DBからも削除する
        // await cardPoolService.bulkUpdateCardCounts(new Map()); // 古いクリア処理
        await cardPoolService.clearCardPool(); // ★ 新しいクリア関数を呼び出す
        set(initialState);
        console.log("Card pool reset completed.");
    },


    // ZIPインポート機能
    importCardPool: async (importedOwnedCards) => {
        // 1. DBを完全に上書き (クリアしてから新しいデータをセット)
        try {
            // await cardPoolService.bulkUpdateCardCounts(new Map()); // 古いクリア処理
            await cardPoolService.clearCardPool(); // ★ まずDBを完全にクリアする
            await cardPoolService.bulkUpdateCardCounts(importedOwnedCards); // 新しいデータを追加
        } catch (error) {
            console.error("Failed to overwrite card pool in DB:", error);
            throw new Error("カードプールのDB上書きに失敗しました。");
        }
        
        // 2. Zustandストアの状態を更新
        let newTotal = 0;
        importedOwnedCards.forEach(count => {
            newTotal += count;
        });

        set({
            ownedCards: importedOwnedCards, 
            totalOwnedCards: newTotal
        });
        console.log(`✅ Card pool imported. Total: ${newTotal} cards.`);
    },
}));