/**
 * src/features/card-pool/components/OwnedCard.tsx
 * 修正: HoverableItem の mediaSx を使用し、未所持カードをモノクロ化。
 */

import React from 'react';
import { Chip } from '@mui/material';
import { getDisplayImageUrl } from '../../../utils/imageUtils';
import HoverableItem, { CARD_HOVER_SCALE } from '../../../components/common/HoverableItem';
import type { OwnedCardDisplay } from '../hooks/useCardPoolDisplay';

interface OwnedCardProps {
    item: OwnedCardDisplay;
    index?: number;
    aspectRatio: number;
    // 親コンポーネントからモーダルオープン関数を受け取る
    onOpenCardViewModal: (cardId: string) => void;
}

const OwnedCard: React.FC<OwnedCardProps> = ({
    item: card,
    index: _index,
    aspectRatio,
    onOpenCardViewModal,
}) => {
    const isOwned = card.count > 0;

    // ... (画像URL生成ロジックは省略) ...
    const placeholderWidth = 200;
    const placeholderHeight = Math.round(placeholderWidth * aspectRatio);
    const displayImageUrl = getDisplayImageUrl(
        card.imageUrl,
        {
            width: placeholderWidth,
            height: placeholderHeight,
            text: card.name,
            imageColor: 'black',
        }
    );

    const handleCardClick = () => {
        // Propsで受け取った関数を呼び出し、カードIDを渡す
        onOpenCardViewModal(card.cardId);
    };

    return (
        <HoverableItem
            imageUrl={displayImageUrl}
            alt={card.name}
            aspectRatio="63 / 88"
            onClick={handleCardClick}
            hoverScale={CARD_HOVER_SCALE}
            // 💡 修正点: CardMedia に適用するスタイルを mediaSx として渡す
            mediaSx={{
                filter: isOwned ? 'none' : 'grayscale(100%)',
            }}
        >
            {/* 💡 修正点: 所持枚数が1以上の場合にのみ Chip を表示 */}
            {isOwned && (
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
            {/* 💡 未所持 (isOwned=false) の場合、Chip は表示されない */}
        </HoverableItem>
    );
};

export default OwnedCard;