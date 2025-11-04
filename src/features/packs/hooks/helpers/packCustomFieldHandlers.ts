/**
 * src/features/packs/hooks/helpers/packCustomFieldHandlers.ts
 *
 * パックエディターのカスタムフィールド関連ハンドラ群
 * 責務:
 * 1. Packのカスタムフィールド値の変更処理
 * 2. Cardのカスタムフィールド設定の変更処理
 * 3. Packのカスタムフィールド設定の変更処理
 */

import type { Pack, CardFieldSettings, PackFieldSettings, FieldSetting } from '../../../../models/models';

// ----------------------------------------------------------------------
// Pack Custom Field Change Handler
// ----------------------------------------------------------------------

export interface HandlePackCustomFieldChangeParams {
    packData: Pack | null;
    setPackData: React.Dispatch<React.SetStateAction<Pack | null>>;
}

/**
 * Packのカスタムフィールド値を変更する
 * CustomFieldManager からの (field, value) 呼び出しに対応
 */
export const createHandlePackCustomFieldChange = (params: HandlePackCustomFieldChangeParams) => {
    const { packData, setPackData } = params;
    
    return (field: string, value: any) => {
        if (!packData) return;

        setPackData(prev => {
            if (!prev) return null;

            let finalValue: any = value;

            // 数値系カスタムフィールドは空文字を undefined に、数値文字列は Number に変換
            if (typeof field === 'string' && field.startsWith('num_')) {
                finalValue = value === '' || value === null ? undefined : Number(value);
            }

            return { ...prev, [field]: finalValue } as Pack;
        });
    };
};

// ----------------------------------------------------------------------
// Card Custom Field Setting Change Handler
// ----------------------------------------------------------------------

export interface HandleCustomFieldSettingChangeParams {
    packData: Pack | null;
    setPackData: React.Dispatch<React.SetStateAction<Pack | null>>;
}

/**
 * Cardカスタムフィールドの設定を変更する (cardFieldSettings を更新)
 * CardModal や PackCardList 側から呼ばれる想定
 */
export const createHandleCustomFieldSettingChange = (params: HandleCustomFieldSettingChangeParams) => {
    const { packData, setPackData } = params;
    
    return (
        type: 'num' | 'str',
        index: number,
        field: keyof FieldSetting,
        value: any
    ) => {
        if (!packData) return;

        setPackData(prev => {
            if (!prev) return null;

            // フィールドキー ('num_1', 'str_2'など) を構築
            const fieldKey = `${type}_${index}` as keyof CardFieldSettings;

            const currentFieldSettings = prev.cardFieldSettings;

            // 特定のキーの FieldSetting を取得
            const targetFieldSetting: FieldSetting = currentFieldSettings[fieldKey];

            // 変更を適用した新しい FieldSetting オブジェクトを生成
            const newFieldSetting: FieldSetting = {
                ...targetFieldSetting,
                [field]: value
            };

            // 新しい設定を CardFieldSettings に反映
            const newCardFieldSettings: CardFieldSettings = {
                ...currentFieldSettings,
                [fieldKey]: newFieldSetting,
            };

            return {
                ...prev,
                cardFieldSettings: newCardFieldSettings,
            };
        });
    };
};

// ----------------------------------------------------------------------
// Pack Custom Field Setting Change Handler
// ----------------------------------------------------------------------

export interface HandlePackFieldSettingChangeParams {
    packData: Pack | null;
    setPackData: React.Dispatch<React.SetStateAction<Pack | null>>;
}

/**
 * Packカスタムフィールドの設定を変更する (packFieldSettings を更新)
 * PackInfoForm 側から呼ばれる想定
 */
export const createHandlePackFieldSettingChange = (params: HandlePackFieldSettingChangeParams) => {
    const { packData, setPackData } = params;
    
    return (
        type: 'num' | 'str',
        index: number,
        field: keyof FieldSetting,
        value: any
    ) => {
        if (!packData) return;

        setPackData(prev => {
            if (!prev) return null;

            // Packのカスタムフィールドは num_1, num_2, str_1, str_2 のみ
            const fieldKey = `${type}_${index}` as keyof PackFieldSettings;

            // null の可能性を考慮し、初期化
            const currentFieldSettings = prev.packFieldSettings || {};

            // 特定のキーの FieldSetting を取得（存在しない場合はデフォルト値を適用）
            const targetFieldSetting: FieldSetting = currentFieldSettings[fieldKey] || {
                label: '',
                isVisible: true,
                isOptional: false,
            };

            // 変更を適用した新しい FieldSetting オブジェクトを生成
            const newFieldSetting: FieldSetting = {
                ...targetFieldSetting,
                [field]: value
            };

            // 新しい設定を PackFieldSettings に反映
            const newPackFieldSettings: PackFieldSettings = {
                ...currentFieldSettings,
                [fieldKey]: newFieldSetting,
            };

            return {
                ...prev,
                packFieldSettings: newPackFieldSettings,
            } as Pack;
        });
    };
};
