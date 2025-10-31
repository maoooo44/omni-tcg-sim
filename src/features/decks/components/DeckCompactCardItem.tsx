/**
 * src/features/decks/components/DeckCompactCardItem.tsx (修正)
 *
 * デッキ構築モードの上部コンパクトリスト (DeckCompactList) 内で表示するカードアイテム。
 * 💡 修正: カード画像が Grid Item の全領域を占め、情報/コントロールを画像上に重ねて表示する。
 */
import React, { useCallback } from 'react';
import { Box, Chip, Tooltip } from '@mui/material';
import ItemQuantityControl from '../../../components/controls/ItemQuantityControl'; 

import type { Card } from '../../../models/card';
import type { DeckListItem } from './DeckCardList';

// CardItemCustomProps は DeckCompactList.tsx で定義したものと同じ型を受け取る
interface CompactItemCustomProps {
    onCardClick: (card: Card) => void;
    isEditMode?: boolean; 
    onCardAdd?: (cardId: string) => void;
    onCardRemove?: (cardId: string) => void;
}

// ReusableItemGrid から渡される Props の型定義
interface DeckCompactCardItemProps extends CompactItemCustomProps {
    item: DeckListItem;
    aspectRatio: number; // ReusableItemGrid から渡されるアスペクト比
}

const DeckCompactCardItem: React.FC<DeckCompactCardItemProps> = ({
    item: card,
    onCardClick,
    isEditMode,
    onCardAdd,
    onCardRemove,
    // aspectRatio はここでは幅計算に使用しないが、Propsとして維持
}) => {
    const { cardId, deckCount, ownedCount, isOverOwned } = card;

    const cardImageUrl = card.imageUrl || 'path/to/default/card/image.png';

    // チップの表示ロジックは DeckCardItem と同様
    const chipLabel = `${deckCount} / ${ownedCount}`;
    const chipBgColor = isOverOwned
        ? 'rgba(255, 0, 0, 0.7)'
        : 'rgba(0,0,0,0.7)';
    const chipTextColor = isOverOwned ? 'white' : 'white';

    // 編集モード時の最大枚数制限
    const maxCount = 99; // 例として99枚

    // ItemQuantityControl の onAdd ハンドラ 
    const handleItemAdd = useCallback(() => {
        if (onCardAdd) {
            onCardAdd(cardId);
        }
    }, [onCardAdd, cardId]);

    // ItemQuantityControl の onRemove ハンドラ 
    const handleItemRemove = useCallback(() => {
        if (onCardRemove) {
            onCardRemove(cardId);
        }
    }, [onCardRemove, cardId]);
    
    // 閲覧用クリックハンドラ
    const handleItemClick = (_e: React.MouseEvent) => {
        if (!isEditMode) {
            onCardClick(card);
        }
    };


    return (
        <Box
            sx={{ 
                height: '100%', 
                // 💡 [修正] Flexboxを解除し、画像単体でItemの領域を占有させる
                display: 'block', 
                p: 0, // Padding も削除 (ItemGridで gap が既に適用されるため)
                // 💡 [修正] 横長リストのカードとして、枠線と角丸を適用
                border: isOverOwned ? '2px solid red' : '1px solid #eee',
                borderRadius: 1,
                overflow: 'hidden', // 画像、チップ、コントロールをこの枠内に収める
                position: 'relative', // 子要素の絶対配置の基準
                cursor: 'default', 
                boxSizing: 'border-box',
            }}
        >
            {/* 1. カード画像 (Itemの全領域を占める) */}
            <Box
                sx={{
                    height: '100%',
                    width: '100%', // Itemの全幅を使う
                    flexShrink: 0,
                    overflow: 'hidden',
                    position: 'relative',
                    
                }}
            >
                 <img
                    src={cardImageUrl}
                    alt={card.name}
                    style={{
                        // 💡 [修正] height: '100%' に加え、幅も '100%' にし、objectFit: 'cover' で画像の歪みを最小化
                        width: '100%', 
                        height: '100%',
                        objectFit: 'cover',
                        display: 'block',
                    }}
                    onClick={handleItemClick} // 閲覧用クリックは画像に設定
                 />
            </Box>

            {/* 2. 枚数コントロール (編集モード時のみ、画像上に重ねて表示) */}
            {isEditMode && onCardAdd && onCardRemove && (
                <Box
                    sx={{
                        position: 'absolute',
                        // 💡 [配置] 右上隅に配置
                        top: 4,
                        right: 4,
                        zIndex: 2, 
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-end',
                        gap: 1,
                    }}
                >
                    <ItemQuantityControl
                        itemId={cardId} 
                        currentCount={deckCount}
                        minCount={0}
                        maxCount={maxCount}
                        onAdd={handleItemAdd}
                        onRemove={handleItemRemove}
                        size="small"
                    />

                    <Tooltip title={`デッキ枚数 / 所持枚数 (${deckCount} / ${ownedCount})`} placement="left">
                        <Chip
                            label={chipLabel}
                            size="small"
                            sx={{
                                bgcolor: chipBgColor,
                                color: chipTextColor,
                                fontWeight: 'bold',
                                fontSize: '0.6rem',
                                height: 18,
                                flexShrink: 0,
                                // コントロールの下の余白を少し空ける
                                mt: 0.5, 
                            }}
                        />
                    </Tooltip>
                </Box>
            )}
            
             {/* 💡 [削除] カード名とコントロールを横に並べるための Box (セクション 2) は完全に削除 */}
        </Box>
    );
};

export default DeckCompactCardItem;