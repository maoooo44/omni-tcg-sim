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
    ArchivePack, // PackストアのfetchAll...が返すリスト表示用の型
    ArchiveItemType, 
    ArchiveCollectionKey 
} from '../../../models/archive'; 

// リスト表示用の統合型: ArchivePackまたはArchiveDeck
type ArchiveDisplayItem = ArchivePack | ArchiveDeck;

import { useSortAndFilter } from '../../../hooks/useSortAndFilter';
import { type SortField } from '../../../utils/sortingUtils';
import { 
    ARCHIVE_DEFAULT_SORT,
    ARCHIVE_PACK_SORT_OPTIONS, // 📌 追加: ソートオプションをインポート
    ARCHIVE_DECK_SORT_OPTIONS  // 📌 追加: ソートオプションをインポート
} from '../../../configs/sortAndFilterDefaults'; 
import type { FilterCondition } from '../../../hooks/useSortAndFilter';


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
    setSortField: (field: SortField) => void;
    toggleSortOrder: () => void;
    setSearchTerm: (term: string) => void;
    setFilters: (filters: FilterCondition[]) => void;
    handleSelectItem: (archiveId: string, itemType: ArchiveItemType) => void;
    isLoading: boolean; // ロード状態を追加
    SORT_OPTIONS: typeof ARCHIVE_PACK_SORT_OPTIONS | typeof ARCHIVE_DECK_SORT_OPTIONS; // 📌 追加
}

export const useArchiveList = ({ collectionType, currentItemType }: UseArchiveListProps): UseArchiveListResult => {
    const navigate = useNavigate();
    
    // 取得したアーカイブデータをローカルで保持
    const [archiveItems, setArchiveItems] = useState<ArchiveDisplayItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // 1. ストアからのアクションの取得
    const packArchiveActions = usePackStore(useShallow(state => ({
        fetchAllArchivePacksFromHistory: state.fetchAllArchivePacksFromHistory,
        fetchAllArchivePacksFromTrash: state.fetchAllArchivePacksFromTrash,
    })));

    // DeckストアもPackストアと同様にアーカイブアクションを持つと仮定
    const deckArchiveActions = useDeckStore(useShallow(state => ({
        fetchAllArchiveDecksFromHistory: state.fetchAllArchiveDecksFromHistory,
        fetchAllArchiveDecksFromTrash: state.fetchAllArchiveDecksFromTrash,
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
    } = useSortAndFilter<ArchiveDisplayItem>(archiveItems, undefined, ARCHIVE_DEFAULT_SORT);

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

    return {
        archiveItems, // ソート/フィルタ前の、現在の条件に合う全アイテム
        displayedItems,
        sortField,
        sortOrder,
        searchTerm,
        filters,
        setSortField,
        toggleSortOrder,
        setSearchTerm,
        setFilters,
        handleSelectItem,
        isLoading,
        SORT_OPTIONS, // 📌 追加: ソートオプションを返り値に含める
    };
};