/**
 * src/models/customField.ts
 *
 * カスタムフィールドに関する共通の型定義を格納します。
 * - CustomFieldType: カスタムフィールドのデータ型
 * - CustomFieldIndex: カスタムフィールドのインデックス（Cardでは1-6）
 * - FieldSetting: 表示設定として既存の DisplaySetting を流用
 */
import type { DisplaySetting } from './pack';

/** カスタムフィールドの型 */
export type CustomFieldType = 'num' | 'str' | 'bool';

/** カスタムフィールドのインデックス（Card の num_1..num_6 / str_1..str_6 に対応） */
export type CustomFieldIndex = 1 | 2 | 3 | 4 | 5 | 6;

/**
 * FieldSetting は UI 側で使われていたローカル型の代わりに
 * Pack の DisplaySetting をそのまま利用します。
 * （以前の isEnabled は DisplaySetting.isVisible に統合します）
 */
export type FieldSetting = DisplaySetting;

export default {} as const;
