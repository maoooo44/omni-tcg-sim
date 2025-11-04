/**
 * src/features/decks/hooks/useDeckCardManagement.ts
 *
 * * Deck編集画面でのカード管理ロジックを分離したカスタムフック。
 * * 責務:
 * 1. デッキゾーン（mainDeck/sideDeck/extraDeck）の選択状態管理
 * 2. カード追加・削除のハンドラ
 * 3. Map型のカード枚数管理とtotalCards/uniqueCardsの自動計算
 * 4. ゾーン切り替えハンドラ
 */

import { useState, useCallback } from 'react';
import type { Deck, DeckArea } from '../../../models/models';

/**
 * useDeckCardManagement のプロパティ
 */
export interface UseDeckCardManagementProps {
    deckData: Deck | null;
    setDeckData: React.Dispatch<React.SetStateAction<Deck | null>>;
}

/**
 * Deck編集画面でのカード管理フック
 * 
 * デッキゾーンの選択、カードの追加・削除、枚数計算を提供します。
 * 
 * @param props - deckData, setDeckData
 * @returns カード管理の状態とハンドラ
 */
export const useDeckCardManagement = ({
    deckData,
    setDeckData,
}: UseDeckCardManagementProps) => {
    
    // --- ゾーン選択状態 ---
    const [selectedDeckArea, setSelectedDeckArea] = useState<DeckArea>('mainDeck');
    
    // --- ゾーン切り替えハンドラ ---
    const handleAreaChange = useCallback((newArea: DeckArea) => {
        setSelectedDeckArea(newArea);
    }, []);
    
    // --- カード枚数更新ヘルパー ---
    
    /**
     * 指定されたゾーンのカード枚数を更新し、totalCards/uniqueCardsを再計算
     */
    const updateCardCount = useCallback((
        zone: keyof Pick<Deck, 'mainDeck' | 'sideDeck' | 'extraDeck'>, 
        cardId: string, 
        count: number
    ) => {
        setDeckData(prev => {
            if (!prev) return null;

            const newMap = new Map(prev[zone]);

            if (count > 0) {
                newMap.set(cardId, count);
            } else {
                newMap.delete(cardId);
            }

            // 各ゾーンのMapを更新
            const newMainMap = zone === 'mainDeck' ? newMap : prev.mainDeck;
            const newSideMap = zone === 'sideDeck' ? newMap : prev.sideDeck;
            const newExtraMap = zone === 'extraDeck' ? newMap : prev.extraDeck;

            // totalCards（総枚数）を計算
            const mainTotal = Array.from(newMainMap.values()).reduce((a, b) => a + b, 0);
            const sideTotal = Array.from(newSideMap.values()).reduce((a, b) => a + b, 0);
            const extraTotal = Array.from(newExtraMap.values()).reduce((a, b) => a + b, 0);
            const newTotalCards = mainTotal + sideTotal + extraTotal;
            
            // uniqueCards（ユニークなカード種類数）を計算
            const newUniqueCards = newMainMap.size + newSideMap.size + newExtraMap.size;

            return {
                ...prev,
                [zone]: newMap, 
                uniqueCards: newUniqueCards,
                totalCards: newTotalCards, 
            };
        });
    }, [setDeckData]);
    
    // --- カード追加・削除ハンドラ ---
    
    /**
     * 指定されたゾーンにカードを1枚追加
     */
    const handleCardAdd = useCallback((
        cardId: string, 
        deckArea: 'mainDeck' | 'sideDeck' | 'extraDeck'
    ) => {
        const currentCount = deckData ? deckData[deckArea].get(cardId) || 0 : 0;
        updateCardCount(deckArea, cardId, currentCount + 1);
    }, [deckData, updateCardCount]);

    /**
     * 指定されたゾーンからカードを1枚削除
     */
    const handleCardRemove = useCallback((
        cardId: string, 
        deckArea: 'mainDeck' | 'sideDeck' | 'extraDeck'
    ) => {
        const currentCount = deckData ? deckData[deckArea].get(cardId) || 0 : 0;
        updateCardCount(deckArea, cardId, currentCount - 1);
    }, [deckData, updateCardCount]);
    
    return {
        // ゾーン選択状態
        selectedDeckArea,
        
        // ゾーン切り替え
        handleAreaChange,
        
        // カード操作
        handleCardAdd,
        handleCardRemove,
    };
};
