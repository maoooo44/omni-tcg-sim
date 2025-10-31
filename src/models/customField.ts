/**
 * src/models/customField.ts
 *
 * * カスタムフィールド（Card モデルの num_X, str_X など）に関する共通の型定義を格納するモデル層モジュール。
 * 主に、カスタムフィールドのデータ型、インデックス、および表示設定を定義し、
 * 設定管理やデータアクセスにおける型の安全性を担保します。
 *
 * * 責務:
 * 1. カスタムフィールドの表示設定（displayName, isVisible, order）の構造を定義する。
 * 2. カスタムフィールドのデータ型（'num', 'str'）を定義する。
 * 3. カスタムフィールドのインデックス（1から6）を定義する。
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