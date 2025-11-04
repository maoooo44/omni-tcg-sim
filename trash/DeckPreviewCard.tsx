/**
 * src/features/decks/components/DeckPreviewCard.tsx
 *
 * デッキ管理機能で使用される、Deckのカバー画像を表示するコンポーネント。
 * * 責務:
 * 1. Deckオブジェクトを受け取り、設定された画像URL（deck.imageUrl）とキーカード合成画像をレンダリングする。
 * 2. 画像URLが存在しない場合、getDisplayImageUrlユーティリティを用いてプレースホルダー画像を生成・表示する。
 * 3. PackPreviewCardと同様に、**カルーセル機能**を提供する（デッキ画像 ⇄ キーカード合成画像）。
 * 4. キーカード合成画像は、keycard_1をメイン、keycard_2とkeycard_3を右下にサブ画像として配置する。
 * 💡 修正: allCards をオプショナル (Card[] | undefined) に変更し、未定義の場合に対応
 */
import React, { useState } from 'react';
import { Box, IconButton } from '@mui/material';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import type { Deck, Card } from '../../../models/models';
import {
    getDisplayImageUrl,
    // Packと共通の定数を使用
    DEFAULT_PACK_DECK_WIDTH as DECK_PREVIEW_W, 
    DEFAULT_PACK_DECK_HEIGHT as DECK_PREVIEW_H,
    DEFAULT_CARD_PREVIEW_WIDTH,
    DEFAULT_CARD_PREVIEW_HEIGHT
} from '../../../utils/imageUtils';
import { createCompositeImage } from '../../../utils/imageCompositor';

// サブカード（キーカード2, 3）の表示サイズ定数
const SUB_CARD_WIDTH = 60;
const SUB_CARD_HEIGHT = Math.round(SUB_CARD_WIDTH * (DEFAULT_CARD_PREVIEW_HEIGHT / DEFAULT_CARD_PREVIEW_WIDTH)); // アスペクト比を維持
const SUB_CARD_GAP = 4; // サブカード間の隙間
const SUB_CARD_MARGIN = 8; // 画像端からのマージン 

interface DeckPreviewCardProps {
    deck: Deck | null;
    allCards?: Card[]; // ⭐ 修正: allCards をオプショナルにする
}

