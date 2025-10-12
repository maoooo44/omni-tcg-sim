// src/stores/userDataStore.ts (修正と追加)

import { create } from 'zustand';
import { userSettingsService, type PersistedUserSettings } from '../services/user-logic/userSettingsService';

// 💡 追加: 3つのモードを表す型を定義
export type CurrentDtcgMode = 'dtcg' | 'free' | 'god';

export interface UserDataState {
    isDTCGEnabled: boolean;     
    isGodMode: boolean;         
    cheatCount: number;         
    
    // 💡 追加: 現在のモードを取得するセレクター関数（アクションではない）
    getCurrentMode: () => CurrentDtcgMode;
    
    // --- アクション ---
    loadUserData: () => Promise<void>; 
    setDTCGMode: (isEnabled: boolean) => Promise<void>; 
    setGodMode: (isGMode: boolean) => Promise<void>;   
    importUserData: (data: Omit<{ coins: number, isDTCGEnabled: boolean, isGodMode: boolean, cheatCount: number }, 'coins'>) => void;
}

// ユーザーデータの初期値 (状態部分のみ)
const initialState = {
    isDTCGEnabled: true, 
    isGodMode: false,
    cheatCount: 0,
};

// DB保存のための永続化可能な状態を抽出するヘルパー関数
const getPersistableState = (state: UserDataState): PersistedUserSettings => ({
    isDTCGEnabled: state.isDTCGEnabled,
    isGodMode: state.isGodMode,
    cheatCount: state.cheatCount,
});


export const useUserDataStore = create<UserDataState>((set, get) => ({
    ...initialState,
    
    // 💡 追加: 現在のモードを計算して返すセレクター
    getCurrentMode: () => {
        const { isDTCGEnabled, isGodMode } = get();
        if (isGodMode) return 'god';
        if (isDTCGEnabled) return 'dtcg';
        return 'free';
    },

    loadUserData: async () => {
        // ... (省略)
        try {
            const settings = await userSettingsService.loadSettings();
            if (settings) {
                set({ 
                    isDTCGEnabled: settings.isDTCGEnabled,
                    isGodMode: settings.isGodMode,
                    cheatCount: settings.cheatCount
                });
            }
            console.log("✅ User data initialized.");
        } catch (error) {
            console.error('Failed to load user data:', error);
        }
    },
    
    setDTCGMode: async (isEnabled) => {
        set({ isDTCGEnabled: isEnabled }); 
        await userSettingsService.saveSettings(getPersistableState(get()));
        console.log(`DTCG Mode set to ${isEnabled}.`);
    },

    setGodMode: async (isGMode) => {
        const currentGodMode = get().isGodMode;
        
        if (isGMode && !currentGodMode) {
            const { cheatCount } = get();
            let newCheatCount = cheatCount + 1; // ゴッドモードONで必ずカウントアップ
            
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
        
        await userSettingsService.saveSettings(getPersistableState(get()));
    },
    
    importUserData: async (data) => {
        set({ ...data });
        await userSettingsService.saveSettings(getPersistableState(get()));
    },

}));