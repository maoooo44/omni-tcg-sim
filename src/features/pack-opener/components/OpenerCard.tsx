/**
 * src/features/pack-opener/components/OpenerCard.tsx (ImagePreview ラッパー版)
 *
 * * 責務:
 * 1. 3D CSSプロパティを使用し、カードのフリップアニメーションを実装する (ラッパー)。
 * 2. 画像表示は ImagePreview に委譲する。
 */

import React from 'react';
import { Box, Paper } from '@mui/material';
import type { OpenerCardData } from '../../../models/models';
import ImagePreview from '../../../components/common/ImagePreview'; 

interface OpenerCardProps {
    cardData: OpenerCardData | null;
    cardBackImageUrl: string;       // パックの裏面画像
    isRevealed: boolean;       // カードが表になっているか (フリップ状態)
    delay: number;             // アニメーション遅延時間 (シーケンシャル開封用)
    onClick?: (card: OpenerCardData) => void;
    useFixedSize?: boolean;
}

import {
    DEFAULT_PACK_DECK_WIDTH as PACK_CARD_WIDTH,
    DEFAULT_PACK_DECK_HEIGHT as PACK_CARD_HEIGHT,
    getDisplayImageUrl // プレースホルダー生成のために残す
} from '../../../utils/imageUtils';


const OpenerCard: React.FC<OpenerCardProps> = ({
    cardData,
    cardBackImageUrl,
    isRevealed,
    delay,
    onClick,
    useFixedSize = true,
}) => {
    
    // --- 1. 画像URLの計算 ---
    
    // 裏面画像 (ImagePreviewがURLを直接受け取るため、ここで計算を維持)
    const backImageUrl = getDisplayImageUrl(cardBackImageUrl, {
        width: PACK_CARD_WIDTH,
        height: PACK_CARD_HEIGHT,
        text: 'BACK',
    });
    
    // --- 2. アニメーションスタイル ---
    const flipStyle = {
        transition: `transform 0.5s ease-out ${delay}ms`,
        transform: isRevealed ? 'rotateY(180deg)' : 'rotateY(0deg)',
    };

    // --- 3. クリックハンドラ ---
    const handleClick = () => {
        // カードが表になっており、データが存在する場合のみクリックを処理
        if (isRevealed && cardData && onClick) {
            onClick(cardData);
        }
    };
    
    // ImagePreviewに適用する共通の画像スタイル（フリップ用）
    const flipImageSx = {
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        borderRadius: 0, // PaperがborderRadiusを持つため、ImagePreview内部のborderRadiusは解除
        border: 'none', // ImagePreview内部のborderも解除
    };


    return (
        <Box
            sx={{
                perspective: '1000px', // 3D効果の基点
                width: useFixedSize ? PACK_CARD_WIDTH : '100%',
                height: useFixedSize ? PACK_CARD_HEIGHT : 'auto',
                aspectRatio: useFixedSize ? undefined : '63 / 88', 

                cursor: isRevealed && cardData ? 'pointer' : 'default',
            }}
            onClick={handleClick}
        >
            <Paper
                elevation={3}
                sx={{
                    width: '100%',
                    height: '100%',
                    position: 'relative',
                    transformStyle: 'preserve-3d', // 3D維持
                    ...flipStyle, // flipStyle を適用してアニメーション
                    borderRadius: 2,
                }}
            >
                {/* 💡 カード表面: ImagePreviewをラップして3D CSSを適用 */}
                <Box
                    sx={{
                        position: 'absolute',
                        width: '100%',
                        height: '100%',
                        backfaceVisibility: 'hidden', 
                        transform: 'rotateY(180deg)', // 表面は初期180度回転 (裏向き)
                        overflow: 'hidden',
                    }}
                >
                    <ImagePreview 
                        item={cardData} // Itemデータを渡す
                        disableCarousel={true} 
                        width={useFixedSize ? PACK_CARD_WIDTH : undefined} 
                        height={useFixedSize ? PACK_CARD_HEIGHT : undefined}
                        imageSx={flipImageSx}
                    />
                </Box>
                
                {/* 💡 カード裏面: ImagePreviewをラップして3D CSSを適用 */}
                <Box
                    sx={{
                        position: 'absolute',
                        width: '100%',
                        height: '100%',
                        backfaceVisibility: 'hidden', 
                        transform: 'rotateY(0deg)', // 裏面は初期0度 (表向き)
                        overflow: 'hidden',
                    }}
                >
                    <ImagePreview 
                        item={null} // Itemデータは不要
                        imageUrl={backImageUrl} // URLを直接指定
                        disableCarousel={true}
                        width={useFixedSize ? PACK_CARD_WIDTH : undefined}
                        height={useFixedSize ? PACK_CARD_HEIGHT : undefined}
                        imageSx={flipImageSx}
                    />
                </Box>
            </Paper>
        </Box>
    );
};

export default OpenerCard;