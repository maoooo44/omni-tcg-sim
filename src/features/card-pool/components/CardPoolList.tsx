/**
 * src/features/card-pool/components/CardPoolList.tsx (統合コンポーネント)
 *
 * カードプールのコントロールバー（フィルタ・ソート・グリッド設定）と、
 * カード一覧表示、ページネーションを統合したコンポーネント。
 */

import React, { useMemo } from 'react';
import { Box, Alert, Pagination } from '@mui/material';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import ViewListIcon from '@mui/icons-material/ViewList';

// 外部コンポーネントのインポート
import ControlBar from '../../../components/common/ControlBar';
import CardList from '../../cards/components/CardList';

// 型定義のインポート
import type { OwnedCardDisplay, ViewMode } from '../hooks/useCardPoolDisplay';
import type { Card, UseGridDisplayReturn  } from '../../../models/models';
import type { 
    ControlBarProps, 
    ToggleGroupProps, 
    ToggleOption,
    SortField, 
    FilterCondition 
} from '../../../models/models'; 

import {
    CARD_POOL_SORT_OPTIONS,
    CARD_POOL_SORT_OPTIONS_WITH_COUNT,
    CARD_FILTER_FIELDS
} from '../../../configs/configs';

// =========================================================================
// 統合後の Props の型定義 (CardPoolControls + CardPoolDisplay)
// =========================================================================

// ⭐ [修正] UseGridDisplayReturn を継承する
export interface CardPoolListProps extends UseGridDisplayReturn {
    // データ表示情報 (Display)
    totalCount: number;
    totalPages: number;
    currentPage: number;
    cardsOnPage: OwnedCardDisplay[]; 
    setCurrentPage: (page: number) => void;
    onOpenCardViewModal: (cardId: string) => void;
    
    // フィルタリング・ソート情報 (Controls)
    isFilterActive: boolean;
    searchTerm: string;
    filters: FilterCondition[];
    setSearchTerm: (term: string) => void;
    setFilters: (filters: FilterCondition[]) => void;
    
    // ソート (Controls)
    sortField: SortField;
    sortOrder: 'asc' | 'desc';
    setSortField: (field: SortField) => void;
    toggleSortOrder: () => void;
    
    // ビューモード (Controls)
    viewMode: ViewMode;
    setViewMode: (newMode: ViewMode) => void;
    isDTCGEnabled: boolean;
}

// =========================================================================
// コンポーネント本体
// =========================================================================

