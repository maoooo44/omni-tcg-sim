/**
 * src/features/packs/hooks/usePackModals.ts
 *
 * * Pack編集画面でのモーダル制御ロジックを分離したカスタムフック。
 * * 責務:
 * 1. RarityEditorModalの開閉制御
 * 2. レアリティ設定の保存ハンドラ
 * 
 * ※ CardModal制御はusePackCardManagementに統合済み
 */

import { useState, useCallback } from 'react';
import type { Pack } from '../../../models/models';

/**
 * usePackModals のプロパティ
 */
export interface UsePackModalsProps {
    setPackData: React.Dispatch<React.SetStateAction<Pack | null>>;
}

/**
 * Pack編集画面でのモーダル管理フック
 * 
 * RarityEditorModalの開閉制御と保存処理を提供します。
 * 
 * @param props - setPackData
 * @returns モーダル制御の状態とハンドラ
 */
export const usePackModals = ({
    setPackData,
}: UsePackModalsProps) => {
    
    // --- RarityEditorModal制御 ---
    const [isRarityModalOpen, setIsRarityModalOpen] = useState(false);
    
    /**
     * RarityEditorModalを開く
     */
    const handleOpenRarityEditorModal = useCallback(() => {
        setIsRarityModalOpen(true);
    }, []);
    
    /**
     * RarityEditorModalを閉じる
     */
    const handleCloseRarityEditorModal = useCallback(() => {
        setIsRarityModalOpen(false);
    }, []);
    
    /**
     * レアリティ設定を保存してモーダルを閉じる
     */
    const handleRarityEditorSave = useCallback((updatedPack: Pack) => {
        setPackData(updatedPack);
        handleCloseRarityEditorModal();
    }, [setPackData, handleCloseRarityEditorModal]);
    
    return {
        // RarityEditorModal
        isRarityModalOpen,
        handleOpenRarityEditorModal,
        handleCloseRarityEditorModal,
        handleRarityEditorSave,
    };
};
