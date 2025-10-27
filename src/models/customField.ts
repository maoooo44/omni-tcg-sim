/**
 * src/models/customField.ts
 *
 * カスタムフィールドに関する共通の型定義を格納します。
 * - CustomFieldType: カスタムフィールドのデータ型
 * - CustomFieldIndex: カスタムフィールドのインデックス（Cardでは1-6）
 * - FieldSetting: 表示設定として既存の DisplaySetting を流用
 */
export interface FieldSetting {
    /** ユーザーフレンドリーな表示名 (例: 'マナコスト', '逃げるエネルギー') */
    displayName: string;
    /** 詳細画面などでこのフィールドを表示するかどうか */
    isVisible: boolean;
    /** 表示順序 (オプション) */
    order?: number; 
}

/** カスタムフィールドの型 */
export type CustomFieldType = 'num' | 'str';

/** カスタムフィールドのインデックス（Card の num_1..num_6 / str_1..str_6 に対応） */
export type CustomFieldIndex = 1 | 2 | 3 | 4 | 5 | 6;

export default {} as const;
