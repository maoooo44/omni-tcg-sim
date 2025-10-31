/**
* src/components/common/HoverableItem.tsx
* 修正: CardMedia にスタイルを渡すための mediaSx プロパティを追加。
*/
import React from 'react';
import { Box, CardMedia, type Theme } from '@mui/material';
import { type SxProps } from '@mui/system'; // SxProps をインポート

// デフォルトの拡大率
export const DEFAULT_HOVER_SCALE = 1.15; // 15%拡大（控えめ）
export const CARD_HOVER_SCALE = 1.2;     // 20%拡大（カード用推奨）
export const PACK_HOVER_SCALE = 1.1;     // 10%拡大（パック用推奨）

interface HoverableItemProps {
    imageUrl: string;
    alt: string;
    aspectRatio?: string; // 例: '63 / 88'（カード）、'1 / 1'（正方形）
    onClick?: () => void;
    children?: React.ReactNode; // チップなどの追加要素
    hoverScale?: number; // ホバー時の拡大率（デフォルト: CARD_HOVER_SCALE）
    transitionDuration?: number; // アニメーション時間（秒）（デフォルト: 0.2）
    // 💡 追加: CardMedia に適用するための sx プロパティ
    mediaSx?: SxProps<Theme>; 
}

const HoverableItem: React.FC<HoverableItemProps> = ({
    imageUrl,
    alt,
    aspectRatio = '63 / 88',
    onClick,
    children,
    hoverScale = CARD_HOVER_SCALE,
    transitionDuration = 0.2,
    mediaSx, // 💡 Propsから受け取る
}) => {
    return (
        <Box
            sx={{
                position: 'relative',
                width: '100%',
                height: '100%',
                cursor: onClick ? 'pointer' : 'default',
                // カクつきを避けるため、transform の transition のみ維持
                transition: `transform ${transitionDuration}s ease-in-out`,
                '&:hover': {
                    transform: `scale(${hoverScale})`,
                    zIndex: 10,
                },
            }}
            onClick={onClick}
        >
            <CardMedia
                component="img"
                image={imageUrl}
                alt={alt}
                sx={[
                    {
                        width: '100%',
                        height: 'auto',
                        aspectRatio: aspectRatio,
                        objectFit: 'contain',
                        borderRadius: 1,
                        boxShadow: 2,
                    },
                    // 💡 修正点: mediaSx をマージする
                    ...(Array.isArray(mediaSx) ? mediaSx : [mediaSx]), 
                ]}
            />
            {children}
        </Box>
    );
};

export default HoverableItem;