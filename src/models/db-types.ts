/**
 * src/models/db-types.ts
 *
 * IndexedDB (Dexie) のテーブルに保存されるオブジェクトのスキーマ型定義。
 * このファイルは、アプリケーションモデル（src/models/*.ts）を、IndexedDBで永続化可能な
 * JSON互換の構造（Recordやプリミティブ型のみ）に変換したデータ構造を定義します。
 */

import type { PackType, RarityConfig, AdvancedRarityConfig, PackFieldSettings, CardFieldSettings } from "./pack"; // Cardの型定義は別ファイルからインポート
import type { DeckType, DeckFieldSettings} from "./deck"; // Cardの型定義は別ファイルからインポート
import type { ArchiveCollectionKey } from "./archive"; 



// Card Data (DBに保存される JSON 互換の構造) (変更なし)
export interface DBCard {
    cardId: string; // カードの一意な識別子
    packId: string; // 収録されているパックのID
    name: string; // 
    number?: number | null;  // 図鑑ナンバー/ソート順として使用
    imageUrl: string; // カード画像の参照URL
    imageColor?: string; //プレースホルダーの色プリセットキー
    rarity: string; // 収録されているレアリティ名（Pack.rarityConfig.rarityNameに対応）
    text: string;
    subtext: string;
    isFavorite: boolean;
    createdAt: string; // ISO 8601形式の作成日時
    updatedAt: string; // ISO 8601形式の最終更新日時

    num_1?: number | null; 
    num_2?: number | null;
    num_3?: number | null; 
    num_4?: number | null; 
    num_5?: number | null; 
    num_6?: number | null; 
    str_1?: string; 
    str_2?: string; 
    str_3?: string; 
    str_4?: string; 
    str_5?: string;
    str_6?: string;

    tag?: Record<string, string>;
    searchText?: string;
}

// Pack Data (DBに保存される JSON 互換の構造) (変更なし)
export interface DBPack {
    packId: string; // パックID (ユニークID, 自動生成)
    name: string;
    number?: number | null;
    imageUrl: string; // 拡張パック画像の参照URL
    imageColor?: string; //プレースホルダーの色プリセットキー
    cardBackImageUrl: string; // カード裏面画像の参照URL
    packType: PackType;
    cardsPerPack: number; // 1パックあたりの封入枚数
    rarityConfig: RarityConfig[]; // レアリティと封入確率の配列
    advancedRarityConfig?: AdvancedRarityConfig[]; // 高度な確定枚数を含むレアリティ設定
    specialProbabilitySlots: number;
    isAdvancedRulesEnabled: boolean;
    price: number; // ゲーム内通貨での価格
    totalCards: number; // 収録カード総数 (自動集計)
    series: string; // TCGシリーズ名
    description: string;
    isOpened: boolean; // 開封済みフラグ
    isFavorite: boolean;
    createdAt: string;
    updatedAt: string; // ISO 8601形式の最終更新日時

    cardPresetId?: string;
    num_1?: number | null;
    num_2?: number | null; 
    str_1?: string;
    str_2?: string;
    packFieldSettings?: PackFieldSettings;
    cardFieldSettings?: CardFieldSettings;
    tag?: Record<string, string>;
    searchText?: string;
    
}

// Deck Data (DBに保存される JSON 互換の構造) (変更なし)
export interface DBDeck {
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
    mainDeck: Record<string, number>; 
    sideDeck: Record<string, number>; 
    extraDeck: Record<string, number>;  // TCGによってはエクストラデッキ

    num_1?: number | null; 
    num_2?: number | null;
    num_3?: number | null; 
    num_4?: number | null; 
    str_1?: string; 
    str_2?: string; 
    str_3?: string; 
    str_4?: string; 
    fieldSettings?: DeckFieldSettings;
    tag?: Record<string, string>;
    searchText?: string;
}

// Card Pool (変更なし)
export interface DBCardPool {
    cardId: string; // 主キー。どのカードかを示す
    count: number;  // 所有枚数
}

// User Settings (汎用的なキー・バリュー形式) (変更なし)
export interface DBSetting {
    key: string; // 主キー (例: 'coins', 'userSettings')
    value: any;     // 保存する値（JSONオブジェクトなど）
}



// --- 履歴/ゴミ箱データ型 ---

export type ItemType = 'card' | 'pack' | 'deck';

export interface DBPackBundle {
    packData: DBPack;   // パック本体のメタデータ
    cardsData: DBCard[]; // その時点の全カードの配列
}

export type DBArchiveData = DBPackBundle | DBDeck;

export interface DBArchive {  
    archiveId: string
    itemId: string;   // 削除されたアイテムの元ID（Pack ID, Deck ID）
    itemType: 'packBundle' | 'deck';
    collectionKey?: ArchiveCollectionKey;
    archivedAt: string; // ISO 8601形式のタイムスタンプ
    itemData: DBArchiveData;
    isFavorite: boolean;
    isManual: boolean; //手動で作成されたか
}