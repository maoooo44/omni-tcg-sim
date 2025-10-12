/**
 * src/features/card-pool/CardPoolManager.tsx
 * * カードコレクションの表示と管理を行うメインコンポーネント。
 * ユーザーが所有するカードをフィルター、並び替え、ページネーション機能で表示する。
 * 各カードの表示には OpenerCard を利用し、枚数表示（DTCG有効時）も行う。
 */

import React, { useMemo } from 'react'; 
import { 
    Box, Typography, Grid, Paper, Select, MenuItem, FormControl, 
    InputLabel, TextField, Pagination, ToggleButtonGroup, ToggleButton, 
    Button, Alert, Divider, Chip, Tooltip // 💡 Tooltipを追加
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import SortIcon from '@mui/icons-material/Sort';
// 💡 Icon: ViewMode切り替え用アイコンを追加
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import ViewListIcon from '@mui/icons-material/ViewList';

// 💡 修正: useCardPoolDisplay のインポートを更新
import { useCardPoolDisplay, CARDS_PER_PAGE, type SortKey, type ViewMode } from './hooks/useCardPoolDisplay'; 
import type { OwnedCardDisplay, CardPoolFilters } from './hooks/useCardPoolDisplay'; 
import OpenerCard from '../../components/OpenerCard'; 

import { useUIStore } from '../../stores/uiStore'; 

import { 
    getDisplayImageUrl, 
} from '../../utils/imageUtils';

// OwnedCardItem コンポーネント定義 (変更なし)
interface OwnedCardProps {
    card: OwnedCardDisplay;
    isDTCGEnabled: boolean;
}
const OwnedCardItem: React.FC<OwnedCardProps> = ({ card, isDTCGEnabled }) => {
    // ... (OwnedCardItem の定義は変更なし)
    const openCardViewModal = useUIStore(state => state.openCardViewModal);

    const displayImageUrl = getDisplayImageUrl(
        card.imageUrl, 
        {
            width: 150, 
            height: 210, 
            text: card.name,
            imgColorPresetKey: 'black', 
        }
    );

    const cardDataForDisplay = useMemo(() => ({
        ...card,
        imageUrl: displayImageUrl, 
    }), [card, displayImageUrl]); 
    
    const handleCardClick = () => {
        openCardViewModal(card.cardId);
    };

    return (
        <Box 
            sx={{ 
                position: 'relative', 
                width: '100%', 
                maxWidth: 150,
                cursor: 'pointer', 
            }}
            onClick={handleCardClick} 
        >
            <OpenerCard 
                cardData={cardDataForDisplay} 
                isRevealed={true} 
                cardBackUrl={''} 
                delay={0} 
            />
            {isDTCGEnabled && (
                <Chip 
                    label={`x${card.count}`} 
                    color="primary" 
                    size="small" 
                    sx={{ 
                        position: 'absolute', 
                        bottom: 4, 
                        right: 4, 
                        bgcolor: 'rgba(0,0,0,0.7)', 
                        color: 'white',
                        fontWeight: 'bold'
                    }} 
                />
            )}
        </Box>
    );
};


const CardPoolManager: React.FC = () => {
    
    // 💡 修正/追加: viewMode, setViewMode, columns を取得
    const {
        isLoading,
        error,
        filteredCards,
        filter,
        setFilter,
        currentPage,
        totalPages,
        setCurrentPage,
        sortKey,
        setSortKey,
        sortOrder,
        setSortOrder,
        viewMode, // 💡 追加
        setViewMode, // 💡 追加
        columns, // 💡 追加: 現在の列数（4 or 6など）
        resetCollection,
        isDTCGEnabled,
    } = useCardPoolDisplay();
    
    const totalCount = useMemo(() => filteredCards.length, [filteredCards]);
    const startIndex = (currentPage - 1) * CARDS_PER_PAGE;
    const endIndex = startIndex + CARDS_PER_PAGE;
    const cardsOnPage = useMemo(() => filteredCards.slice(startIndex, endIndex), [filteredCards, startIndex, endIndex]);

    // 💡 追加: Grid size を動的に計算するヘルパー
    // Material UI Gridは12カラムシステムなので、12 / columns が size になる
    const gridSize = useMemo(() => {
        const size = Math.floor(12 / columns);
        // 列数をブレークポイントごとに制御しないため、全てに同じサイズを適用
        return { xs: 6, sm: size < 4 ? 4 : size, md: size, lg: size, xl: size };
    }, [columns]);
    
    // 💡 追加: 表示モード切り替えハンドラ
    const handleViewModeChange = (
        _event: React.MouseEvent<HTMLElement>,
        newMode: ViewMode | null,
    ) => {
        if (newMode) {
            setViewMode(newMode);
            setCurrentPage(1); // モード変更時にページをリセット
        }
    };


    const handleFilterChange = (key: keyof CardPoolFilters, value: string | number | null) => {
        setFilter({ [key]: value });
        setCurrentPage(1); 
    };

    const handleClearSearch = () => {
        setFilter({ search: '' });
        setCurrentPage(1);
    };

    const handleSortChange = (
        _event: React.MouseEvent<HTMLElement>,
        newSortKey: string | null,
    ) => {
        if (newSortKey) {
            if (newSortKey === sortKey) {
                 // 同じキーが選択されたら順序を反転
                setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
            } else {
                // 異なるキーが選択されたらキーを変更し、順序をascにリセット
                setSortKey(newSortKey as SortKey);
                setSortOrder('asc');
            }
        }
    };
    
    if (isLoading) {
        // ... (ロード中表示は変更なし)
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <Typography>カードデータをロード中...</Typography>
            </Box>
        );
    }

    if (error) {
        // ... (エラー表示は変更なし)
        return (
            <Alert severity="error" sx={{ my: 2 }}>
                カードプールのロードに失敗しました: {error.message}
            </Alert>
        );
    }

    // 💡 修正: レジストレーション順は図鑑モードでのみ表示
    const sortOptions: { value: SortKey, label: string }[] = useMemo(() => {
        const options: { value: SortKey, label: string }[] = [
            { value: 'name', label: '名前' },
            { value: 'pack', label: 'パック' },
        ];
        if (isDTCGEnabled) {
            options.push({ value: 'count', label: '枚数' });
        }
        if (viewMode === 'collection') {
            options.push({ value: 'registrationSequence', label: '登録順' });
        }
        return options;
    }, [isDTCGEnabled, viewMode]);


    return (
        <Box sx={{ flexGrow: 1, p: 2 }}>
            <Typography variant="h4" gutterBottom>
                カードコレクション管理
            </Typography>
            <Divider sx={{ mb: 3 }} />

            <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>フィルターと並び替え</Typography>
                
                <Grid container spacing={2}>
                    
                    {/* 検索・フィルター領域 (変更なし) */}
                    {/* ... (Grid size={{ xs: 12, md: 4 }} - 検索) ... */}
                    <Grid size={{ xs: 12, md: 4 }}> 
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
                    
                    {/* ... (Grid size={{ xs: 6, md: 2 }} - パック) ... */}
                    <Grid size={{ xs: 6, md: 2 }}>
                        <FormControl fullWidth>
                            <InputLabel>パック</InputLabel>
                            <Select
                                value={filter.packId || 'all'}
                                label="パック"
                                onChange={(e) => handleFilterChange('packId', e.target.value === 'all' ? null : e.target.value)}
                            >
                                <MenuItem value="all">全て</MenuItem>
                                <MenuItem value="pack-a">パックA</MenuItem> 
                            </Select>
                        </FormControl>
                    </Grid>
                    
                    {/* ... (Grid size={{ xs: 6, md: 2 }} - レアリティ) ... */}
                    <Grid size={{ xs: 6, md: 2 }}>
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
                            </Select>
                        </FormControl>
                    </Grid>
                    
                    {/* 💡 修正: 並び替えボタンの配置を修正 */}
                    <Grid size={{ xs: 12, md: 4 }}>
                         <Box sx={{ display: 'flex', alignItems: 'center', height: '100%', gap: 1 }}>
                            <SortIcon color="action" />
                            <ToggleButtonGroup
                                value={sortKey} 
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
                            
                            {sortKey && (
                                <Button 
                                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                                    size="small"
                                    variant="outlined" // 順序が分かりやすいようにアウトライン化
                                >
                                    {sortOrder === 'asc' ? '昇順 ▲' : '降順 ▼'}
                                </Button>
                            )}
                        </Box>
                    </Grid>
                    
                    {/* 💡 追加: 表示モード切り替えと列数設定 */}
                    <Grid size={{ xs: 12 }} sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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

                        {/* 列数設定（ここでは省略。columnsはuseCardPoolDisplayで固定管理としておく） */}
                        
                        <Button 
                            variant="outlined" 
                            color="error" 
                            onClick={resetCollection} 
                            size="small"
                        >
                            コレクションをリセット
                        </Button>
                    </Grid>

                </Grid>
            </Paper>

            <Typography variant="h6" sx={{ mt: 3 }}>
                合計 {totalCount} 件のカードを表示中 ({viewMode === 'collection' ? '図鑑モード' : 'リストモード'})
            </Typography>

            {/* カード表示エリア */}
            <Box sx={{ mt: 3, minHeight: 400 }}>
                {totalCount === 0 ? (
                    // ... (カードなしのアラートは変更なし)
                    <Alert severity="info">
                        表示できるカードがありません。フィルターを変更するか、パックを開封してください。
                    </Alert>
                ) : (
                    <>
                        <Grid container spacing={2} justifyContent="flex-start"> {/* justifyContentを修正 */}
                            {cardsOnPage.map((card) => (
                                <Grid 
                                    // 💡 修正: 動的に計算した gridSize を使用
                                    size={gridSize} 
                                    key={card.cardId} 
                                    sx={{ display: 'flex', justifyContent: 'center' }}
                                >
                                    <OwnedCardItem card={card} isDTCGEnabled={isDTCGEnabled} />
                                </Grid>
                            ))}
                        </Grid>


                        {/* Pagination (変更なし) */}
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

export default CardPoolManager;