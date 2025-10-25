/**
 * src/features/card-pool/CardPool.tsx
 *
 * カードコレクションの表示と管理を行うメインコンポーネント（ビュー）。
 * フィルタリング、並び替え、ページネーションのUIと、全体のレイアウトを管理します。
 * 個々のカード表示ロジックは OwnedCardItem コンポーネントに委譲されます。
 */

import React, { useMemo } from 'react'; 
import { 
    Box, Typography, Grid, Paper, Select, MenuItem, FormControl, 
    InputLabel, TextField, Pagination, ToggleButtonGroup, ToggleButton, 
    Button, Alert, Divider, Tooltip 
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import SortIcon from '@mui/icons-material/Sort';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import ViewListIcon from '@mui/icons-material/ViewList';

// 💡 共通ロジックと設定をインポート 
import { useGridDisplay } from '../../hooks/useGridDisplay'; 
import { CardPoolGridSettings } from '../../configs/defaults'; 
import GridColumnToggle from '../../components/controls/GridColumnToggle'; 
import ReusableItemGrid from '../../components/common/ReusableItemGrid'; 

// 💡 既存のインポート
import { useCardPoolDisplay, CARDS_PER_PAGE, type ViewMode } from './hooks/useCardPoolDisplay'; 
import type { CardPoolFilters } from './hooks/useCardPoolDisplay'; 
import { type SortField } from '../../utils/sortingUtils'; 
import OwnedCardItem from './components/OwnedCard'; 
// 💡 仮のUser Dataフック (本来はDB/Contextから取得)
const useUserData = () => ({
    // UserDataState.gridSettings.cardPool の仮のデータ構造
    cardPoolGridSettings: {
        isUserDefaultEnabled: false,
        globalColumns: null,
        advancedResponsive: {
            isEnabled: false,
            columns: {}
        }
    }
});


const CardPool: React.FC = () => {
    
    // 従来のロジックフックから状態とハンドラを取得
    const {
        isLoading,
        error,
        filteredCards,
        filter,
        setFilter,
        currentPage,
        totalPages,
        setCurrentPage,
        sortField,
        setSortField,
        sortOrder,
        toggleSortOrder,
        viewMode, 
        setViewMode, 
        isDTCGEnabled,
        availablePacks,
    } = useCardPoolDisplay();
    
    // DBから永続化されたユーザー設定を取得 (仮)
    const { cardPoolGridSettings } = useUserData();

    // 1. 💡 修正: グリッド表示のロジックと設定をフックから取得
    const { 
        columns, 
        setColumns, 
        minColumns, 
        maxColumns,
        sxOverride, 
        aspectRatio,
        gap, // 💡 変更: spacingではなくgap（px単位、小数点対応）
    } = useGridDisplay({ 
        settings: CardPoolGridSettings, 
        storageKey: 'card-pool-list-cols', 
        userGlobalDefault: cardPoolGridSettings 
    }); 

    const totalCount = useMemo(() => filteredCards.length, [filteredCards]);
    const startIndex = (currentPage - 1) * CARDS_PER_PAGE;
    const endIndex = startIndex + CARDS_PER_PAGE;
    const cardsOnPage = useMemo(() => filteredCards.slice(startIndex, endIndex), [filteredCards, startIndex, endIndex]);

    const handleViewModeChange = (
        _event: React.MouseEvent<HTMLElement>,
        newMode: ViewMode | null,
    ) => {
        if (newMode) {
            setViewMode(newMode);
            setCurrentPage(1); 
        }
    };

    const handleFilterChange = (key: keyof CardPoolFilters, value: string | number | null) => {
        setFilter({ ...filter, [key]: value }); 
        setCurrentPage(1); 
    };

    const handleClearSearch = () => {
        setFilter({ ...filter, search: null }); 
        setCurrentPage(1);
    };

    const handleSortChange = (
        _event: React.MouseEvent<HTMLElement>,
        newSortField: string | null,
    ) => {
        if (newSortField) {
            if (newSortField === sortField) {
                // 同じキーが選択されたら順序を反転
                toggleSortOrder();
            } else {
                // 異なるキーが選択されたらキーを変更
                setSortField(newSortField as SortField);
            }
        }
    };
    
    // ロード中、エラー表示
    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <Typography>カードデータをロード中...</Typography>
            </Box>
        );
    }

    if (error) {
        return (
            <Alert severity="error" sx={{ my: 2 }}>
                カードプールのロードに失敗しました: {error.message}
            </Alert>
        );
    }

    // ソートオプションの定義
    const sortOptions: { value: SortField, label: string }[] = useMemo(() => {
        const options: { value: SortField, label: string }[] = [
            { value: 'number', label: '図鑑/パック順' },
            { value: 'name', label: '名前' },
            { value: 'packName', label: 'パック名' }, 
            { value: 'rarity', label: 'レアリティ' },
        ];
        if (isDTCGEnabled && viewMode === 'list') {
            options.push({ value: 'count', label: '枚数' });
        }
        return options;
    }, [isDTCGEnabled, viewMode]);


    return (
        <Box sx={{ flexGrow: 1, p: 2 }}>
            <Typography variant="h4" gutterBottom>
                カードプール
            </Typography>
            <Divider sx={{ mb: 3 }} />

            <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>フィルターと並び替え</Typography>
                
                <Grid container spacing={2}>
                    
                    {/* 検索フィールド - 💡 修正: size => xs/md */}
                    <Grid size={{xs:12,md:4}}> 
                        <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1 }}>
                            <SearchIcon color="action" sx={{ mb: 1.5 }} />
                            <TextField 
                                label="カード名で検索"
                                fullWidth
                                value={filter.search || ''}
                                onChange={(e) => handleFilterChange('search', e.target.value)}
                            />
                            {filter.search && (
                                <Button onClick={handleClearSearch} size="small" sx={{ mb: 0.5 }}>
                                    <CloseIcon />
                                </Button>
                            )}
                        </Box>
                    </Grid>
                    
                    {/* パックフィルター - 💡 修正: size => xs/md */}
                    <Grid size={{xs:6,md:2}}>
                        <FormControl fullWidth>
                            <InputLabel>パック</InputLabel>
                            <Select
                                value={filter.packId || 'all'}
                                label="パック"
                                onChange={(e) => handleFilterChange('packId', e.target.value === 'all' ? null : e.target.value)}
                            >
                                <MenuItem value="all">全て</MenuItem>
                                {availablePacks.map(pack => (
                                    <MenuItem key={pack.packId} value={pack.packId}>
                                        {pack.number ? `[${pack.number}] ` : ''}{pack.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    
                    {/* レアリティフィルター - 💡 修正: size => xs/md */}
                    <Grid size={{xs:6,md:2}}>
                        <FormControl fullWidth>
                            <InputLabel>レアリティ</InputLabel>
                            <Select
                                value={filter.rarity || 'all'}
                                label="レアリティ"
                                onChange={(e) => handleFilterChange('rarity', e.target.value === 'all' ? null : e.target.value)}
                            >
                                <MenuItem value="all">全て</MenuItem>
                                <MenuItem value="Common">Common</MenuItem>
                                <MenuItem value="Rare">Rare</MenuItem>
                                {/* ... 他のレアリティ ... */}
                            </Select>
                        </FormControl>
                    </Grid>
                    
                    {/* 並び替えボタン - 💡 修正: size => xs/md */}
                    <Grid size={{xs:12,md:4}}>
                               <Box sx={{ display: 'flex', alignItems: 'center', height: '100%', gap: 1 }}>
                                    <SortIcon color="action" sx={{ mb: 0.5 }} />
                                    <ToggleButtonGroup
                                        value={sortField}
                                        exclusive
                                        onChange={handleSortChange}
                                        size="small"
                                        aria-label="card sort"
                                        sx={{ flexGrow: 1 }}
                                    >
                                        {sortOptions.map(opt => (
                                            <ToggleButton key={opt.value} value={opt.value} aria-label={opt.label}>
                                                {opt.label}
                                            </ToggleButton>
                                        ))}
                                    </ToggleButtonGroup>
                                    
                                    {sortField && (
                                        <Button 
                                            onClick={toggleSortOrder} 
                                            size="small"
                                            variant="outlined"
                                        >
                                            {sortOrder === 'asc' ? '昇順 ▲' : '降順 ▼'}
                                        </Button>
                                    )}
                               </Box>
                    </Grid>
                    
                    {/* 表示モード切り替えと列数トグルボタン - 💡 修正: size => xs */}
                    <Grid size={{xs:12}} sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <ToggleButtonGroup
                                    value={viewMode}
                                    exclusive
                                    onChange={handleViewModeChange}
                                    size="small"
                                    aria-label="view mode"
                                >
                                    <Tooltip title="所有カードリスト">
                                        <ToggleButton value="list" aria-label="list">
                                            <ViewListIcon /> リスト
                                        </ToggleButton>
                                    </Tooltip>
                                    <Tooltip title="図鑑表示 (全カード)">
                                        <ToggleButton value="collection" aria-label="collection">
                                            <ViewModuleIcon /> 図鑑
                                        </ToggleButton>
                                    </Tooltip>
                                </ToggleButtonGroup>

                                {/* 💡 修正: viewModeの条件を削除し、常に表示 */}
                                <GridColumnToggle 
                                    currentColumns={columns} 
                                    setColumns={setColumns} 
                                    minColumns={minColumns} 
                                    maxColumns={maxColumns} 
                                    label={`列数:`}
                                />
                                
                    </Grid>

                </Grid>
            </Paper>

            <Typography variant="h6" sx={{ mt: 3 }}>
                {/* 💡 修正: (1行 X 枚) の表示を削除 */}
                合計 {totalCount} 件のカードを表示中
            </Typography>

            {/* カード表示エリア */}
            <Box sx={{ mt: 3, minHeight: 400 }}>
                {totalCount === 0 ? (
                    <Alert severity="info">
                        表示できるカードがありません。フィルターを変更するか、パックを開封してください。
                    </Alert>
                ) : (
                    <>
                        {/* 💡 修正: ReusableItemGridへのpropsを更新 (gapを追加) */}
                        <ReusableItemGrid
                            items={cardsOnPage}
                            ItemComponent={OwnedCardItem}
                            sxOverride={sxOverride}
                            aspectRatio={aspectRatio}
                            gap={gap}
                        />
                        
                        {/* Pagination */}
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

export default CardPool;