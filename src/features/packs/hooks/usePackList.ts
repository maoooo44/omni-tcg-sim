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
import { useUserDataStore } from '../../../stores/userDataStore'; 
import { useSortAndFilter } from '../../../hooks/useSortAndFilter';

import type { Pack } from '../../../models/pack';
import { type SortField } from '../../../utils/sortingUtils';
import { packFieldAccessor, PACK_SORT_OPTIONS } from '../packUtils';
// 💡 修正: 新規デッキ作成用のユーティリティをインポート
import { createDefaultPack } from '../../../utils/dataUtils';

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
    handleNewPack: () => void; // 💡 修正: initializeNewPackEditingがなくなったため、Promise<void>ではなくなった
    handleDeletePack: (packId: string, packName: string) => void; 
    isAllViewMode: boolean;
}

const defaultSortOptions = {
    defaultSortField: 'number',
    defaultSortOrder: 'asc' as const,
};

export const usePackList = (): UsePackListResult => {
    const navigate = useNavigate();

    // ストアからのデータとアクションの取得
    // 💡 修正: initializeNewPackEditingを削除。fetchPacksをfetchAllPacksに、deletePackをmovePackToTrashに変更。
    const { 
        packs, 
        fetchAllPacks, // 💡 修正: fetchPacks -> fetchAllPacks
        movePackToTrash, // 💡 修正: deletePack -> movePackToTrash
    } = usePackStore(useShallow(state => ({
        packs: state.packs,
        fetchAllPacks: state.fetchAllPacks,
        movePackToTrash: state.movePackToTrash,
    })));

    // 💡 追加: UserDataStoreから isAllViewMode を取得
    const { isAllViewMode } = useUserDataStore(useShallow(state => ({
        isAllViewMode: state.isAllViewMode,
    })));

    // 初期ロードの実行
    useEffect(() => {
        fetchAllPacks(); // 💡 修正: fetchPacks -> fetchAllPacks
    }, [fetchAllPacks]); 
    
    // ソート＆フィルタリングフックの適用
    const {
        sortedAndFilteredData: displayedPacks,
        sortField,
        sortOrder,
        searchTerm,
        setSortField,
        toggleSortOrder,
        setSearchTerm,
    } = useSortAndFilter<Pack>(packs, packFieldAccessor, defaultSortOptions);

    // アクションハンドラ (ナビゲーションロジック)
    const handleSelectPack = useCallback((packId: string) => {
        navigate({ to: `/data/packs/$packId`, params: { packId } });
    }, [navigate]);
    
    // 💡 修正: 新規パック作成ロジックを createDefaultPack を使って実装
    const handleNewPack = useCallback(() => {
        // createDefaultPack を使用して新しい一意のIDを持つ空のパックデータを生成しIDを取得
        const newPack = createDefaultPack();
        const newPackId = newPack.packId; 
        
        // 🚨 注意: 本来、この初期パックを Store/ローカル状態に追加するロジックが必要ですが、
        // usePackEditorがIDを受け取って初期化を行うと仮定し、IDのみを渡します。

        navigate({ to: `/data/packs/$packId`, params: { packId: newPackId } }); 
    }, [navigate]);

    // 削除ハンドラ (データ操作ロジック)
    // 💡 修正: deletePack -> movePackToTrash に変更し、フックのアクション名を同じにする
    const handleDeletePack = useCallback((packId: string, packName: string) => {
        if (!window.confirm(`パック「${packName}」をゴミ箱に移動しますか？`)) {
            return;
        }
        try {
            movePackToTrash(packId); // 💡 修正: ストアアクション movePackToTrash を呼び出す
            // 削除後のUI更新はZustandストア経由で自動的に行われる
        } catch (error) {
            alert('パックの削除に失敗しました。');
            console.error(error);
        }
    }, [movePackToTrash]); // 💡 依存配列も movePackToTrash に修正


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
        isAllViewMode, 
    };
};