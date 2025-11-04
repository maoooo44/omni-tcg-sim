/**
 * src/configs/userDataConfigs.ts
 *
 * * ユーザーのパーシステントな設定（アプリケーション設定、GC設定、グリッド表示設定など）に対するデフォルト値を定義するモジュール。
 * 主にデータベースにユーザーデータが存在しない場合や、特定の項目が欠落している場合に使用されるフォールバック値を提供します。
 *
 * * 責務:
 * 1. ユーザーの設定項目 (`GridDisplayDefault`, `GCSetting`, `PersistedUserSettings`) ごとのアプリケーションデフォルト値を静的データとして保持する。
 * 2. 全てのユーザー設定を統合した最終的なデフォルトオブジェクト (`DEFAULT_USER_DATA_CONFIGS`) を提供する。
 */
import type {
    GridDisplayDefault,
    GCSetting,
    PersistedUserSettings
} from '../models/userData';

// ----------------------------------------
// 個別のデフォルト値
// ----------------------------------------

/** GridDisplayDefault のアプリケーションデフォルト値 */
export const DEFAULT_GRID_DISPLAY_DEFAULT: GridDisplayDefault = {
    isUserDefaultEnabled: false,
    globalColumns: null,
    advancedResponsive: {
        isEnabled: false,
        columns: {},
    }
}

/** GC設定のアプリケーションデフォルト値 */
export const DEFAULT_GC_CONFIGS: GCSetting = {
    trash: {
        packBundle: { timeLimit: 30, maxSize: 100 },
        deck: { timeLimit: 30, maxSize: 100 },
    },
    history: {
        packBundle: { timeLimit: 90, maxSize: 500 },
        deck: { timeLimit: 90, maxSize: 500 },
    },
};


// ----------------------------------------
// 統合されたデフォルト設定
// ----------------------------------------

/** DBにデータがない場合に使用される、全てのユーザー設定のデフォルト値 */
export const DEFAULT_USER_DATA_CONFIGS: PersistedUserSettings = {
    isDTCGEnabled: true,
    isGodMode: false,
    cheatCount: 0,

    gcSettings: DEFAULT_GC_CONFIGS,

    // customFieldConfig: 現在コメントアウトされているため、デフォルト設定オブジェクトから除外するか、コメントアウトを維持する。

    gridSettings: {
        cardPool: DEFAULT_GRID_DISPLAY_DEFAULT,
    }
};