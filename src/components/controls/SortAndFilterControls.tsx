/**
 * src/components/controls/SortAndFilterControls.tsx
 *
 * 汎用的なソートとフィルタリングの操作UIを提供するコンポーネント。
 * 親コンポーネントから状態と更新関数を受け取り、UIイベントに応じてそれらを呼び出す。
 */
import React, { useCallback, useState } from 'react';
import { 
    Box, 
    TextField, 
    FormControl, 
    InputLabel, 
    Select, 
    MenuItem, 
    IconButton, 
    Grid,
    Button,
    Chip,
    type SelectChangeEvent
} from '@mui/material';
import SortIcon from '@mui/icons-material/Sort';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import AddIcon from '@mui/icons-material/Add';
import ClearIcon from '@mui/icons-material/Clear';

import type { SortField } from '../../utils/sortingUtils';
import type { SortFilterState } from '../../hooks/useSortAndFilter'; // 型定義をインポート

// 汎用的なソートオプションの型 (表示名とフィールドキー)
export interface SortOption {
    label: string;
    value: SortField;
}

// フィルタフィールドの型定義
export type FilterFieldType = 'text' | 'number' | 'select' | 'boolean';

export interface FilterField {
    field: string;
    label: string;
    type: FilterFieldType;
    options?: string[]; // select用のオプション
    caseSensitive?: boolean; // text用の大文字小文字区別（デフォルト: false）
}

// フィルタ条件の型
export interface FilterCondition {
    field: string;
    value: string | number | boolean;
}

// コンポーネントのProps型
export interface SortAndFilterControlsProps extends SortFilterState {
    // 💡 ソートに利用できるフィールドのリスト
    sortOptions: SortOption[];
    
    // 💡 状態更新関数
    setSortField: (field: SortField) => void;
    toggleSortOrder: () => void;
    setSearchTerm: (term: string) => void;
    
