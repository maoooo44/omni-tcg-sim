/**
 * src/models/db-types.ts
 *
 * IndexedDB (Dexie) の各テーブルに保存されるオブジェクトのデータ構造を定義する型ファイルです。
 * カードプール、ユーザー設定、デッキデータなど、永続化が必要なデータ型が含まれます。
 */

export interface DBCardPool {
  cardId: string; // 主キー。どのカードかを示す
  count: number;  // 所有枚数
}

export interface DBSetting {
  key: string; // 主キー (例: 'coins', 'userSettings')
  value: any;  // 保存する値（JSONオブジェクトなど）
}

export interface DBDeck {
    deckId: string; // 主キー
    name: string;
    description: string;
    
    // JSON互換の Record<string, number> でカードIDと枚数をマッピング
    mainDeck: Record<string, number>; 
    sideDeck: Record<string, number>;
    extraDeck: Record<string, number>; 

    hasUnownedCards: boolean;
    createdAt: string; 
    updatedAt: string; 
}

// 他のDBテーブル（例: UserSettings, DeckDataなど）の型もここに追加されます。