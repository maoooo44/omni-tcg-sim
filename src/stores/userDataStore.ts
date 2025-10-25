/**
 * src/stores/userDataStore.ts
 *
 * ユーザーの設定（DTCG/Free/God Mode）および、それに関連するメタデータ（チート回数）の
 * グローバルな状態を管理するZustandストア。
 * 責務は、モード間の複雑なロジック処理と、userDataServiceを介した設定の永続化である。
 * 💡 修正: カスタムフィールド設定 (customFieldConfig) の更新と永続化アクションを削除。
 * 📌 修正: gridSettings の状態とロジックを追加。
 */

import { create } from 'zustand';
// userDataService から PersistedUserSettings と DEFAULT_SETTINGS をインポート
import { userDataService, DEFAULT_SETTINGS } from '../services/user-data/userDataService'; 
// models/userData から必要な型をインポート
import type{ CurrentGameMode, UserDataState, GridDisplayDefault, PersistedUserSettings, } from '../models/userData'; 
// 💡 削除: CustomFieldType, CustomFieldIndex, FieldSetting のインポートを削除


// ----------------------------------------
// 💡 UserDataStore インターフェースの定義 (状態 + アクション)
// ----------------------------------------

// ... (UserDataStore インターフェースの定義は変更なし) ...

export interface UserDataStore extends UserDataState {
    // 💡 状態に依存するセレクター
    getCurrentMode: () => CurrentGameMode;
    
    // --- アクション ---
    loadUserData: () => Promise<void>; 
    setDTCGMode: (isEnabled: boolean) => Promise<void>; 
    setGodMode: (isGMode: boolean) => Promise<void>; 
    
    /** 外部データ（インポート）でユーザーデータを更新する */
    importUserData: (data: Omit<UserDataState & { coins: number }, 'coins'>) => Promise<void>;

    /** * 💡 削除: カスタムフィールドの設定 (displayName, isEnabled, description) を更新し永続化するアクションを削除 */

    // 📌 新規追加: GridDisplayDefault の設定を更新するアクション
    setGridDisplayDefault: (
        componentKey: 'cardPool', // 現時点では cardPool のみ
        updates: Partial<GridDisplayDefault>
    ) => Promise<void>;
}


// ----------------------------------------
// 初期値設定
// ----------------------------------------

// 💡 削除: customFieldConfig の初期値設定を削除

// 📌 既存: gridSettings の初期値
const initialGridSettings = DEFAULT_SETTINGS.gridSettings;

// ユーザーデータの初期値 (状態部分のみ)
const initialState: UserDataState = {
    isDTCGEnabled: true, 
    isGodMode: false,
    cheatCount: 0,
    
    gcSettings: DEFAULT_SETTINGS.gcSettings,
    
    // 💡 削除: customFieldConfig を削除

    // 📌 既存: gridSettings の初期値を設定
    gridSettings: initialGridSettings,
};


// ----------------------------------------
// ヘルパー関数
// ----------------------------------------

// DB保存のための永続化可能な状態を抽出するヘルパー関数
const getPersistableState = (state: UserDataStore): PersistedUserSettings => ({
    isDTCGEnabled: state.isDTCGEnabled,
    isGodMode: state.isGodMode,
    cheatCount: state.cheatCount,
    
    gcSettings: state.gcSettings,
    
    // 💡 削除: customFieldConfig を削除

    // 📌 gridSettings を永続化対象に追加
    gridSettings: state.gridSettings,
});


// ----------------------------------------
// Zustand Store 実装
// ----------------------------------------

export const useUserDataStore = create<UserDataStore>((set, get) => ({
    ...initialState,
    
    // 現在のモードを計算して返すセレクター
    getCurrentMode: () => {
        const { isDTCGEnabled, isGodMode } = get();
        if (isGodMode) return 'god' as CurrentGameMode; 
        if (isDTCGEnabled) return 'dtcg' as CurrentGameMode;
        return 'free' as CurrentGameMode;
    },

    loadUserData: async () => {
        try {
            const settings = await userDataService.loadSettings();
            if (settings) {
                set({ 
                    isDTCGEnabled: settings.isDTCGEnabled,
                    isGodMode: settings.isGodMode,
                    cheatCount: settings.cheatCount,
                    
                    gcSettings: settings.gcSettings,
                    
                    // 💡 削除: customFieldConfig のロードを削除

                    // 📌 gridSettings をロード
                    gridSettings: settings.gridSettings,
                });
            }
            console.log("✅ User data initialized.");
        } catch (error) {
            console.error('Failed to load user data:', error);
        }
    },
    
    setDTCGMode: async (isEnabled: boolean) => {
        set({ isDTCGEnabled: isEnabled }); 
        await userDataService.saveSettings(getPersistableState(get()));
        console.log(`DTCG Mode set to ${isEnabled}.`);
    },

    setGodMode: async (isGMode: boolean) => {
        const currentGodMode = get().isGodMode;
        
        if (isGMode && !currentGodMode) {
            const { cheatCount } = get();
            let newCheatCount = cheatCount + 1; 
            
            set({ 
                isGodMode: isGMode, 
                isDTCGEnabled: true, // God ModeはDTCGの派生
                cheatCount: newCheatCount 
            });
            console.log(`God Mode Activated. Cheat Count: ${newCheatCount}`);

        } else if (!isGMode && currentGodMode) {
            // God Modeを解除する場合は、DTCGモードに戻る（isDTCGEnabledはtrueを維持）
            set({ isGodMode: isGMode });
            console.log("God Mode Deactivated.");
        } else {
            return;
        }
        
        await userDataService.saveSettings(getPersistableState(get()));
    },
        
    importUserData: async (data) => { 
        set({ 
            isDTCGEnabled: data.isDTCGEnabled,
            isGodMode: data.isGodMode,
            cheatCount: data.cheatCount,
            
            gcSettings: data.gcSettings, 
            
            // 💡 削除: customFieldConfig のインポートを削除

            // 📌 gridSettings をインポート
            gridSettings: data.gridSettings,
        });
        await userDataService.saveSettings(getPersistableState(get()));
        console.log("User data imported and saved.");
    },

    // ----------------------------------------
    // 💡 削除: onSettingChange アクションの実装を削除
    // ----------------------------------------

    // ----------------------------------------
    // 📌 既存実装: setGridDisplayDefault
    // ----------------------------------------
    setGridDisplayDefault: async (componentKey, updates) => {
        set((state) => {
            // 階層のシャローコピー
            const newGridSettings = { ...state.gridSettings };
            const currentSettings = newGridSettings[componentKey];
            
            // 該当するコンポーネントの設定を更新
            newGridSettings[componentKey] = {
                ...currentSettings,
                ...updates,
                // advancedResponsive のネストされたオブジェクトも更新対象にある可能性
                advancedResponsive: {
                    ...currentSettings.advancedResponsive,
                    ...updates.advancedResponsive,
                }
            };
            return { gridSettings: newGridSettings };
        });

        // 永続化を実行
        await userDataService.saveSettings(getPersistableState(get()));
        console.log(`✅ Grid Display Default updated for ${componentKey}.`);
    }
}));