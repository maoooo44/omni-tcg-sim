/**
 * src/models/userData.ts
 *
 * ユーザーデータに関連する型定義を格納します。
 * (userDataStore.ts から切り出し)
 */

// 3つのモードを表す型を定義
export type CurrentGameMode = 'dtcg' | 'free' | 'god';

// 💡 修正: GC設定の型をuserDataServiceからインポート
import type { GCSetting } from '../services/user-data/userDataService';


/**
 * ユーザー設定のZustandストアの状態を定義します。
 */
export interface UserData {
    isDTCGEnabled: boolean;       
    isGodMode: boolean;           
    cheatCount: number;           
    isAllViewMode: boolean; // 全データ表示モード
    
    // 💡 修正: GC設定を新しいネスト構造に変更
    gcSettings: GCSetting;
    
    // 現在のモードを取得するセレクター関数
    getCurrentMode: () => CurrentGameMode;
    
    // --- アクション ---
    /** DBからユーザー設定をロードし、ストアを初期化する */
    loadUserData: () => Promise<void>; 
    /** DTCGモードの有効/無効を切り替える */
    setDTCGMode: (isEnabled: boolean) => Promise<void>; 
    /** Godモードの有効/無効を切り替える（チート回数を更新するロジックを含む） */
    setGodMode: (isGMode: boolean) => Promise<void>;      
    
    /** 全データ表示モードの有効/無効を切り替える */
    setAllViewMode: (isMode: boolean) => Promise<void>;         

    /** 外部データ（インポート）でユーザーデータを更新する */
    // coins はストアで管理されていないが、import/exportデータ型に含まれる可能性があるためOmit
    importUserData: (data: Omit<{ 
        coins: number, 
        isDTCGEnabled: boolean, 
        isGodMode: boolean, 
        cheatCount: number, 
        isAllViewMode: boolean,
        
        // 💡 修正: import対象のGC設定を新しいネスト構造に変更
        gcSettings: GCSetting
    }, 'coins'>) => void; 
}