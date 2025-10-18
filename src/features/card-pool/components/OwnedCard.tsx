/**
 * src/features/card-pool/components/OwnedCard.tsx
 *
 * カードコレクション表示内で、個々の所有カードを表すコンポーネントです。
 * 画像のURL生成、枚数チップ表示、カード詳細モーダルを開くためのクリックハンドラを管理します。
 */

import React, { useMemo } from 'react';
import { Box, Chip, Tooltip } from '@mui/material';
import { useUIStore } from '../../../stores/uiStore'; 
import { getDisplayImageUrl } from '../../../utils/imageUtils';
// OpenerCard を汎用的なカード表示コンポーネントとして使用
import OpenerCard from '../../../features/pack-opener/components/OpenerCard'; 
import type { OwnedCardDisplay } from '../hooks/useCardPoolDisplay'; 
import type { OpenerCardData } from '../../../models/pack-opener'; // ★ OpenerCardData をインポート

interface OwnedCardProps {
    card: OwnedCardDisplay;
    isDTCGEnabled: boolean;
}

const OwnedCard: React.FC<OwnedCardProps> = ({ card, isDTCGEnabled }) => {
    const openCardViewModal = useUIStore(state => state.openCardViewModal);

    // 表示用の画像URLを生成
    const displayImageUrl = getDisplayImageUrl(
        card.imageUrl, 
        {
            width: 150, 
            height: 210, 
            text: card.name,
            imageColor: 'black', 
        }
    );

    // ★ 修正: OpenerCardData型に適合させるため、idプロパティを追加
    const cardDataForDisplay: OpenerCardData = useMemo(() => ({
        // id: ユニークなキーとしてcardIdにプレフィックスを付けて流用
        id: `owned-card-display-${card.cardId}`, // ✅ OpenerCardDataに必須なidを追加
        cardId: card.cardId,
        name: card.name,
        imageUrl: displayImageUrl, 
        rarity: card.rarity,
    }), [card.cardId, card.name, card.rarity, displayImageUrl]); 
    
    const handleCardClick = () => {
        openCardViewModal(card.cardId);
    };

    return (
        <Tooltip title={card.name} placement="top" arrow>
            <Box 
                sx={{ 
                    position: 'relative', 
                    width: '100%', 
                    maxWidth: 200, 
                    cursor: 'pointer', 
                }}
                onClick={handleCardClick} 
            >
                {/* OpenerCardを静的なカード画像表示として使用 */}
                <OpenerCard 
                    cardData={cardDataForDisplay} // OpenerCardData型に適合
                    isRevealed={true} // 常に表面を表示
                    cardBackUrl={''} // 未使用
                    delay={0} // 未使用
                />
                {/* 枚数チップ */}
                {/* ... (Chipの部分は省略) ... */}
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
        </Tooltip>
    );
};

export default OwnedCard;