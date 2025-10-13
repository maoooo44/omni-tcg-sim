/**
 * src/models/deck.ts
 *
 * デッキエンティティの型定義ファイルです。
 * TCGシミュレータで使用されるデッキデータ構造（カードリスト、枚数、メタデータ）を定義します。
 */
export interface Deck {
    deckId: string;
    name: string;
    description: string;
    
    // デッキのカスタム画像URL
    imageUrl?: string; // オプションとし、デフォルトでは空または undefined を想定

    // 💡 追加: プレースホルダー画像の色プリセットキー
    imgColor?: string; // 例: 'red', 'blue'

    // ★追加: ソート用/コレクション管理用ナンバー
    number?: number | null; 
    
    // デッキに含まれるカードと枚数
    // key: cardId (string), value: count (number)
    // Mapを使用して、編集時や検索時に高速なアクセスを可能にする
    mainDeck: Map<string, number>;
    sideDeck: Map<string, number>;
    extraDeck: Map<string, number>; // TCGによってはエクストラデッキの概念がある

    // デッキに未所有カードが含まれているかどうかの状態
    hasUnownedCards: boolean; 

    // メタデータ
    createdAt: string; // ISO 8601形式のタイムスタンプ
    updatedAt: string; // ISO 8601形式のタイムスタンプ
}

export interface DeckCard {
    cardId: string;
    count: number;
}