/**
 * src/models/deck.ts
 *
 * デッキエンティティの型定義ファイルです。
 * TCGシミュレータで使用されるデッキデータ構造（カードリスト、枚数、メタデータ）を定義します。
 */

export type DeckType = 'MainOnly' | 'MainSide' | 'MainSideExtra';


export interface Deck {
    deckId: string;
    name: string;
    number?: number | null; 
    imageUrl: string; // オプションとし、デフォルトでは空または undefined を想定
    imageColor?: string; // 例: 'red', 'blue'
    ruleId?: string; // このデッキが準拠するカスタムルールセットのID（オプション）
    deckType: DeckType; // デッキの構成要素
    totalCards: number;
    series: string; // デッキが属するTCGシリーズ名
    description: string;
    isLegal: boolean; // 準拠するruleSetに基づき、デッキが形式的に有効か
    hasUnownedCards: boolean;     // デッキに未所有カードが含まれているかどうかの状態
    isFavorite: boolean;
    createdAt: string; // ISO 8601形式のタイムスタンプ
    updatedAt: string; // ISO 8601形式のタイムスタンプ
    // デッキに含まれるカードと枚数
    // key: cardId (string), value: count (number)
    // Mapを使用して、編集時や検索時に高速なアクセスを可能にする
    mainDeck: Map<string, number>;
    sideDeck: Map<string, number>;
    extraDeck: Map<string, number>; // TCGによってはエクストラデッキ

    // ブール値カスタムインデックス (10枠)
    custom_1_bool?: boolean;
    custom_2_bool?: boolean;
    custom_3_bool?: boolean;
    custom_4_bool?: boolean;
    custom_5_bool?: boolean;
    custom_6_bool?: boolean;
    custom_7_bool?: boolean;
    custom_8_bool?: boolean;
    custom_9_bool?: boolean;
    custom_10_bool?: boolean;
    
    // 数値カスタムインデックス (10枠)
    custom_1_num?: number;
    custom_2_num?: number;
    custom_3_num?: number;
    custom_4_num?: number;
    custom_5_num?: number;
    custom_6_num?: number;
    custom_7_num?: number;
    custom_8_num?: number;
    custom_9_num?: number;
    custom_10_num?: number;

    // 文字列カスタムインデックス (10枠)
    custom_1_str?: string;
    custom_2_str?: string;
    custom_3_str?: string;
    custom_4_str?: string;
    custom_5_str?: string;
    custom_6_str?: string;
    custom_7_str?: string;
    custom_8_str?: string;
    custom_9_str?: string;
    custom_10_str?: string;
}

export interface DeckCard {
    cardId: string;
    count: number;
}
