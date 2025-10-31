/**
 * src/models/deck.ts
 *
 * * デッキエンティティのデータ構造と関連型を定義するモデル層モジュール。
 * TCGシミュレータで使用されるデッキデータ（デッキ構成、メタデータ、カスタムフィールド設定）を表現します。
 *
 * * 責務:
 * 1. デッキの構成タイプ（DeckType）を定義する。
 * 2. デッキのカスタムフィールドの表示設定（DeckFieldSettings）を定義する。
 * 3. デッキ本体のデータ構造（Deck）を定義する（ID、カードリスト、枚数、メタデータ、状態フラグ）。
 * 4. デッキ内のカードの最小単位（DeckCard）を定義する。
 */

export type DeckType = 'MainOnly' | 'MainSide' | 'MainSideExtra';

import type { FieldSetting } from './customField';


/** カードの標準フィールドの表示設定を定義する型 */
export interface DeckFieldSettings {
    num_1: FieldSetting;
    num_2: FieldSetting;
    num_3: FieldSetting;
    num_4: FieldSetting;
    str_1: FieldSetting;
    str_2: FieldSetting;
    str_3: FieldSetting;
    str_4: FieldSetting;
}



export interface Deck {
    deckId: string;
    name: string;
    number?: number | null;
    imageUrl: string;
    imageColor?: string;
    ruleId?: string;
    deckType: DeckType;
    totalCards: number;
    series: string;
    description: string;
    keycard_1?: string;
    keycard_2?: string;
    keycard_3?: string;
    isLegal: boolean;
    hasUnownedCards: boolean;
    isFavorite: boolean;
    createdAt: string;
    updatedAt: string;
    // デッキに含まれるカードと枚数
    // key: cardId (string), value: count (number)
    mainDeck: Map<string, number>;
    sideDeck: Map<string, number>;
    extraDeck: Map<string, number>;

    num_1?: number | null;
    num_2?: number | null;
    num_3?: number | null;
    num_4?: number | null;
    str_1?: string;
    str_2?: string;
    str_3?: string;
    str_4?: string;

    fieldSettings: DeckFieldSettings;

    /** ユーザー定義のタグ/その他の属性。カスタムフィールドの代わり。 */
    tag?: string[];
    /** 全文検索用の連結文字列（tagを結合） */
    searchText?: string;
}

export interface DeckCard {
    cardId: string;
    count: number;
}