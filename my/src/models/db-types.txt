// src/models/db-types.ts (修正・追記)

/**
 * IndexedDB (Dexie) に保存されるテーブルごとのデータ型定義
 */

export interface DBCardPool {
  cardId: string; // 主キー。どのカードかを示す
  count: number;  // 所有枚数
}

export interface DBSetting {
  key: string; // 主キー (例: 'coins', 'userSettings')
  value: any;  // 保存する値（JSONオブジェクトなど）
}

// 💡 デッキ（decksテーブル）のための型
export interface DBDeck {
    deckId: string; // 主キー
    name: string;
    description: string;
    
    // Map<string, number> ではなく JSON互換の Record<string, number>
    mainDeck: Record<string, number>; 
    sideDeck: Record<string, number>;
    extraDeck: Record<string, number>; 

    hasUnownedCards: boolean; 
    createdAt: string; 
    updatedAt: string; 
}

// 他のDBテーブル（例: UserSettings, DeckDataなど）の型もここに追加されます。