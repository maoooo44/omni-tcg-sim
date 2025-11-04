/**
 * src/features/packs/hooks/usePackCardManagement.ts
 *
 * * Pack編集画面でのカード管理ロジックを分離したカスタムフック。
 * * 責務:
 * 1. カードリスト（ローカル状態）の管理
 * 2. カード追加・編集・削除のハンドラ
 * 3. カードモーダルの開閉制御
 * 4. カード編集用のデフォルト値生成
 */

import { useState, useCallback } from 'react';
import { createDefaultCard } from '../../../utils/dataUtils';
import type { Pack, Card as CardType } from '../../../models/models';

/**
 * usePackCardManagement のプロパティ
 */
export interface UsePackCardManagementProps {
    packData: Pack | null;
    cards: CardType[];
    setCards: React.Dispatch<React.SetStateAction<CardType[]>>;
    isEditorMode: boolean;
}

/**
 * Pack編集画面でのカード管理フック
 * 
 * カードの追加・編集・削除、カードモーダルの制御を提供します。
 * 
 * @param props - packData, cards, setCards, isEditorMode
 * @returns カード管理の状態とハンドラ
 */
export const usePackCardManagement = ({
    packData,
    cards,
    setCards,
    isEditorMode,
}: UsePackCardManagementProps) => {
    
    // --- カードモーダル制御 ---
    const [isCardModalOpen, setIsCardModalOpen] = useState(false);
    const [editingCard, setEditingCard] = useState<CardType | null>(null);
    
    // --- モーダル開閉ハンドラ ---
    const handleCloseCardModal = useCallback(() => {
        setEditingCard(null);
        setIsCardModalOpen(false);
    }, []);
    
    /**
     * カード編集モーダルを開く（新規作成または既存カード編集）
     */
    const handleOpenCardEditorModal = useCallback((card: CardType | null) => {
        if (!packData) return;

        if (!card) {
            // 新規カード作成
            const defaultCard: CardType = createDefaultCard(packData.packId);

            // デフォルトレアリティを設定
            const defaultRarity = (packData.rarityConfig && packData.rarityConfig.length > 0)
                ? packData.rarityConfig[0].rarityName
                : 'Common';

            setEditingCard({
                ...defaultCard,
                rarity: defaultRarity,
            });

        } else {
            // 既存カード編集
            setEditingCard(card);
        }
        setIsCardModalOpen(true);
    }, [packData]);
    
    /**
     * カード閲覧モーダルを開く（閲覧モード）
     */
    const handleOpenCardViewModal = useCallback((card: CardType) => {
        if (!packData) return;

        setEditingCard(card);
        setIsCardModalOpen(true);

        // デバッグログ
        if (process.env.NODE_ENV !== 'production') {
            console.log('*** CardModal Parent Debug (PackEditor/View Mode) ***');
            console.log('Is this ReadOnly? (Expected:', !isEditorMode, '):', !isEditorMode);
            console.log('Card:', card.name, '| CardID:', card.cardId);
            console.log('Pack cardFieldSettings:', packData.cardFieldSettings || {});
            console.log('*******************************************');
        }
    }, [packData, isEditorMode]);
    
    // --- カード保存・削除ハンドラ ---
    
    /**
     * カード保存ハンドラ（新規作成または既存カード更新）
     */
    const handleCardSave = useCallback((cardToSave: CardType) => {
        if (!packData) return;
        
        const isNew = !cards.some(c => c.cardId === cardToSave.cardId);

        const finalCard: CardType = isNew
            ? {
                ...cardToSave,
                packId: packData.packId,
            }
            : cardToSave;

        setCards(prevCards => {
            if (isNew) {
                return [...prevCards, finalCard];
            } else {
                return prevCards.map(c =>
                    c.cardId === finalCard.cardId ? finalCard : c
                );
            }
        });
        
        handleCloseCardModal();
    }, [packData, cards, setCards, handleCloseCardModal]);
    
    /**
     * カード削除ハンドラ（ローカルリストから除外、DB削除は保存時）
     */
    const handleRemoveCard = useCallback(async (cardId: string) => {
        setCards(prevCards => prevCards.filter(c => c.cardId !== cardId));
        handleCloseCardModal();
    }, [setCards, handleCloseCardModal]);
    
    return {
        // モーダル状態
        isCardModalOpen,
        editingCard,
        
        // モーダル制御
        handleOpenCardEditorModal,
        handleOpenCardViewModal,
        handleCloseCardModal,
        
        // カード操作
        handleCardSave,
        handleRemoveCard,
    };
};
