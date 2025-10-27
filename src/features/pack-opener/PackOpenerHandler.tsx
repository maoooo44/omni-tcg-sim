/**
* src/features/pack-opener/PackOpenerHandler.tsx
*
* パック開封シミュレーションの表示ロジックを制御するコンポーネントです。
* 親コンポーネントから受け取った開封結果 (`lastOpenedResults`) を、アニメーション用のフラットなカードリスト (`OpenerCardData[]`) に変換します。
* また、開封アニメーションの状態 (`isRevealed`) を管理し、結果の有無に応じてプレースホルダーの表示/リセットを行います。
* 実際のカードフリップアニメーションは、子の `PackOpeningAnimation` コンポーネントに委譲します。
*/

import React, { useState, useEffect, useCallback } from 'react';
import { Box } from '@mui/material';

// useCardDataフックをインポート
import { useCardData } from '../../hooks/useCardData';

// 外部依存の型やフックをインポート
import type { Pack } from '../../models/pack';
// Cardモデルの型をインポート
import type { Card } from '../../models/card';
import type { OpenedResultState, OpenerCardData } from '../../models/packOpener';

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


// 定数: カードプレースホルダーオプション
const CARD_PLACEHOLDER_OPTIONS = {
    width: DEFAULT_CARD_PREVIEW_WIDTH,
    height: DEFAULT_CARD_PREVIEW_HEIGHT,
    bgColor: '333333',
    textColor: 'ffffff',
};

interface PackOpenerHandlerProps {
    selectedPack: Pack | null;
    lastOpenedResults: OpenedResultState;
    setLastOpenedResults: React.Dispatch<React.SetStateAction<OpenedResultState>>;
    sxOverride: any;
    aspectRatio: number;
    gap: number;
}

