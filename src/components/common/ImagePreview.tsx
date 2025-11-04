/**
 * src/components/common/ImagePreview.tsx (ImageURL/disableCarousel 追加版)
 *
 * * 責務: ItemまたはimageUrlを受け取り、渡されたデータに基づいて画像をレンダリングする（カルーセル機能はオプション）。
 */
import React, { useState } from 'react';
import { Box, IconButton, type Theme } from '@mui/material';
import { type SxProps } from '@mui/system';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';

import type { Pack, Deck, Card, CommonItemData, ItemImageOptions } from '../../models/models';
import {
    getDisplayImageUrl,
    createCompositeImage,
    DEFAULT_PACK_DECK_WIDTH,
    DEFAULT_PACK_DECK_HEIGHT,
    DEFAULT_CARD_PREVIEW_WIDTH,
    DEFAULT_CARD_PREVIEW_HEIGHT,
    type ImageType 
} from '../../utils/imageUtils';

// ItemImageOptions を再エクスポート (後方互換性のため)
export type { ItemImageOptions } from '../../models/models';

// Key Card Composite Imageの定数
const SUB_CARD_WIDTH = 60;
const SUB_CARD_HEIGHT_RATIO = DEFAULT_CARD_PREVIEW_HEIGHT / DEFAULT_CARD_PREVIEW_WIDTH;
const SUB_CARD_GAP = 4;
const SUB_CARD_MARGIN = 8; 

// ---------------------------------------------------------------------
// I. 型定義
// ---------------------------------------------------------------------

type Item = Pack | Deck | Card | CommonItemData;


interface ImagePreviewProps extends ItemImageOptions { // ⭐ ItemImageOptionsを継承
    /** 必須: 表示するアイテムオブジェクト（itemがある場合は優先） */
    item: Item | null;

    /** 💡 新規追加: 画像URLを直接指定する場合（item.imageUrlよりも優先） */
    imageUrl?: string; 

    /** オプション: カスタム幅（InteractiveItemContainerからリレーしないサイズプロパティ） */
    width?: number;
    /** オプション: カスタム高さ（InteractiveItemContainerからリレーしないサイズプロパティ） */
    height?: number;

    // --- オプション機能 ---
    /** オプション: trueの場合、2枚目にカード裏面画像を表示（主にPack用） */
    showCardBack?: boolean;
    /** キーカード合成に必要なカードデータ。 */
    keycardsData?: Card[]; 
    
    /** 💡 新規追加: trueの場合、カルーセル表示とナビゲーションボタンを無効化する */
    disableCarousel?: boolean; 
}

interface ImageItem {
    url: string; 
    alt: string;
}

// ---------------------------------------------------------------------
// II. コンポーネント本体
// ---------------------------------------------------------------------

