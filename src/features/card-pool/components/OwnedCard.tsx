/**
 * src/features/card-pool/components/OwnedCard.tsx
 *
 * カードコレクション表示内で、個々の所有カードを表すコンポーネントです。
 * 画像のURL生成、枚数チップ表示、カード詳細モーダルを開くためのクリックハンドラを管理します。
 * * 💡 修正点: ReusableItemGrid の ItemComponentProps に適合するため、Props を item と aspectRatio を受け取るように変更。
 */

import React from 'react';
import { Chip } from '@mui/material';
import { useUIStore } from '../../../stores/uiStore'; 
import { getDisplayImageUrl } from '../../../utils/imageUtils';
import HoverableItem, { CARD_HOVER_SCALE } from '../../../components/common/HoverableItem';
import type { OwnedCardDisplay } from '../hooks/useCardPoolDisplay';

// 💡 修正: Props定義を ReusableItemGrid の期待する型に合わせる
interface OwnedCardProps {
    item: OwnedCardDisplay;
    index?: number; // ReusableItemGridから渡されるが使用しない
    aspectRatio: number;
}

const OwnedCard: React.FC<OwnedCardProps> = ({ 
    item: card,
    index: _index,
    aspectRatio,
}) => {
    const openCardViewModal = useUIStore(state => state.openCardViewModal);

    // プレースホルダー画像生成用のサイズは仮の値を使用
    const placeholderWidth = 200;
    const placeholderHeight = Math.round(placeholderWidth * aspectRatio);

    // 表示用の画像URLを生成
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
        openCardViewModal(card.cardId);
    };

    return (
        <HoverableItem
            imageUrl={displayImageUrl}
            alt={card.name}
            aspectRatio="63 / 88"
            onClick={handleCardClick}
            hoverScale={CARD_HOVER_SCALE}
        >
            {/* 枚数チップ */}
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
        </HoverableItem>
    );
};

export default OwnedCard;