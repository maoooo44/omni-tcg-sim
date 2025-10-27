/**
 * src/utils/dataUtils.ts
 *
 * アプリケーションのコアエンティティ（Deck, Pack, Card）の初期データ生成と、
 * 汎用的なID生成機能を提供するドメインレスなユーティリティ群。
 */

import { v4 as uuidv4 } from 'uuid'; 
import type { Deck, DeckFieldSettings } from '../models/deck';
// 💡 Pack の型に加えて、設定の型もインポート
import type { Pack, PackFieldSettings, CardFieldSettings } from '../models/pack'; 
import type { Card } from '../models/card';
import type { FieldSetting } from '../models/customField'; // 💡 FieldSetting の型もインポート

/**
 * 汎用的なUUID (v4) を生成する関数。
 */
export const generateId = (): string => {
    return uuidv4();
}

/**
 * 💡 新規追加: 欠落しているフィールドをデフォルト値で補完する汎用関数
 * @param data - インポートされたデータ (ソース)
 * @param defaults - デフォルト値を保持するオブジェクト (ターゲット)
 * @returns 補完されたデータ (T)
 */
export const applyDefaultsIfMissing = <T extends Record<string, any>, D extends Record<string, any>>(
    data: T,
    defaults: D
): T => {
    // T型をベースにしたコピーを Record<string, any> としても扱えるようにキャスト
    const result: T = { ...data };
    const resultMutable = result as Record<string, any>; // 💡 修正: 一時的にインデックスアクセスを許可する型に

    // defaults のキーをすべてチェック
    for (const key in defaults) {
        // インポートされたデータ (result) の値が undefined または null の場合にのみ、デフォルト値を適用
        // key が T に存在しない可能性があるが、Record<string, any> によりアクセス可能
        if (resultMutable[key] === undefined || resultMutable[key] === null) {
            
            // 💡 修正: D型の値を T型のプロパティに代入
            // T型に存在しないプロパティにデフォルト値を設定しようとすると runtime error になる可能性はあるが、
            // 型定義T, DはPack/Deckモデルであり、keysは共通であるという前提で進めます。
            resultMutable[key] = defaults[key]; 
        }
    }
    return result; // 最終的な戻り値は T型を保証
};


// 💡 カスタムフィールド設定のデフォルト値を生成するヘルパー関数
const createDefaultFieldSettings = <K extends string>(keys: readonly K[], prefix: string): Record<K, FieldSetting> => {
    const settings = {} as Record<K, FieldSetting>;
    
    keys.forEach(key => {
        const parts = key.split('_');
        const type = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
        const index = parts[1];
        
        settings[key] = {
            displayName: `${prefix} ${type} ${index}`,
            isVisible: false, // デフォルトでは非表示
        } as FieldSetting;
    });
    
    return settings;
};

// ------------------------------------
// Core Model Default Data Generators
// ------------------------------------

/**
 * 新しいデッキの初期データを生成し、UUIDを付与します。
 * 💡 修正: 関数名を createDefaultDeckData に統一。ID生成は内部で行う。
 */
export const createDefaultDeck = (id?: string): Deck => {
    const newDeckId = id || generateId(); 
    const now = new Date().toISOString();
    const DECK_FIELD_KEYS = [
        'num_1', 'num_2', 'num_3', 'num_4',
        'str_1', 'str_2', 'str_3', 'str_4',
    ] as const;
    const defaultDeckFieldSettings = createDefaultFieldSettings(DECK_FIELD_KEYS, 'Deck') as DeckFieldSettings;
    return {
        deckId: newDeckId,
        name: '新規デッキ',
        number: undefined, 
        imageUrl: '',
        deckType: 'MainOnly',
        totalCards: 0,
        series: '',
        description: '', 
        isLegal: false,
        hasUnownedCards: false,
        isFavorite: false,
        createdAt: now,
        updatedAt: now,
        mainDeck: new Map(), // Map<cardId, count>
        sideDeck: new Map(),
        extraDeck: new Map(),  
        fieldSettings: defaultDeckFieldSettings,
    };
}


/**
 * 新しいパックの初期データを生成し、UUIDを付与します。（PackEditで使用する詳細なデフォルト値）
 */
export const createDefaultPack = (id?: string): Pack => {
    const newPackId = id || generateId(); // IDを引数で受け取れるようにする
    const now = new Date().toISOString();
    
    // 💡 Pack 自身のカスタムフィールドキー
    const PACK_FIELD_KEYS = ['num_1', 'num_2', 'str_1', 'str_2'] as const;
    // 💡 Card のカスタムフィールドキー (Pack の設定として保持)
    const CARD_FIELD_KEYS = [
        'num_1', 'num_2', 'num_3', 'num_4', 'num_5', 'num_6',
        'str_1', 'str_2', 'str_3', 'str_4', 'str_5', 'str_6'
    ] as const;

    // 💡 Pack Field Settings のデフォルト値を生成
    const defaultPackFieldSettings = createDefaultFieldSettings(PACK_FIELD_KEYS, 'Pack') as PackFieldSettings;
    
    // 💡 Card Field Settings のデフォルト値を生成
    const defaultCardFieldSettings = createDefaultFieldSettings(CARD_FIELD_KEYS, 'Card') as CardFieldSettings;
    
    const DEFAULT_RARITY_CONFIG = [ 
        { rarityName: 'N', probability: 1 },
    ];
    const DEFAULT_ADVANCED_RARITY_CONFIG = [ 
        // fixedValue: 0 は AdvancedRarityConfig で必須
        { rarityName: 'N', probability: 1, specialProbability: 1, fixedValue: 0 }, 
    ];

    return {
        packId: newPackId,
        name: '新規パック',
        number: undefined, 
        imageUrl: '',
        cardBackImageUrl: '', 
        price: 0, 
        packType: 'Booster',
        cardsPerPack: 5, 
        totalCards: 0,
        series: '',
        description: '', 
        isOpened: false,
        isFavorite: false,
        createdAt: now,
        updatedAt: now,
        rarityConfig: DEFAULT_RARITY_CONFIG,
        advancedRarityConfig: DEFAULT_ADVANCED_RARITY_CONFIG,
        specialProbabilitySlots: 0,
        isAdvancedRulesEnabled: false, 
        
        // 💡 Pack 自身のカスタムフィールド設定を追加
        packFieldSettings: defaultPackFieldSettings,
        
        // 💡 Card のカスタムフィールド設定を追加
        cardFieldSettings: defaultCardFieldSettings,

        // 💡 オプショナルな Pack のカスタムフィールドの値は初期データでは含めない（DB肥大化防止）
        // num_1, num_2, str_1, str_2 は Pack 型でオプショナルなため、このオブジェクトから省略
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
        number: undefined, 
        imageUrl: '',
        rarity: '',
        text: '',
        subtext: '',
        isFavorite: false,
        createdAt: now,
        updatedAt: now,
        // 💡 Card のカスタムフィールドの値 (num_1, str_1など) は Pack と同様に省略
    };
}