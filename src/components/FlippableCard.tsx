// src/components/FlippableCard.tsx

import React, { useState, /*useEffect*/ } from 'react'; 
import { Box, Paper, /*Typography*/ } from '@mui/material'; 
// import BrokenImage from '@mui/icons-material/BrokenImage'; // 🚨 削除: BrokenImageはもう使わない

import type { CardData } from '../features/pack-opening/PackOpeningHandler'; 

interface FlippableCardProps { 
    card: CardData; 
    cardBackUrl: string; // パックから継承された裏面画像URL 
    isRevealed: boolean; // trueで表面（front）を表示する 
    delay: number; // アニメーションの遅延時間 (ms) 
    onCardClick: (cardId: string) => void; // クリックハンドラ
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
    // 🚨 削除: isFrontImageError 状態は不要になる
    // const [isFrontImageError, setIsFrontImageError] = useState(false); 
    
    // 強制的にトランジションを無効化する状態は維持 (アニメーションの制御のため)
    const [disableTransition, /*setDisableTransition*/] = useState(false);

    // 🚨 削除: isFrontImageError のリセットは不要になる
    // useEffect(() => { 
    //     setIsFrontImageError(false); 
    // }, [card.imageUrl]); 
    
    // ... (disableTransition に関する useEffect はそのまま) ...

    const transitionDuration = '0.5s';
    const finalTransition = disableTransition 
        ? 'none' 
        : `transform ${transitionDuration}`;
    
    const handleClick = () => {
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
                cursor: isRevealed ? 'pointer' : 'default', 
                transformStyle: 'preserve-3d', 
                
                transition: finalTransition, 
                transitionDelay: isRevealed ? `${delay}ms` : '0ms', 
                
                transform: isRevealed ? 'rotateY(180deg)' : 'rotateY(0deg)',
            }}
            onClick={handleClick}
        > 
            {/* 🚨 修正1: <img> タグのスタイルを変更し、直接表示する */}
            {/* isRevealed が true の時だけ表面画像を表示 */}
            <img 
                src={card.imageUrl} 
                alt={card.name} // 👈 ここで alt テキストが使われる
                style={{ 
                    position: 'absolute', 
                    width: '100%', 
                    height: '100%', 
                    objectFit: 'cover', // 画像のアスペクト比を維持しつつボックスを埋める
                    backfaceVisibility: 'hidden', // 裏面を表示しない
                    borderRadius: '8px',
                    transform: 'rotateY(180deg)', // 表面として表示
                    zIndex: 1, // 裏面より手前に表示
                    display: isRevealed ? 'block' : 'none', // 🚨 修正2: isRevealed が true の時のみ表示
                }} 
                // 🚨 削除: onError イベントハンドラは不要になる
                // onError={() => { setIsFrontImageError(true); }} 
                key={card.imageUrl} 
            /> 

            {/* 🚨 削除: 表面 (Front Face) の Paper コンポーネントは不要になる */}
            {/* <Paper ... > ... </Paper> */}

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
                    // transform: 'rotateY(0deg)', // 裏面は回転しない
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