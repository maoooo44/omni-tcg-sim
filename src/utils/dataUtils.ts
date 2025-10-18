/**
 * src/utils/dataUtils.ts
 *
 * アプリケーションのコアエンティティ（Deck, Pack, Card）の初期データ生成と、
 * 汎用的なID生成機能を提供するドメインレスなユーティリティ群。
 */

import { v4 as uuidv4 } from 'uuid'; 
import type { Deck } from '../models/deck';
import type { Pack } from '../models/pack'; 
import type { Card } from '../models/card';

/**
 * 汎用的なUUID (v4) を生成する関数。
 */
export const generateId = (): string => {
    return uuidv4();
}

/**
 * 新しいデッキの初期データを生成し、UUIDを付与します。
 * @param id - 外部からIDを指定する場合に使用（オプション）。指定がない場合は新規生成。
 */
// 💡 修正: createDefaultDeck を Pack や Card と同じように ID を引数で受け取れるようにする
export const createDefaultDeck = (id?: string): Deck => {
    const newDeckId = id || generateId(); 
    const now = new Date().toISOString();
    return {
        deckId: newDeckId,
        name: '新規デッキ', // deckStore のローカル名から変更
        description: '',
        imageUrl: undefined,
        number: undefined, // undefinedは自動採番フラグ
        mainDeck: new Map(), // Map<cardId, count>
        sideDeck: new Map(),
        extraDeck: new Map(),
        hasUnownedCards: false,
        isInStore: false,
        createdAt: now,
        updatedAt: now,
        // deckStore のローカルにあった imgColor: 'default' を追加
        imgColor: 'default', 
    };
}

/**
 * 新しいパックの初期データを生成し、UUIDを付与します。（PackEditで使用する詳細なデフォルト値）
 */
export const createDefaultPackData = (): Pack => {
    const newPackId = generateId(); 
    const now = new Date().toISOString();
    
    // Packのデフォルト値
    const DEFAULT_RARITY_CONFIG = [ 
        { rarityName: 'N', probability: 1 },
    ];
    const DEFAULT_ADVANCED_RARITY_CONFIG = [ 
        { rarityName: 'N', probability: 1, specialProbability:1, fixedValue: 0 },
    ];

    return {
        packId: newPackId,
        name: '新規パック', // PackEditの初期名
        series: '',
        cardsPerPack: 5, // PackEditの初期枚数
        packType: 'Booster',
        rarityConfig: DEFAULT_RARITY_CONFIG,
        advancedRarityConfig: DEFAULT_ADVANCED_RARITY_CONFIG,
        specialProbabilitySlots: 0,
        isAdvancedRulesEnabled: false,
        imageUrl: '',
        description: '', 
        totalCards: 0,
        isOpened: false,
        cardBackUrl: '', 
        price: 0, 
        releaseDate: new Date().toISOString().split('T')[0], 
        userCustom: {},
        number: undefined, // undefinedは自動採番フラグ
        isInStore: false, // 新規作成時のデフォルト
        createdAt: now,
        updatedAt: now,
    };
}

/**
 * 新しいカードの初期データを生成し、UUIDを付与します。
 * @param packId - 収録パックID (必須)
 */
export const createDefaultCard = (packId: string): Card => {
    const newCardId = generateId(); 
    const now = new Date().toISOString();

    return {
        cardId: newCardId, 
        packId: packId,
        name: '新しいカード',
        imageUrl: '',
        rarity: '',
        isFavorite: false,
        createdAt: now,
        updatedAt: now, // ISO 8601形式の最終更新日時
    };
}