const DeckPreviewCard: React.FC<DeckPreviewCardProps> = ({ deck, allCards }) => {
    // 0: Deck Image (表面), 1: KeyCard Composite Image (キーカード合成画像)
    const [currentIndex, setCurrentIndex] = useState(0);
    const [keyCardCompositeUrl, setKeyCardCompositeUrl] = useState<string>('');

    if (!deck) return null;
    
    // ⭐ 新規: allCards が渡されている、かつ、いずれかのキーカードIDが設定されている場合に機能を有効にする
    const isKeyCardEnabled = !!allCards && (!!deck.keycard_1 || !!deck.keycard_2 || !!deck.keycard_3);

    // --- 1. デッキ画像URLの決定 ---
    const deckImageUrl = getDisplayImageUrl(deck.imageUrl, {
        imageColor: deck.imageColor,
        text: deck.name // デッキ名をプレースホルダーテキストに利用
    });
    
    // --- 2. キーカード合成画像の生成 ---
    React.useEffect(() => {
        // ⭐ 修正: キーカード機能が無効な場合は処理をスキップ
        if (!isKeyCardEnabled) {
             setKeyCardCompositeUrl(''); // 明示的に空にしておく
             return;
        }

        console.log('🔍 DeckPreviewCard - キーカード合成画像生成開始');
        console.log('keycard_1:', deck.keycard_1);
        console.log('keycard_2:', deck.keycard_2);
        console.log('keycard_3:', deck.keycard_3);
        
        // isKeyCardEnabled のチェックにより allCards が存在することは保証されている
        const validCards = allCards as Card[]; 

        // キーカードIDからCardオブジェクトを取得
        const keycard1 = validCards.find(c => c.cardId === deck.keycard_1);
        const keycard2 = validCards.find(c => c.cardId === deck.keycard_2);
        const keycard3 = validCards.find(c => c.cardId === deck.keycard_3);

        // createCompositeImageを使用して合成画像を生成
        createCompositeImage(
            keycard1,
            [keycard2, keycard3],
            {
                width: DECK_PREVIEW_W,
                height: DECK_PREVIEW_H,
                subWidth: SUB_CARD_WIDTH,
                subHeight: SUB_CARD_HEIGHT,
                subGap: SUB_CARD_GAP,
                subMargin: SUB_CARD_MARGIN,
                fallbackImageColor: deck.imageColor,
                fallbackText: 'キーカード未設定'
            }
        ).then(compositeUrl => {
            setKeyCardCompositeUrl(compositeUrl);
            console.log('✅ キーカード合成画像生成完了');
        }).catch(error => {
            console.error('❌ キーカード合成画像の生成に失敗しました:', error);
            // エラー時はプレースホルダーを設定
            const errorUrl = getDisplayImageUrl(undefined, {
                imageColor: deck.imageColor,
                text: 'キーカード画像エラー'
            });
            setKeyCardCompositeUrl(errorUrl);
        });
    }, [deck.keycard_1, deck.keycard_2, deck.keycard_3, allCards, deck.imageColor, deck.name, deckImageUrl, isKeyCardEnabled]); // ⭐ 修正: 依存配列に isKeyCardEnabled を追加

    // --- 3. 画像リストの作成 ---
    const images = [
        { url: deckImageUrl, alt: `${deck.name} デッキ画像` },
    ];
    
    // ⭐ 修正: キーカードが有効な場合のみ2枚目の画像をリストに追加
    if (isKeyCardEnabled) {
        images.push({ url: keyCardCompositeUrl, alt: `${deck.name} キーカード` });
    }

    // 画像が1枚しかない場合はカルーセルを無効にする
    // ⭐ 修正: 画像リストの長さに基づいて無効化を判定
    const isCarouselDisabled = images.length <= 1;

    // --- 4. ハンドラ定義 ---
    const handleNext = () => {
        if (isCarouselDisabled) return;
        setCurrentIndex(prev => (prev + 1) % images.length);
    };

    const handlePrev = () => {
        if (isCarouselDisabled) return;
        setCurrentIndex(prev => (prev - 1 + images.length) % images.length);
    };

    return (
        <Box sx={{ 
            mb: 2, 
            textAlign: 'center',
            // プレビューコンテナのサイズを固定し、カルーセルの「窓」とする
            width: DECK_PREVIEW_W,
            height: DECK_PREVIEW_H,
            mx: 'auto', // 中央寄せ
            position: 'relative',
            overflow: 'hidden', // 外枠からはみ出す画像を隠す
            borderRadius: 1, 
        }}>
            {/* 画像コンテナ: スワイプアニメーションのために transform を適用 */}
            <Box sx={{
                display: 'flex',
                // 現在のインデックスに基づいてコンテナを横方向に移動
                transform: `translateX(-${currentIndex * DECK_PREVIEW_W}px)`,
                transition: 'transform 0.5s ease-in-out', // アニメーション
                width: DECK_PREVIEW_W * images.length, // ⭐ 修正: images.length に基づく幅
                height: DECK_PREVIEW_H,
            }}>
                {images.map((img, index) => (
                    <Box
                        key={index}
                        sx={{
                            minWidth: DECK_PREVIEW_W,
                            height: DECK_PREVIEW_H,
                            position: 'relative',
                        }}
                    >
                        <img
                            src={img.url || deckImageUrl}
                            alt={img.alt}
                            style={{
                                width: DECK_PREVIEW_W,
                                height: DECK_PREVIEW_H,
                                objectFit: 'cover',
                                borderRadius: 4,
                                border: '1px solid #ddd',
                            }}
                        />
                    </Box>
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

export default DeckPreviewCard;