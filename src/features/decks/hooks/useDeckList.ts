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

import { useEffect, useCallback, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useDeckStore } from '../../../stores/deckStore';
import type { Deck } from '../../../models/deck';
import { type SortField } from '../../../utils/sortingUtils';
import { useSortAndFilter } from '../../../hooks/useSortAndFilter';
// ユーティリティから計算関数をインポート
import { calculateTotalCards as utilityCalculateTotalCards, deckFieldAccessor } from '../deckUtils';
import { DECK_SORT_OPTIONS } from '../../../configs/sortAndFilterDefaults';
import type { FilterCondition } from '../../../components/controls/SortAndFilterControls';

interface UseDeckListResult {
    decks: Deck[];
    displayedDecks: Deck[];
    sortField: SortField;
    sortOrder: 'asc' | 'desc';
    searchTerm: string;
    DECK_SORT_OPTIONS: typeof DECK_SORT_OPTIONS;
    setSortField: (field: SortField) => void;
    toggleSortOrder: () => void;
    setSearchTerm: (term: string) => void;
    isLoading: boolean;
    handlemoveDeckToTrash: (deckId: string) => void;
    // ユーティリティ関数を公開
    calculateTotalCards: (deck: Deck) => number;
    handleFilterChange: (filters: FilterCondition[]) => void;
}

const defaultSortOptions = {
    defaultSortField: 'number',
    defaultSortOrder: 'asc' as const,
};

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

    // フィルタ条件の状態管理
    const [filters, setFilters] = useState<FilterCondition[]>([]);
    
    // ソート＆フィルタリングフックの適用
    const {
        sortedAndFilteredData: sortedDecks,
        sortField,
        sortOrder,
        searchTerm,
        setSortField,
        toggleSortOrder,
        setSearchTerm,
    } = useSortAndFilter<Deck>(decks, deckFieldAccessor, defaultSortOptions);

    // フィルタリング処理
    const displayedDecks = sortedDecks.filter(deck => {
        return filters.every(filter => {
            const value = deck[filter.field as keyof Deck];
            
            if (filter.field === 'name' || filter.field === 'series' || filter.field === 'description') {
                // テキストフィールド: 部分一致（大文字小文字区別なし）
                return String(value || '').toLowerCase().includes(String(filter.value).toLowerCase());
            } else if (filter.field === 'totalCards' || filter.field === 'number') {
                // 数値フィールド: 範囲検索対応
                const filterValue = String(filter.value);
                if (filterValue.includes('-')) {
                    const [min, max] = filterValue.split('-').map(Number);
                    const numValue = Number(value);
                    return numValue >= min && numValue <= max;
                } else {
                    return Number(value) === Number(filter.value);
                }
            } else if (filter.field === 'deckType') {
                // select: 完全一致
                return value === filter.value;
            } else if (filter.field === 'isFavorite' || filter.field === 'isLegal' || filter.field === 'hasUnownedCards') {
                // boolean: 完全一致
                return value === filter.value;
            }
            return true;
        });
    });

    // フィルタ変更ハンドラ
    const handleFilterChange = useCallback((newFilters: FilterCondition[]) => {
        setFilters(newFilters);
    }, []);

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
        DECK_SORT_OPTIONS,
        setSortField,
        toggleSortOrder,
        setSearchTerm,
        isLoading,
        handlemoveDeckToTrash,
        // ユーティリティとしてインポートした関数を直接返す
        calculateTotalCards: utilityCalculateTotalCards,
        handleFilterChange,
    };
};