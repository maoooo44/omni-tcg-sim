/**
 * src/features/decks/hooks/useDeckList.ts
 *
 * デッキリスト画面 (DeckList) のデータ取得、状態管理、ソート・フィルタリングロジックを提供するカスタムフック。
 * * 責務:
 * 1. Zustandストア (useDeckStore) からデッキデータとローディング状態をシャロー比較で取得する。
 * 2. コンポーネントマウント時にデッキ全件の非同期ロード (fetchAllDecks) をトリガーする。
 * 3. 汎用フック (useSortAndFilter) を使用して、全デッキリストに対して検索・ソート・フィルタリングロジックを適用し、結果 (displayedDecks) と制御関数を公開する。
 * 4. 表示補助機能として、デッキの総カード枚数を計算するユーティリティ関数 (calculateTotalCards) を公開する。
 */

import { useEffect } from 'react';
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
    } = useDeckStore(useShallow(state => ({
        decks: state.decks,
        isLoading: state.isLoading,
        fetchAllDecks: state.fetchAllDecks,
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
        calculateTotalCards: utilityCalculateTotalCards,
    };
};