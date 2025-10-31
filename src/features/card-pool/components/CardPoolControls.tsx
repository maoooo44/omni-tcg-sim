/**
 * src/features/card-pool/components/CardPoolControls.tsx
 */
import React, { useMemo } from 'react';
import {
    Box, Typography,
    ToggleButtonGroup, ToggleButton, Tooltip,
    Grid,
} from '@mui/material';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import ViewListIcon from '@mui/icons-material/ViewList';

import GridColumnToggle from '../../../components/controls/GridColumnToggle';
// import SortAndFilterControls from '../../../components/controls/SortAndFilterControls'; // 削除
import SortAndFilterButton from '../../../components/controls/SortAndFilterButton'; // 💡 統合コンポーネントを追加

import {
    CARD_POOL_SORT_OPTIONS,
    CARD_POOL_SORT_OPTIONS_WITH_COUNT,
    CARD_FILTER_FIELDS
} from '../../../configs/sortAndFilterDefaults';

import type { ViewMode } from '../hooks/useCardPoolDisplay';
import type { SortField } from '../../../utils/sortingUtils';
import type { FilterCondition } from '../../../hooks/useSortAndFilter';

// --- Props の型定義 (省略) ---

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

    const handleViewModeChange = (
        _event: React.MouseEvent<HTMLElement>,
        newMode: ViewMode | null,
    ) => {
        if (newMode) {
            setViewMode(newMode);
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

    return (
        <Box>
            {/* ソート＆フィルタコントロール (旧: ページ内に直接表示していた部分) */}
            {/* 削除されたため、この場所にあった SortAndFilterControls の代わりにボタンを配置 */}
            {/* ... (なし) */}

            {/* 件数表示＆コントロール */}
            <Grid container spacing={2} alignItems="center" justifyContent="space-between">
                <Grid size={{ xs: 'auto' }}>
                    <Typography variant="h6">
                        カード一覧 ({totalCount}件)
                    </Typography>
                </Grid>
                <Grid size={{ xs: 'auto' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>

                        {/* 💡 ソート・フィルタボタンを追加 */}
                        <SortAndFilterButton
                            labelPrefix="カード"
                            sortOptions={sortOptions}
                            sortField={sortField}
                            sortOrder={sortOrder}
                            searchTerm={searchTerm}
                            filters={filters}
                            setSortField={setSortField}
                            toggleSortOrder={toggleSortOrder}
                            setSearchTerm={setSearchTerm}
                            setFilters={setFilters}
                            filterFields={CARD_FILTER_FIELDS}
                        />

                        {/* 列数トグル */}
                        <GridColumnToggle
                            currentColumns={columns}
                            setColumns={setColumns}
                            minColumns={minColumns}
                            maxColumns={maxColumns}
                            label="列数:"
                        />

                        {/* ビューモードトグル */}
                        <ToggleButtonGroup
                            value={viewMode}
                            exclusive
                            onChange={handleViewModeChange}
                            size="medium"
                            aria-label="view mode"
                            sx={{ height: '36.5px', width: '180px' }}
                        >
                            <Tooltip title="所有カードリスト">
                                <ToggleButton value="list" aria-label="list" sx={{ height: '36.5px', flex: 1 }}>
                                    <ViewListIcon sx={{ mr: 0.5 }} /> 所持
                                </ToggleButton>
                            </Tooltip>
                            <Tooltip title="図鑑表示 (全カード)">
                                <ToggleButton value="collection" aria-label="collection" sx={{ height: '36.5px', flex: 1 }}>
                                    <ViewModuleIcon sx={{ mr: 0.5 }} /> 図鑑
                                </ToggleButton>
                            </Tooltip>
                        </ToggleButtonGroup>
                    </Box>
                </Grid>
            </Grid>
        </Box>
    );
};

export default CardPoolControls;