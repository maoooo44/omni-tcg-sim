/**
 * src/components/controls/SortAndFilterControls.tsx
 *
 * 汎用的なソートとフィルタリングの操作UIを提供するコンポーネント。
 * 親コンポーネントから状態と更新関数を受け取り、UIイベントに応じてそれらを呼び出す。
 */
import React, { useCallback } from 'react';
import { 
    Box, 
    TextField, 
    FormControl, 
    InputLabel, 
    Select, 
    MenuItem, 
    IconButton, 
    Grid,
    type SelectChangeEvent
} from '@mui/material';
import SortIcon from '@mui/icons-material/Sort';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';

import type { SortField } from '../../utils/sortingUtils';
import type { SortFilterState } from '../../hooks/useSortAndFilter'; // 型定義をインポート

// 汎用的なソートオプションの型 (表示名とフィールドキー)
export interface SortOption {
    label: string;
    value: SortField;
}

// コンポーネントのProps型
export interface SortAndFilterControlsProps extends SortFilterState {
    // 💡 ソートに利用できるフィールドのリスト
    sortOptions: SortOption[];
    
    // 💡 状態更新関数
    setSortField: (field: SortField) => void;
    toggleSortOrder: () => void;
    setSearchTerm: (term: string) => void;
    
    // 💡 UIオプション
    labelPrefix?: string; // 例: "パック" のソート・フィルタ
    disableFiltering?: boolean; // フィルタリングを無効にするオプション
    disableSorting?: boolean; // ソートを無効にするオプション
}

/**
 * 汎用的なソートとフィルタリングの操作UIコンポーネント
 * (Grid v7対応: itemは廃止)
 */
const SortAndFilterControls: React.FC<SortAndFilterControlsProps> = ({
    sortField,
    sortOrder,
    searchTerm,
    sortOptions,
    setSortField,
    toggleSortOrder,
    setSearchTerm,
    labelPrefix = '',
    disableFiltering = false,
    disableSorting = false,
}) => {
    
    const handleSortFieldChange = useCallback((event: SelectChangeEvent) => {
        setSortField(event.target.value as SortField);
    }, [setSortField]);

    const handleSearchChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(event.target.value);
    }, [setSearchTerm]);

    return (
        <Box sx={{ mb: 3, p: 2, bgcolor: 'background.paper', borderRadius: 2, boxShadow: 1 }}>
            <Grid container spacing={2} alignItems="center">
                
                {/* 検索/フィルタリング入力欄 */}
                {!disableFiltering && (
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <TextField
                            fullWidth
                            label={`${labelPrefix}を検索 (名前/ID/No.など)`}
                            variant="outlined"
                            size="small"
                            value={searchTerm}
                            onChange={handleSearchChange}
                        />
                    </Grid>
                )}

                {/* ソートフィールド選択 */}
                {!disableSorting && (
                    <Grid size={{ xs: 8, sm: 4, md: disableFiltering ? 8 : 4 }}>
                        <FormControl fullWidth variant="outlined" size="small">
                            <InputLabel>ソート項目</InputLabel>
                            <Select
                                value={sortField}
                                onChange={handleSortFieldChange}
                                label="ソート項目"
                            >
                                {sortOptions.map((option) => (
                                    <MenuItem key={option.value} value={option.value}>
                                        {option.label}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                )}

                {/* ソート順トグルボタン */}
                {!disableSorting && (
                    <Grid size={{ xs: 4, sm: 2, md: disableFiltering ? 4 : 2 }}>
                        <IconButton
                            onClick={toggleSortOrder}
                            color="primary"
                            size="large"
                            title={sortOrder === 'asc' ? '昇順 (クリックで降順)' : '降順 (クリックで昇順)'}
                        >
                            <SortIcon sx={{ mr: 0.5 }} />
                            {sortOrder === 'asc' ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />}
                        </IconButton>
                    </Grid>
                )}
            </Grid>
        </Box>
    );
};

export default SortAndFilterControls;