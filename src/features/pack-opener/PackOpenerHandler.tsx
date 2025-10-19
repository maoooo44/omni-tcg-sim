/**
* src/features/pack-opener/PackOpenerHandler.tsx
*
* パック開封シミュレーションの表示ロジックを制御するコンポーネントです。
* 親コンポーネントから受け取った開封結果 (`lastOpenedResults`) を、アニメーション用のフラットなカードリスト (`OpenerCardData[]`) に変換します。
* また、開封アニメーションの状態 (`isRevealed`) を管理し、結果の有無に応じてプレースホルダーの表示/リセットを行います。
* 実際のカードフリップアニメーションは、子の `PackOpeningAnimation` コンポーネントに委譲します。
*/

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Box } from '@mui/material';

// useCardDataフックをインポート
import { useCardData } from '../../hooks/useCardData';

// 外部依存の型やフックをインポート
import type { Pack } from '../../models/pack';
// Cardモデルの型をインポート
import type { Card } from '../../models/card';
import type { OpenedResultState } from '../../models/pack-opener';

// PackOpeningAnimationとOpenerCardで共通利用される型を切り出す
import type { OpenerCardData } from '../../models/pack-opener'; 

// UIコンポーネントのパスを修正（相対パスを維持）
import PackOpeningAnimation from './components/PackOpenerAnimation';
import CardModal from '../../components/modals/CardModal'; // 共通UI領域に配置されていると仮定
// 【新規追加】CardModalのpropsに必要な型をインポート
import type { CardModalProps } from '../../components/modals/CardModal'; 

import {
    getDisplayImageUrl,
    DEFAULT_CARD_PREVIEW_WIDTH,
    DEFAULT_CARD_PREVIEW_HEIGHT
} from '../../utils/imageUtils';


// 定数: カードプレースホルダーオプション (変更なし)
const CARD_PLACEHOLDER_OPTIONS = {
    width: DEFAULT_CARD_PREVIEW_WIDTH,
    height: DEFAULT_CARD_PREVIEW_HEIGHT,
    bgColor: '333333',
    textColor: 'ffffff',
};

interface PackOpenerHandlerProps {
    selectedPack: Pack | null;
    lastOpenedResults: OpenedResultState;
    // setLastOpenedResults はコンポーネント内で使用されていないが、型定義の整合性のため復活
    setLastOpenedResults: React.Dispatch<React.SetStateAction<OpenedResultState>>;
}

