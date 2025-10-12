// src/components/FlippableCard.tsx

import React, { useState, useEffect } from 'react'; 
import { Box, Paper, Typography } from '@mui/material'; 
import BrokenImage from '@mui/icons-material/BrokenImage'; 

import type { CardData } from '../features/pack-opening/PackOpeningHandler'; 

// 🚨 修正1: PropsにonCardClickを追加
interface FlippableCardProps { 
    card: CardData; 
    cardBackUrl: string; // パックから継承された裏面画像URL 
    isRevealed: boolean; // trueで表面（front）を表示する 
    delay: number; // アニメーションの遅延時間 (ms) 
    onCardClick: (cardId: string) => void; // 💡 追加: クリックハンドラ
} 

const CARD_WIDTH = 120; 
const CARD_HEIGHT = 168; 

const FlippableCard: React.FC<FlippableCardProps> = ({ 
    card, 
    cardBackUrl, 
    isRevealed, 
    delay,
    onCardClick
}) => { 
    const [isFrontImageError, setIsFrontImageError] = useState(false); 
    
    // 💡 修正1: 強制的にトランジションを無効化する状態を追加
    const [disableTransition, setDisableTransition] = useState(false);

    useEffect(() => { 
        setIsFrontImageError(false); 
    }, [card.imageUrl]); 
    
    // 💡 修正2: リセット時のアニメーション無効化を制御
    useEffect(() => {
        // isRevealed が false になったとき（リセット開始）
        if (!isRevealed) {
            // 1. まずトランジションを無効化する状態を設定（次の描画で 'transition: none' が適用される）
            setDisableTransition(true);
            
            // 2. requestAnimationFrame でブラウザの次の描画フレームを待つ
            const animationFrame = requestAnimationFrame(() => {
                // 3. 次の描画フレームで transition を有効に戻し、次のアニメーションに備える
                setDisableTransition(false); 
            });
            
            return () => cancelAnimationFrame(animationFrame);
        } else {
            // isRevealed が true になるときは、必ずアニメーションを有効にする状態に
            setDisableTransition(false);
        }
    }, [isRevealed]);

    // 💡 修正3: 動的な transition スタイルを定義
    const transitionDuration = '0.5s';
    const finalTransition = disableTransition 
        ? 'none' 
        : `transform ${transitionDuration}`;
    
    // 🚨 修正4: クリック処理を追加
    const handleClick = () => {
        // カードが表（isRevealed=true）の時のみクリックを処理
        if (isRevealed) {
            onCardClick(card.cardId);
        }
    };
    
    return ( 
        <Box 
            sx={{ 
                width: CARD_WIDTH, 
                height: CARD_HEIGHT, 
                margin: '8px', 
                perspective: '1000px', 
                // 🚨 修正5: isRevealed の時のみカーソルを pointer に変更
                cursor: isRevealed ? 'pointer' : 'default', 
                transformStyle: 'preserve-3d', 
                
                // 💡 適用: ローカル状態に基づいて transition を制御
                transition: finalTransition, 
                // isRevealed=true の時だけ遅延を適用
                transitionDelay: isRevealed ? `${delay}ms` : '0ms', 
                
                transform: isRevealed ? 'rotateY(180deg)' : 'rotateY(0deg)',
            }}
            onClick={handleClick} // 💡 修正6: クリックハンドラを適用
        > 
            <img 
                src={card.imageUrl} 
                alt={card.name} 
                style={{ position: 'absolute', opacity: 0, width: 1, height: 1, zIndex: -1 }} 
                onError={() => { 
                    setIsFrontImageError(true); 
                }} 
                key={card.imageUrl} 
            /> 

            {/* 表面 (Front Face) */} 
            <Paper 
                elevation={4} 
                sx={{ 
                    position: 'absolute', 
                    width: '100%', 
                    height: '100%', 
                    backfaceVisibility: 'hidden', 
                    backgroundImage: isFrontImageError 
                        ? 'none' 
                        : `url(${card.imageUrl})`, 
                    backgroundSize: 'cover', 
                    backgroundPosition: 'center', 
                    transform: 'rotateY(180deg)', 
                    borderRadius: '8px', 
                    backgroundColor: isFrontImageError ? '#333333' : 'transparent', 
                }} 
            > 
                {isFrontImageError && ( 
                    <Box 
                        sx={{ 
                            width: '100%', 
                            height: '100%', 
                            display: 'flex', 
                            flexDirection: 'column', 
                            justifyContent: 'center', 
                            alignItems: 'center', 
                        }} 
                    > 
                        <BrokenImage sx={{ fontSize: 40, color: '#f44336' }} /> 
                        <Typography variant="caption" sx={{ color: 'white', mt: 1 }}> 
                            画像エラー 
                        </Typography> 
                    </Box> 
                )} 
            </Paper> 

            {/* 裏面 (Back Face) */} 
            <Paper 
                elevation={4} 
                sx={{ 
                    position: 'absolute', 
                    width: '100%', 
                    height: '100%', 
                    backfaceVisibility: 'hidden', 
                    backgroundImage: `url(${cardBackUrl})`, 
                    backgroundSize: 'cover', 
                    backgroundPosition: 'center', 
                    borderRadius: '8px', 
                }} 
            > 
                <Box sx={{ p: 1 }}> 
                </Box> 
            </Paper> 
        </Box> 
    ); 
}; 

export default FlippableCard;