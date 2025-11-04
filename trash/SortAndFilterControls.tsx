/**
* src/components/controls/SortAndFilterControls.tsx
*
* 汎用的なソート、検索、フィルタリングの操作UIを一元的に提供する複合コントロールコンポーネント。
* 親コンポーネントのロジック（カスタムフックなど）から状態と更新ハンドラを受け取り、UIイベントを処理する。
*
* * 責務:
* 1. 簡易検索用のテキスト入力UIを提供する (filterFieldsが空の場合)。
* 2. 高度なフィルタリング用のフィールド選択、値入力、条件追加/削除UIを提供する (filterFieldsがある場合)。
* 3. 適用されたフィルタ条件をChipとして表示し、個別の削除および全クリア機能を提供する。
* 4. ソート項目（フィールド）の選択UIを提供する。
* 5. ソート順序（昇順/降順）をトグルするUIを提供する。
* 6. すべてのUIイベント（検索、ソート、フィルタ操作）の結果を外部の状態更新関数 (`setSearchTerm`, `setSortField`, `setFilters`など) に渡す。
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
    type SelectChangeEvent,
    type BoxProps
} from '@mui/material';
import SortIcon from '@mui/icons-material/Sort';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import AddIcon from '@mui/icons-material/Add';
import ClearIcon from '@mui/icons-material/Clear';

import type { SortField } from '../../utils/sortingUtils';
import type {
    SortFilterState,
    FilterField,
    FilterCondition
} from '../../hooks/useSortAndFilter';

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
    setFilters: (filters: FilterCondition[]) => void;

    // 💡 フィルタリング関連
    filterFields?: FilterField[]; // フィルタリング可能なフィールド定義

    // 💡 UIオプション
    labelPrefix?: string; // 例: "パック" のソート・フィルタ
    disableFiltering?: boolean; // フィルタリングを無効にするオプション
    disableSorting?: boolean; // ソートを無効にするオプション

    sx?: BoxProps['sx'];
}

const SortAndFilterControls: React.FC<SortAndFilterControlsProps> = ({
    sortField,
    sortOrder,
    searchTerm,
    filters: externalFilters,
    sortOptions,
    setSortField,
    toggleSortOrder,
    setSearchTerm,
    setFilters: setExternalFilters,
    filterFields = [],
    labelPrefix = 'アイテム',
    disableFiltering = false,
    disableSorting = false,
    sx,
}) => {

    // フィルタ条件の状態管理（親からの値で初期化）
    const [filters, setFilters] = useState<FilterCondition[]>(externalFilters);
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
        setExternalFilters(newFilters);

        // 入力欄をリセット
        setCurrentField('');
        setCurrentValue('');
    }, [currentField, currentValue, filters, filterFields, setExternalFilters]);

    // フィルタ条件を削除
    const handleRemoveFilter = useCallback((index: number) => {
        const newFilters = filters.filter((_, i) => i !== index);
        setFilters(newFilters);
        setExternalFilters(newFilters);
    }, [filters, setExternalFilters]);

    // すべてのフィルタをクリア
    const handleClearAllFilters = useCallback(() => {
        setFilters([]);
        setExternalFilters([]);
    }, [setExternalFilters]);

    // 現在選択中のフィールド定義を取得
    const selectedFieldDef = filterFields.find(f => f.field === currentField);

    return (
        <Box sx={{ mb: 3, p: 2, bgcolor: 'background.paper', borderRadius: 2, boxShadow: 1, ...sx }}>
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