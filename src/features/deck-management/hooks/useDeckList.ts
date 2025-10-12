// src/features/deck-management/hooks/useDeckList.ts

import { useEffect, useCallback } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useDeckStore } from '../../../stores/deckStore';
import type { Deck } from '../../../models/deck';

interface UseDeckListResult {
    decks: Deck[];
    isLoading: boolean;
    handleDeleteDeck: (deckId: string) => void;
    calculateTotalCards: (deck: Deck) => number;
}

/**
 * デッキリストの表示に必要なデータをストアから取得し、ロジックを提供するカスタムフック
 */
export const useDeckList = (): UseDeckListResult => {
    const { 
        decks, 
        isLoading, 
        loadDecks, 
        deleteDeck,
    } = useDeckStore(useShallow(state => ({
        decks: state.decks,
        isLoading: state.isLoading,
        loadDecks: state.loadDecks,
        deleteDeck: state.deleteDeck,
    })));

    // 1. コンポーネントマウント時にデッキをロードする (🚨 重要な修正)
    useEffect(() => {
        // デッキが空の場合のみロードを実行し、無限ループを避ける
        if (decks.length === 0 && !isLoading) {
            console.log('[useDeckList] Triggering initial loadDecks to fetch dummy data...');
            loadDecks();
        }
    }, [decks.length, isLoading, loadDecks]); // 依存配列にloadDecksを含める

    // 2. カード合計枚数の計算ロジック
    const calculateTotalCards = useCallback((deck: Deck): number => {
        // Mapの値を合計
        const mainCount = Array.from(deck.mainDeck.values()).reduce((sum, count) => sum + count, 0);
        const sideCount = Array.from(deck.sideDeck.values()).reduce((sum, count) => sum + count, 0);
        const extraCount = Array.from(deck.extraDeck.values()).reduce((sum, count) => sum + count, 0);
        return mainCount + sideCount + extraCount;
    }, []);

    // 3. デッキ削除ハンドラ
    const handleDeleteDeck = useCallback((deckId: string) => {
        if (window.confirm('本当にこのデッキを削除しますか？')) {
            console.log(`[useDeckList] Deleting deck: ${deckId}`);
            deleteDeck(deckId);
        }
    }, [deleteDeck]);
    
    return {
        decks,
        isLoading,
        handleDeleteDeck,
        calculateTotalCards,
    };
};