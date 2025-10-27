// src/features/card-pool/components/OwnedCard.tsx

import React from 'react';
import { Chip } from '@mui/material';
// ❌ useUIStore, useNavigate のインポートを削除
// import { useUIStore } from '../../../stores/uiStore'; 
import { getDisplayImageUrl } from '../../../utils/imageUtils';
import HoverableItem, { CARD_HOVER_SCALE } from '../../../components/common/HoverableItem';
import type { OwnedCardDisplay } from '../hooks/useCardPoolDisplay';

// 💡 Props定義にモーダルを開くためのハンドラを追加
interface OwnedCardProps {
    item: OwnedCardDisplay;
    index?: number; 
    aspectRatio: number;
    // ★ 修正: 親コンポーネントからモーダルオープン関数を受け取る
    onOpenCardViewModal: (cardId: string) => void; 
}

const OwnedCard: React.FC<OwnedCardProps> = ({ 
    item: card,
    index: _index,
    aspectRatio,
    onOpenCardViewModal, // ★ 受け取る
}) => {
    // ❌ useUIStore の呼び出しを削除
    // const openCardViewModal = useUIStore(state => state.openCardViewModal);

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
        // ★ Propsで受け取った関数を呼び出し、カードIDを渡す
        onOpenCardViewModal(card.cardId);
    };

    return (
        <HoverableItem
            imageUrl={displayImageUrl}
            alt={card.name}
            aspectRatio="63 / 88"
            onClick={handleCardClick}
            hoverScale={CARD_HOVER_SCALE}
        >
            {/* ... (枚数チップのレンダリングは省略) ... */}
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