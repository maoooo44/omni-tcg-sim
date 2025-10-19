/**
 * src/stores/userDataStore.ts
 *
 * ユーザーの設定（DTCG/Free/God Mode）および、それに関連するメタデータ（チート回数）の
 * グローバルな状態を管理するZustandストア。
 * 責務は、モード間の複雑なロジック処理と、userDataServiceを介した設定の永続化である。
 * 💡 修正: カスタムフィールド設定 (customFieldConfig) の更新と永続化アクションを追加。
 */

import { create } from 'zustand';
// userDataService から PersistedUserSettings と DEFAULT_SETTINGS をインポート
import { userDataService, type PersistedUserSettings, DEFAULT_SETTINGS } from '../services/user-data/userDataService'; 
// models/userData から必要な型をインポート
import { 
    type CurrentGameMode, 
    type UserDataState, 
    type CustomFieldConfig,

} from '../models/userData'; 
import type { CustomFieldType, CustomFieldIndex, FieldSetting } from '../models/custom-field';


// ----------------------------------------
// 💡 UserDataStore インターフェースの定義 (状態 + アクション)
// ----------------------------------------

/**
 * @description ユーザーデータのZustandストア全体（状態 + アクション）のインターフェース
 * 💡 UserDataState を継承し、アクションを追加する
 */
export interface UserDataStore extends UserDataState {
    // 💡 状態に依存するセレクター
    getCurrentMode: () => CurrentGameMode;
    
    // --- アクション ---
    loadUserData: () => Promise<void>; 
    setDTCGMode: (isEnabled: boolean) => Promise<void>; 
    setGodMode: (isGMode: boolean) => Promise<void>; 
    
    /** 外部データ（インポート）でユーザーデータを更新する */
    importUserData: (data: Omit<UserDataState & { coins: number }, 'coins'>) => Promise<void>;

    /** * 💡 新規追加: カスタムフィールドの設定 (displayName, isEnabled, description) を更新し永続化する 
     * itemType: 'Card', 'Deck', 'Pack'
     */
    onSettingChange: (
        itemType: 'Card' | 'Deck' | 'Pack',
        type: CustomFieldType, 
        index: CustomFieldIndex, 
        settingUpdates: Partial<FieldSetting>
    ) => Promise<void>; // 永続化を伴うため Promise<void>
}


// ----------------------------------------
// 初期値設定
// ----------------------------------------

// 💡 customFieldConfig の初期値を追加 (DEFAULT_SETTINGSから取得)
const initialCustomFieldConfig: CustomFieldConfig = { 
    Pack: DEFAULT_SETTINGS.customFieldConfig.Pack,
    Card: DEFAULT_SETTINGS.customFieldConfig.Card,
    Deck: DEFAULT_SETTINGS.customFieldConfig.Deck,
};

// ユーザーデータの初期値 (状態部分のみ)
const initialState: UserDataState = {
    isDTCGEnabled: true, 
    isGodMode: false,
    cheatCount: 0,
    isAllViewMode: false, 
    
    gcSettings: DEFAULT_SETTINGS.gcSettings,
    
    customFieldConfig: initialCustomFieldConfig, 
};


// ----------------------------------------
// ヘルパー関数
// ----------------------------------------

// DB保存のための永続化可能な状態を抽出するヘルパー関数
// PersistedUserSettings に customFieldConfig が含まれる前提で実装
const getPersistableState = (state: UserDataStore): PersistedUserSettings => ({
    isDTCGEnabled: state.isDTCGEnabled,
    isGodMode: state.isGodMode,
    cheatCount: state.cheatCount,
    isAllViewMode: state.isAllViewMode, 
    
    gcSettings: state.gcSettings,
    
    customFieldConfig: state.customFieldConfig, 
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
                    isAllViewMode: settings.isAllViewMode ?? initialState.isAllViewMode,
                    
                    gcSettings: settings.gcSettings,
                    
                    // customFieldConfig をロード（未設定の場合は初期値）
                    customFieldConfig: settings.customFieldConfig ?? initialState.customFieldConfig,
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
            isAllViewMode: data.isAllViewMode,
            
            gcSettings: data.gcSettings, 
            
            customFieldConfig: data.customFieldConfig,
        });
        await userDataService.saveSettings(getPersistableState(get()));
        console.log("User data imported and saved.");
    },

    // ----------------------------------------
    // 💡 新規実装: onSettingChange
    // ----------------------------------------
    onSettingChange: async (itemType, type, index, settingUpdates) => {
        set((state) => {
            // customFieldConfig 全体をシャローコピー
            const newConfig = { ...state.customFieldConfig };
            
            // 該当する itemType の設定をシャローコピー
            const newCategory = { ...newConfig[itemType] };
            
            // 該当する CustomFieldType の設定をシャローコピー
            const newTypeFields = { ...newCategory[type] };
            
            // 該当フィールドの現在の設定を取得し、更新内容をマージ
            const currentSetting = newTypeFields[index];
            newTypeFields[index] = { 
                ...currentSetting,
                ...settingUpdates 
            } as FieldSetting; // FieldSettingとしてキャスト
            
            // 階層を遡って新しい設定オブジェクトを構築
            newCategory[type] = newTypeFields;
            newConfig[itemType] = newCategory;

            return { customFieldConfig: newConfig };
        });
        
        // 永続化を実行
        await userDataService.saveSettings(getPersistableState(get()));
        console.log(`✅ Custom Field Setting updated for ${itemType} ${type}${index}`);
    },
}));