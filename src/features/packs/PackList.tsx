/**
 * src/features/packs/PackList.tsx
 *
 * パック管理フィーチャーの核となるコンポーネント。
 * 責務は、usePackListカスタムフックから取得したパックデータ、ソート/フィルタ状態、および操作ハンドラ（選択、新規作成、削除）を用いて、
 * Material UIのGridレイアウトに基づいたパックカード一覧UIを描画すること。
 * 純粋なビュー層として機能し、データ取得やビジネスロジックの詳細はカスタムフックに完全に委譲する。
 */
import React from 'react'; 
import { Grid, Card, CardContent, Typography, CardActionArea, Box, CardMedia, Alert, IconButton } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete'; 

import { usePackList } from './hooks/usePackList';

import SortAndFilterControls from '../../components/controls/SortAndFilterControls';

import { 
    getDisplayImageUrl, 
    DEFAULT_PACK_DECK_WIDTH as PACK_CARD_WIDTH,
    DEFAULT_PACK_DECK_HEIGHT as PACK_CARD_HEIGHT
} from '../../utils/imageUtils'; 

// 画像プレースホルダーオプションをローカルで定義
const PACK_PLACEHOLDER_OPTIONS = {
    width: PACK_CARD_WIDTH,
    height: PACK_CARD_HEIGHT,
    imgColorPresetKey: 'default',
};


const PackList: React.FC = () => {
    const { 
        packs,
        displayedPacks,
        sortField,
        sortOrder,
        searchTerm,
        PACK_SORT_OPTIONS,
        setSortField,
        toggleSortOrder,
        setSearchTerm,
        handleSelectPack,
        handleNewPack,
        handleDeletePack, 
    } = usePackList();


    const hasPacks = packs.length > 0;
    const isFilteredButEmpty = packs.length > 0 && displayedPacks.length === 0 && searchTerm;
    const isTotallyEmpty = !hasPacks && !searchTerm; // パックがゼロで、検索もしていない状態

    return (
        <Box sx={{ flexGrow: 1, p: 2 }}>
            <Typography variant="h4" gutterBottom>
                パック一覧 ({packs.length}件)
            </Typography>
            
            <SortAndFilterControls
                labelPrefix="パック"
                sortOptions={PACK_SORT_OPTIONS}
                sortField={sortField}
                sortOrder={sortOrder}
                searchTerm={searchTerm}
                setSortField={setSortField}
                toggleSortOrder={toggleSortOrder}
                setSearchTerm={setSearchTerm}
            />

            {/* 1. 検索結果がゼロの場合のAlert */}
            {isFilteredButEmpty && (
                <Alert severity="info" sx={{ mt: 2 }}>
                    "{searchTerm}" に一致するパックが見つかりませんでした。
                </Alert>
            )}

            {/* 2. パックリスト（新規作成カードを含む）の描画 */}
            {/* 検索結果が空でない、またはパックが全くない（Alertを別途表示）の全ての場合にGridコンテナを表示する */}
            {!isFilteredButEmpty && (
                <Grid container spacing={3} sx={{ mt: 1 }}>
                    
                    {/* ★ 修正ポイント: 新規パック作成用のカードを無条件でGridの先頭に配置 */}
                    <Grid size={{ xs: 6, sm: 4, md: 3 }} sx={{ display: 'flex', justifyContent: 'center' }}>
                        <Card 
                            sx={{ 
                                width: PACK_CARD_WIDTH, 
                                height: PACK_CARD_HEIGHT,
                                cursor: 'pointer',
                                boxShadow: 1, 
                                border: '2px dashed #ccc', // 点線枠
                            }}
                            onClick={handleNewPack}
                        >
                            <CardActionArea sx={{ 
                                height: '100%', 
                                display: 'flex', 
                                flexDirection: 'column', 
                                justifyContent: 'center', 
                                alignItems: 'center' 
                            }}>
                                <AddIcon sx={{ fontSize: 60, color: '#ccc' }} /> {/* +マーク */}
                                <Typography variant="subtitle1" color="text.secondary">
                                    新規パックを作成
                                </Typography>
                            </CardActionArea>
                        </Card>
                    </Grid>

                    {/* パックがゼロ件の場合の Alert を Grid 内に表示 (既存のAlertを再利用) */}
                    {isTotallyEmpty && (
                        <Grid size={12}>
                            <Alert severity="info" sx={{ mt: 2 }}>
                                パックが登録されていません。新しいパックを作成してください。
                            </Alert>
                        </Grid>
                    )}
                    
                    {/* 既存のパック一覧のマップ処理 (ソート・フィルタ後のデータを使用) */}
                    {displayedPacks.map((pack) => (
                        <Grid size={{ xs: 6, sm: 4, md: 3 }} key={pack.packId} sx={{ display: 'flex', justifyContent: 'center' }}>
                            <Card 
                                sx={{ 
                                    width: PACK_CARD_WIDTH, 
                                    height: PACK_CARD_HEIGHT,
                                    boxShadow: 1, 
                                    position: 'relative', 
                                }}
                            >
                                {/* 編集ページへの遷移はCardActionArea全体で処理 */}
                                <CardActionArea onClick={() => handleSelectPack(pack.packId)}>
                                    <CardMedia
                                        component="img"
                                        image={getDisplayImageUrl(
                                            pack.imageUrl,
                                            { 
                                                ...PACK_PLACEHOLDER_OPTIONS, 
                                                text: pack.name, 
                                            }
                                        )}
                                        alt={pack.name}
                                        sx={{ height: 150, objectFit: 'cover' }} 
                                    />
                                    <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
                                        {/* 図鑑 No.の表示 */}
                                        {pack.number !== null && (
                                            <Typography variant="overline" color="text.primary" sx={{ display: 'block', lineHeight: 1.2 }}>
                                                No. {pack.number}
                                            </Typography>
                                        )}
                                        <Typography variant="subtitle1" noWrap>{pack.name}</Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {pack.series} | {pack.cardsPerPack}枚
                                        </Typography>
                                    </CardContent>
                                </CardActionArea>
                                
                                {/* 削除ボタンの配置とロジック実行 */}
                                <Box sx={{ position: 'absolute', top: 5, right: 5 }}>
                                    <IconButton 
                                        size="small" 
                                        color="error"
                                        onClick={(e) => {
                                            e.stopPropagation(); // CardActionAreaのonClickを阻止
                                            handleDeletePack(pack.packId, pack.name);
                                        }}
                                    >
                                        <DeleteIcon fontSize="inherit" />
                                    </IconButton>
                                </Box>
                                
                            </Card>
                        </Grid>
                    ))}

                </Grid>
            )}
        </Box>
    );
};

export default PackList;