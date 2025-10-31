/**
 * src/models/userData.ts
 *
 * * ユーザーの永続的な設定と状態（ユーザーデータ）に関連する全ての型定義を格納するモデル層モジュール。
 * ゲームモード、ガベージコレクション（GC）設定、グリッド表示のデフォルト設定など、
 * アプリケーションの状態管理層（Store）や永続化層が使用するデータ構造を定義します。
 *
 * * 責務:
 * 1. 現在のゲームモードの型（CurrentGameMode）を定義する。
 * 2. アーカイブ機能のGC設定構造（GCSetting, ItemGcSettings）を定義する。
 * 3. グリッド表示のコンポーネント別ユーザーデフォルト設定構造（GridDisplayDefault）を定義する。
 * 4. DBに保存するユーザー設定の最終的な型（PersistedUserSettings）を定義する。
 * 5. ユーザーデータの状態管理が使用する型（UserDataState）を定義する。
 */

// 3つのモードを表す型を定義
export type CurrentGameMode = 'dtcg' | 'free' | 'god';

import type { GridBreakpoints } from './grid';


// ----------------------------------------------------
// サービスから移動: GC (Garbage Collection) 設定の型定義
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
// 新規追加: グリッド表示のコンポーネント別ユーザーデフォルト設定の型
// ----------------------------------------------------

/**
 * グリッド表示（列数）に関するユーザーの永続化デフォルト設定
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


// ----------------------------------------------------
// サービスから移動: 永続化するユーザーデータの最終的な型
// ----------------------------------------------------

/**
 * DBに保存するユーザー設定の具体的な型 (永続化対象のすべてを含む)
 */
export interface PersistedUserSettings {
    isDTCGEnabled: boolean;
    isGodMode: boolean;
    cheatCount: number;

    gcSettings: GCSetting;

    gridSettings: {
        cardPool: GridDisplayDefault;
    };
}

// ----------------------------------------------------
// UserDataStoreが使用する状態の型（PersistedUserSettingsとほぼ同じだが、分離）
// ----------------------------------------------------

/**
 * ユーザーデータの永続的な状態を定義します。（アクションは含まない）
 */
export interface UserDataState {
    isDTCGEnabled: boolean;
    isGodMode: boolean;
    cheatCount: number;
    gcSettings: GCSetting;

    gridSettings: {
        /** カードプール表示に関するユーザーデフォルト設定 (Component-specific) */
        cardPool: GridDisplayDefault;
    };
}