/* src/services/user-data/userDataService.ts
 *
 * IndexedDB (Dexie) の 'userSettings' テーブルに対して、
 * コイン以外のユーザー設定（isDTCGEnabled, isGodMode, cheatCountなど）
 * のロードと保存を行うサービス。設定は単一のキーで管理される。
 */

import { db } from '../database/db';
import type { DBSetting } from '../../models/db-types'; 
// import { ARCHIVE_GC_DEFAULTS } from '../../config/gcDefaults'; // ★ 削除: コンフィグへの依存をなくす

// ✅ 修正1: CustomFieldConfig をインポート
import type { CustomFieldConfig } from '../../models/userData';

const SETTINGS_KEY = 'userSettings'; 

// ★ 削除: getArchiveGcSetting でしか使われないため
// export type ArchiveCollectionKey = 'trash' | 'history'; 
// ★ ArchiveCollectionKey は archiveService.ts に戻す


// 🗑️ GC (Garbage Collection) 設定の型定義 🗑️

// ✅ 修正2: ItemGcSettings の定義を明確な位置に移動し、参照可能にする
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

/**
 * DBに保存するユーザー設定の具体的な型
 */
export interface PersistedUserSettings {
    isDTCGEnabled: boolean;
    isGodMode: boolean;
    cheatCount: number;
    isAllViewMode: boolean; 
    
    gcSettings: GCSetting; // 新しくネストした設定オブジェクト
    
    // ✅ 修正3: customFieldConfig を永続化対象に追加 (前回の修正)
    customFieldConfig: CustomFieldConfig; 
}

// サービスのデフォルト設定 (DBにデータがない場合に使用される)

// 💡 CustomFieldConfig の簡易的なデフォルト構造
const DEFAULT_CUSTOM_FIELD_CONFIG: CustomFieldConfig = {
    Pack: { bool: {}, num: {}, str: {} } as any, 
    Card: { bool: {}, num: {}, str: {} } as any,
    Deck: { bool: {}, num: {}, str: {} } as any,
};


export const DEFAULT_SETTINGS: PersistedUserSettings = {
    isDTCGEnabled: true,
    isGodMode: false,
    cheatCount: 0,
    isAllViewMode: false, 
    
    gcSettings: {
        trash: {
            packBundle: { timeLimit: 30, maxSize: 100 },
            deck: { timeLimit: 30, maxSize: 100 },
        },
        history: {
            packBundle: { timeLimit: 90, maxSize: 500 },
            deck: { timeLimit: 90, maxSize: 500 },
        },
    },
    
    // ✅ 修正4: customFieldConfig のデフォルト値を追加 (前回の修正)
    customFieldConfig: DEFAULT_CUSTOM_FIELD_CONFIG,
};

/**
 * IndexedDB (Dexie) の 'userSettings' テーブルに対するユーザー設定の操作を扱うサービス。
 */
export const userDataService = {

    /**
     * DBからユーザー設定をロードする。
     * @returns PersistedUserSettings (データが存在しない場合はデフォルト設定)
     */
    async loadSettings(): Promise<PersistedUserSettings> { 
        try {
            const entry = await db.userSettings.get(SETTINGS_KEY);
            
            if (entry) {
                // ロードした設定をベースに、不足しているプロパティはDEFAULT_SETTINGSで補完
                const loadedSettings = entry.value as Partial<PersistedUserSettings>;
                
                // ネストされたオブジェクトも安全に結合する (ディープマージの簡易版)
                const mergedGcSettings = {
                    ...DEFAULT_SETTINGS.gcSettings,
                    ...loadedSettings.gcSettings,
                    trash: {
                        ...DEFAULT_SETTINGS.gcSettings.trash,
                        ...loadedSettings.gcSettings?.trash,
                    },
                    history: {
                        ...DEFAULT_SETTINGS.gcSettings.history,
                        ...loadedSettings.gcSettings?.history,
                    },
                };

                // ✅ 修正5: customFieldConfig をマージする (前回の修正)
                const mergedCustomFieldConfig: CustomFieldConfig = {
                    ...DEFAULT_SETTINGS.customFieldConfig,
                    ...loadedSettings.customFieldConfig,
                } as CustomFieldConfig;

                return {
                    ...DEFAULT_SETTINGS,
                    ...loadedSettings,
                    gcSettings: mergedGcSettings,
                    customFieldConfig: mergedCustomFieldConfig,
                } as PersistedUserSettings;
            }
            return DEFAULT_SETTINGS; 
        } catch (error) {
            console.error("Failed to load user settings from DB:", error);
            return DEFAULT_SETTINGS; 
        }
    },

    /**
     * 現在のユーザー設定全体をDBに保存する（更新または新規作成）。
     * @param settings - 保存する設定オブジェクト
     */
    async saveSettings(settings: PersistedUserSettings): Promise<void> {
        // ... (省略) ...
        try {
            const settingEntry: DBSetting = {
                key: SETTINGS_KEY,
                value: settings
            };
            await db.userSettings.put(settingEntry); 
        } catch (error) {
            console.error("Failed to save user settings to DB:", error);
            throw new Error("ユーザー設定のDB保存に失敗しました。");
        }
    },

    /**
     * Storeから直接呼び出すための簡潔な設定取得関数
     */
    async getUserSettings(): Promise<PersistedUserSettings> {
        return this.loadSettings();
    }
    
    // ★ 削除: getArchiveGcSetting メソッドを削除
};