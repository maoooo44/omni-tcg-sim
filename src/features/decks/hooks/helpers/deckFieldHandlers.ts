/**
 * src/features/decks/hooks/helpers/deckFieldHandlers.ts
 *
 * デッキエディターの基本的なフィールド更新ハンドラ群
 * 
 * ※ 基本的なハンドラは共通化済み（features/common/helpers/editorHandlers.ts）
 * ※ このファイルではDeck固有の設定（keycard_*, num_*）を適用したラッパーのみを提供
 */

import type { Deck } from '../../../../models/models';
import {
    createHandleInputChange as genericInputChange,
    createHandleSelectChange as genericSelectChange,
    createHandleToggleFavorite as genericToggleFavorite,
} from '../../../common/helpers/editorHandlers';

// ----------------------------------------------------------------------
// Deck-specific Input Change Handler
// ----------------------------------------------------------------------

export interface HandleInputChangeParams {
    deckData: Deck | null;
    setDeckData: React.Dispatch<React.SetStateAction<Deck | null>>;
}

/**
 * Deck用の入力フィールド変更ハンドラ
 * 数値フィールド: number, num_*
 * オプショナルフィールド: keycard_*（空文字→undefined）
 */
export const createHandleInputChange = (params: HandleInputChangeParams) => {
    return genericInputChange({
        data: params.deckData,
        setData: params.setDeckData,
        numericFields: ['number'],
        numericPrefixes: ['num_'],
        optionalPrefixes: ['keycard_'],
    });
};

// ----------------------------------------------------------------------
// Deck-specific Select Change Handler
// ----------------------------------------------------------------------

export interface HandleSelectChangeParams {
    deckData: Deck | null;
    setDeckData: React.Dispatch<React.SetStateAction<Deck | null>>;
}

/**
 * Deck用のセレクトフィールド変更ハンドラ
 */
export const createHandleSelectChange = (params: HandleSelectChangeParams) => {
    return genericSelectChange({
        data: params.deckData,
        setData: params.setDeckData,
    });
};

// ----------------------------------------------------------------------
// Deck-specific Toggle Favorite Handler
// ----------------------------------------------------------------------

export interface HandleToggleFavoriteParams {
    deckId: string;
    isNewDeck: boolean;
    updateDeckIsFavorite: (deckId: string, isFavorite: boolean) => Promise<Deck | null>;
}

/**
 * Deck用のお気に入り状態トグルハンドラ
 */
export const createHandleToggleFavorite = (params: HandleToggleFavoriteParams) => {
    return genericToggleFavorite({
        itemId: params.deckId,
        isNew: params.isNewDeck,
        updateIsFavorite: params.updateDeckIsFavorite,
    });
};
