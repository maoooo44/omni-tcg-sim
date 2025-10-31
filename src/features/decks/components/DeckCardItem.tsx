/**
 * src/features/decks/components/DeckCardItem.tsx
 *
 * デッキリスト (DeckCardList) 内で表示する個別のカードアイテム（画像のみ）。
 * 修正: 「<デッキに入れる枚数> / <カードの所持枚数>」表示の Chip のスタイルを OwnedCard に合わせ、
 * 所持超過時のみ透過度を保ったまま赤色に変更。
 * 💡 修正: 共通コンポーネント ItemQuantityControl を使用して増減コントロールを表示する機能。
 */
import React from 'react';
import { Box, Paper, Tooltip, Chip } from '@mui/material';
// 💡 修正: 共通の枚数コントロールを ItemQuantityControl に変更
import ItemQuantityControl from '../../../components/controls/ItemQuantityControl'; 

import type { Card } from '../../../models/card';
import { DeckEditorCardGridSettings } from '../../../configs/gridDefaults';
import type { DeckListItem } from './DeckCardList';

// CardItemCustomProps は DeckCardList.tsx で定義したものと同じ型を受け取る
interface DeckItemCustomProps {
    onCardClick: (card: Card) => void;
    // 💡 修正: isDeckBuildingMode から isEditMode に変更
    isEditMode?: boolean; 
    onCardAdd?: (cardId: string) => void;
    onCardRemove?: (cardId: string) => void;
}

// ReusableItemGrid から渡される Props の型定義
interface DeckCardItemProps extends DeckItemCustomProps {
    item: DeckListItem;
}

const DeckCardItem: React.FC<DeckCardItemProps> = ({
    item: card,
    onCardClick,
    // 💡 修正: Props を isEditMode として受け取る
    isEditMode,
    onCardAdd,
    onCardRemove,
}) => {
    const { cardId, deckCount, ownedCount, isOverOwned } = card;

    const cardImageUrl = card.imageUrl || 'path/to/default/card/image.png';

    // 💡 チップの表示ロジックは変更なし
    const chipLabel = `${deckCount} / ${ownedCount}`;
    const tooltipTitle = isOverOwned
        ? `所持枚数を超過しています (${deckCount} / ${ownedCount})`
        : `デッキ枚数 / 所持枚数 (${deckCount} / ${ownedCount})`;
    const chipBgColor = isOverOwned
        ? 'rgba(255, 0, 0, 0.7)'
        : 'rgba(0,0,0,0.7)';


    // 💡 修正: 編集モード時は onCardClick を実行しないようにする
    const handleItemClick = (_e: React.MouseEvent) => {
        // 編集モードでない場合にのみ実行
        if (!isEditMode) { // 👈 修正箇所 1: isEditMode を参照
            onCardClick(card);
        }
    };

    return (
        <Box
            sx={{ 
                position: 'relative', 
                p: 0.5, 
                // 💡 修正: 編集モード時はクリックの目的が変わるため 'default'
                cursor: isEditMode ? 'default' : 'pointer', 
                textAlign: 'center' 
            }}
            onClick={handleItemClick} // 💡 修正されたハンドラ
        >
            {/* 1. カード画像 */}
            <Tooltip title={tooltipTitle} placement="top">
                <Paper
                    elevation={isOverOwned ? 5 : 2}
                    sx={{
                        borderRadius: 1,
                        overflow: 'hidden',
                        position: 'relative',
                        width: '100%',
                        paddingTop: `${100 / DeckEditorCardGridSettings.aspectRatio}%`,
                        filter: 'none',
                    }}
                >
                    <img
                        src={cardImageUrl}
                        alt={card.name}
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            display: 'block',
                        }}
                    />

                    {/* 2. 所持枚数/デッキ枚数表示 Chip */}
                    <Chip
                        label={chipLabel}
                        size="small"
                        sx={{
                            position: 'absolute',
                            bottom: 4,
                            right: 4,
                            bgcolor: chipBgColor,
                            color: 'white',
                            fontWeight: 'bold',
                            zIndex: 1,
                        }}
                    />
                </Paper>
            </Tooltip>

            {/* 💡 修正: 編集モード時のコントロール - ItemQuantityControlを使用 */}
            {isEditMode && onCardAdd && onCardRemove && ( // 👈 修正箇所 2: isEditMode を参照
                <Box
                    sx={{
                        position: 'absolute',
                        top: 4,
                        right: 4,
                        zIndex: 2, // Chipより前面に
                    }}
                >
                    <ItemQuantityControl
                        itemId={cardId} // 💡 cardId を itemId として渡す
                        currentCount={deckCount}
                        minCount={1}
                        // 💡 デッキ編集時の最大枚数制限（例: 3枚）をここで設定可能 
                        onAdd={onCardAdd}
                        onRemove={onCardRemove}
                        size="small"
                    />
                </Box>
            )}
        </Box>
    );
};

export default DeckCardItem;