/**
 * src/features/pack-opener/components/PackOpenerAnimation.tsx
 *
 * パック開封シミュレーションの結果を表示し、カードのフリップアニメーションを制御するコンポーネントです。
 * 開封結果のカードリストを受け取り、各カードにアニメーション遅延を適用して OpenerCard を描画します。
 * カードクリック時に useUIStore を介してカード詳細ビューモーダルを開きます。
 */

import React from 'react';
import { Box, Typography, Grid } from '@mui/material';

// OpenerCard (CardFaceを使用する採用版) をインポート
import OpenerCard from './OpenerCard'; 
import { useUIStore } from '../../../stores/uiStore';
import type { OpenerCardData } from '../../../models/pack-opener';

// Propsの型を再定義
interface PackOpenerAnimationProps {
    openedCards: OpenerCardData[]; // 封入されたカードのリスト
    isRevealed: boolean; // フリップ状態 (PackOpenerから受け取る)
    cardBackUrl: string; // 裏面画像URL (PackOpenerから受け取る)
}

const FLIP_DELAY_MS = 100; // カード1枚あたりのフリップ開始遅延

const PackOpenerAnimation: React.FC<PackOpenerAnimationProps> = ({
    openedCards,
    isRevealed,
    cardBackUrl
}) => {
    
    // openCardViewModalアクションを取得
    const openCardViewModal = useUIStore(state => state.openCardViewModal);
    
    // カードクリックハンドラを定義
    // OpenerCardのonClick propはOpenerCardData (CardType) 全体を渡すため、それに合わせる
    const handleCardClick = (card: OpenerCardData) => {
        // OpenerCardDataからcardIdを取り出してモーダルを開く
        openCardViewModal(card.cardId);
    }
    
    return (
        <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            
            {/* 2. カード表示グリッド */}
            <Grid
                container
                spacing={1}
                justifyContent="center"
                sx={{
                    maxWidth: 1800,
                }}
            >
                {openedCards.map((card, index) => (
                    // Gridのサイズ指定はユーザー定義の構文（item廃止、size使用）を保持
                    <Grid size={2.4} key={index}>
                        <OpenerCard
                            cardData={card} // OpenerCardのProps名に合わせる
                            isRevealed={isRevealed}
                            cardBackUrl={cardBackUrl}
                            delay={index * FLIP_DELAY_MS}
                            onClick={handleCardClick} // OpenerCardのProps名に合わせる
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

export default PackOpenerAnimation;