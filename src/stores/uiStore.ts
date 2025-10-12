/**
 * src/stores/uiStore.ts
 *
 * アプリケーション全体のUIの状態を管理するZustandストア。
 * CardViewModalの表示状態と、表示対象のカードIDを一元管理する。
 */
import { create } from 'zustand';

export interface UIStore {
    // CardViewModalの状態
    isCardViewModalOpen: boolean;
    selectedCardId: string | null;

    /**
     * CardViewModalを開き、表示対象のカードIDを設定します。
     * @param cardId 表示するカードのID
     */
    openCardViewModal: (cardId: string) => void;

    /**
     * CardViewModalを閉じ、選択中のカードIDをリセットします。
     */
    closeCardViewModal: () => void;

    // TODO: 他のグローバルUI状態 (例: isMobileDrawerOpen, currentToastMessage) はここに追加
}

export const useUIStore = create<UIStore>((set) => ({
    // 初期状態
    isCardViewModalOpen: false,
    selectedCardId: null,

    // アクション
    openCardViewModal: (cardId) => {
        set({
            isCardViewModalOpen: true,
            selectedCardId: cardId,
        });
        console.log(`[UIStore] CardViewModal opened for ID: ${cardId}`);
    },

    closeCardViewModal: () => {
        set({
            isCardViewModalOpen: false,
            selectedCardId: null,
        });
        console.log(`[UIStore] CardViewModal closed.`);
    },
}));