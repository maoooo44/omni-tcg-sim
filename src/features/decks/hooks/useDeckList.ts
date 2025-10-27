/**
 * src/features/decks/hooks/useDeckList.ts
 *
 * デッキリストの表示に必要なデータをZustandストアから取得し、基本的なロジックを提供するカスタムフック。
 * 責務：
 * 1. コンポーネントマウント時にデッキ一覧データを非同期でロードする。
 * 2. デッキの削除アクション（handlemoveDeckToTrash）を提供する。
 * 3. 表示補助として、ユーティリティからカード総枚数計算機能（calculateTotalCards）を提供する。
 * 4. ソート＆フィルタリング機能を提供する。
 */

import { useEffect, useCallback } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useDeckStore } from '../../../stores/deckStore';
import type { Deck } from '../../../models/deck';
import { type SortField } from '../../../utils/sortingUtils';
import { useSortAndFilter } from '../../../hooks/useSortAndFilter';
// ユーティリティから計算関数をインポート
import { calculateTotalCards as utilityCalculateTotalCards } from '../deckUtils';
import { DECK_SORT_OPTIONS, DECK_DEFAULT_SORT } from '../../../configs/sortAndFilterDefaults';
import type { FilterCondition } from '../../../hooks/useSortAndFilter';

interface UseDeckListResult {
    decks: Deck[];
    displayedDecks: Deck[];
    sortField: SortField;
    sortOrder: 'asc' | 'desc';
    searchTerm: string;
    filters: FilterCondition[];
    DECK_SORT_OPTIONS: typeof DECK_SORT_OPTIONS;
    setSortField: (field: SortField) => void;
    toggleSortOrder: () => void;
    setSearchTerm: (term: string) => void;
    setFilters: (filters: FilterCondition[]) => void;
    isLoading: boolean;
    handlemoveDeckToTrash: (deckId: string) => void;
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
        fetchAllDecks, 
        moveDeckToTrash,
    } = useDeckStore(useShallow(state => ({
        decks: state.decks,
        isLoading: state.isLoading,
        fetchAllDecks: state.fetchAllDecks,
        moveDeckToTrash: state.moveDeckToTrash,
    })));

    // 1. コンポーネントマウント時にデッキをロードする
    useEffect(() => {
        // ロードはマウント時に一度だけ実行
        fetchAllDecks();
    }, [fetchAllDecks]);

    // ソート＆フィルタリングフックの適用
    const {
        sortedAndFilteredData: displayedDecks,
        sortField,
        sortOrder,
        searchTerm,
        filters,
        setSortField,
        toggleSortOrder,
        setSearchTerm,
        setFilters,
    } = useSortAndFilter<Deck>(decks, undefined, DECK_DEFAULT_SORT);

    // 3. デッキ削除ハンドラ
    const handlemoveDeckToTrash = useCallback((deckId: string) => {
        if (window.confirm('本当にこのデッキを削除しますか？')) {
            moveDeckToTrash(deckId);
        }
    }, [moveDeckToTrash]);
    
    return {
        decks,
        displayedDecks,
        sortField,
        sortOrder,
        searchTerm,
        filters,
        DECK_SORT_OPTIONS,
        setSortField,
        toggleSortOrder,
        setSearchTerm,
        setFilters,
        isLoading,
        handlemoveDeckToTrash,
        // ユーティリティとしてインポートした関数を直接返す
        calculateTotalCards: utilityCalculateTotalCards,
    };
};