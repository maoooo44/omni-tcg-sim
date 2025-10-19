/**
 * src/models/custom-field.ts
 *
 * Pack, Card, Deckエンティティに存在する汎用カスタムフィールド (custom_*_*) の
 * 用途と表示名を定義する設定データ構造の基本型と、その初期値を定義します。
 */

// ----------------------------------------------------------------------
// 1. 型定義 (変更なし)
// ----------------------------------------------------------------------

// カスタムフィールドのインデックス番号 (1-10)
export type CustomFieldIndex = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

// カスタムフィールドの型
export type CustomFieldType = 'bool' | 'num' | 'str';

// カスタムフィールド設定の基本構造
export interface FieldSetting {
    displayName: string; 
    description?: string;
    isEnabled: boolean; // 初期値は全て false に統一
}

// カテゴリーごとのカスタムフィールド設定を保持する型
export interface CustomFieldCategory {
    bool: Record<CustomFieldIndex, FieldSetting>;
    num: Record<CustomFieldIndex, FieldSetting>;
    str: Record<CustomFieldIndex, FieldSetting>;
}

/**
 * @description ユーザーデータに格納されるカスタムフィールドのグローバル設定
 */
export interface CustomFieldConfig {
    Pack: CustomFieldCategory;
    Card: CustomFieldCategory;
    Deck: CustomFieldCategory;
}


// ----------------------------------------------------------------------
// 2. 初期値の定義
// ----------------------------------------------------------------------

// 全インデックス (1から10) の配列
const customFieldIndices: CustomFieldIndex[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

/**
 * @description 全てのエンティティで共通の初期設定オブジェクトを作成
 * @returns CustomFieldCategory のレコード
 */
const createInitialCategory = (): CustomFieldCategory => {
    
    const initialSettings = {} as CustomFieldCategory;
    
    // boolean の初期設定 (全て無効)
    initialSettings.bool = customFieldIndices.reduce((acc, index) => {
        acc[index] = { displayName: `bool_${index}`, isEnabled: false };
        return acc;
    }, {} as Record<CustomFieldIndex, FieldSetting>);
    
    // number の初期設定 (全て無効)
    initialSettings.num = customFieldIndices.reduce((acc, index) => {
        acc[index] = { displayName: `num_${index}`, isEnabled: false };
        return acc;
    }, {} as Record<CustomFieldIndex, FieldSetting>);
    
    // string の初期設定 (全て無効)
    initialSettings.str = customFieldIndices.reduce((acc, index) => {
        acc[index] = { 
            displayName: `str_${index}`, 
            isEnabled: false, // 特別扱いはしない
        };
        return acc;
    }, {} as Record<CustomFieldIndex, FieldSetting>);
    
    return initialSettings;
};

// ----------------------------------------------------------------------
// 3. エクスポートされる初期値
// ----------------------------------------------------------------------

// 共通のベース設定を一度生成
const COMMON_INITIAL_CATEGORY = createInitialCategory();

/**
 * @description CustomFieldConfig の初期デフォルト値 (Card/Pack/Deckで共通)
 */
export const initialCustomFieldConfig: CustomFieldConfig = {
    Card: COMMON_INITIAL_CATEGORY, 
    Pack: COMMON_INITIAL_CATEGORY,
    Deck: COMMON_INITIAL_CATEGORY,
};

/**
 * @description usePackEditor に渡すカスタムフィールド設定の初期値 (Cardの設定に統一)
 * 💡 Card の特別扱いをなくしたため、単に初期設定カテゴリとして公開
 */
export const initialCustomFieldSettings: CustomFieldCategory = COMMON_INITIAL_CATEGORY;