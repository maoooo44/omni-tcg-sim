/**
 * src/models/deck.ts
 *
 * デッキエンティティの型定義ファイルです。
 * TCGシミュレータで使用されるデッキデータ構造（カードリスト、枚数、メタデータ）を定義します。
 */

export type DeckType = 'MainOnly' | 'MainSide' | 'MainSideExtra';

export interface DisplaySetting {
    /** ユーザーフレンドリーな表示名 (例: 'マナコスト', '逃げるエネルギー') */
    displayName: string;
    /** 詳細画面などでこのフィールドを表示するかどうか */
    isVisible: boolean;
    /** 表示順序 (オプション) */
    order?: number; 
}

/** カードの標準フィールドの表示設定を定義する型 */
export interface DeckFieldSettings {
    num_1: DisplaySetting;
    num_2: DisplaySetting;
    num_3: DisplaySetting;
    num_4: DisplaySetting;
    str_1: DisplaySetting;
    str_2: DisplaySetting;
    str_3: DisplaySetting;
    str_4: DisplaySetting;
}



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
    keycard_1?: string; //キーカードのcardId
    keycard_2?: string;
    keycard_3?: string;
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

    num_1?: number | null; 
    num_2?: number | null;
    num_3?: number | null; 
    num_4?: number | null; 
    str_1?: string; 
    str_2?: string; 
    str_3?: string; 
    str_4?: string; 

    fieldSettings?: DeckFieldSettings;

    /** ユーザー定義のタグ/その他の属性。カスタムフィールドの代わり。 */
    tag?: Record<string, string>;
    /** 全文検索用の連結文字列（tagを結合） */
    searchText?: string;
}

export interface DeckCard {
    cardId: string;
    count: number;
}