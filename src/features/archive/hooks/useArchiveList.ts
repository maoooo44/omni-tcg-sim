/**
 * src/features/archive/hooks/useArchiveList.ts
 *
 * * アーカイブ一覧表示に必要な全てのデータ、状態、および操作ロジックを提供するカスタムフック。
 * usePackStoreとuseDeckStoreの両方からアーカイブアクションを呼び出し、データを統合する。
 */
import { useEffect, useCallback, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useShallow } from 'zustand/react/shallow';

// 使用するストア
import { usePackStore } from '../../../stores/packStore';
import { useDeckStore } from '../../../stores/deckStore'; // DeckStoreも同様にアーカイブアクションを持つと仮定

// モデルの型定義
import type { 
    ArchiveDeck, 
    ArchivePack,
    ArchiveItemType, 
    ArchiveCollectionKey,
    SortField,
    FilterCondition
} from '../../../models/models'; 

// リスト表示用の統合型: ArchivePackまたはArchiveDeck
type ArchiveDisplayItem = ArchivePack | ArchiveDeck;

import { useSortFilter } from '../../../hooks/useSortFilter';
import { useSelection } from '../../../hooks/useSelection';
import { useBulkOperations } from '../../../hooks/useBulkOperations';
import { 
    ARCHIVE_DEFAULT_SORT,
    ARCHIVE_PACK_SORT_OPTIONS,
    ARCHIVE_DECK_SORT_OPTIONS
} from '../../../configs/configs';


interface UseArchiveListProps {
    collectionType: ArchiveCollectionKey; // 'trash' or 'history'
    currentItemType: ArchiveItemType;     // 'packBundle' or 'deck'
}

interface UseArchiveListResult {
    archiveItems: ArchiveDisplayItem[];
    displayedItems: ArchiveDisplayItem[];
    sortField: SortField;
    sortOrder: 'asc' | 'desc';
    searchTerm: string;
    filters: FilterCondition[];
    selectedArchiveIds: string[];
    setSortField: (field: SortField) => void;
    toggleSortOrder: () => void;
    setSearchTerm: (term: string) => void;
    setFilters: (filters: FilterCondition[]) => void;
    handleSelectItem: (archiveId: string, itemType: ArchiveItemType) => void;
    toggleArchiveSelection: (archiveId: string) => void;
    toggleAllArchivesSelection: () => void;
    handleBulkDelete: () => Promise<void>;
    handleBulkToggleFavorite: () => Promise<void>;
    clearSelection: () => void;
    isLoading: boolean; // ロード状態を追加
    SORT_OPTIONS: typeof ARCHIVE_PACK_SORT_OPTIONS | typeof ARCHIVE_DECK_SORT_OPTIONS; // 📌 追加
}

