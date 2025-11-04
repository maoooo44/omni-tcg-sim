/**
 * src/services/data-io/dataIOUtils.ts
 *
 * * データI/O層（CSV/JSONインポート・エクスポート）で使用される共通ユーティリティおよび型定義モジュール。
 * * 責務:
 * 1. CSV/JSON I/Oでの照合に使用するカスタムフィールド定義（CustomFieldDefinition）インターフェースの提供。
 * 2. Packの設定情報（CardFieldSettings）に基づき、ユーザーフレンドリーな表示名とCardモデルの物理キーをマッピングした CustomFieldDefinition のリストを動的に生成する。
 */

import type { Card, CardFieldSettings } from '../../models/models';

/**
 * CSV/JSONインポート/エクスポートでの照合に使用するカスタムフィールドの定義
 * ユーザーが設定した表示名と、Cardモデルの物理キーをマッピングします。
 */
export interface CustomFieldDefinition {
    /** ユーザーがCSVヘッダーとして使用する名前 (例: "攻撃力") */
    fieldName: string;
    /** Cardモデルの実際の物理キー名 (例: "num_1") */
    cardKey: keyof Card;
    /** データ型 */
    type: 'num' | 'str';
}

/**
 * CustomFieldConfigから、Cardエンティティのカスタムフィールド定義リストを生成します。
 * CSVヘッダーの照合に使用されます。
 * @param cardSettings - Packから取得したカスタムフィールド設定
 * @returns 照合に使用する CustomFieldDefinition の配列
 */
export const createCardCustomFieldDefinitions = (
    cardSettings: CardFieldSettings | undefined
): CustomFieldDefinition[] => {
    if (!cardSettings) return [];

    const definitions: CustomFieldDefinition[] = [];

    // num_1..num_6 と str_1..str_6 を走査
    for (let i = 1; i <= 6; i++) {

        // --- 数値フィールド (num_i) の処理 ---
        const numKey = `num_${i}` as keyof CardFieldSettings;
        // 型アサーションはコードの簡潔さを優先して許容
        const numSetting = (cardSettings as any)[numKey] as { displayName: string; isVisible: boolean } | undefined;

        if (numSetting && numSetting.isVisible && numSetting.displayName.trim() !== '') {
            definitions.push({
                fieldName: numSetting.displayName,
                cardKey: `num_${i}` as keyof Card,
                type: 'num',
            });
        }

        // --- 文字列フィールド (str_i) の処理 ---
        const strKey = `str_${i}` as keyof CardFieldSettings;
        const strSetting = (cardSettings as any)[strKey] as { displayName: string; isVisible: boolean } | undefined;

        if (strSetting && strSetting.isVisible && strSetting.displayName.trim() !== '') {
            definitions.push({
                fieldName: strSetting.displayName,
                cardKey: `str_${i}` as keyof Card,
                type: 'str',
            });
        }
    }

    return definitions;
};