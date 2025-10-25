// src/services/data-io/dataIOUtils.ts

import type { Card } from '../../models/card';
// CustomField の型定義は共通 models に移動したため、そこから参照します。
// カスタムフィールド型の抽象は廃止。型リテラルで直接記述。
import type { CardFieldSettings } from '../../models/pack';

/**
 * @description CSV/JSONインポート/エクスポートでの照合に使用するカスタムフィールドの定義
 * ユーザーが設定した表示名と、Cardモデルの物理キーをマッピングします。
 */
export interface CustomFieldDefinition {
    /** ユーザーがCSVヘッダーとして使用する名前 (例: "攻撃力") */
    fieldName: string; 
    /** Cardモデルの実際の物理キー名 (例: "custom_1_num") */
    cardKey: keyof Card; 
    /** データ型 */
    type: 'num' | 'str';
}

/**
 * CustomFieldConfigから、Cardエンティティのカスタムフィールド定義リストを生成します。
 * CSVヘッダーの照合に使用されます。
 * @param config - UserDataから取得したカスタムフィールド設定全体
 * @returns 照合に使用する CustomFieldDefinition の配列
 */
export const createCardCustomFieldDefinitions = (
    cardSettings: CardFieldSettings | undefined
): CustomFieldDefinition[] => {
    // 新しいモデルでは Card のカスタム表示設定は Pack.cardFieldSettings (CardFieldSettings) に存在します。
    if (!cardSettings) return [];

    const definitions: CustomFieldDefinition[] = [];

    // num_1..num_6 と str_1..str_6 を走査して、表示設定が有効かつ表示名があれば定義を作成する
    for (let i = 1; i <= 6; i++) {
        const numKey = `num_${i}` as keyof CardFieldSettings;
        const numSetting = (cardSettings as any)[numKey] as { displayName: string; isVisible: boolean } | undefined;
        if (numSetting && numSetting.isVisible && numSetting.displayName.trim() !== '') {
            definitions.push({
                fieldName: numSetting.displayName,
                cardKey: `num_${i}` as keyof Card,
                type: 'num',
            });
        }

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