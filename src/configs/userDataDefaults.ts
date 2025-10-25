// src/configs/userDataDefaults.ts

// 💡 修正: 必要な型をすべて models/userData からインポートする (循環参照の解消)
import type { 
    /*CustomFieldConfig,*/ 
    GridDisplayDefault,
    GCSetting, 
    PersistedUserSettings 
} from '../models/userData'; 

// ----------------------------------------
// 個別のデフォルト値
// ----------------------------------------

/** カスタムフィールドの簡易的なデフォルト構造 
export const DEFAULT_CUSTOM_FIELD_CONFIG: CustomFieldConfig = {
    Pack: { bool: {}, num: {}, str: {} } as any, 
    Card: { bool: {}, num: {}, str: {} } as any,
    Deck: { bool: {}, num: {}, str: {} } as any,
};*/

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
export const DEFAULT_GC_SETTINGS: GCSetting = {
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
export const DEFAULT_SETTINGS: PersistedUserSettings = {
    isDTCGEnabled: true,
    isGodMode: false,
    cheatCount: 0,
    
    gcSettings: DEFAULT_GC_SETTINGS,
    
    //customFieldConfig: DEFAULT_CUSTOM_FIELD_CONFIG,

    gridSettings: {
        cardPool: DEFAULT_GRID_DISPLAY_DEFAULT,
    }
};