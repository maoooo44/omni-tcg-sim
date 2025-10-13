// src/utils/dataUtils.ts

import { v4 as generateUUID } from 'uuid';
import type { Deck } from '../models/deck';
import type { Pack } from '../models/pack'; 
import type { Card } from '../models/card';

/**
 * 💡 新規追加: 汎用的なUUID (v4) を生成する関数。
 * 以前 packUtils.ts にあった generatePackId の代替機能を提供します。
 */
export const generateId = (): string => {
    return generateUUID();
}

/**
 * 新しいデッキの初期データを生成し、UUIDを付与します。
 */
export const createDefaultDeck = (): Deck => {
    // 🚨 修正: generateUUID() の代わりに generateId() を使用
    const newDeckId = generateId(); 
    const now = new Date().toISOString();
    return {
        deckId: newDeckId,
        name: '新しいデッキ',
        description: '',
        imageUrl: undefined,
        // ★追加: undefinedは自動採番フラグ
        number: undefined, 
        // ---------------------------------------------
        mainDeck: new Map(),
        sideDeck: new Map(),
        extraDeck: new Map(),
        hasUnownedCards: false,
        createdAt: now,
        updatedAt: now,
    };
}

/**
 * 新しいパックの初期データを生成し、UUIDを付与します。（PackEditで使用する詳細なデフォルト値）
 */
export const createDefaultPackData = (): Pack => {
    // 🚨 修正: generateUUID() の代わりに generateId() を使用
    const newPackId = generateId(); 
    const now = new Date().toISOString();
    
    // Packのデフォルト値 (packUtilsから統合)
    const DEFAULT_RARITY_CONFIG = [ 
        { rarityName: 'Common', probability: 0.75 },
        { rarityName: 'Uncommon', probability: 0.20 },
        { rarityName: 'Rare', probability: 0.05 },
    ];

    return {
        packId: newPackId,
        name: '新規パック', // PackEditの初期名
        series: '未定',
        cardsPerPack: 12, // PackEditの初期枚数
        packType: 'Booster',
        rarityConfig: DEFAULT_RARITY_CONFIG,
        imageUrl: '',
        description: 'ブースターパックの説明をここに入力してください。', 
        totalCards: 0,
        isOpened: false,
        cardBackUrl: '', 
        price: 300, 
        releaseDate: new Date().toISOString().split('T')[0], 
        userCustom: {},
        // ★追加: undefinedは自動採番フラグ
        number: undefined, 
        // ---------------------------------------------
        isInStore: false, // 新規作成時のデフォルトはtrue
        updatedAt: now,
    };
}

/**
 * 新しいカードの初期データを生成し、UUIDを付与します。
 * @param packId - 収録パックID (必須)
 */
export const createDefaultCard = (packId: string): Card => {
    // 🚨 修正: デッキ/パックと同じ形式で ID とタイムスタンプを宣言する
    const newCardId = generateId(); 
    // Card モデルに timestamp があれば now も宣言するが、
    // 現在の Card モデルには更新日/作成日がないため、IDのみ宣言で統一
    const now = new Date().toISOString();
    
    // (もし Card モデルに createdAt/updatedAt が追加された場合は、const now = new Date().toISOString(); を追加)

    return {
        cardId: newCardId, // ★ 修正: 宣言した変数を使用
        packId: packId,
        name: '新しいカード',
        imageUrl: '',
        rarity: '',
        isInStore: false,
        userCustom: {},
        // number は自動採番のため省略
        updatedAt: now, // ISO 8601形式の最終更新日時
    };
}
