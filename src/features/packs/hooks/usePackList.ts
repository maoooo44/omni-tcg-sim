/**
 * src/features/packs/hooks/usePackList.ts
 *
 * パック一覧表示に必要な全てのデータ、状態、および操作ロジックを提供するカスタムフック。
 * このフックはPackListコンポーネント（ビュー層）とZustandストア（データ層）の橋渡し役を担う。
 * 責務：
 * 1. Zustandストアからパック一覧データと、fetchPacks, initializeNewPackEditing, deletePackなどのアクションを取得する。
 * 2. データ取得（初期ロード）の実行。
 * 3. 汎用フック（useSortAndFilter）を使用して、パックデータにソートとフィルタリングの機能を提供する。
 * 4. UIからの操作（パック選択、新規作成、削除）に対応するナビゲーションおよびデータ操作ハンドラ（useCallbackでメモ化）を提供する。
 * 💡 5. useUserDataStoreからisAllViewModeを取得し、論理削除アイテムの表示を制御する責務の一部を担う。
 */
import { useEffect, useCallback } from 'react';
import { useNavigate } from '@tanstack/react-router'; 
import { useShallow } from 'zustand/react/shallow';
import { usePackStore } from '../../../stores/packStore';
import { useUserDataStore } from '../../../stores/userDataStore'; // 💡 追加
import { useSortAndFilter } from '../../../hooks/useSortAndFilter';

import type { Pack } from '../../../models/pack';
import { type SortField } from '../../../utils/sortingUtils';
import { packFieldAccessor, PACK_SORT_OPTIONS } from '../packUtils';

interface UsePackListResult {
    packs: Pack[];
    displayedPacks: Pack[];
    sortField: SortField;
    sortOrder: 'asc' | 'desc';
    searchTerm: string;
    PACK_SORT_OPTIONS: typeof PACK_SORT_OPTIONS;
    setSortField: (field: SortField) => void;
    toggleSortOrder: () => void;
    setSearchTerm: (term: string) => void;
    handleSelectPack: (packId: string) => void;
    handleNewPack: () => Promise<void>;
    handleDeletePack: (packId: string, packName: string) => void; 
    isAllViewMode: boolean; // 💡 追加
}

const defaultSortOptions = {
    defaultSortField: 'number',
    defaultSortOrder: 'asc' as const,
};

export const usePackList = (): UsePackListResult => {
    const navigate = useNavigate();

    // ストアからのデータとアクションの取得
    const { 
        packs, 
        initializeNewPackEditing, 
        fetchPacks,
        deletePack, 
    } = usePackStore(useShallow(state => ({
        packs: state.packs,
        initializeNewPackEditing: state.initializeNewEditingPack,
        fetchPacks: state.fetchPacks,
        deletePack: state.deletePack, 
    })));

    // 💡 追加: UserDataStoreから isAllViewMode を取得
    const { isAllViewMode } = useUserDataStore(useShallow(state => ({
        isAllViewMode: state.isAllViewMode,
    })));

    // 初期ロードの実行
    useEffect(() => {
        fetchPacks();
    }, [fetchPacks]); 
    
    // ソート＆フィルタリングフックの適用
    const {
        sortedAndFilteredData: displayedPacks,
        sortField,
        sortOrder,
        searchTerm,
        setSortField,
        //setSortOrder,
        toggleSortOrder,
        setSearchTerm,
    } = useSortAndFilter<Pack>(packs, packFieldAccessor, defaultSortOptions);

    // アクションハンドラ (ナビゲーションロジック)
    const handleSelectPack = useCallback((packId: string) => {
        navigate({ to: `/data/packs/$packId`, params: { packId } });
    }, [navigate]);
    
    const handleNewPack = useCallback(async () => {
        const newPackId = await initializeNewPackEditing(); 
        navigate({ to: `/data/packs/$packId`, params: { packId: newPackId } }); 
    }, [initializeNewPackEditing, navigate]);

    // 削除ハンドラ (データ操作ロジック)
    const handleDeletePack = useCallback((packId: string, packName: string) => {
        if (!window.confirm(`パック「${packName}」と関連するすべてのカードを完全に削除しますか？`)) {
            return;
        }
        try {
            deletePack(packId); 
            // 削除後のUI更新はZustandストア経由で自動的に行われる
        } catch (error) {
            alert('パックの削除に失敗しました。');
            console.error(error);
        }
    }, [deletePack]);


    return {
        packs,
        displayedPacks,
        sortField,
        sortOrder,
        searchTerm,
        PACK_SORT_OPTIONS,
        setSortField,
        toggleSortOrder,
        setSearchTerm,
        handleSelectPack,
        handleNewPack,
        handleDeletePack, 
        isAllViewMode, // 💡 追加
    };
};