export const useArchiveList = ({ collectionType, currentItemType }: UseArchiveListProps): UseArchiveListResult => {
    const navigate = useNavigate();
    
    // 取得したアーカイブデータをローカルで保持
    const [archiveItems, setArchiveItems] = useState<ArchiveDisplayItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    // 選択状態の管理（共通フック使用）
    const {
        selectedIds: selectedArchiveIds,
        toggleSelection: toggleArchiveSelection,
        toggleAllSelection,
        clearSelection,
    } = useSelection<string>();

    // 一括操作ハンドラ生成（共通フック使用）
    const { createBulkHandler } = useBulkOperations({
        selectedIds: selectedArchiveIds,
        clearSelection,
    });

    // 1. ストアからのアクションの取得
    const packArchiveActions = usePackStore(useShallow(state => ({
        fetchAllArchivePacksFromHistory: state.fetchAllArchivePacksFromHistory,
        fetchAllArchivePacksFromTrash: state.fetchAllArchivePacksFromTrash,
        bulkDeletePackBundlesFromHistory: state.bulkDeletePackBundlesFromHistory,
        bulkDeletePackBundlesFromTrash: state.bulkDeletePackBundlesFromTrash,
        bulkUpdateArchivePackBundlesIsFavoriteToHistory: state.bulkUpdateArchivePackBundlesIsFavoriteToHistory,
        bulkUpdateArchivePackBundlesIsFavoriteToTrash: state.bulkUpdateArchivePackBundlesIsFavoriteToTrash,
    })));

    // DeckストアもPackストアと同様にアーカイブアクションを持つと仮定
    const deckArchiveActions = useDeckStore(useShallow(state => ({
        fetchAllArchiveDecksFromHistory: state.fetchAllArchiveDecksFromHistory,
        fetchAllArchiveDecksFromTrash: state.fetchAllArchiveDecksFromTrash,
        bulkDeleteDecksFromHistory: state.bulkDeleteDecksFromHistory,
        bulkDeleteDecksFromTrash: state.bulkDeleteDecksFromTrash,
        bulkUpdateArchiveDecksIsFavoriteToHistory: state.bulkUpdateArchiveDecksIsFavoriteToHistory,
        bulkUpdateArchiveDecksIsFavoriteToTrash: state.bulkUpdateArchiveDecksIsFavoriteToTrash,
    })));


    // 2. データ取得ロジック
    const fetchArchiveData = useCallback(async () => {
        setIsLoading(true);
        try {
            let data: ArchiveDisplayItem[] = [];

            if (currentItemType === 'packBundle') {
                if (collectionType === 'history') {
                    // ArchivePack[] を取得
                    data = await packArchiveActions.fetchAllArchivePacksFromHistory();
                } else if (collectionType === 'trash') {
                    // ArchivePack[] を取得
                    data = await packArchiveActions.fetchAllArchivePacksFromTrash();
                }
            } else if (currentItemType === 'deck') {
                // Deckストアにも同様のフェッチ関数があると仮定
                if (collectionType === 'history') {
                    // ArchiveDeck[] を取得
                    data = await deckArchiveActions.fetchAllArchiveDecksFromHistory();
                } else if (collectionType === 'trash') {
                    // ArchiveDeck[] を取得
                    data = await deckArchiveActions.fetchAllArchiveDecksFromTrash();
                }
            }
            setArchiveItems(data);
        } catch (error) {
            console.error(`[useArchiveList] Failed to fetch archive data for ${currentItemType}/${collectionType}:`, error);
            setArchiveItems([]);
        } finally {
            setIsLoading(false);
        }
    }, [collectionType, currentItemType, packArchiveActions, deckArchiveActions]);

    // collectionTypeまたはcurrentItemTypeが変更されたらデータを再取得
    useEffect(() => {
        fetchArchiveData();
    }, [fetchArchiveData]);


    // 3. ソート＆フィルタリングフックの適用
    const {
        sortedAndFilteredData: displayedItems,
        sortField,
        sortOrder,
        searchTerm,
        filters,
        setSortField,
        toggleSortOrder,
        setSearchTerm,
        setFilters,
    } = useSortFilter<ArchiveDisplayItem>(archiveItems, undefined, ARCHIVE_DEFAULT_SORT);

    // 📌 修正点: ソートオプションをフック内部で決定
    const SORT_OPTIONS = currentItemType === 'packBundle' 
        ? ARCHIVE_PACK_SORT_OPTIONS 
        : ARCHIVE_DECK_SORT_OPTIONS;


    // 4. アクションハンドラ (ナビゲーションロジック)
    const handleSelectItem = useCallback((archiveId: string, itemType: ArchiveItemType) => {
        const pathPrefix = itemType === 'packBundle' ? '/archive/packs' : '/archive/decks';
        
        navigate({ 
            to: `${pathPrefix}/$archiveId`, 
            params: { archiveId } 
        });
    }, [navigate]);

    // 全選択トグルのラッパー（displayedItemsを使用）
    const toggleAllArchivesSelection = useCallback(() => {
        const allIds = displayedItems.map(item => 
            currentItemType === 'packBundle' 
                ? (item as ArchivePack).meta.archiveId 
                : (item as ArchiveDeck).meta.archiveId
        );
        toggleAllSelection(allIds);
    }, [toggleAllSelection, displayedItems, currentItemType]);

    // 一括削除ハンドラ（共通フック使用）
    const handleBulkDelete = useCallback(
        createBulkHandler(async () => {
            if (currentItemType === 'packBundle') {
                if (collectionType === 'history') {
                    await packArchiveActions.bulkDeletePackBundlesFromHistory(selectedArchiveIds);
                } else {
                    await packArchiveActions.bulkDeletePackBundlesFromTrash(selectedArchiveIds);
                }
            } else {
                if (collectionType === 'history') {
                    await deckArchiveActions.bulkDeleteDecksFromHistory(selectedArchiveIds);
                } else {
                    await deckArchiveActions.bulkDeleteDecksFromTrash(selectedArchiveIds);
                }
            }
            // データを再取得
            await fetchArchiveData();
        }, { clearSelectionAfter: true }),
        [createBulkHandler, currentItemType, collectionType, packArchiveActions, deckArchiveActions, selectedArchiveIds, fetchArchiveData]
    );

    // 一括お気に入りトグルハンドラ（共通フック使用）
    const handleBulkToggleFavorite = useCallback(
        createBulkHandler(async () => {
            // 選択されたアイテムのお気に入り状態を確認
            const selectedItems = displayedItems.filter(item =>
                selectedArchiveIds.includes(
                    currentItemType === 'packBundle'
                        ? (item as ArchivePack).meta.archiveId
                        : (item as ArchiveDeck).meta.archiveId
                )
            );

            // 1つでも非お気に入りがあれば全てtrueに、全てお気に入りならfalseに
            const hasNonFavorite = selectedItems.some(item => !item.meta.isFavorite);
            const newFavoriteState = hasNonFavorite;

            if (currentItemType === 'packBundle') {
                if (collectionType === 'history') {
                    await packArchiveActions.bulkUpdateArchivePackBundlesIsFavoriteToHistory(selectedArchiveIds, newFavoriteState);
                } else {
                    await packArchiveActions.bulkUpdateArchivePackBundlesIsFavoriteToTrash(selectedArchiveIds, newFavoriteState);
                }
            } else {
                if (collectionType === 'history') {
                    await deckArchiveActions.bulkUpdateArchiveDecksIsFavoriteToHistory(selectedArchiveIds, newFavoriteState);
                } else {
                    await deckArchiveActions.bulkUpdateArchiveDecksIsFavoriteToTrash(selectedArchiveIds, newFavoriteState);
                }
            }

            // データを再取得
            await fetchArchiveData();
        }),
        [createBulkHandler, displayedItems, selectedArchiveIds, currentItemType, collectionType, packArchiveActions, deckArchiveActions, fetchArchiveData]
    );

    return {
        archiveItems, // ソート/フィルタ前の、現在の条件に合う全アイテム
        displayedItems,
        sortField,
        sortOrder,
        searchTerm,
        filters,
        selectedArchiveIds,
        setSortField,
        toggleSortOrder,
        setSearchTerm,
        setFilters,
        handleSelectItem,
        toggleArchiveSelection,
        toggleAllArchivesSelection,
        handleBulkDelete,
        handleBulkToggleFavorite,
        clearSelection,
        isLoading,
        SORT_OPTIONS, // 📌 追加: ソートオプションを返り値に含める
    };
};