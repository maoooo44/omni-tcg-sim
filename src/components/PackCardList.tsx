// src/components/PackCardList.tsx

import React from 'react';
import { Button, Grid, Box, Typography, Card, CardContent, CardActionArea, CardMedia } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
// 💡 削除: グローバルストアへの依存を解消
// import { useShallow } from 'zustand/react/shallow';
// import { useCardStore } from '../stores/cardStore';
import { generateUUID } from '../utils/uuidUtils';
import type { Card as CardType } from '../models/card';

// 💡 削除: onOpenViewModalを親から受け取るため、ここでは不要
// import { useUIStore } from '../stores/uiStore'; 

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


/**
 * PackCardListProps の型定義を修正し、カードリストを受け取るようにします。
 */
export interface PackCardListProps {
    packId: string;
    isEditable: boolean;
    // ★ 修正: 親コンポーネント（usePackEdit）からローカルのカードリストを受け取る
    cards: CardType[]; 
    // 編集モーダルを開くためのハンドラ（PackEditPage側が実装）
    onOpenEditModal: (card: CardType | null) => void;
    // 💡 復活: 閲覧モーダルを開くためのハンドラをプロパティとして定義
    onOpenViewModal: (card: CardType) => void; 
}


const PackCardList: React.FC<PackCardListProps> = ({ 
    packId, 
    isEditable, 
    // ★ 修正: propsからカードリストを取得
    cards,
    onOpenEditModal,
    // 💡 追加: onOpenViewModal をプロパティとして受け取る
    onOpenViewModal,
}) => {
    // 💡 削除: グローバルUIストアの参照は不要になりました

    // ★ 修正: propsで受け取ったリストをそのまま使用
    // const cardsInPack = useCardStore(useShallow(state => state.cards.filter(card => card.packId === packId)));
    const cardsInPack = cards;

    // 新規カードを追加する処理
    const handleAddNewCard = () => {
        if (!isEditable) return;

        const newCard: CardType = {
            cardId: generateUUID(),
            packId: packId,
            name: '新しいカード',
            imageUrl: '',
            rarity: '',
            userCustom: {},
            // 💡 エラー修正: プレースホルダーとして 0 を設定 (サービス層で正しい値に上書きされる)
            registrationSequence: 0,
        };

        onOpenEditModal(newCard);
    };

    // 既存カードを選択した処理
    const handleSelectCard = (card: CardType) => {
        if (isEditable) {
            // 編集モード時: 編集モーダルを開く (親コンポーネント経由)
            onOpenEditModal(card);
        } else {
            // 💡 修正: 非編集モード時: 親コンポーネントから渡された onOpenViewModal を使用
            onOpenViewModal(card); 
        }
    };

    return (
        <Box sx={{ flexGrow: 1 }}>
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
                    {cardsInPack.map(card => (
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
                                        <Typography variant="subtitle2" noWrap>{card.name}</Typography>
                                        <Typography variant="caption" color="text.secondary">{card.rarity}</Typography>
                                    </CardContent>
                                </CardActionArea>
                            </Card>
                        </Grid>
                    ))}

                    {/* ... (カードなしの場合の表示省略) */}
                    {cardsInPack.length === 0 && (
                        // MaterialUI Grid v7 の修正
                        <Grid size={{xs:12}}>
                            <Box sx={{ p: 2, m: 1, border: '1px dashed grey', borderRadius: 1, width: '100%' }}>
                                <Typography variant="body2" color="text.secondary">
                                    カードはまだ登録されていません。
                                </Typography>
                            </Box>
                        </Grid>
                    )}

                </Grid>
            </Box>
        </Box>
    );
};

export default PackCardList;