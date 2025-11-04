/**
 * src/features/packs/hooks/usePackList.ts
 *
 * パック一覧表示に必要な全てのデータ、状態、および操作ロジックを提供するカスタムフック。
 * * 責務：
 * 1. Zustandストア（usePackStore）からパック一覧データと、fetchAllPacksなどのアクションを取得する。
 * 2. コンポーネントマウント時にデータ取得（初期ロード）をトリガーする。
 * 3. 汎用フック（useSortFilter）を使用して、パック一覧データにソートとフィルタリングの機能を提供する。
 * 4. UIからの操作（パック選択、新規作成）に対応するナビゲーションハンドラ（handleSelectPack, handleNewPack）を提供する。
 * 5. 一括削除のための選択状態管理と操作ハンドラを提供する。
 */
import { useEffect, useCallback } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useShallow } from 'zustand/react/shallow';
import { usePackStore } from '../../../stores/packStore';
import { useSortFilter } from '../../../hooks/useSortFilter';
import { useSelection } from '../../../hooks/useSelection';
import { useBulkOperations } from '../../../hooks/useBulkOperations';

import type { Pack, SortField, FilterCondition } from '../../../models/models';
import { PACK_SORT_OPTIONS, PACK_DEFAULT_SORT } from '../../../configs/configs';
import { createDefaultPack } from '../../../utils/dataUtils';

interface UsePackListResult {
    packs: Pack[];
    displayedPacks: Pack[];
    sortField: SortField;
    sortOrder: 'asc' | 'desc';
    searchTerm: string;
    filters: FilterCondition[];
    PACK_SORT_OPTIONS: typeof PACK_SORT_OPTIONS;
    selectedPackIds: string[];
    setSortField: (field: SortField) => void;
    toggleSortOrder: () => void;
    setSearchTerm: (term: string) => void;
    setFilters: (filters: FilterCondition[]) => void;
    handleSelectPack: (packId: string) => void;
    handleNewPack: () => void;
    togglePackSelection: (packId: string) => void;
    toggleAllPacksSelection: () => void;
    handleBulkDelete: () => Promise<void>;
    handleBulkEdit: (fields: Partial<Pack>) => Promise<void>;
    clearSelection: () => void;
    //handleDeletePack: (packId: string, packName: string) => void;
}

export const usePackList = (): UsePackListResult => {
    const navigate = useNavigate();

    // ストアからのデータとアクションの取得
    const {
        packs,
        fetchAllPacks,
        bulkMovePacksToTrash,
        bulkUpdatePacksFields,
    } = usePackStore(useShallow(state => ({
        packs: state.packs,
        fetchAllPacks: state.fetchAllPacks,
        movePackToTrash: state.movePackToTrash,
        bulkMovePacksToTrash: state.bulkMovePacksToTrash,
        bulkUpdatePacksFields: state.bulkUpdatePacksFields,
    })));

    // 選択状態の管理（共通フック使用）
    const {
        selectedIds: selectedPackIds,
        toggleSelection: togglePackSelection,
        toggleAllSelection,
        clearSelection,
    } = useSelection<string>();

    // 一括操作ハンドラ生成（共通フック使用）
    const { createBulkHandler } = useBulkOperations({
        selectedIds: selectedPackIds,
        clearSelection,
    });

    // 初期ロードの実行
    useEffect(() => {
        fetchAllPacks();
    }, [fetchAllPacks]);

    // ソート＆フィルタリングフックの適用
    const {
        sortedAndFilteredData: displayedPacks,
        sortField,
        sortOrder,
        searchTerm,
        filters,
        setSortField,
        toggleSortOrder,
        setSearchTerm,
        setFilters,
    } = useSortFilter<Pack>(packs, undefined, PACK_DEFAULT_SORT);

    // アクションハンドラ (ナビゲーションロジック)
    const handleSelectPack = useCallback((packId: string) => {
        navigate({ to: `/packs/$packId`, params: { packId } });
    }, [navigate]);

    const handleNewPack = useCallback(() => {
        // createDefaultPack を使用して新しい一意のIDを持つ空のパックデータを生成しIDを取得
        const newPack = createDefaultPack();
        const newPackId = newPack.packId;

        navigate({ to: `/packs/$packId`, params: { packId: newPackId } });
    }, [navigate]);

    // 全選択トグルのラッパー（displayedPacksを使用）
    const toggleAllPacksSelection = useCallback(() => {
        toggleAllSelection(displayedPacks.map(pack => pack.packId));
    }, [toggleAllSelection, displayedPacks]);

    // 一括削除ハンドラ（共通フック使用）
    const handleBulkDelete = useCallback(
        createBulkHandler(() => bulkMovePacksToTrash(selectedPackIds), { clearSelectionAfter: true }),
        [createBulkHandler, bulkMovePacksToTrash, selectedPackIds]
    );

    // 一括編集ハンドラ（共通フック使用）
    const handleBulkEdit = useCallback(
        async (fields: Partial<Pack>) => {
            const handler = createBulkHandler(async () => {
                await bulkUpdatePacksFields(selectedPackIds, fields);
            });
            await handler();
        },
        [createBulkHandler, bulkUpdatePacksFields, selectedPackIds]
    );

    // 削除ハンドラ (データ操作ロジック)


    return {
        packs,
        displayedPacks,
        sortField,
        sortOrder,
        searchTerm,
        filters,
        PACK_SORT_OPTIONS,
        selectedPackIds,
        setSortField,
        toggleSortOrder,
        setSearchTerm,
        setFilters,
        handleSelectPack,
        handleNewPack,
        togglePackSelection,
        toggleAllPacksSelection,
        handleBulkDelete,
        handleBulkEdit,
        clearSelection,
        //handleDeletePack,
    };
};