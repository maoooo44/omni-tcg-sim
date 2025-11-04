/**
 * src/features/card-pool/components/CardPoolControls.tsx
 */
import React, { useMemo } from 'react';
import {
    Box
} from '@mui/material';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import ViewListIcon from '@mui/icons-material/ViewList';

// 💡 修正: すべての型定義を models からインポート
import type { 
    ControlBarProps, 
    ToggleGroupProps, 
    ToggleOption, // src/models/ui.ts から再エクスポート
    SortField, 
    FilterCondition 
} from '../../../models/models'; 

import ControlBar from '../../../components/common/ControlBar';

import {
    CARD_POOL_SORT_OPTIONS,
    CARD_POOL_SORT_OPTIONS_WITH_COUNT,
    CARD_FILTER_FIELDS
} from '../../../configs/configs';

import type { ViewMode } from '../hooks/useCardPoolDisplay';

// --- Props の型定義 ---

export interface CardPoolControlsProps {
    // データ表示情報
    totalCount: number;
    // ビューモード
    viewMode: ViewMode;
    setViewMode: (newMode: ViewMode) => void;
    // ソート・フィルタリング
    sortField: SortField;
    sortOrder: 'asc' | 'desc';
    setSortField: (field: SortField) => void;
    toggleSortOrder: () => void;
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    filters: FilterCondition[];
    setFilters: (filters: FilterCondition[]) => void;
    // グリッド設定
    columns: number;
    setColumns: (cols: number) => void;
    minColumns: number;
    maxColumns: number;
    // その他
    isDTCGEnabled: boolean;
    setCurrentPage: (page: number) => void;
}

// --- コンポーネント本体 ---

const CardPoolControls: React.FC<CardPoolControlsProps> = ({
    totalCount,
    viewMode,
    setViewMode,
    sortField,
    sortOrder,
    setSortField,
    toggleSortOrder,
    searchTerm,
    setSearchTerm,
    filters,
    setFilters,
    columns,
    setColumns,
    minColumns,
    maxColumns,
    isDTCGEnabled,
    setCurrentPage,
}) => {

    // ビューモード変更ハンドラ (ToggleGroupProps の onToggleChange に合わせて修正)
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

    // ソートオプションを動的に選択（DTCGモードのリスト表示では枚数ソートを含む）
    const sortOptions = useMemo(() => {
        return isDTCGEnabled && viewMode === 'list'
            ? CARD_POOL_SORT_OPTIONS_WITH_COUNT
            : CARD_POOL_SORT_OPTIONS;
    }, [isDTCGEnabled, viewMode]);


    // ⭐️ ControlBar に渡す Props を構築 ⭐️
    const controlBarProps: ControlBarProps = useMemo(() => {
        
        // 1. ソート・フィルターの Props
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

        // 2. 列数トグルの Props
        const gridToggleProps = {
            columns: columns,
            setColumns: setColumns,
            minColumns: minColumns,
            maxColumns: maxColumns,
        };

        // 3. トグルボタン（ビューモード）の Props
        const toggleOptions: ToggleOption<ViewMode>[] = [
            {
                value: 'list',
                // 💡 修正: label ではなく icon にアイコンを設定し、tooltip を使用
                icon: <ViewListIcon/>,
                tooltip: "所有カードリスト",
            },
            {
                value: 'collection',
                // 💡 修正: label ではなく icon にアイコンを設定し、tooltip を使用
                icon: <ViewModuleIcon/>,
                tooltip: "図鑑表示 (全カード)",
            },
        ];

        const toggleGroupProps: ToggleGroupProps = {
            toggleValue: viewMode,
            onToggleChange: handleViewModeChange,
            toggleOptions: toggleOptions as ToggleOption<string>[], // ViewModeをstringにキャストして渡す
            toggleSize: 'medium',
        };

        return {
            title: "カード一覧",
            itemCount: totalCount,
            itemLabel: "件",
            showTitle: true,
            
            // 構造化コントロールを渡す
            sortFilterProps: sortFilterProps,
            gridToggleProps: gridToggleProps,
            toggleGroupProps: toggleGroupProps,

            actionButtons: [], 
        };
    }, [
        totalCount, 
        sortOptions, 
        sortField, 
        sortOrder, 
        setSortField, 
        toggleSortOrder,
        searchTerm,
        setSearchTerm,
        filters,
        setFilters,
        columns,
        setColumns,
        minColumns,
        maxColumns,
        viewMode,
        handleViewModeChange,
    ]);


    return (
        <Box>
            {/* ControlBar にすべてのロジックと UI を委譲 */}
            <ControlBar {...controlBarProps} />
        </Box>
    );
};

export default CardPoolControls;