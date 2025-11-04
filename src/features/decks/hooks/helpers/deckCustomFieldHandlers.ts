/**
 * src/features/decks/hooks/helpers/deckCustomFieldHandlers.ts
 *
 * デッキエディターのカスタムフィールド関連ハンドラ群
 * 責務:
 * 1. Deckのカスタムフィールド値の変更処理
 * 2. Deckのカスタムフィールド設定の変更処理
 */

import type { Deck, DeckFieldSettings, FieldSetting } from '../../../../models/models';

// ----------------------------------------------------------------------
// Deck Custom Field Change Handler
// ----------------------------------------------------------------------

export interface HandleDeckCustomFieldChangeParams {
    deckData: Deck | null;
    setDeckData: React.Dispatch<React.SetStateAction<Deck | null>>;
}

/**
 * Deckのカスタムフィールド値を変更する
 * CustomFieldManager からの (field, value) 呼び出しに対応
 */
export const createHandleDeckCustomFieldChange = (params: HandleDeckCustomFieldChangeParams) => {
    const { deckData, setDeckData } = params;
    
    return (field: string, value: any) => {
        if (!deckData) return;
        setDeckData(prev => prev ? ({ ...prev, [field]: value }) : null);
    };
};

// ----------------------------------------------------------------------
// Deck Custom Field Setting Change Handler
// ----------------------------------------------------------------------

export interface HandleCustomFieldSettingChangeParams {
    deckData: Deck | null;
    setDeckData: React.Dispatch<React.SetStateAction<Deck | null>>;
}

/**
 * Deckカスタムフィールドの設定を変更する (deckFieldSettings を更新)
 * DeckInfoForm 側から呼ばれる想定
 */
export const createHandleCustomFieldSettingChange = (params: HandleCustomFieldSettingChangeParams) => {
    const { deckData, setDeckData } = params;
    
    return (
        type: 'num' | 'str',
        index: number,
        field: keyof FieldSetting,
        value: any
    ) => {
        if (!deckData) return;

        setDeckData(prev => {
            if (!prev) return null;

            // フィールドキー ('num_1', 'str_2'など) を構築
            const fieldKey = `${type}_${index}` as keyof DeckFieldSettings;
            
            const currentFieldSettings = prev.deckFieldSettings || {} as DeckFieldSettings;
            
            const targetFieldSetting: FieldSetting = currentFieldSettings[fieldKey] || {
                label: '',
                isVisible: true,
                isOptional: false,
            };

            const newFieldSetting: FieldSetting = {
                ...targetFieldSetting,
                [field]: value
            };

            const newDeckFieldSettings: DeckFieldSettings = {
                ...currentFieldSettings,
                [fieldKey]: newFieldSetting,
            };
            
            return {
                ...prev,
                deckFieldSettings: newDeckFieldSettings,
            };
        });
    };
};
