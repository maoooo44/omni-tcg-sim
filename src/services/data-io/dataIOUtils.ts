// src/services/data-io/dataIOUtils.ts

import type { Card } from '../../models/card';
import type { CustomFieldType, CustomFieldIndex } from '../../models/custom-field';
import type { CustomFieldConfig } from '../../models/userData';

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
    type: CustomFieldType;
}

/**
 * CustomFieldConfigから、Cardエンティティのカスタムフィールド定義リストを生成します。
 * CSVヘッダーの照合に使用されます。
 * @param config - UserDataから取得したカスタムフィールド設定全体
 * @returns 照合に使用する CustomFieldDefinition の配列
 */
export const createCardCustomFieldDefinitions = (
    config: CustomFieldConfig
): CustomFieldDefinition[] => {
    
    // config.Cardがundefinedになる可能性に備えて早期リターン
    if (!config.Card) return [];

    const cardConfig = config.Card;
    const definitions: CustomFieldDefinition[] = [];
    
    const fieldTypes: CustomFieldType[] = ['bool', 'num', 'str'];

    fieldTypes.forEach(type => {
        // インデックス 1 から 10 までをループ
        for (let i = 1; i <= 10; i++) {
            const index = i as CustomFieldIndex;
            // Record<CustomFieldIndex, FieldSetting> から設定を取得
            const setting = cardConfig[type][index]; 

            if (!setting) continue; // 設定が未定義の場合はスキップ
            
            // 物理名 (Card のプロパティ名) を構築
            const cardKey = `custom_${index}_${type}` as keyof Card; 
            
            // isEnabled かつ displayName が設定されている場合にマッピング情報を作成
            if (setting.isEnabled && setting.displayName.trim() !== '') {
                definitions.push({
                    fieldName: setting.displayName,
                    cardKey: cardKey,
                    type: type,
                });
            }
        }
    });

    return definitions;
};