/**
 * src/features/packs/hooks/helpers/packStateHelpers.ts
 *
 * パックエディターの状態管理に関するヘルパー関数群
 * 責務:
 * 1. ダーティチェック用の比較フィールド抽出
 * 2. PackとCardsのバンドル状態更新ロジック
 */

import type { Pack, Card } from '../../../../models/models';

// ----------------------------------------------------------------------
// PackBundle に基づく比較用フィールド定義
// ----------------------------------------------------------------------

export type CardCompareFields = Pick<Card, 
    'name' | 'number' | 'imageUrl' | 'imageColor' | 'rarity' |
    'text' | 'subtext' | 'isFavorite' | 
    'num_1' | 'num_2' | 'num_3' | 'num_4' | 'num_5' | 'num_6' |
    'str_1' | 'str_2' | 'str_3' | 'str_4' | 'str_5' | 'str_6' | 
    'tag' | 'searchText'
>;

export type PackCompareFields = Pick<Pack,
    'name' | 'number' | 'imageUrl' | 'imageColor' | 'cardBackImageUrl' | 'cardBackImageColor' | 
    'price' | 'packType' | 'cardsPerPack' | 'series' |
    'description' | 'isOpened' | 'isFavorite' | 
    'rarityConfig' | 'advancedRarityConfig' | 'specialProbabilitySlots' | 'isAdvancedRulesEnabled' | 
    'constructedDeckCards' |
    'num_1' | 'num_2' | 'str_1' | 'str_2' | 
    'packFieldSettings' | 'cardFieldSettings' | 'tag' | 'searchText'
>;

export type PackBundleCompareFields = {
    pack: PackCompareFields;
    cards: CardCompareFields[];
};

// ----------------------------------------------------------------------
// 比較フィールド抽出関数
// ----------------------------------------------------------------------

/**
 * PackとCardsから、ダーティチェック用の比較フィールドを抽出する
 * @param pack Packオブジェクト
 * @param cards Cardオブジェクトの配列
 * @returns 比較用のPackBundleCompareFields
 */
export const extractCompareFieldsFromBundle = (
    pack: Pack, 
    cards: Card[]
): PackBundleCompareFields => {
    const packFields: PackCompareFields = {
        name: pack.name,
        series: pack.series,
        price: pack.price,
        cardsPerPack: pack.cardsPerPack,
        rarityConfig: pack.rarityConfig,
        advancedRarityConfig: pack.advancedRarityConfig,
        imageUrl: pack.imageUrl,
        imageColor: pack.imageColor,
        cardBackImageUrl: pack.cardBackImageUrl,
        packType: pack.packType,
        description: pack.description,
        isOpened: pack.isOpened,
        isFavorite: pack.isFavorite,
        specialProbabilitySlots: pack.specialProbabilitySlots,
        isAdvancedRulesEnabled: pack.isAdvancedRulesEnabled,
        number: pack.number,
        num_1: pack.num_1, 
        num_2: pack.num_2, 
        str_1: pack.str_1, 
        str_2: pack.str_2,
        packFieldSettings: pack.packFieldSettings, 
        cardFieldSettings: pack.cardFieldSettings, 
        tag: pack.tag, 
        searchText: pack.searchText,
        constructedDeckCards: pack.constructedDeckCards,
    };

    const cardFields: CardCompareFields[] = cards.map(c => ({
        name: c.name,
        number: c.number,
        imageUrl: c.imageUrl,
        imageColor: c.imageColor,
        rarity: c.rarity,
        text: c.text,
        subtext: c.subtext,
        isFavorite: c.isFavorite,
        num_1: c.num_1, 
        num_2: c.num_2, 
        num_3: c.num_3, 
        num_4: c.num_4, 
        num_5: c.num_5, 
        num_6: c.num_6,
        str_1: c.str_1, 
        str_2: c.str_2, 
        str_3: c.str_3, 
        str_4: c.str_4, 
        str_5: c.str_5, 
        str_6: c.str_6,
        tag: c.tag, 
        searchText: c.searchText,
    }));

    // カードを番号順にソート
    cardFields.sort((a, b) => (a.number || 0) - (b.number || 0));

    return {
        pack: packFields,
        cards: cardFields,
    };
};

// ----------------------------------------------------------------------
// 状態更新パラメータ型定義
// ----------------------------------------------------------------------

export interface UpdateLocalBundleStateParams {
    setPackData: React.Dispatch<React.SetStateAction<Pack | null>>;
    setCards: React.Dispatch<React.SetStateAction<Card[]>>;
    setOriginalPackBundleData: React.Dispatch<React.SetStateAction<PackBundleCompareFields | null>>;
    setOriginalCardIds: React.Dispatch<React.SetStateAction<Set<string>>>;
}

/**
 * PackとCardのローカル状態をまとめて更新するヘルパー関数
 * @param pack 更新するPackデータ
 * @param loadedCards 更新するCardデータ配列（nullの場合は空配列として扱う）
 * @param params 状態更新用のセッター関数群
 */
export const updateLocalBundleState = (
    pack: Pack,
    loadedCards: Card[] | null,
    params: UpdateLocalBundleStateParams
): void => {
    const { setPackData, setCards, setOriginalPackBundleData, setOriginalCardIds } = params;
    
    setPackData(pack);
    const finalCards = loadedCards || [];
    setCards(finalCards);
    
    // originalPackBundleDataは初回ロード時（nullのとき）または明示的なリセット時のみセット
    setOriginalPackBundleData(prev => 
        prev ?? extractCompareFieldsFromBundle(pack, finalCards)
    );
    
    // 元のカードIDリストも初回ロード時（size === 0のとき）または明示的なリセット時のみセット
    setOriginalCardIds(prev => 
        prev.size === 0 ? new Set(finalCards.map(c => c.cardId)) : prev
    );
    
    if (process.env.NODE_ENV !== 'production') {
        console.debug(`[packStateHelpers:updateLocalBundleState] 💾 Original Pack Bundle Data Set.`);
    }
};
