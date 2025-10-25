/* src/services/user-data/userDataService.ts
 *
 * IndexedDB (Dexie) の 'userSettings' テーブルに対して、
 * コイン以外のユーザー設定（isDTCGEnabled, isGodMode, cheatCountなど）
 * のロードと保存を行うサービス。設定は単一のキーで管理される。
 */

import { db } from '../database/db';
import type { DBSetting } from '../../models/db-types'; 
// 💡 既存: DEFAULT_SETTINGS のみインポート
import { DEFAULT_SETTINGS } from '../../configs/defaults';

// 💡 修正: CustomFieldConfig のインポートを削除
import type { 
    GridDisplayDefault, 
    PersistedUserSettings,
    GCSetting,
    ItemGcSettings
} from '../../models/userData'; 

const SETTINGS_KEY = 'userSettings'; 

export { DEFAULT_SETTINGS };


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
                const loadedSettings = entry.value as Partial<PersistedUserSettings>;
                
                // ネストされたオブジェクトも安全に結合する (ディープマージの簡易版)

                const mergedGcSettings: GCSetting = { // GCSettingに型注釈
                    ...DEFAULT_SETTINGS.gcSettings, 
                    ...loadedSettings.gcSettings,
                    trash: {
                        ...DEFAULT_SETTINGS.gcSettings.trash,
                        ...loadedSettings.gcSettings?.trash,
                        // 💡 ItemGcSettings のプロパティに型注釈を追加することで、使用を明確化できる
                        packBundle: {
                            ...(DEFAULT_SETTINGS.gcSettings.trash.packBundle as ItemGcSettings),
                            ...(loadedSettings.gcSettings?.trash.packBundle as Partial<ItemGcSettings>),
                        },
                        deck: {
                            ...(DEFAULT_SETTINGS.gcSettings.trash.deck as ItemGcSettings),
                            ...(loadedSettings.gcSettings?.trash.deck as Partial<ItemGcSettings>),
                        },
                    },
                    history: {
                        ...DEFAULT_SETTINGS.gcSettings.history,
                        ...loadedSettings.gcSettings?.history,
                        // 💡 ItemGcSettings のプロパティに型注釈を追加
                        packBundle: {
                            ...(DEFAULT_SETTINGS.gcSettings.history.packBundle as ItemGcSettings),
                            ...(loadedSettings.gcSettings?.history.packBundle as Partial<ItemGcSettings>),
                        },
                        deck: {
                            ...(DEFAULT_SETTINGS.gcSettings.history.deck as ItemGcSettings),
                            ...(loadedSettings.gcSettings?.history.deck as Partial<ItemGcSettings>),
                        },
                    },
                };

                // 💡 削除: mergedCustomFieldConfig のマージロジックを削除

                const mergedGridSettings = {
                    ...DEFAULT_SETTINGS.gridSettings, 
                    ...loadedSettings.gridSettings,
                    cardPool: { // GridDisplayDefault に型注釈を追加
                        ...(DEFAULT_SETTINGS.gridSettings.cardPool as GridDisplayDefault),
                        ...(loadedSettings.gridSettings?.cardPool as Partial<GridDisplayDefault>),
                        advancedResponsive: {
                            ...DEFAULT_SETTINGS.gridSettings.cardPool.advancedResponsive,
                            ...loadedSettings.gridSettings?.cardPool.advancedResponsive,
                        }
                    }
                }

                return {
                    ...DEFAULT_SETTINGS,
                    ...loadedSettings,
                    gcSettings: mergedGcSettings,
                    // 💡 削除: customFieldConfig のマージ結果を削除
                    gridSettings: mergedGridSettings,
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