// 💡 プレースホルダーの生成を分離 (変更なし)
const generatePlaceholders = (selectedPack: Pack): OpenerCardData[] => {
    const placeholders: OpenerCardData[] = [];
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


const PackOpenerHandler: React.FC<PackOpenerHandlerProps> = ({
    selectedPack,
    lastOpenedResults,
    //setLastOpenedResults, // setLastOpenedResults を受け取る
}) => {
    
    // useCardDataフックを呼び出し、カード情報取得関数を取得
    const { getCardInfo } = useCardData();

    // 現在表示しているカードリスト (プレースホルダー or 結果)
    const [displayedCards, setDisplayedCards] = useState<OpenerCardData[]>([]);
    // カードが表向きになっているか (false = 裏面表示)
    const [isRevealed, setIsRevealed] = useState(false);

    // 【新規追加】モーダル関連の State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedCardForModal, setSelectedCardForModal] = useState<Card | null>(null); // CardModalに渡すCardデータ
    
    // 1. lastOpenedResults を PackOpeningAnimation が求めるフラットなリストに変換 (ロジック変更なし)
    const flattenedOpenedCards = useMemo((): OpenerCardData[] => {
        const results = lastOpenedResults.results;
        
        if (results.length === 0 || !selectedPack) {
            return [];
        }
        
        // result の型が { cardId: string, count: number } であることを保証
        return results.reduce((acc: OpenerCardData[], result) => {
            const cardArray: OpenerCardData[] = [];
            
            // getCardInfo を使って実際のカードデータを取得
            const actualCard: Card | undefined = getCardInfo(result.cardId);

            // データが見つからない場合のフォールバック
            const cardDetails = actualCard ? {
                cardId: actualCard.cardId,
                name: actualCard.name,
                // CardモデルのimageUrlは string | null | undefined の可能性があるため、そのまま渡す
                imageUrl: actualCard.imageUrl,
                rarity: actualCard.rarity || '不明',
                // CardModalで必要となるが OpenerCardData に含まれない基本フィールド
                packId: actualCard.packId, 
                number: actualCard.number,
            } : {
                cardId: result.cardId,
                name: `カードデータが見つかりません (${result.cardId})`,
                imageUrl: null, // nullを渡すことで、getDisplayImageUrlが確実にプレースホルダーを生成する
                rarity: 'UNKNOWN',
                packId: selectedPack.packId, // 少なくともパックIDは設定
                number: null,
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


    // 🚨 修正: useEffectを統合し、リセット時にプレースホルダーをセットするように変更 (ロジック変更なし)
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
                console.log("[PackOpenerHandler] Animation reset: isRevealed set to false, and placeholders loaded for re-open.");
            }
        }
        
    }, [lastOpenedResults.id, lastOpenedResults.results.length, selectedPack, flattenedOpenedCards]); // selectedPack と flattenedOpenedCards を依存に追加

    // cardBackUrlはPackOpeningAnimationに渡す (ロジックは変更なし)
    const cardBackUrl = selectedPack?.cardBackImageUrl || getDisplayImageUrl(null, { ...CARD_PLACEHOLDER_OPTIONS, text: 'BACK' });
    
    // 【新規追加】CardModalの操作ハンドラ
    const handleModalClose = useCallback(() => {
        setIsModalOpen(false);
        setSelectedCardForModal(null);
    }, []);

    // パック開封画面では保存/削除は行わないため、ダミー関数を渡す
    const handleCardSave: CardModalProps['onSave'] = useCallback((cardToSave) => {
        console.warn("Card Save called from PackOpener. Operation ignored in view mode.", cardToSave);
        // 実際の保存ロジックは含まない
    }, []);
    
    const handleCardRemove: CardModalProps['onRemove'] = useCallback(async (cardId) => {
        console.warn("Card Remove called from PackOpener. Operation ignored in view mode.", cardId);
        // 実際の削除ロジックは含まない
    }, []);
    
    // 【新規追加】カードをクリックした時のハンドラ
    const handleCardClick = useCallback((openerCardData: OpenerCardData) => {
        const actualCard: Card | undefined = getCardInfo(openerCardData.cardId);

        if (!actualCard) {
            console.error("Card data not found for modal:", openerCardData.cardId);
            return;
        }

        // CardModalに渡す Card 型のデータに変換
        // OpenerCardData に含まれる情報だけでなく、Card 型に必要なすべての情報を埋める
        const cardForModal: Card = {
            ...actualCard,
            cardId: openerCardData.cardId,
            name: openerCardData.name,
            rarity: openerCardData.rarity,
            imageUrl: actualCard.imageUrl || openerCardData.imageUrl, // 実際のURLがあればそちらを優先
            packId: actualCard.packId || selectedPack!.packId, // 必須
            // ... その他の必須フィールドも実際には必要 (例: number, createdAt, updatedAt)
        };

        setSelectedCardForModal(cardForModal);
        setIsModalOpen(true);
    }, [getCardInfo, selectedPack]);


    if (!selectedPack || displayedCards.length === 0) {
        return null;
    }

    return (
        <Box sx={{ mt: 3, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <PackOpeningAnimation
                openedCards={displayedCards}
                isRevealed={isRevealed}
                cardBackUrl={cardBackUrl}
                // 【必須追加】カードクリック時のハンドラを渡す
                onCardClick={handleCardClick} 
            />
            
            {/* CardViewModalをコンポーネントツリーに追加し、必須propsを渡す */}
            <CardModal 
                open={isModalOpen}
                onClose={handleModalClose}
                card={selectedCardForModal} // Card | null を渡す
                onSave={handleCardSave} // ダミーを渡す
                onRemove={handleCardRemove} // ダミーを渡す
                
                // selectedPack から取得可能な必須データ
                packRaritySettings={selectedPack.rarityConfig} 
                currentPackName={selectedPack.name} 
                currentPackId={selectedPack.packId} 
                
                // customFieldSettings, onCustomFieldSettingChange は親から渡されるか、Contextから取得されるべき
                // ここではエラー回避のため一旦仮の値を渡すが、適切な実装が必要
                // 実際には PackOpenerHandler の props に customFieldSettings を追加すべき
                customFieldSettings={{} as CardModalProps['customFieldSettings']} // 仮
                onCustomFieldSettingChange={() => {}} // 仮

                // パック開封結果の閲覧なので ReadOnly を true に設定
                isReadOnly={true}
            />

        </Box>
    );
};

export default PackOpenerHandler;