/**
 * src/features/decks/hooks/useDeckList.ts
 *
 * デッキリスト画面 (DeckList) のデータ取得、状態管理、ソート・フィルタリングロジックを提供するカスタムフック。
 * * 責務:
 * 1. Zustandストア (useDeckStore) からデッキデータとローディング状態をシャロー比較で取得する。
 * 2. コンポーネントマウント時にデッキ全件の非同期ロード (fetchAllDecks) をトリガーする。
 * 3. 汎用フック (useSortFilter) を使用して、全デッキリストに対して検索・ソート・フィルタリングロジックを適用し、結果 (displayedDecks) と制御関数を公開する。
 * 4. 表示補助機能として、デッキの総カード枚数を計算するユーティリティ関数 (calculateTotalCards) を公開する。
 * 5. 一括削除のための選択状態管理と操作ハンドラを提供する。
 */

import { useEffect, useCallback } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useDeckStore } from '../../../stores/deckStore';
import type { Deck, SortField, FilterCondition } from '../../../models/models';
import { useSortFilter } from '../../../hooks/useSortFilter';
import { useSelection } from '../../../hooks/useSelection';
import { useBulkOperations } from '../../../hooks/useBulkOperations';
// ユーティリティから計算関数をインポート
import { calculateTotalCards as utilityCalculateTotalCards } from '../deckUtils';
import { DECK_SORT_OPTIONS, DECK_DEFAULT_SORT } from '../../../configs/configs';

interface UseDeckListResult {
    decks: Deck[];
    displayedDecks: Deck[];
    sortField: SortField;
    sortOrder: 'asc' | 'desc';
    searchTerm: string;
    filters: FilterCondition[];
    DECK_SORT_OPTIONS: typeof DECK_SORT_OPTIONS;
    selectedDeckIds: string[];
    setSortField: (field: SortField) => void;
    toggleSortOrder: () => void;
    setSearchTerm: (term: string) => void;
    setFilters: (filters: FilterCondition[]) => void;
    isLoading: boolean;
    toggleDeckSelection: (deckId: string) => void;
    toggleAllDecksSelection: () => void;
    handleBulkDelete: () => Promise<void>;
    handleBulkEdit: (fields: Partial<Deck>) => Promise<void>;
    clearSelection: () => void;
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
        bulkMoveDecksToTrash,
        bulkUpdateDecksFields,
    } = useDeckStore(useShallow(state => ({
        decks: state.decks,
        isLoading: state.isLoading,
        fetchAllDecks: state.fetchAllDecks,
        bulkMoveDecksToTrash: state.bulkMoveDecksToTrash,
        bulkUpdateDecksFields: state.bulkUpdateDecksFields,
    })));

    // 選択状態の管理（共通フック使用）
    const {
        selectedIds: selectedDeckIds,
        toggleSelection: toggleDeckSelection,
        toggleAllSelection,
        clearSelection,
    } = useSelection<string>();

    // 一括操作ハンドラ生成（共通フック使用）
    const { createBulkHandler } = useBulkOperations({
        selectedIds: selectedDeckIds,
        clearSelection,
    });

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
    } = useSortFilter<Deck>(decks, undefined, DECK_DEFAULT_SORT);

    // 全選択トグルのラッパー（displayedDecksを使用）
    const toggleAllDecksSelection = useCallback(() => {
        toggleAllSelection(displayedDecks.map(deck => deck.deckId));
    }, [toggleAllSelection, displayedDecks]);

    // 一括削除ハンドラ（共通フック使用）
    const handleBulkDelete = useCallback(
        createBulkHandler(() => bulkMoveDecksToTrash(selectedDeckIds), { clearSelectionAfter: true }),
        [createBulkHandler, bulkMoveDecksToTrash, selectedDeckIds]
    );

    // 一括編集ハンドラ（共通フック使用）
    const handleBulkEdit = useCallback(
        async (fields: Partial<Deck>) => {
            const handler = createBulkHandler(async () => {
                await bulkUpdateDecksFields(selectedDeckIds, fields);
            });
            await handler();
        },
        [createBulkHandler, bulkUpdateDecksFields, selectedDeckIds]
    );

    return {
        decks,
        displayedDecks,
        sortField,
        sortOrder,
        searchTerm,
        filters,
        DECK_SORT_OPTIONS,
        selectedDeckIds,
        setSortField,
        toggleSortOrder,
        setSearchTerm,
        setFilters,
        isLoading,
        toggleDeckSelection,
        toggleAllDecksSelection,
        handleBulkDelete,
        handleBulkEdit,
        clearSelection,
        calculateTotalCards: utilityCalculateTotalCards,
    };
};