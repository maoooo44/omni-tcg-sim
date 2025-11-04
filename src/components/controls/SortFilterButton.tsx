/**
* src/components/controls/SortFilterButton.tsx
*
* 汎用的なソート、検索、フィルタリングの操作UI（SortFilterControlsの内容）を
* Popoverで展開するボタンコンポーネントに統合。
* フィルタ条件が適用されている場合は、アイコンを強調表示する。
*/
import React, { useState, useCallback } from 'react';
import {
    // 💡 IconButton は EnhancedIconButton の内部で使用するためここでは削除
    Popover,
    Box,
    Badge,
    Typography,
    // 💡 Controlsから移動したMUIコンポーネント
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Grid,
    Button,
    Chip,
    type SelectChangeEvent,
} from '@mui/material';
// 💡 EnhancedIconButton をインポート
import EnhancedIconButton from '../common/EnhancedIconButton'; // 適切なパスに修正してください

// 💡 Controlsから移動したアイコン
import SearchIcon from '@mui/icons-material/Search';
import SortIcon from '@mui/icons-material/Sort';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import AddIcon from '@mui/icons-material/Add';
import ClearIcon from '@mui/icons-material/Clear';

// 💡 Controlsから移動した型定義
import type {
    SortFilterState,
    FilterField,
    FilterCondition,
    SortOption,
    SortField
} from '../../models/models';



// コンポーネントのProps型 (旧 SortFilterControlsProps とほぼ同じ)
export interface SortFilterButtonProps extends SortFilterState {
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

    // 💡 修正: tooltipText をオプショナルにする (必須の '?' を追加)
    tooltipText?: string;
    disabled?: boolean;
}

const SortFilterButton: React.FC<SortFilterButtonProps> = ({
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

    // 💡 修正: デフォルト値を設定
    tooltipText = "ソート・フィルタの表示",
    disabled = false,
}) => {

    // Popoverのアンカー要素を管理するstate
    const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

    // 💡 Controlsから移動したローカルステート
    const [filters, setFilters] = useState<FilterCondition[]>(externalFilters);
    const [currentField, setCurrentField] = useState<string>('');
    const [currentValue, setCurrentValue] = useState<string>('');

    // フィルタリング条件が適用されているかどうか
    // 簡易検索 (searchTerm) または高度なフィルタ (filters) のどちらかが有効な場合
    const isFiltered = externalFilters.length > 0 || (searchTerm && searchTerm.length > 0);

    // Popoverを開く処理
    const handleClick = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    }, []);

    // Popoverを閉じる処理
    const handleClose = useCallback(() => {
        setAnchorEl(null);
    }, []);


    // 💡 Controlsから移動したロジック (useCallback)
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
        setExternalFilters(newFilters); // 親の状態も更新

        // 入力欄をリセット
        setCurrentField('');
        setCurrentValue('');
    }, [currentField, currentValue, filters, filterFields, setExternalFilters]);

    // フィルタ条件を削除
    const handleRemoveFilter = useCallback((index: number) => {
        const newFilters = filters.filter((_, i) => i !== index);
        setFilters(newFilters);
        setExternalFilters(newFilters); // 親の状態も更新
    }, [filters, setExternalFilters]);

    // すべてのフィルタをクリア
    const handleClearAllFilters = useCallback(() => {
        setFilters([]);
        setExternalFilters([]); // 親の状態も更新
    }, [setExternalFilters]);
    // 💡 ロジックここまで

    // 現在選択中のフィールド定義を取得
    const selectedFieldDef = filterFields.find(f => f.field === currentField);

    const open = Boolean(anchorEl);
    const id = open ? 'sort-filter-popover' : undefined;

    return (
        <>
            <EnhancedIconButton
                icon={
                    // フィルタ条件がある場合はバッジを表示するとUXが向上
                    <Badge
                        // externalFilters (親の状態) に基づいてバッジを表示
                        badgeContent={externalFilters.length > 0 ? externalFilters.length : 0}
                        color="primary"
                        invisible={externalFilters.length === 0}
                        overlap="circular"
                        anchorOrigin={{
                            vertical: 'top',
                            horizontal: 'right',
                        }}
                    >
                        {/* 虫メガネアイコン */}
                        <SearchIcon />
                    </Badge>
                }
                aria-describedby={id}
                onClick={handleClick}
                // 💡 tooltipText はデフォルト値が設定されているため、呼び出し元で省略可能
                tooltipText={tooltipText}
                disabled={disabled}
                // フィルタ条件がある場合は色を変更 (水色に近い色としてinfo.mainを使用)
                color={isFiltered ? 'info' : 'default'}
            />

            <Popover
                id={id}
                open={open}
                anchorEl={anchorEl}
                onClose={handleClose}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'center',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'center',
                }}
                // Popoverのスタイル調整
                sx={{
                    '& .MuiPopover-paper': {
                        minWidth: 300,
                        maxWidth: '90vw'
                    }
                }}
            >
                {/* 💡 SortFilterControlsの中身をBox内に展開 */}
                <Box sx={{ p: 2, minWidth: 350 }}>
                    <Typography variant="subtitle1" gutterBottom>
                        {labelPrefix || 'アイテム'}のソートとフィルタ
                    </Typography>

                    {/* 💡 Controls.tsx の中身の Grid を配置 */}
                    <Grid container spacing={2} alignItems="center">

                        {/* 検索/フィルタリング入力欄（従来の簡易検索） */}
                        {!disableFiltering && filterFields.length === 0 && (
                            <Grid size={{ xs: 12 }}>
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
                                <Grid size={{ xs: 12, sm: 4 }}>
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
                                <Grid size={{ xs: 9, sm: 6 }}>
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
                                <Grid size={{ xs: 3, sm: 2 }}>
                                    <EnhancedIconButton
                                        icon={<AddIcon />}
                                        onClick={handleAddFilter}
                                        disabled={!currentField || !currentValue}
                                        tooltipText="フィルタ条件を追加" // ツールチップを追加
                                        size="small" // 周りの要素に合わせてサイズを調整
                                        color="primary" // MUI Buttonのデフォルトの動作に合わせる

                                    // 💡 補足: fullWidthのButtonとして機能させるには、
                                    // Grid内のEnhancedIconButtonをBoxで囲み、
                                    // Boxに幅指定をする方法もありますが、ここではアイコンボタンとして簡潔に修正
                                    />
                                </Grid>

                                {/* 追加されたフィルタ条件の表示 */}
                                {externalFilters.length > 0 && (
                                    <Grid size={{ xs: 12 }}>
                                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center', mt: 1 }}>
                                            {externalFilters.map((filter, index) => {
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
                            <Grid size={{ xs: 8, sm: 6 }}>
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
                            <Grid size={{ xs: 4, sm: 2 }}>
                                <EnhancedIconButton
                                    icon={
                                        <>
                                            <SortIcon sx={{ mr: 0.5 }} />
                                            {sortOrder === 'asc' ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />}
                                        </>
                                    }
                                    onClick={toggleSortOrder}
                                    color="primary"
                                    size="large"
                                    tooltipText={sortOrder === 'asc' ? '昇順 (クリックで降順)' : '降順 (クリックで昇順)'}
                                />
                            </Grid>
                        )}
                    </Grid>
                    {/* 💡 Controls.tsx の中身ここまで */}
                </Box>
            </Popover>
        </>
    );
};

export default SortFilterButton;