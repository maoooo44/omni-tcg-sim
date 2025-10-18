/**
 * src/models/custom-field-config.ts
 *
 * Pack, Card, Deckエンティティに存在する汎用カスタムフィールド (custom_*_*) の
 * 用途と表示名を定義する設定データ構造です。
 * アプリケーション内で一度だけ作成・管理され、ユーザー設定に紐づくことを想定します。
 */

// カスタムフィールドのインデックス番号 (1-10)
export type CustomFieldIndex = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

// カスタムフィールドの型
export type CustomFieldType = 'bool' | 'num' | 'str';

// カスタムフィールド設定の基本構造
export interface FieldSetting {
    /**
     * @description ユーザーがUIに表示するために設定するフィールド名
     * 例: 'パワー', 'マナコスト', '通常版フラグ'
     */
    displayName: string; 

    /**
     * @description フィールドの簡単な説明やヒント
     */
    description?: string;

    /**
     * @description このカスタムフィールドを使用するかどうか (未使用の場合はfalse)
     */
    isEnabled: boolean;
}

// カテゴリーごとのカスタムフィールド設定を保持する型
export interface CustomFieldCategoryConfig {
    // ブール値 (custom_N_bool) 10枠の設定
    bool: Record<CustomFieldIndex, FieldSetting>;
    
    // 数値 (custom_N_num) 10枠の設定
    num: Record<CustomFieldIndex, FieldSetting>;
    
    // 文字列 (custom_N_str) 10枠の設定
    str: Record<CustomFieldIndex, FieldSetting>;
}

/**
 * @description アプリケーション全体で使用されるカスタムフィールドのグローバル設定
 */
export interface CustomFieldConfig {
    /**
     * @description パックエンティティのカスタムフィールド設定
     */
    Pack: CustomFieldCategoryConfig;

    /**
     * @description カードエンティティのカスタムフィールド設定
     */
    Card: CustomFieldCategoryConfig;
    
    /**
     * @description デッキエンティティのカスタムフィールド設定
     */
    Deck: CustomFieldCategoryConfig;

    // この設定自体のメタデータ（作成日時など）は、DBSettingなどのラッパーで管理される
}