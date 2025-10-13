// src/components/PackCardList.tsx

import React from 'react';
import { Button, Grid, Box, Typography, Card, CardContent, CardActionArea, CardMedia, Alert } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

import type { Card as CardType } from '../models/card';
import { createDefaultCard } from '../utils/dataUtils';

// 💡 ソート・フィルタリング機能のインポート
import { useSortAndFilter } from '../hooks/useSortAndFilter';
import { type SortField } from '../utils/sortingUtils';
import SortAndFilterControls, { type SortOption } from './SortAndFilterControls';

// 共通画像ユーティリティと定数
import {
    getDisplayImageUrl,
    DEFAULT_PACK_DECK_WIDTH as PREVIEW_W,
    DEFAULT_PACK_DECK_HEIGHT as PREVIEW_H 
} from '../utils/imageUtils';

// カードグリッドのサイズを共通定数に合わせる
const CARD_GRID_WIDTH = PREVIEW_W; 

// 定義: カードリスト内のプレースホルダーオプション
const CARD_PLACEHOLDER_OPTIONS = {
    width: PREVIEW_W,
    height: PREVIEW_H,
    bgColor: '2c3e50', 
};


// =========================================================================
// 1. ソート・フィルタリング用設定
// =========================================================================

/**
 * Cardオブジェクトから指定されたフィールドの値を取得するアクセサ関数
 */
const cardFieldAccessor = (item: CardType, field: SortField): string | number | null | undefined => {
    switch (field) {
        case 'number':
            return item.number;
        case 'name':
            return item.name;
        case 'cardId':
            return item.cardId;
        case 'rarity':
            return item.rarity;
        default:
            return (item as any)[field] ?? null;
    }
};

/**
 * ソートオプションの定義
 */
const CARD_SORT_OPTIONS: SortOption[] = [
    { label: 'No. (デフォルト)', value: 'number' },
    { label: 'カード名', value: 'name' },
    { label: 'レアリティ', value: 'rarity' },
    { label: 'ID', value: 'cardId' },
];


// =========================================================================
// 2. コンポーネント本体
// =========================================================================

export interface PackCardListProps {
    packId: string;
    isEditable: boolean;
    cards: CardType[]; 
    onOpenEditModal: (card: CardType | null) => void;
    onOpenViewModal: (card: CardType) => void; 
}


const PackCardList: React.FC<PackCardListProps> = ({ 
    packId, 
    isEditable, 
    cards, // propsからカードリストを取得
    onOpenEditModal,
    onOpenViewModal,
}) => {

    // ★ 修正: useSortAndFilterフックの適用
    const {
        sortedAndFilteredData: displayedCards, // ソート・フィルタ後のカードリスト
        sortField,
        sortOrder,
        searchTerm,
        setSortField,
        setSearchTerm,
        toggleSortOrder,
    } = useSortAndFilter<CardType>(cards, cardFieldAccessor, {
        defaultSortField: 'number', // numberによるデフォルトソートを適用
        defaultSortOrder: 'asc'
    });
    
    // 💡 修正: propsで受け取ったリストをそのまま使用 (フック適用前の元のリスト)
    const cardsInPack = cards;

    // 新規カードを追加する処理
    const handleAddNewCard = () => {
        if (!isEditable) return;

        const newCard: CardType = createDefaultCard(packId);
        onOpenEditModal(newCard);
    };


    // 既存カードを選択した処理
    const handleSelectCard = (card: CardType) => {
        if (isEditable) {
            onOpenEditModal(card);
        } else {
            onOpenViewModal(card); 
        }
    };
    
    const hasFilteredResults = displayedCards.length > 0;
    const isSearchActive = searchTerm.trim() !== '';

    return (
        <Box sx={{ flexGrow: 1 }}>
            
            {/* 💡 ソート&フィルタリングUIの配置 */}
            <SortAndFilterControls
                labelPrefix="カード"
                sortOptions={CARD_SORT_OPTIONS}
                sortField={sortField}
                sortOrder={sortOrder}
                searchTerm={searchTerm}
                setSortField={setSortField}
                toggleSortOrder={toggleSortOrder}
                setSearchTerm={setSearchTerm}
            />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h5">収録カード ({cardsInPack.length}枚)</Typography>
                {isEditable && (
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={handleAddNewCard}
                    >
                        新規カードを追加
                    </Button>
                )}
            </Box>

            <Box
                sx={{
                    maxHeight: '70vh',
                    overflowY: 'auto',
                    p: 1,
                    border: '1px solid',
                    borderColor: 'grey.300',
                    borderRadius: 1
                }}
            >
                {/* 収録カードのグリッド表示 */}
                <Grid container spacing={2}>
                    
                    {/* 検索結果が0件の場合のメッセージ */}
                    {isSearchActive && !hasFilteredResults && (
                        <Grid size={{xs:12}}>
                            <Alert severity="info" sx={{ m: 1 }}>
                                "{searchTerm}" に一致するカードが見つかりませんでした。
                            </Alert>
                        </Grid>
                    )}
                    
                    {/* カードリストの描画 (ソート・フィルタ後のデータを使用) */}
                    {hasFilteredResults ? (
                        displayedCards.map(card => (
                            // MaterialUI Grid v7 の修正: sizeの代わりにxs, sm, md, lgを使用
                            <Grid size={{xs:6,sm:4,md:3,lg:2}} key={card.cardId}>
                                <Card
                                    sx={{
                                        width: CARD_GRID_WIDTH,
                                        cursor: 'pointer',
                                        boxShadow: 1,
                                    }}
                                    onClick={() => handleSelectCard(card)}
                                >
                                    <CardActionArea>
                                        <CardMedia
                                            component="img"
                                            image={getDisplayImageUrl(
                                                card.imageUrl,
                                                {
                                                    ...CARD_PLACEHOLDER_OPTIONS,
                                                    text: card.name
                                                }
                                            )}
                                            alt={card.name}
                                            sx={{ height: CARD_PLACEHOLDER_OPTIONS.height, objectFit: 'cover' }}
                                        />
                                        <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
                                            {/* No. の表示を追加 */}
                                            {card.number !== null && (
                                                <Typography variant="overline" color="text.primary" sx={{ display: 'block', lineHeight: 1.2 }}>
                                                    No. {card.number}
                                                </Typography>
                                            )}
                                            <Typography variant="subtitle2" noWrap>{card.name}</Typography>
                                            <Typography variant="caption" color="text.secondary">{card.rarity}</Typography>
                                        </CardContent>
                                    </CardActionArea>
                                </Card>
                            </Grid>
                        ))
                    ) : (
                        // カードが元々1枚もなく、検索もされていない場合のメッセージ
                        !isSearchActive && (
                            <Grid size={{xs:12}}>
                                <Box sx={{ p: 2, m: 1, border: '1px dashed grey', borderRadius: 1, width: '100%' }}>
                                    <Typography variant="body2" color="text.secondary">
                                        カードはまだ登録されていません。
                                    </Typography>
                                </Box>
                            </Grid>
                        )
                    )}
                </Grid>
            </Box>
        </Box>
    );
};

export default PackCardList;