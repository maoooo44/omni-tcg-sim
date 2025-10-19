/**
 * src/models/userData.ts
 *
 * ユーザーデータの永続的な状態に関連する型定義を格納します。
 */

// 3つのモードを表す型を定義
export type CurrentGameMode = 'dtcg' | 'free' | 'god';

// 💡 修正: CustomFieldConfigをインポート
import type { CustomFieldCategory } from './custom-field';
// 💡 修正: GCSettingの型をインポート
import type { GCSetting } from '../services/user-data/userDataService';


/**
 * @description カスタムフィールドのグローバル設定 (UserDataに統合)
 */
export interface CustomFieldConfig {
    Pack: CustomFieldCategory;
    Card: CustomFieldCategory;
    Deck: CustomFieldCategory;
}

/**
 * @description ユーザーデータの永続的な状態を定義します。（アクションは含まない）
 */
export interface UserDataState {
    isDTCGEnabled: boolean;
    isGodMode: boolean;
    cheatCount: number;
    isAllViewMode: boolean;
    gcSettings: GCSetting;
    customFieldConfig: CustomFieldConfig; // 💡 追加
}