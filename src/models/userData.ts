/**
 * src/models/userData.ts
 *
 * ユーザーデータの永続的な状態に関連する型定義を格納します。
 */

// 3つのモードを表す型を定義
export type CurrentGameMode = 'dtcg' | 'free' | 'god';

// 💡 修正: CustomFieldCategoryのインポートを削除
// GridBreakpointsをインポート
import type { GridBreakpoints } from './grid'; 


// ----------------------------------------------------
// 📌 サービスから移動: GC (Garbage Collection) 設定の型定義
// ----------------------------------------------------

// 各アイテムタイプ（Pack, Card, Deck）の保持設定
export interface ItemGcSettings {
    /** 削除までの期間 (日数)。 null/undefined の場合はサービスデフォルト値を使用。 */
    timeLimit: number | null | undefined; 
    /** 最大アイテム数。null/undefined の場合はサービスデフォルト値を使用。 */
    maxSize: number | null | undefined; 
}

// コレクション（Trash, History）ごとの GC 設定
export interface GCSetting {
    trash: {
        packBundle: ItemGcSettings;
        deck: ItemGcSettings;
    };
    history: {
        packBundle: ItemGcSettings;
        deck: ItemGcSettings;
    };
}

// ----------------------------------------------------
// 💡 新規追加: グリッド表示のコンポーネント別ユーザーデフォルト設定の型
// ----------------------------------------------------

/**
 * @description グリッド表示（列数）に関するユーザーの永続化デフォルト設定
 */
export interface GridDisplayDefault {
    /** ユーザー設定（グローバル or 高度）をアプリケーションデフォルトより優先して適用するかどうか */
    isUserDefaultEnabled: boolean;

    /** 1. シンプル設定 (全画面サイズでこの列数を使用) */
    globalColumns: number | null; 
    
    /** 2. 高度な設定 (レスポンシブ設定) */
    advancedResponsive: {
        /** 高度なレスポンシブ設定を有効にするか（trueの場合、globalColumnsを無視） */
        isEnabled: boolean;
        /** 画面サイズごとのデフォルト列数 (xs, sm, md, lg, xl) */
        columns: Partial<Record<GridBreakpoints, number>>;
    };
}


/**
 * @description カスタムフィールドのグローバル設定 (UserDataから削除)
 */
// 💡 削除: CustomFieldConfig の定義を削除

// ----------------------------------------------------
// 📌 サービスから移動: 永続化するユーザーデータの最終的な型
// ----------------------------------------------------

/**
 * @description DBに保存するユーザー設定の具体的な型 (永続化対象のすべてを含む)
 */
export interface PersistedUserSettings {
    isDTCGEnabled: boolean;
    isGodMode: boolean;
    cheatCount: number;
    
    gcSettings: GCSetting;
    
    // 💡 削除: customFieldConfig を削除

    gridSettings: {
        cardPool: GridDisplayDefault;
    };
}

// ----------------------------------------------------
// 💡 UserDataStoreが使用する状態の型（PersistedUserSettingsとほぼ同じだが、分離）
// ----------------------------------------------------

/**
 * @description ユーザーデータの永続的な状態を定義します。（アクションは含まない）
 */
export interface UserDataState {
    isDTCGEnabled: boolean;
    isGodMode: boolean;
    cheatCount: number;
    gcSettings: GCSetting;
    
    // 💡 削除: customFieldConfig を削除

    gridSettings: {
        /** カードプール表示に関するユーザーデフォルト設定 (Component-specific) */
        cardPool: GridDisplayDefault;
    };
}