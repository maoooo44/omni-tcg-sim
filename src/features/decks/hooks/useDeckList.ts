/**
 * src/features/decks/hooks/useDeckList.ts
 *
 * デッキリストの表示に必要なデータをZustandストアから取得し、基本的なロジックを提供するカスタムフック。
 * 責務：
 * 1. コンポーネントマウント時にデッキ一覧データを非同期でロードする。
 * 2. デッキの削除アクション（handleDeleteDeck）を提供する。
 * 3. 表示補助として、ユーティリティからカード総枚数計算機能（calculateTotalCards）を提供する。
 */

import { useEffect, useCallback } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useDeckStore } from '../../../stores/deckStore';
import type { Deck } from '../../../models/deck';
// ユーティリティから計算関数をインポート
import { calculateTotalCards as utilityCalculateTotalCards } from '../deckUtils'; 

interface UseDeckListResult {
    decks: Deck[];
    isLoading: boolean;
    handleDeleteDeck: (deckId: string) => void;
    // ユーティリティ関数を公開
    calculateTotalCards: (deck: Deck) => number;
}

/**
 * デッキリストの表示に必要なデータをストアから取得し、ロジックを提供するカスタムフック
 */
export const useDeckList = (): UseDeckListResult => {
    const { 
        decks, 
        isLoading, 
        fetchDecks, 
        deleteDeck,
    } = useDeckStore(useShallow(state => ({
        decks: state.decks,
        isLoading: state.isLoading,
        fetchDecks: state.fetchDecks,
        deleteDeck: state.deleteDeck,
    })));

    // 1. コンポーネントマウント時にデッキをロードする
    useEffect(() => {
        // ロードはマウント時に一度だけ実行
        fetchDecks();
    }, [fetchDecks]);


    // 3. デッキ削除ハンドラ
    const handleDeleteDeck = useCallback((deckId: string) => {
        if (window.confirm('本当にこのデッキを削除しますか？')) {
            deleteDeck(deckId);
        }
    }, [deleteDeck]);
    
    return {
        decks,
        isLoading,
        handleDeleteDeck,
        // ユーティリティとしてインポートした関数を直接返す
        calculateTotalCards: utilityCalculateTotalCards, 
    };
};