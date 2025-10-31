/**
 * src/features/packs/hooks/usePackList.ts
 *
 * パック一覧表示に必要な全てのデータ、状態、および操作ロジックを提供するカスタムフック。
 * * 責務：
 * 1. Zustandストア（usePackStore）からパック一覧データと、fetchAllPacksなどのアクションを取得する。
 * 2. コンポーネントマウント時にデータ取得（初期ロード）をトリガーする。
 * 3. 汎用フック（useSortAndFilter）を使用して、パック一覧データにソートとフィルタリングの機能を提供する。
 * 4. UIからの操作（パック選択、新規作成）に対応するナビゲーションハンドラ（handleSelectPack, handleNewPack）を提供する。
 */
import { useEffect, useCallback } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useShallow } from 'zustand/react/shallow';
import { usePackStore } from '../../../stores/packStore';
import { useSortAndFilter } from '../../../hooks/useSortAndFilter';

import type { Pack } from '../../../models/pack';
import { type SortField } from '../../../utils/sortingUtils';
import { PACK_SORT_OPTIONS, PACK_DEFAULT_SORT } from '../../../configs/sortAndFilterDefaults';
import { createDefaultPack } from '../../../utils/dataUtils';
import type { FilterCondition } from '../../../hooks/useSortAndFilter';

interface UsePackListResult {
    packs: Pack[];
    displayedPacks: Pack[];
    sortField: SortField;
    sortOrder: 'asc' | 'desc';
    searchTerm: string;
    filters: FilterCondition[];
    PACK_SORT_OPTIONS: typeof PACK_SORT_OPTIONS;
    setSortField: (field: SortField) => void;
    toggleSortOrder: () => void;
    setSearchTerm: (term: string) => void;
    setFilters: (filters: FilterCondition[]) => void;
    handleSelectPack: (packId: string) => void;
    handleNewPack: () => void;
    //handleDeletePack: (packId: string, packName: string) => void;
}

export const usePackList = (): UsePackListResult => {
    const navigate = useNavigate();

    // ストアからのデータとアクションの取得
    const {
        packs,
        fetchAllPacks,
    } = usePackStore(useShallow(state => ({
        packs: state.packs,
        fetchAllPacks: state.fetchAllPacks,
        movePackToTrash: state.movePackToTrash,
    })));

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
    } = useSortAndFilter<Pack>(packs, undefined, PACK_DEFAULT_SORT);

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

    // 削除ハンドラ (データ操作ロジック)


    return {
        packs,
        displayedPacks,
        sortField,
        sortOrder,
        searchTerm,
        filters,
        PACK_SORT_OPTIONS,
        setSortField,
        toggleSortOrder,
        setSearchTerm,
        setFilters,
        handleSelectPack,
        handleNewPack,
        //handleDeletePack,
    };
};