    // 💡 フィルタリング関連
    filterFields?: FilterField[]; // フィルタリング可能なフィールド定義
    onFilterChange?: (filters: FilterCondition[]) => void; // フィルタ条件変更時のコールバック
    
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
    filterFields = [],
    onFilterChange,
    labelPrefix = '',
    disableFiltering = false,
    disableSorting = false,
}) => {
    
    // フィルタ条件の状態管理
    const [filters, setFilters] = useState<FilterCondition[]>([]);
    const [currentField, setCurrentField] = useState<string>('');
    const [currentValue, setCurrentValue] = useState<string>('');
    
    const handleSortFieldChange = useCallback((event: SelectChangeEvent) => {
        setSortField(event.target.value as SortField);
    }, [setSortField]);

    const handleSearchChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(event.target.value);
    }, [setSearchTerm]);

    // フィルタ条件を追加
    const handleAddFilter = useCallback(() => {
        if (!currentField || !currentValue) return;
        
        const fieldDef = filterFields.find(f => f.field === currentField);
        if (!fieldDef) return;
        
        let parsedValue: string | number | boolean = currentValue;
        
        // 型に応じて値を変換
        if (fieldDef.type === 'number') {
            parsedValue = currentValue; // 範囲検索文字列のまま保持
        } else if (fieldDef.type === 'boolean') {
            parsedValue = currentValue === 'true';
        }
        
        const newFilters = [...filters, { field: currentField, value: parsedValue }];
        setFilters(newFilters);
        onFilterChange?.(newFilters);
        
        // 入力欄をリセット
        setCurrentField('');
        setCurrentValue('');
    }, [currentField, currentValue, filters, filterFields, onFilterChange]);

    // フィルタ条件を削除
    const handleRemoveFilter = useCallback((index: number) => {
        const newFilters = filters.filter((_, i) => i !== index);
        setFilters(newFilters);
        onFilterChange?.(newFilters);
    }, [filters, onFilterChange]);

    // すべてのフィルタをクリア
    const handleClearAllFilters = useCallback(() => {
        setFilters([]);
        onFilterChange?.([]);
    }, [onFilterChange]);

    // 現在選択中のフィールド定義を取得
    const selectedFieldDef = filterFields.find(f => f.field === currentField);

    return (
        <Box sx={{ mb: 3, p: 2, bgcolor: 'background.paper', borderRadius: 2, boxShadow: 1 }}>
            <Grid container spacing={2} alignItems="center">
                
                {/* 検索/フィルタリング入力欄（従来の簡易検索） */}
                {!disableFiltering && filterFields.length === 0 && (
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

                {/* 高度なフィルタリングUI */}
                {!disableFiltering && filterFields.length > 0 && (
                    <>
                        {/* フィールド選択 */}
                        <Grid size={{ xs: 12, sm: 3, md: 3 }}>
                            <FormControl fullWidth variant="outlined" size="small">
                                <InputLabel>フィールド</InputLabel>
                                <Select
                                    value={currentField}
                                    onChange={(e) => {
                                        setCurrentField(e.target.value);
                                        setCurrentValue('');
                                    }}
                                    label="フィールド"
                                >
                                    {filterFields.map((field) => (
                                        <MenuItem key={field.field} value={field.field}>
                                            {field.label}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>

                        {/* 値入力 */}
                        <Grid size={{ xs: 9, sm: 6, md: 5 }}>
                            {selectedFieldDef?.type === 'select' ? (
                                <FormControl fullWidth variant="outlined" size="small">
                                    <InputLabel>値</InputLabel>
                                    <Select
                                        value={currentValue}
                                        onChange={(e) => setCurrentValue(e.target.value)}
                                        label="値"
                                        disabled={!currentField}
                                    >
                                        {selectedFieldDef.options?.map((option) => (
                                            <MenuItem key={option} value={option}>
                                                {option}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            ) : selectedFieldDef?.type === 'boolean' ? (
                                <FormControl fullWidth variant="outlined" size="small">
                                    <InputLabel>値</InputLabel>
                                    <Select
                                        value={currentValue}
                                        onChange={(e) => setCurrentValue(e.target.value)}
                                        label="値"
                                        disabled={!currentField}
                                    >
                                        <MenuItem value="true">はい</MenuItem>
                                        <MenuItem value="false">いいえ</MenuItem>
                                    </Select>
                                </FormControl>
                            ) : (
                                <TextField
                                    fullWidth
                                    label={selectedFieldDef?.type === 'number' ? '値 (例: 10 または 10-20)' : '値'}
                                    variant="outlined"
                                    size="small"
                                    value={currentValue}
                                    onChange={(e) => setCurrentValue(e.target.value)}
                                    disabled={!currentField}
                                    placeholder={selectedFieldDef?.type === 'number' ? '10-20' : ''}
                                />
                            )}
                        </Grid>

                        {/* 条件追加ボタン */}
                        <Grid size={{ xs: 3, sm: 3, md: 2 }}>
                            <Button
                                fullWidth
                                variant="contained"
                                startIcon={<AddIcon />}
                                onClick={handleAddFilter}
                                disabled={!currentField || !currentValue}
                            >
                                追加
                            </Button>
                        </Grid>

                        {/* 追加されたフィルタ条件の表示 */}
                        {filters.length > 0 && (
                            <Grid size={{ xs: 12 }}>
                                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                                    {filters.map((filter, index) => {
                                        const fieldDef = filterFields.find(f => f.field === filter.field);
                                        return (
                                            <Chip
                                                key={index}
                                                label={`${fieldDef?.label}: ${filter.value}`}
                                                onDelete={() => handleRemoveFilter(index)}
                                                color="primary"
                                                variant="outlined"
                                            />
                                        );
                                    })}
                                    <Button
                                        size="small"
                                        startIcon={<ClearIcon />}
                                        onClick={handleClearAllFilters}
                                    >
                                        すべてクリア
                                    </Button>
                                </Box>
                            </Grid>
                        )}
                    </>
                )}

                {/* ソートフィールド選択 */}
                {!disableSorting && (
                    <Grid size={{ xs: 8, sm: 4, md: disableFiltering ? 8 : 3 }}>
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