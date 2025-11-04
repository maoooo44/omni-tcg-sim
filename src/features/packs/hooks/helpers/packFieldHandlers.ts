/**
 * src/features/packs/hooks/helpers/packFieldHandlers.ts
 *
 * パックエディターの基本的なフィールド更新ハンドラ群
 * 
 * ※ 基本的なハンドラは共通化済み（features/common/helpers/editorHandlers.ts）
 * ※ このファイルではPack固有の設定を適用したラッパーのみを提供
 */

import type { Pack } from '../../../../models/models';
import {
    createHandleInputChange as genericInputChange,
    createHandleSelectChange as genericSelectChange,
    createHandleToggleFavorite as genericToggleFavorite,
} from '../../../common/helpers/editorHandlers';

// ----------------------------------------------------------------------
// Pack-specific Input Change Handler
// ----------------------------------------------------------------------

export interface HandleInputChangeParams {
    packData: Pack | null;
    setPackData: React.Dispatch<React.SetStateAction<Pack | null>>;
}

/**
 * Pack用の入力フィールド変更ハンドラ
 * 数値フィールド: price, number, cardsPerPack
 */
export const createHandleInputChange = (params: HandleInputChangeParams) => {
    return genericInputChange({
        data: params.packData,
        setData: params.setPackData,
        numericFields: ['price', 'number', 'cardsPerPack'],
    });
};

// ----------------------------------------------------------------------
// Pack-specific Select Change Handler
// ----------------------------------------------------------------------

export interface HandleSelectChangeParams {
    packData: Pack | null;
    setPackData: React.Dispatch<React.SetStateAction<Pack | null>>;
}

/**
 * Pack用のセレクトフィールド変更ハンドラ
 */
export const createHandleSelectChange = (params: HandleSelectChangeParams) => {
    return genericSelectChange({
        data: params.packData,
        setData: params.setPackData,
    });
};

// ----------------------------------------------------------------------
// Pack-specific Toggle Favorite Handler
// ----------------------------------------------------------------------

export interface HandleToggleFavoriteParams {
    packId: string;
    isNewPack: boolean;
    updatePackIsFavorite: (packId: string, isFavorite: boolean) => Promise<Pack | null>;
}

/**
 * Pack用のお気に入り状態トグルハンドラ
 */
export const createHandleToggleFavorite = (params: HandleToggleFavoriteParams) => {
    return genericToggleFavorite({
        itemId: params.packId,
        isNew: params.isNewPack,
        updateIsFavorite: params.updatePackIsFavorite,
    });
};