const CardPoolList: React.FC<CardPoolListProps> = (props) => {
    
    // 💡 Props の分割代入 (可読性のため)
    const {
        totalCount, totalPages, currentPage, cardsOnPage, setCurrentPage, onOpenCardViewModal,
        isFilterActive, searchTerm, filters, setSearchTerm, setFilters,
        sortField, sortOrder, setSortField, toggleSortOrder,
        viewMode, setViewMode, isDTCGEnabled,
        // ⭐ [修正] UseGridDisplayReturn のプロパティをすべて受け取る
        columns, setColumns, minColumns, maxColumns, gridRenderUnit,
    } = props;


    // --- 1. ControlBar 関連ロジック (旧 CardPoolControls の責務) ---

    const handleViewModeChange: ToggleGroupProps['onToggleChange'] = (
        _event,
        newValue,
    ) => {
        if (newValue && (newValue === 'list' || newValue === 'collection')) {
            setViewMode(newValue as ViewMode);
            // ページネーションをリセット
            setCurrentPage(1);
        }
    };

    const sortOptions = useMemo(() => {
        return isDTCGEnabled && viewMode === 'list'
            ? CARD_POOL_SORT_OPTIONS_WITH_COUNT
            : CARD_POOL_SORT_OPTIONS;
    }, [isDTCGEnabled, viewMode]);


    const controlBarProps: ControlBarProps = useMemo(() => {
        
        const sortFilterProps = {
            labelPrefix: "カード",
            sortOptions: sortOptions,
            sortField: sortField,
            sortOrder: sortOrder,
            setSortField: setSortField,
            toggleSortOrder: toggleSortOrder,
            searchTerm: searchTerm,
            setSearchTerm: setSearchTerm,
            filters: filters,
            setFilters: setFilters,
            filterFields: CARD_FILTER_FIELDS,
        };

        const gridToggleProps = {
            columns: columns,
            setColumns: setColumns,
            minColumns: minColumns,
            maxColumns: maxColumns,
        };

        const toggleOptions: ToggleOption<ViewMode>[] = [
            { value: 'list', icon: <ViewListIcon/>, tooltip: "所有カードリスト" },
            { value: 'collection', icon: <ViewModuleIcon/>, tooltip: "図鑑表示 (全カード)" },
        ];

        const toggleGroupProps: ToggleGroupProps = {
            toggleValue: viewMode,
            onToggleChange: handleViewModeChange,
            toggleOptions: toggleOptions as ToggleOption<string>[],
            toggleSize: 'medium',
        };

        return {
            title: "カード一覧",
            itemCount: totalCount,
            itemLabel: "件",
            showTitle: true,
            sortFilterProps: sortFilterProps,
            gridToggleProps: gridToggleProps,
            toggleGroupProps: toggleGroupProps,
            actionButtons: [], 
        };
    }, [
        totalCount, sortOptions, sortField, sortOrder, setSortField, toggleSortOrder,
        searchTerm, setSearchTerm, filters, setFilters,
        // ⭐ [修正] UseGridDisplayReturn のプロパティを依存配列に追加
        columns, setColumns, minColumns, maxColumns, viewMode, handleViewModeChange,
    ]);


    // --- 2. CardList/Pagination 関連ロジック (旧 CardPoolDisplay の責務) ---
    
    const handleCardClick = (card: Card) => {
        onOpenCardViewModal(card.cardId);
    };

    const cardDisplayOptions = useMemo(() => ({
        quantityChip: true,
        quantityControl: false,
        keycardRank: false,
        grayscaleWhenZero: true,
        enableHoverEffect: true,
    }), []);

    // ⭐ [修正] CardList の gridRenderUnit にそのままリレー
    const cardListGridRenderUnit = gridRenderUnit; // gridRenderUnit は既に UseGridDisplayReturn から受け取っている

    // --- 3. 統合レンダリング ---

    const hasFilteredResults = cardsOnPage.length > 0;
    const isTotalZero = totalCount === 0;

    return (
        <Box sx={{ flexGrow: 1 }}>
            
            {/* 1. コントロールバー */}
            <ControlBar {...controlBarProps} />

            {/* 2. カードリスト表示エリア */}
            <Box sx={{ mt: 3, minHeight: 400 }}>
                {isTotalZero && !isFilterActive ? (
                    <Alert severity="info">
                        カードがありません。パックを開封してください。
                    </Alert>
                ) : !hasFilteredResults && isFilterActive ? (
                    <Alert severity="info">
                        "{searchTerm}" に一致するカードが見つかりませんでした。
                    </Alert>
                ) : (
                    <>
                        <CardList
                            // 💡 totalCardCount は ControlBar で表示済みだが、CardList の必須 Props
                            cards={cardsOnPage as Card[]} 
                            totalCardCount={totalCount} 
                            context="card-pool"
                            onCardClick={handleCardClick}
                            cardDisplay={cardDisplayOptions}
                            // ⭐ [修正] gridRenderUnit プロパティを渡す
                            gridRenderUnit={cardListGridRenderUnit} 
                            isFilterActive={isFilterActive}
                            searchTerm={searchTerm}
                        />

                        {/* ページネーション */}
                        {totalPages > 1 && (
                            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                                <Pagination
                                    count={totalPages}
                                    page={currentPage}
                                    onChange={(_e, page) => setCurrentPage(page)} 
                                    color="primary"
                                    showFirstButton
                                    showLastButton
                                />
                            </Box>
                        )}
                    </>
                )}
            </Box>
        </Box>
    );
};

export default CardPoolList;