// src/utils/dataUtils.ts (新規作成を想定)

import { v4 as generateUUID } from 'uuid';
import type { Deck } from '../models/deck';
import type { Pack } from '../models/pack'; // packの型をインポート


/**
 * 新しいデッキの初期データを生成し、UUIDを付与します。
 */
export const createDefaultDeck = (): Deck => {
    const newDeckId = generateUUID();
    const now = new Date().toISOString();
    return {
        deckId: newDeckId,
        name: '新しいデッキ',
        description: '',
        imageUrl: undefined,
        mainDeck: new Map(),
        sideDeck: new Map(),
        extraDeck: new Map(),
        hasUnownedCards: false,
        createdAt: now,
        updatedAt: now,
    };
}

/**
 * 新しいパックの初期データを生成し、UUIDを付与します。
 * (既存の createDefaultPack() を置き換える)
 */
export const createDefaultPackData = (): Pack => {
    const newPackId = generateUUID();
    // const now = new Date().toISOString();
    
    // Packのデフォルト値 (既存のロジックを参考に)
    const DEFAULT_RARITY_CONFIG = [{ rarityName: 'Common', probability: 1.0 }];

    return {
        packId: newPackId,
        name: '新しいパック',
        series: '未設定',
        cardsPerPack: 5,
        packType: 'Booster',
        rarityConfig: DEFAULT_RARITY_CONFIG,
        imageUrl: '',
        description: '',
        totalCards: 0, // 初期カード数は0
        isOpened: false,
        // createdAt: now,
        // updatedAt: now,
        cardBackUrl: '', 
        price: 0, 
        releaseDate: '', 
        userCustom: {}
    };
}