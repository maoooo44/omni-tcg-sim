/**
 * src/features/pack-opening/PackOpeningHandler.tsx
 * PackOpenerからビジネスロジックと状態管理（アニメーション準備）を分離
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Box } from '@mui/material';

// useCardDataフックをインポート
import { useCardData } from '../../hooks/useCardData';

// 外部依存の型やフックをインポート
import type { Pack } from '../../models/pack';
// Cardモデルの型をインポート
import type { Card } from '../../models/card';
import type { OpenedResultState } from './hooks/usePackOpenerData';
import PackOpeningAnimation from '../../components/PackOpeningAnimation';
import CardViewModal from '../../components/CardViewModal';
import {
    getDisplayImageUrl,
    DEFAULT_CARD_PREVIEW_WIDTH,
    DEFAULT_CARD_PREVIEW_HEIGHT
} from '../../utils/imageUtils';


export interface CardData {
    id: string; // ユニークな開封インスタンスID
    cardId: string; // カード定義ID
    name: string;
    imageUrl: string; // 最終的に表示する画像URL (プレースホルダー含む)
    rarity: string;
}

// 定数: カードプレースホルダーオプション
const CARD_PLACEHOLDER_OPTIONS = {
    width: DEFAULT_CARD_PREVIEW_WIDTH,
    height: DEFAULT_CARD_PREVIEW_HEIGHT,
    bgColor: '333333',
    textColor: 'ffffff',
};

interface PackOpeningHandlerProps {
    selectedPack: Pack | null;
    lastOpenedResults: OpenedResultState;
    setLastOpenedResults: React.Dispatch<React.SetStateAction<OpenedResultState>>;
}

// 💡 追加: プレースホルダーの生成を分離
const generatePlaceholders = (selectedPack: Pack): CardData[] => {
    const placeholders: CardData[] = [];
    for (let i = 0; i < selectedPack.cardsPerPack; i++) {
        placeholders.push({
            id: `placeholder-${i}-${crypto.randomUUID()}`, 
            cardId: `placeholder-card-${i}`,
            name: '???',
            imageUrl: getDisplayImageUrl(null, { ...CARD_PLACEHOLDER_OPTIONS, text: 'PACK' }),
            rarity: '',
        });
    }
    return placeholders;
};


const PackOpeningHandler: React.FC<PackOpeningHandlerProps> = ({
    selectedPack,
    lastOpenedResults,
    //setLastOpenedResults
}) => {
    
    // useCardDataフックを呼び出し、カード情報取得関数を取得
    const { getCardInfo } = useCardData();

    // 現在表示しているカードリスト (プレースホルダー or 結果)
    const [displayedCards, setDisplayedCards] = useState<CardData[]>([]);
    // カードが表向きになっているか (false = 裏面表示)
    const [isRevealed, setIsRevealed] = useState(false);

    // 1. lastOpenedResults を PackOpeningAnimation が求めるフラットなリストに変換
    const flattenedOpenedCards = useMemo((): CardData[] => {
        const results = lastOpenedResults.results;
        
        if (results.length === 0 || !selectedPack) {
            return [];
        }
        
        // result の型が { cardId: string, count: number } であることを保証
        return results.reduce((acc: CardData[], result) => {
            const cardArray: CardData[] = [];
            
            // getCardInfo を使って実際のカードデータを取得
            const actualCard: Card | undefined = getCardInfo(result.cardId);

            // データが見つからない場合のフォールバック
            const cardDetails = actualCard ? {
                cardId: actualCard.cardId,
                name: actualCard.name,
                // CardモデルのimageUrlは string | null | undefined の可能性があるため、そのまま渡す
                imageUrl: actualCard.imageUrl,
                rarity: actualCard.rarity || '不明',
            } : {
                cardId: result.cardId,
                name: `カードデータが見つかりません (${result.cardId})`,
                imageUrl: null, // nullを渡すことで、getDisplayImageUrlが確実にプレースホルダーを生成する
                rarity: 'UNKNOWN',
            };
            
            for (let i = 0; i < result.count; i++) {
                
                // プレースホルダーテキストの決定 (カード名)
                const placeholderText = cardDetails.name;
                
                // getDisplayImageUrlを使用してimageUrlを決定
                const finalImageUrl = getDisplayImageUrl(
                    cardDetails.imageUrl, // 実際の画像URL、または undefined/null
                    {
                        ...CARD_PLACEHOLDER_OPTIONS,
                        text: placeholderText || 'CARD',
                    }
                );

                cardArray.push({
                    // idにcrypto.randomUUID()を混ぜて、同一カードが複数枚あってもユニークになるようにする
                    id: `${result.cardId}-${crypto.randomUUID()}-${i}`,
                    cardId: cardDetails.cardId,
                    name: cardDetails.name,
                    imageUrl: finalImageUrl, // プレースホルダーまたは実画像URL
                    rarity: cardDetails.rarity,
                });
            }
            return acc.concat(cardArray);
        }, []);

    }, [lastOpenedResults, selectedPack, getCardInfo]);


    // 🚨 修正: useEffectを統合し、リセット時にプレースホルダーをセットするように変更
    useEffect(() => {
        if (!selectedPack) {
            setDisplayedCards([]);
            setIsRevealed(false);
            return;
        }
        
        const hasNewResults = lastOpenedResults.results.length > 0;
        const isInitialState = lastOpenedResults.id === 'initial';
        
        if (hasNewResults) {
            // 3-B. 開封結果が確定したら、カードリストを切り替え
            setDisplayedCards(flattenedOpenedCards);
            
            // 0ms後に isRevealed を true にしてフリップを開始
            setTimeout(() => {
                setIsRevealed(true); 
            }, 0); 

        } else if (isInitialState || (!isInitialState && !hasNewResults)) {
            // 3-A. 初回ロード時 (isInitialState) および 再開封時のリセット (!hasNewResults)
            
            // 1. プレースホルダーを生成してセット（最重要: 前の実際のカードデータをクリア）
            const placeholders = generatePlaceholders(selectedPack);
            setDisplayedCards(placeholders);
            
            // 2. カードを一瞬で裏面(false)に戻す (アニメーションリセット)
            setIsRevealed(false); 
            
            if (!isInitialState) {
                console.log("[PackOpeningHandler] Animation reset: isRevealed set to false, and placeholders loaded for re-open.");
            }
        }
        
    }, [lastOpenedResults.id, lastOpenedResults.results.length, selectedPack, flattenedOpenedCards]); // selectedPack と flattenedOpenedCards を依存に追加

    // cardBackUrlはPackOpeningAnimationに渡す (ロジックは変更なし)
    const cardBackUrl = selectedPack?.cardBackUrl || getDisplayImageUrl(null, { ...CARD_PLACEHOLDER_OPTIONS, text: 'BACK' });
    
    if (!selectedPack || displayedCards.length === 0) {
        return null;
    }

    return (
        <Box sx={{ mt: 3, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <PackOpeningAnimation
                openedCards={displayedCards}
                isRevealed={isRevealed}
                cardBackUrl={cardBackUrl}
            />
            {/* CardViewModalをコンポーネントツリーに追加 */}
            <CardViewModal />

        </Box>
    );
};

export default PackOpeningHandler;