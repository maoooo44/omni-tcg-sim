/**
 * src/features/packs/components/PackPreviewCard.tsx
 *
 * パック編集画面などのPack管理機能で使用される、Packのカバー画像/カード裏面画像を表示するコンポーネント。
 * * 責務:
 * 1. Packオブジェクトを受け取り、設定された画像URL（pack.imageUrl と pack.cardBackImageUrl）をレンダリングする。
 * 2. ユーザーのスワイプ/クリック操作で、パック画像とカード裏面画像を切り替える**カルーセル機能**を提供する。
 * 3. 画像URLが存在しない場合、getDisplayImageUrlユーティリティを用いてプレースホルダー画像を生成・表示する。
 */
import React, { useState } from 'react';
import { Box, IconButton } from '@mui/material';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import type { Pack } from '../../../models/pack';
import {
    getDisplayImageUrl,
    DEFAULT_PACK_DECK_WIDTH as PACK_PREVIEW_W,
    DEFAULT_PACK_DECK_HEIGHT as PACK_PREVIEW_H
} from '../../../utils/imageUtils';

interface PackPreviewCardProps {
    pack: Pack | null;
}

const PackPreviewCard: React.FC<PackPreviewCardProps> = ({ pack }) => {
    // 0: Pack Image (表面), 1: Card Back Image (裏面)
    const [currentIndex, setCurrentIndex] = useState(0);

    if (!pack) return null;

    // --- 1. 画像URLの決定とリスト化 ---
    

    const packImageUrl = getDisplayImageUrl(pack.imageUrl, {
        // ⬇️ 修正: packData.imageColor があればそれを使う
        imageColor: pack.imageColor,
        text: pack.name // パック名をプレースホルダーテキストに利用
    });
    

    // カード裏面画像が設定されていない場合は、パック画像と同じプレースホルダーを使用
    const cardBackImageUrl = getDisplayImageUrl(pack.cardBackImageUrl, {
        imageColor: pack.cardBackImageColor,
        text: pack.name ? `${pack.name} Back` : 'Card Back'
    });

    // 表示する画像のリスト
    const images = [
        { url: packImageUrl, alt: `${pack.name} パック画像` },
        { url: cardBackImageUrl, alt: `${pack.name} カード裏面画像` },
    ];
    
    // 画像が1枚しかない場合はカルーセルを無効にする（常にPack Imageを表示）
    const isCarouselDisabled = images[0].url === images[1].url;

    // --- 2. ハンドラ定義 ---
    const handleNext = () => {
        if (isCarouselDisabled) return;
        setCurrentIndex(prev => (prev + 1) % images.length);
    };

    const handlePrev = () => {
        if (isCarouselDisabled) return;
        setCurrentIndex(prev => (prev - 1 + images.length) % images.length);
    };

    // スワイプ（ドラッグ）イベントは実装せず、ここではカーソル操作（ボタン）で代替し、スワイプ風の表示（CSS）のみ実現します。

    return (
        <Box sx={{ 
            mb: 2, 
            textAlign: 'center',
            // プレビューコンテナのサイズを固定し、カルーセルの「窓」とする
            width: PACK_PREVIEW_W,
            height: PACK_PREVIEW_H,
            mx: 'auto', // 中央寄せ
            position: 'relative',
            overflow: 'hidden', // 外枠からはみ出す画像を隠す
            borderRadius: 1, 
        }}>
            {/* 画像コンテナ: スワイプアニメーションのために transform を適用 */}
            <Box sx={{
                display: 'flex',
                // 現在のインデックスに基づいてコンテナを横方向に移動
                transform: `translateX(-${currentIndex * PACK_PREVIEW_W}px)`,
                transition: 'transform 0.5s ease-in-out', // アニメーション
                width: PACK_PREVIEW_W * images.length, // 2枚分の幅
                height: PACK_PREVIEW_H,
            }}>
                {images.map((img, index) => (
                    <img
                        key={index}
                        src={img.url}
                        alt={img.alt}
                        style={{
                            minWidth: PACK_PREVIEW_W, // 各画像は PackPreviewW の幅を持つ
                            height: PACK_PREVIEW_H,
                            objectFit: 'cover',
                            borderRadius: 4,
                            border: '1px solid #ddd',
                        }}
                    />
                ))}
            </Box>

            {/* ナビゲーションボタン */}
            {!isCarouselDisabled && (
                <>
                    <IconButton 
                        onClick={handlePrev} 
                        size="small"
                        sx={{
                            position: 'absolute',
                            top: '50%',
                            left: 4,
                            transform: 'translateY(-50%)',
                            color: 'white',
                            bgcolor: 'rgba(0, 0, 0, 0.4)',
                            '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.6)' }
                        }}
                    >
                        <NavigateBeforeIcon />
                    </IconButton>
                    <IconButton 
                        onClick={handleNext} 
                        size="small"
                        sx={{
                            position: 'absolute',
                            top: '50%',
                            right: 4,
                            transform: 'translateY(-50%)',
                            color: 'white',
                            bgcolor: 'rgba(0, 0, 0, 0.4)',
                            '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.6)' }
                        }}
                    >
                        <NavigateNextIcon />
                    </IconButton>
                </>
            )}
            
            {/* インジケーター (現在どちらの画像が表示されているかを示す) */}
            {!isCarouselDisabled && (
                <Box sx={{ 
                    position: 'absolute', 
                    bottom: 4, 
                    left: '50%', 
                    transform: 'translateX(-50%)', 
                    display: 'flex', 
                    gap: 0.5 
                }}>
                    {images.map((_, index) => (
                        <Box 
                            key={index}
                            sx={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                bgcolor: currentIndex === index ? 'primary.main' : 'rgba(255, 255, 255, 0.5)',
                                border: '1px solid #000',
                            }}
                        />
                    ))}
                </Box>
            )}
        </Box>
    );
};

export default PackPreviewCard;
