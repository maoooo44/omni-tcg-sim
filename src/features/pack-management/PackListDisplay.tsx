// src/features/pack-management/PackListDisplay.tsx

/**
 * 登録されているすべてのパックを一覧表示するフィーチャーコンポーネント。
 * データ取得、ソート、フィルタリング、および一覧描画のロジックを持つ。
 */
import React, { useEffect } from 'react'; 
import { useNavigate } from '@tanstack/react-router'; 
import { Grid, Card, CardContent, Typography, CardActionArea, Box, CardMedia, Button, Alert } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { usePackStore } from '../../stores/packStore'; 
import { useShallow } from 'zustand/react/shallow';

// 💡 共通の型、ユーティリティ、コンポーネントをインポート
import type { Pack } from '../../models/pack'; // Packモデルをインポート
import { useSortAndFilter } from '../../hooks/useSortAndFilter';
import { type SortField } from '../../utils/sortingUtils'; // 💡 SortFieldは定義元からインポート
import SortAndFilterControls, { type SortOption } from '../../components/SortAndFilterControls';

import { 
    getDisplayImageUrl, 
    DEFAULT_PACK_DECK_WIDTH as PACK_CARD_WIDTH,
    DEFAULT_PACK_DECK_HEIGHT as PACK_CARD_HEIGHT
} from '../../utils/imageUtils'; 

// 💡 修正 2: PACK_PLACEHOLDER_OPTIONSをローカルで定義 (imageUtils.tsの型に合わせる)
const PACK_PLACEHOLDER_OPTIONS = {
    width: PACK_CARD_WIDTH,
    height: PACK_CARD_HEIGHT,
    imgColorPresetKey: 'default', // ImageDisplayOptionsに合わせる
};


// =========================================================================
// 1. ソート・フィルタリング用設定
// =========================================================================

/**
 * Packオブジェクトから指定されたフィールドの値を取得するアクセサ関数
 * useSortAndFilterフックに渡すために必要。
 */
const packFieldAccessor = (item: Pack, field: SortField): string | number | null | undefined => {
    switch (field) {
        case 'number':
            return item.number;
        case 'name':
            return item.name;
        case 'packId':
            return item.packId;
        // Packモデルに存在する series フィールドも検索対象に含める
        case 'series':
            return item.series;
        default:
            // その他の動的なフィールドは Pack モデルには少ないが、念の為
            return (item as any)[field] ?? null;
    }
};

/**
 * ソートオプションの定義
 */
const PACK_SORT_OPTIONS: SortOption[] = [
    { label: '図鑑 No. (デフォルト)', value: 'number' },
    { label: 'パック名', value: 'name' },
    { label: 'ID', value: 'packId' },
    { label: 'シリーズ', value: 'series' },
];


// =========================================================================
// 2. コンポーネント本体
// =========================================================================

const PackListDisplay: React.FC = () => {
    // 1. データ取得
    const { packs, initializeNewPackEditing, loadPacks } = usePackStore(useShallow(state => ({
        packs: state.packs,
        initializeNewPackEditing: state.initializeNewPackEditing,
        loadPacks: state.loadPacks, 
    })));
    
    // 2. ナビゲーションロジック
    const navigate = useNavigate();

    // コンポーネントがマウントされたときにパックリストをロード
    useEffect(() => {
        loadPacks();
    }, [loadPacks]); 
    
    // 💡 3. ソート＆フィルタリングフックの適用
    const {
        sortedAndFilteredData: displayedPacks,
        sortField,
        sortOrder,
        searchTerm,
        setSortField,
        toggleSortOrder,
        setSearchTerm,
    } = useSortAndFilter<Pack>(packs, packFieldAccessor, {
        defaultSortField: 'number', // numberによるデフォルトソートを適用
        defaultSortOrder: 'asc'
    });


    // 既存パックをクリックしたときの処理
    const handleSelectPack = (packId: string) => {
        navigate({ to: `/data/packs/$packId`, params: { packId } });
    };
    
    // 新規作成カードが押されたときの処理
    const handleNewPack = async () => {
        // 1. Storeで新規パックを初期化し、UUIDを取得
        const newPackId = await initializeNewPackEditing(); 
        
        // 2. 取得したUUIDで編集ページに即時遷移
        navigate({ to: `/data/packs/$packId`, params: { packId: newPackId } }); 
    };

    const hasPacks = packs.length > 0;

    return (
        // 3. UI描画ロジック
        <Box sx={{ flexGrow: 1, p: 2 }}>
            <Typography variant="h4" gutterBottom>
                パック一覧 ({packs.length}件)
            </Typography>
            
            {/* 💡 SortAndFilterControlsの配置 */}
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

            {/* 新規作成ボタン (フィルタリングUIの下に配置) */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
                <Button variant="contained" startIcon={<AddIcon />} onClick={handleNewPack}>
                    新しいパックを作成
                </Button>
            </Box>


            {/* パック一覧の描画 (ソート・フィルタ後のデータ: displayedPacks を使用) */}
            {packs.length > 0 && displayedPacks.length === 0 && searchTerm ? (
                 <Alert severity="info" sx={{ mt: 2 }}>
                    "{searchTerm}" に一致するパックが見つかりませんでした。
                </Alert>
            ) : !hasPacks ? (
                <Alert severity="info" sx={{ mt: 2 }}>
                    パックが登録されていません。新しいパックを作成してください。
                </Alert>
            ) : (
                <Grid container spacing={3}>
                    
                    {/* 新規パック作成用の + ボタン */}
                    {/* 💡 修正: 新規作成ボタンをリストの先頭から固定で表示するため、Gridの中に移し、リストの先頭要素として表示 */}
                    <Grid size={{ xs: 6, sm: 4, md: 3 }} sx={{ display: 'flex', justifyContent: 'center' }}>
                        <Card 
                            sx={{ 
                                width: PACK_CARD_WIDTH, 
                                height: PACK_CARD_HEIGHT,
                                cursor: 'pointer',
                                boxShadow: 1, 
                                border: '2px dashed #ccc',
                            }}
                            onClick={handleNewPack} // ナビゲーションハンドラを使用
                        >
                            <CardActionArea sx={{ 
                                height: '100%', 
                                display: 'flex', 
                                flexDirection: 'column', 
                                justifyContent: 'center', 
                                alignItems: 'center' 
                            }}>
                                <AddIcon sx={{ fontSize: 60, color: '#ccc' }} />
                                <Typography variant="subtitle1" color="text.secondary">
                                    新規パックを作成
                                </Typography>
                            </CardActionArea>
                        </Card>
                    </Grid>
                    
                    {/* 既存のパック一覧のマップ処理 (ソート・フィルタ後のデータを使用) */}
                    {displayedPacks.map((pack) => (
                        <Grid size={{ xs: 6, sm: 4, md: 3 }} key={pack.packId} sx={{ display: 'flex', justifyContent: 'center' }}>
                            <Card 
                                sx={{ 
                                    width: PACK_CARD_WIDTH, 
                                    height: PACK_CARD_HEIGHT,
                                    cursor: 'pointer',
                                    boxShadow: 1, 
                                }}
                                onClick={() => handleSelectPack(pack.packId)}
                            >
                                <CardActionArea sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
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
                                        {/* 図鑑 No.の表示を追加 */}
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
                            </Card>
                        </Grid>
                    ))}

                </Grid>
            )}
        </Box>
    );
};

export default PackListDisplay;