const ImagePreview: React.FC<ImagePreviewProps> = ({ 
    item, 
    imageUrl, 
    width: customWidth, 
    height: customHeight,
    showCardBack = false,
    enableHoverEffect = false,
    keycardsData, 
    imageSx, 
    disableCarousel = false, 
}) => {
    
    // itemがnullでimageUrlもない場合はレンダリングしない
    if (!item && !imageUrl) return null;
    
    // --- 1. アイテムタイプの判定とデフォルトサイズの決定 ---
    
    let itemType: ImageType;
    if (item && 'cardId' in item) { 
        itemType = 'card';
    } else { 
        itemType = 'pack_deck';
    }
    
    const defaultW = itemType === 'card' ? DEFAULT_CARD_PREVIEW_WIDTH : DEFAULT_PACK_DECK_WIDTH;
    const defaultH = itemType === 'card' ? DEFAULT_CARD_PREVIEW_HEIGHT : DEFAULT_PACK_DECK_HEIGHT;

    // ⭐ サイズ決定ロジックを変更
    // customWidth/Heightが指定されていない場合、'100%'を使用して親コンポーネントにサイズ決定を委ねる
    const finalWidth = customWidth ? customWidth : '100%';
    const finalHeight = customHeight ? customHeight : '100%';

    // URL生成や合成ロジックに必要な数値の幅/高さ（指定がない場合はデフォルト値を使用）
    const finalNumericWidth = (typeof finalWidth === 'number' ? finalWidth : defaultW);
    const finalNumericHeight = (typeof finalHeight === 'number' ? finalHeight : defaultH);
    
    // --- 2. アイテム型によるアクセス準備 ---
    const isDeckItem = item ? 'deckId' in item : false; 
    const isPackItem = item ? 'packId' in item : false;
    const deckItem = item as Deck; 
    const packItem = item as Pack;
    
    // 3. キーカード合成画像の状態（Deck系専用）
    const [keyCardCompositeUrl, setKeyCardCompositeUrl] = useState<string>('');
    
    // --- 4. 画像リストの構築 ---

    // a. メイン画像 (imageUrlが最優先)
    const mainImage = imageUrl || getDisplayImageUrl(item?.imageUrl, {
        imageColor: item?.imageColor,
        text: item?.name || 'No Name', 
        type: itemType, 
        // URL生成には数値の幅/高さを渡す
        width: finalNumericWidth, 
        height: finalNumericHeight
    });

    const images: ImageItem[] = [
        { 
            url: mainImage, 
            alt: `${item?.name || 'アイテム'} メイン画像` 
        },
    ];

    // b. カード裏面 (Pack系専用)
    if (showCardBack && isPackItem) {
        const backImageUrl = getDisplayImageUrl(packItem.cardBackImageUrl, {
            imageColor: packItem.cardBackImageColor,
            text: packItem.name ? `${packItem.name} Back` : 'Card Back',
            type: itemType,
            width: finalNumericWidth,
            height: finalNumericHeight
        });
        images.push({ url: backImageUrl, alt: `${packItem.name} カード裏面` });
    }

    // c. キーカード合成画像 (Deck系専用) - useEffectロジックは変更なし
    const isKeyCardGenerationEnabled = isDeckItem && !!keycardsData;
    
    React.useEffect(() => {
        if (!isKeyCardGenerationEnabled) {
            setKeyCardCompositeUrl('');
            return;
        }

        const validCards = keycardsData as Card[]; 
        
        const keycard1 = validCards.find(c => c.cardId === deckItem.keycard_1);
        const keycard2 = validCards.find(c => c.cardId === deckItem.keycard_2);
        const keycard3 = validCards.find(c => c.cardId === deckItem.keycard_3);
        
        const subCardHeight = Math.round(SUB_CARD_WIDTH * SUB_CARD_HEIGHT_RATIO);

        createCompositeImage(
            keycard1,
            [keycard2, keycard3],
            {
                // 合成画像生成には数値の幅/高さを渡す
                width: finalNumericWidth, 
                height: finalNumericHeight,
                subWidth: SUB_CARD_WIDTH,
                subHeight: subCardHeight,
                subGap: SUB_CARD_GAP,
                subMargin: SUB_CARD_MARGIN,
                fallbackImageColor: deckItem.imageColor,
                fallbackText: 'キーカード未設定'
            }
        ).then(setKeyCardCompositeUrl).catch((error) => {
             console.error('❌ キーカード合成画像の生成に失敗しました:', error);
             const errorUrl = getDisplayImageUrl(undefined, {
                 imageColor: deckItem.imageColor,
                 text: '合成エラー',
                 type: itemType,
                 width: finalNumericWidth,
                 height: finalNumericHeight
             });
             setKeyCardCompositeUrl(errorUrl);
        });
    }, [isKeyCardGenerationEnabled, deckItem, keycardsData, finalNumericWidth, finalNumericHeight, itemType]);

    if (isKeyCardGenerationEnabled && keyCardCompositeUrl) {
        images.push({ url: keyCardCompositeUrl, alt: `${deckItem.name} キーカード` });
    }
    
    // --- 5. レンダリング (カルーセルロジック) ---
    
    const isCarouselDisabled = images.length <= 1 || disableCarousel;
    const [currentIndex, setCurrentIndex] = useState(0);

    const handleNext = () => {
        if (isCarouselDisabled) return;
        setCurrentIndex(prev => (prev + 1) % images.length);
    };

    const handlePrev = () => {
        if (isCarouselDisabled) return;
        setCurrentIndex(prev => (prev - 1 + images.length) % images.length);
    };
    
    React.useEffect(() => {
        if (currentIndex >= images.length) {
            setCurrentIndex(0);
        }
    }, [images.length, currentIndex]);

    const cursorSx: SxProps<Theme> = enableHoverEffect ? { cursor: 'pointer' } : {};
    
    const defaultImageSx: SxProps<Theme> = {
        width: '100%', 
        height: '100%', 
        objectFit: 'contain', 
        borderRadius: 1, 
        border: 'none',
    };
    
    const combinedImageSx: SxProps<Theme> = [
        defaultImageSx, 
        cursorSx, 
        // 外部から渡された imageSx を適用
        ...(Array.isArray(imageSx) ? imageSx : (imageSx ? [imageSx] : []))
    ] as SxProps<Theme>;


    return (
        <Box 
            // width, height に finalWidth/Height を適用 (カスタム指定があれば優先、なければ '100%')
            sx={{ 
                position: 'relative', overflow: 'hidden', borderRadius: 1, 
                width: finalWidth, height: finalHeight, 
            }}
        >
            <Box sx={{
                display: 'flex',
                // finalWidth が '100%' の場合、0px移動に固定
                transform: `translateX(-${isCarouselDisabled ? 0 : currentIndex * (typeof finalWidth === 'number' ? finalWidth : 0)}px)`,
                transition: 'transform 0.5s ease-in-out', 
                width: isCarouselDisabled ? finalWidth : `calc(100% * ${images.length})`, // 100% * N枚
                height: finalHeight,
            }}>
                {/* 💡 isCarouselDisabled の場合、最初の1枚だけをレンダリング */}
                {images.slice(0, isCarouselDisabled ? 1 : images.length).map((img, index) => (
                    <Box key={index} sx={{ 
                        minWidth: isCarouselDisabled ? '100%' : `calc(100% / ${images.length})`, 
                        height: finalHeight, 
                        position: 'relative' 
                    }}>
                        <Box
                            component="img" 
                            src={img.url}
                            alt={img.alt}
                            sx={combinedImageSx} 
                        />
                    </Box>
                ))}
            </Box>

            {/* ナビゲーションボタンとインジケーター */}
            {!isCarouselDisabled && (
                <>
                    <IconButton onClick={handlePrev} size="small" sx={{ position: 'absolute', top: '50%', left: 4, transform: 'translateY(-50%)', color: 'white', bgcolor: 'rgba(0, 0, 0, 0.4)', '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.6)' }, zIndex: 11 }}><NavigateBeforeIcon /></IconButton>
                    <IconButton onClick={handleNext} size="small" sx={{ position: 'absolute', top: '50%', right: 4, transform: 'translateY(-50%)', color: 'white', bgcolor: 'rgba(0, 0, 0, 0.4)', '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.6)' }, zIndex: 11 }}><NavigateNextIcon /></IconButton>
                    <Box sx={{ position: 'absolute', bottom: 4, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 0.5, zIndex: 11 }}>
                        {images.map((_, index) => (
                            <Box key={index} sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: currentIndex === index ? 'primary.main' : 'rgba(255, 255, 255, 0.5)', border: '1px solid #000' }} />
                        ))}
                    </Box>
                </>
            )}
        </Box>
    );
};

export default ImagePreview;