// 💡 プレースホルダーの生成を分離
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
    sxOverride,
    aspectRatio,
    gap,
}) => {
    
    // useCardDataフックを呼び出し、カード情報取得関数を取得
    const { fetchCardInfo } = useCardData();

    // 現在表示しているカードリスト (プレースホルダー or 結果)
    const [displayedCards, setDisplayedCards] = useState<OpenerCardData[]>([]);
    // カードが表向きになっているか (false = 裏面表示)
    const [isRevealed, setIsRevealed] = useState(false);

    // 【新規追加】モーダル関連の State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedCardForModal, setSelectedCardForModal] = useState<Card | null>(null); // CardModalに渡すCardデータ
    
    // 💡 新規: 非同期で計算した開封結果リストを保持するState
    const [actualOpenedCards, setActualOpenedCards] = useState<OpenerCardData[]>([]);

    // 1. lastOpenedResults を PackOpeningAnimation が求めるフラットなリストに変換（非同期処理）
    // 💡 useMemo から useEffect にロジックを移動し、非同期でカード情報を取得
    useEffect(() => {
        const calculateOpenedCards = async () => {
            const results = lastOpenedResults.results;
            
            if (results.length === 0 || !selectedPack) {
                setActualOpenedCards([]);
                return;
            }
            
            // 全てのカード情報を非同期で一括取得
            const cardIds = results.map(r => r.cardId);
            const cardPromises = cardIds.map(id => fetchCardInfo(id));
            const actualCards = await Promise.all(cardPromises);
            
            const cardMap = new Map<string, Card>(
                actualCards
                    .filter((card): card is Card => card !== undefined)
                    .map(card => [card.cardId, card])
            );
            
            const flattenedList: OpenerCardData[] = results.reduce((acc: OpenerCardData[], result) => {
                const actualCard = cardMap.get(result.cardId);
                
                // カードデータが見つからない場合のフォールバック
                const cardDetails = actualCard ? {
                    cardId: actualCard.cardId,
                    name: actualCard.name,
                    imageUrl: actualCard.imageUrl,
                    rarity: actualCard.rarity || '不明',
                    packId: actualCard.packId, 
                    number: actualCard.number,
                } : {
                    cardId: result.cardId,
                    name: `カードデータが見つかりません (${result.cardId})`,
                    imageUrl: null,
                    rarity: 'UNKNOWN',
                    packId: selectedPack.packId,
                    number: null,
                };
                
                for (let i = 0; i < result.count; i++) {
                    const placeholderText = cardDetails.name;
                    
                    const finalImageUrl = getDisplayImageUrl(
                        cardDetails.imageUrl,
                        {
                            ...CARD_PLACEHOLDER_OPTIONS,
                            text: placeholderText || 'CARD',
                        }
                    );

                    acc.push({
                        id: `${result.cardId}-${crypto.randomUUID()}-${i}`,
                        cardId: cardDetails.cardId,
                        name: cardDetails.name,
                        imageUrl: finalImageUrl,
                        rarity: cardDetails.rarity,
                        cardBackImageUrl: selectedPack.cardBackImageUrl,
                    });
                }
                return acc;
            }, []);

            setActualOpenedCards(flattenedList);
        };

        if (lastOpenedResults.results.length > 0 && selectedPack) {
            calculateOpenedCards();
        } else {
            setActualOpenedCards([]);
        }
        
    }, [lastOpenedResults.results, selectedPack, fetchCardInfo]); 
    // ↑ flattenedOpenedCards（useMemo）の代わりに actualOpenedCards（useEffect）を導入

    // 🚨 修正: useEffectを統合し、リセット時にプレースホルダーをセットするように変更 (ロジック変更なし)
    useEffect(() => {
        if (!selectedPack) {
            setDisplayedCards([]);
            setIsRevealed(false);
            return;
        }
        
        const hasNewResults = lastOpenedResults.results.length > 0;
        const isInitialState = lastOpenedResults.id === 'initial';
        
        // 💡 修正: hasNewResults のチェックと actualOpenedCards の準備完了を待つ
        if (hasNewResults && actualOpenedCards.length > 0) {
            // 3-B. 開封結果が確定し、非同期のデータ変換が完了したら、カードリストを切り替え
            console.log('[PackOpenerHandler] Opening animation: switching to actual cards');
            setDisplayedCards(actualOpenedCards); // 💡 修正: actualOpenedCards を使用
            
            // 二重RAFでブラウザの描画フレームを待ち、CSSの初期状態が確実に適用されてからアニメーション開始
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    console.log('[PackOpenerHandler] Starting flip animation');
                    setIsRevealed(true);
                });
            }); 

        } else if (isInitialState || (!isInitialState && !hasNewResults)) {
            // 3-A. 初回ロード時 (isInitialState) および 再開封時のリセット (!hasNewResults)
            
            // 1. プレースホルダーを生成してセット
            const placeholders = generatePlaceholders(selectedPack);
            setDisplayedCards(placeholders);
            
            // 2. カードを一瞬で裏面(false)に戻す (アニメーションリセット)
            setIsRevealed(false); 
            
            if (!isInitialState) {
                console.log("[PackOpenerHandler] Animation reset: isRevealed set to false, and placeholders loaded for re-open.");
            }
        }
        
    }, [lastOpenedResults.id, lastOpenedResults.results.length, selectedPack, actualOpenedCards.length]); 
    // 💡 依存配列に actualOpenedCards.length を追加

    // cardBackImageUrlはPackOpeningAnimationに渡す(生のURLをそのまま渡す。OpenerCardでgetDisplayImageUrlを使用)
    const cardBackImageUrl = selectedPack?.cardBackImageUrl || '';
    
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
    const handleCardClick = useCallback(async (openerCardData: OpenerCardData) => {
        // 💡 修正: fetchCardInfo は async なので await が必須
        const actualCard: Card | undefined = await fetchCardInfo(openerCardData.cardId);

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
    }, [fetchCardInfo, selectedPack]);


    if (!selectedPack || displayedCards.length === 0) {
        return null;
    }

    return (
        <Box sx={{ /*mt: 3,*/ width: '100%', display: 'flex', flexDirection: 'column' }}>
            <PackOpeningAnimation
                openedCards={displayedCards}
                isRevealed={isRevealed}
                cardBackImageUrl={cardBackImageUrl}
                onCardClick={handleCardClick}
                sxOverride={sxOverride}
                aspectRatio={aspectRatio}
                gap={gap}
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
                
                /* 💡 修正: selectedPack から cardFieldSettings を取得して渡す */
                customFieldSettings={selectedPack.cardFieldSettings} 
                
                // 閲覧モードなので設定変更は常にダミー関数を渡す
                onCustomFieldSettingChange={() => {}}

                // パック開封結果の閲覧なので ReadOnly を true に設定
                isReadOnly={true}
            />

        </Box>
    );
};

export default PackOpenerHandler;