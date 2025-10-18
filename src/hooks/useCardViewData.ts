/**
 * src/hooks/useCardViewData.ts
 *
 * CardViewModal でカード詳細情報を表示するために必要なデータを取得・計算するカスタムフック。
 * zustandの useUIStore から表示対象のカードIDを取得し、useCardStore と usePackStore から対応する
 * Card オブジェクト、Pack オブジェクト、および PackName を計算して提供する。
 */
import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useUIStore } from '../stores/uiStore'; 
import { useCardStore } from '../stores/cardStore';
import { usePackStore } from '../stores/packStore';
import type { Card } from '../models/card';
import type { Pack } from '../models/pack';

interface CardViewData {
    isCardViewModalOpen: boolean;
    selectedCardId: string | null;
    closeCardViewModal: () => void;
    card: Card | undefined;
    packName: string;
}

export const useCardViewData = (): CardViewData => {
    // 1. UIストアからモーダルの状態とカードIDを取得
    const { isCardViewModalOpen, selectedCardId, closeCardViewModal } = useUIStore(useShallow(state => ({
        isCardViewModalOpen: state.isCardViewModalOpen,
        selectedCardId: state.selectedCardId,
        closeCardViewModal: state.closeCardViewModal,
    })));

    // 2. カードストアとパックストアから全データを取得
    const allCards = useCardStore(state => state.cards);
    const packs = usePackStore(state => state.packs);

    // 3. 表示対象のカードとパック情報を計算
    const result = useMemo(() => {
        if (!selectedCardId) {
            return {
                card: undefined,
                packName: '不明なパック',
            };
        }
        
        const card: Card | undefined = allCards.find(c => c.cardId === selectedCardId);
        let packName = '不明なパック';

        if (card) {
            const pack: Pack | undefined = packs.find(p => p.packId === card.packId);
            packName = pack ? pack.name : '不明なパック';
        }

        return { card, packName };
    }, [selectedCardId, allCards, packs]);

    return {
        isCardViewModalOpen,
        selectedCardId,
        closeCardViewModal,
        card: result.card,
        packName: result.packName,
    };
};