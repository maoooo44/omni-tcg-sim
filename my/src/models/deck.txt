// src/models/deck.ts
/**
 * デッキエンティティの型定義
 * TCGシミュレータのデッキデータ構造を定義する
 */
export interface Deck {
    deckId: string;
    name: string;
    description: string;
    
    // デッキに含まれるカードと枚数
    // key: cardId (string), value: count (number)
    // Mapを使用して、編集時や検索時に高速なアクセスを可能にする
    mainDeck: Map<string, number>;
    sideDeck: Map<string, number>;
    extraDeck: Map<string, number>; // TCGによってはエクストラデッキの概念がある

    // 💡 新規追加: デッキに未所有カードが含まれているかどうかの状態
    hasUnownedCards: boolean; 
    // 💡 (オプション) どのカードが未所有か具体的な情報を持っても良いが、今回はbooleanでシンプルに

    // メタデータ
    createdAt: string; // ISO 8601形式のタイムスタンプ
    updatedAt: string; // ISO 8601形式のタイムスタンプ
}