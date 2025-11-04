/**
 * src/features/decks/hooks/helpers/deckStateHelpers.ts
 *
 * デッキエディターの状態管理に関するヘルパー関数群
 * 責務:
 * 1. ダーティチェック用の比較フィールド抽出
 * 2. Deckのディープコピー（Map型対応）
 * 3. ローカル状態更新ロジック
 */

import type { Deck } from '../../../../models/models';

// ----------------------------------------------------------------------
// Deckのダーティチェック用フィールド定義
// ----------------------------------------------------------------------

export type DeckCompareFields = Pick<Deck,
    'name' | 'number' | 'imageUrl' | 'imageColor' | 'ruleId' | 'deckType' | 'series' | 'description' |
    'keycard_1' | 'keycard_2' | 'keycard_3' | 'isLegal' | 'hasUnownedCards' | 'isFavorite' | 
    'mainDeck' | 'sideDeck' | 'extraDeck' |
    'num_1' | 'num_2' | 'num_3' | 'num_4' | 'str_1' | 'str_2' | 'str_3' | 'str_4' | 
    'deckFieldSettings' | 'tag' | 'searchText'
>;

// ----------------------------------------------------------------------
// Map型のディープコピーヘルパー
// ----------------------------------------------------------------------

/**
 * Deck全体をディープコピーする（Map型を含む）
 * @param deck コピー元のDeckオブジェクト
 * @returns ディープコピーされたDeckオブジェクト
 */
export const deepCopyDeck = (deck: Deck): Deck => {
    // 1. Map型をJSONシリアライズ可能な Array<[key, value]> に変換
    const jsonString = JSON.stringify(deck, (_key, value) => {
        if (value instanceof Map) {
            return Array.from(value.entries());
        }
        return value;
    });

    // 2. JSONからパースし、特定のキーの Array を Map に戻す
    return JSON.parse(jsonString, (key, value) => {
        if (key === 'mainDeck' || key === 'sideDeck' || key === 'extraDeck') {
            // valueが配列であることを確認し、Mapに復元
            if (Array.isArray(value)) {
                return new Map(value as [string, number][]);
            }
        }
        return value;
    }) as Deck;
};

// ----------------------------------------------------------------------
// 比較フィールド抽出関数
// ----------------------------------------------------------------------

/**
 * Deckから、ダーティチェック用の比較フィールドを抽出する
 * @param deck Deckオブジェクト
 * @returns 比較用のDeckCompareFields
 */
export const extractCompareFieldsFromDeck = (deck: Deck): DeckCompareFields => {
    // Map<cardId, count> を [cardId, count][] に変換し、cardIdでソート
    const mapToArrayAndSort = (map: Map<string, number>): [string, number][] =>
        Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));

    const deckFields: DeckCompareFields = {
        name: deck.name,
        number: deck.number || null,
        imageUrl: deck.imageUrl,
        imageColor: deck.imageColor,
        ruleId: deck.ruleId || undefined,
        deckType: deck.deckType,
        series: deck.series,
        description: deck.description,
        keycard_1: deck.keycard_1,
        keycard_2: deck.keycard_2,
        keycard_3: deck.keycard_3,
        isLegal: deck.isLegal,
        hasUnownedCards: deck.hasUnownedCards,
        isFavorite: deck.isFavorite,

        // Map型のゾーンを比較可能な配列に変換
        // @ts-ignore: Array.from(Map)をJSON.stringifyするために一旦anyとして扱う
        mainDeck: mapToArrayAndSort(deck.mainDeck) as any,
        // @ts-ignore: Array.from(Map)をJSON.stringifyするために一旦anyとして扱う
        sideDeck: mapToArrayAndSort(deck.sideDeck) as any,
        // @ts-ignore: Array.from(Map)をJSON.stringifyするために一旦anyとして扱う
        extraDeck: mapToArrayAndSort(deck.extraDeck) as any,

        // カスタムフィールド
        num_1: deck.num_1, 
        num_2: deck.num_2, 
        num_3: deck.num_3, 
        num_4: deck.num_4,
        str_1: deck.str_1, 
        str_2: deck.str_2, 
        str_3: deck.str_3, 
        str_4: deck.str_4,
        deckFieldSettings: deck.deckFieldSettings, 
        tag: deck.tag, 
        searchText: deck.searchText,
    };

    return deckFields;
};

// ----------------------------------------------------------------------
// 状態更新パラメータ型定義
// ----------------------------------------------------------------------

export interface UpdateLocalStateParams {
    setDeckData: React.Dispatch<React.SetStateAction<Deck | null>>;
    setInitialDeckModel: React.Dispatch<React.SetStateAction<Deck | null>>;
    setOriginalDeckData: React.Dispatch<React.SetStateAction<DeckCompareFields | null>>;
    setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
}

/**
 * ローカルステートを一括で更新し、ダーティチェックのベースラインを設定
 * @param deck 更新するDeckデータ
 * @param params 状態更新用のセッター関数群
 */
export const updateLocalState = (
    deck: Deck,
    params: UpdateLocalStateParams
): void => {
    const { setDeckData, setInitialDeckModel, setOriginalDeckData, setIsLoading } = params;
    
    // deckData の更新
    setDeckData(deck);
    
    // 復元用にディープコピーをセット (Mapを確実にコピーするため)
    setInitialDeckModel(deepCopyDeck(deck));
    
    // ダーティチェック用に比較フィールドをセット
    setOriginalDeckData(extractCompareFieldsFromDeck(deck));
    
    setIsLoading(false);
};
