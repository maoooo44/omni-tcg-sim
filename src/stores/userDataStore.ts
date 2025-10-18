/**
 * src/stores/userDataStore.ts
 *
 * ユーザーの設定（DTCG/Free/God Mode）および、それに関連するメタデータ（チート回数）の
 * グローバルな状態を管理するZustandストア。
 * 責務は、モード間の複雑なロジック処理と、userDataServiceを介した設定の永続化である。
 */

import { create } from 'zustand';
// 💡 修正: DEFAULT_SETTINGS をインポート。PersistedUserSettings も新しい型を使用
import { userDataService, type PersistedUserSettings, DEFAULT_SETTINGS } from '../services/user-data/userDataService'; 
// 💡 修正: 型定義を models/userData.ts からインポート
import { type CurrentGameMode, type UserData } from '../models/userData'; 

// ユーザーデータの初期値 (状態部分のみ)
// 💡 修正: GC設定を新しいネスト構造に変更
const initialState = {
    isDTCGEnabled: true, 
    isGodMode: false,
    cheatCount: 0,
    isAllViewMode: false, 
    
    // GC設定の初期値 (DEFAULT_SETTINGSの構造と一致させる)
    gcSettings: DEFAULT_SETTINGS.gcSettings,
};

// DB保存のための永続化可能な状態を抽出するヘルパー関数
// 💡 修正: GC設定を gcSettings オブジェクトとして PersistedUserSettings に含める
const getPersistableState = (state: UserData): PersistedUserSettings => ({
    isDTCGEnabled: state.isDTCGEnabled,
    isGodMode: state.isGodMode,
    cheatCount: state.cheatCount,
    isAllViewMode: state.isAllViewMode, 
    
    // 💡 修正: gcSettings をネストされたオブジェクトとして格納
    gcSettings: state.gcSettings,
});


export const useUserDataStore = create<UserData>((set, get) => ({
    ...initialState,
    
    // 現在のモードを計算して返すセレクター
    getCurrentMode: () => {
        const { isDTCGEnabled, isGodMode } = get();
        if (isGodMode) return 'god' as CurrentGameMode; // 💡 型アサーションを追加
        if (isDTCGEnabled) return 'dtcg' as CurrentGameMode;
        return 'free' as CurrentGameMode;
    },

    loadUserData: async () => {
        try {
            const settings = await userDataService.loadSettings();
            if (settings) {
                // 💡 修正: GC設定を gcSettings オブジェクトとしてストアにロード
                set({ 
                    isDTCGEnabled: settings.isDTCGEnabled,
                    isGodMode: settings.isGodMode,
                    cheatCount: settings.cheatCount,
                    isAllViewMode: settings.isAllViewMode ?? initialState.isAllViewMode,
                    
                    // gcSettingsはloadSettingsでDEFAULT_SETTINGSとマージされているため、そのままセット
                    gcSettings: settings.gcSettings,
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
        
        await userDataService.saveSettings(getPersistableState(get()));
    },
    
    setAllViewMode: async (isMode: boolean) => { 
        set({ isAllViewMode: isMode }); 
        await userDataService.saveSettings(getPersistableState(get()));
        console.log(`All Data View Mode set to ${isMode}.`);
    },
    
    importUserData: async (data) => {
        // 💡 修正: GC設定を gcSettings オブジェクトとしてセット
        set({ 
            isDTCGEnabled: data.isDTCGEnabled,
            isGodMode: data.isGodMode,
            cheatCount: data.cheatCount,
            isAllViewMode: data.isAllViewMode,
            
            gcSettings: data.gcSettings, // 新しい構造をそのままセット
        });
        await userDataService.saveSettings(getPersistableState(get()));
    },

}));

