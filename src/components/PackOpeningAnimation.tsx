// src/components/PackOpeningAnimation.tsx

import React from 'react';
import { Box, Typography, Grid } from '@mui/material';
import FlippableCard from './FlippableCard';
import type { CardData } from '../features/pack-opening/PackOpeningHandler';

// 🚨 修正1: useUIStoreをインポート
import { useUIStore } from '../stores/uiStore';


// Propsの型を再定義
interface PackOpeningAnimationProps {
    openedCards: CardData[]; // 封入されたカードのリスト
    isRevealed: boolean; // フリップ状態 (PackOpenerから受け取る)
    cardBackUrl: string; // 裏面画像URL (PackOpenerから受け取る)
}

const FLIP_DELAY_MS = 100; // カード1枚あたりのフリップ開始遅延

const PackOpeningAnimation: React.FC<PackOpeningAnimationProps> = ({
    openedCards,
    isRevealed,
    cardBackUrl
}) => {
    
    // 🚨 修正2: openCardViewModalアクションを取得
    const openCardViewModal = useUIStore(state => state.openCardViewModal);
    
    // 🚨 修正3: カードクリックハンドラを定義
    const handleCardClick = (cardId: string) => {
        openCardViewModal(cardId);
    }
    
    return (
        <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            
            {/* 2. カード表示グリッド */}
            <Grid
                container
                spacing={1}
                justifyContent="center"
                sx={{
                    maxWidth: 1200,
                }}
            >
                {openedCards.map((card, index) => (
                    <Grid size={2.4} key={index}>
                        <FlippableCard
                            card={card}
                            isRevealed={isRevealed}
                            cardBackUrl={cardBackUrl}
                            delay={index * FLIP_DELAY_MS}
                            onCardClick={handleCardClick} // 💡 修正4: ハンドラを渡す
                        />
                    </Grid>
                ))}
            </Grid>
            
            {/* 3. 結果のサマリー (開封後に表示) */}
            {isRevealed && (
                <Box sx={{ mt: 4, textAlign: 'center' }}>
                    <Typography variant="h6" color="success.main">
                        開封結果が表示されました！
                    </Typography>
                </Box>
            )}
        </Box>
    );
};

export default PackOpeningAnimation;