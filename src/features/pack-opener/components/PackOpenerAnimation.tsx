/**
 * src/features/pack-opener/components/PackOpenerAnimation.tsx
 *
 * パック開封シミュレーションの結果を表示し、カードのフリップアニメーションを制御するコンポーネントです。
 * 開封結果のカードリストを受け取り、各カードにアニメーション遅延を適用して OpenerCard を描画します。
 * 【修正】カードクリック時の処理は親コンポーネント（PackOpenerHandler）に委譲します。
 */

import React from 'react';
import { Box, Typography, Grid } from '@mui/material';

// OpenerCard (CardFaceを使用する採用版) をインポート
import OpenerCard from './OpenerCard'; 
// import { useUIStore } from '../../../stores/uiStore'; // 💡 削除: 親コンポーネントに制御を委譲するため
import type { OpenerCardData } from '../../../models/pack-opener';

// Propsの型を再定義
interface PackOpenerAnimationProps {
    openedCards: OpenerCardData[]; // 封入されたカードのリスト
    isRevealed: boolean; // フリップ状態 (PackOpenerから受け取る)
    cardBackUrl: string; // 裏面画像URL (PackOpenerから受け取る)
    // 【新規追加】カードクリック時に親に通知するためのハンドラ
    onCardClick: (card: OpenerCardData) => void; 
}

const FLIP_DELAY_MS = 100; // カード1枚あたりのフリップ開始遅延

const PackOpenerAnimation: React.FC<PackOpenerAnimationProps> = ({
    openedCards,
    isRevealed,
    cardBackUrl,
    onCardClick // 【新規追加】propsとして受け取る
}) => {
    
    // const openCardViewModal = useUIStore(state => state.openCardViewModal); // 💡 削除: 親コンポーネントに制御を委譲するため
    
    // const handleCardClick = (card: OpenerCardData) => { // 💡 削除: 親コンポーネントのロジックに置き換え
    //     openCardViewModal(card.cardId);
    // }
    
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
                            // 💡 修正: propsとして受け取った onCardClick をそのまま渡す
                            onClick={onCardClick} 
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