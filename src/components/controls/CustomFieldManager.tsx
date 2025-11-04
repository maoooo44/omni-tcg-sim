/**
* src/components/controls/CustomFieldManager.tsx
*
* Pack, Card, Deckエンティティ共通のカスタムフィールド設定表示・編集コンポーネント。
* エンティティタイプに応じて利用可能なフィールドの入力フォーム（TextField）を表示し、
* ユーザーがカスタムフィールドの値編集、表示/非表示の切り替え、詳細設定モーダルの起動を行うUIを提供する。
*
* * 責務:
* 1. アイテムタイプ（Card/Pack/Deck）に応じて、カスタムフィールドの物理的な最大数と表示サイズ（Grid設定）を決定する。
* 2. 外部から渡された設定 (`customFieldSettings`) に基づき、表示が有効なフィールド (`activeFields`) のリストを生成する。
* 3. `activeFields` を設定された `order` に基づきソートして表示する。
* 4. 各フィールドの値をアイテムデータ (`itemData`) から取得し、`TextField` にバインドする。
* 5. 値の変更 (`onFieldChange`) および設定の変更 (`onSettingChange`) を外部コンポーネントに委譲する。
* 6. フィールド設定モーダル (`CustomFieldModal`) を制御する。
*/
import React, { useMemo, useState } from 'react';
import {
    Box, Typography, Grid, Paper,
    TextField,
    // ⚠️ Button を削除
    // ⚠️ Select, MenuItem, FormControl, InputLabel, IconButton, type SelectChangeEvent を削除
} from '@mui/material';
// ⚠️ DeleteIcon を削除
import SettingsIcon from '@mui/icons-material/Settings';

// ⭐️ 追加: EnhancedIconButton をインポート
import EnhancedIconButton from '../common/EnhancedIconButton';

// 既存の型定義をインポート
import type { Card, Pack, Deck, CustomFieldType, FieldSetting } from '../../models/models';

import CustomFieldModal from '../modals/CustomFieldModal';


export type CustomFieldKeys = 'num_1' | 'num_2' | 'str_1' | 'str_2' | 'num_3' | 'num_4' | 'str_3' | 'str_4' | 'num_5' | 'num_6' | 'str_5' | 'str_6';
type ItemWithCustomFields = Card | Pack | Deck; 

const FIELD_LIMITS: Record<'Card' | 'Deck' | 'Pack', number> = {
    // num/str それぞれの最大インデックス。Card: 6, Deck: 4, Pack: 2
    'Card': 6,
    'Deck': 4,
    'Pack': 2,
};

interface GridSizeProps {
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
}

const GRID_SETTINGS: Record<'Card' | 'Deck' | 'Pack', GridSizeProps> = {
    // Card (最大12フィールド): PCでは4列表示 (サイズ3)
    'Card': { xs: 12, md: 6 },
    // Deck (最大8フィールド): PCではフル幅表示 (サイズ12)
    'Deck': { xs: 12, md: 12 },
    // Pack (最大4フィールド): PCでは2列表示 (サイズ6)
    'Pack': { xs: 12, md: 12 },
};

const FIXED_HEIGHTS: Record<'Card' | 'Deck' | 'Pack', number> = {
    // 1行あたり約70px-80pxを想定。Cardはスペース節約のためやや低めに設定しスクロールを促す
    'Card': 366,
    'Deck': 280,
    'Pack': 244,
};


export interface CustomFieldManagerProps {
    // ⭐️ 修正: Partial を追加し、全ての CustomFieldKeys が必須ではないようにする
    customFieldSettings: Partial<Record<CustomFieldKeys, FieldSetting>> | undefined;
    itemData: ItemWithCustomFields;
    onFieldChange: <F extends keyof ItemWithCustomFields>(field: F, value: any) => void;
    itemType: 'Card' | 'Deck' | 'Pack';

    // 4引数シグネチャを維持（親コンポーネントを修正することが最善のため）
    onSettingChange?: (
        itemType: 'Card' | 'Deck' | 'Pack',
        type: CustomFieldType,
        index: number,
        settingUpdates: Partial<FieldSetting>
    ) => void;

    isReadOnly: boolean;
    
    /** カスタムフィールド設定ボタンを非表示にする（一括編集時など） */
    hideSettingsButton?: boolean;

    /** ⭐️ 追加: カスタムフィールド設定に関わらず全てのフィールドを表示する */
    forceShowAllFields?: boolean; 
}

export interface CustomFieldInfo {
    fieldKey: CustomFieldKeys;
    type: CustomFieldType;
    index: number;
    setting?: FieldSetting;
}

const getCustomFieldInfo = (itemType: 'Card' | 'Deck' | 'Pack', settings: Partial<Record<CustomFieldKeys, FieldSetting>> | undefined): CustomFieldInfo[] => {
    const fields: CustomFieldInfo[] = [];
    const limit = FIELD_LIMITS[itemType];
    const types: CustomFieldType[] = ['num', 'str'];

    for (const type of types) {
        for (let i = 1; i <= limit; i++) {
            const index = i;
            const fieldKey = `${type}_${i}` as CustomFieldKeys;
            fields.push({ fieldKey, type: type as CustomFieldType, index, setting: settings?.[fieldKey] });
        }
    }
    return fields;
};

// ----------------------------------------
// コンポーネント本体
// ----------------------------------------

const CustomFieldManager: React.FC<CustomFieldManagerProps> = ({
    customFieldSettings,
    itemData,
    onFieldChange,
    itemType,
    onSettingChange,
    isReadOnly,
    hideSettingsButton = false,
    // ⭐️ 追加: プロパティを受け取る
    forceShowAllFields = false, 
}) => {

    const allCustomFields = useMemo(() => getCustomFieldInfo(itemType, customFieldSettings), [itemType, customFieldSettings]);

    const [isModalOpen, setIsModalOpen] = useState(false);

    // ----------------------------------------
    // UI ロジック
    // ----------------------------------------

    const handleOpenModal = () => setIsModalOpen(true);
    const handleCloseModal = () => setIsModalOpen(false);


    /**
     * activeFields:
     * 全フィールド表示モード: 全フィールドを表示
     * 通常モード: 設定が存在し、isVisible: true のフィールドのみ表示
     */
    const activeFields = useMemo(() => {
        // ⭐️ 修正: forceShowAllFields が true の場合は全フィールドを表示 ⭐️
        if (forceShowAllFields) {
            // 全フィールドを表示（設定の有無に関わらず）
            return allCustomFields
                .map((f): CustomFieldInfo & { setting: FieldSetting } => ({
                    ...f,
                    setting: f.setting || {
                        displayName: f.fieldKey, // フィールドキーをデフォルト表示名に
                        isVisible: true,
                        order: 0
                    }
                }))
                .sort((a, b) => a.fieldKey.localeCompare(b.fieldKey));
        }

        // 通常時: 設定が存在し、isVisibleがtrueの場合のみ表示
        return allCustomFields
            .filter((f): f is CustomFieldInfo & { setting: FieldSetting } => {
                // 💡 修正: settingが存在し、isVisibleが厳密にtrueの場合のみ表示
                if (!f.setting || f.setting.isVisible !== true) return false;

                return true;
            })
            // order があれば order 順、なければ fieldKey 順
            .sort((a, b) => {
                const aOrder = a.setting.order ?? Infinity;
                const bOrder = b.setting.order ?? Infinity;
                if (aOrder !== bOrder) {
                    return aOrder - bOrder;
                }
                return a.fieldKey.localeCompare(b.fieldKey);
            });
    }, [allCustomFields, forceShowAllFields]); // ⭐️ 修正: 依存配列を forceShowAllFields に変更

    const gridSize = GRID_SETTINGS[itemType];
    const fixedHeight = FIXED_HEIGHTS[itemType];

    // ----------------------------------------
    // メイン描画
    // ----------------------------------------

    return (
        <Box>
            {/* ⭐️ 修正: ヘッダー部分の追加とButtonのEnhancedIconButtonへの置き換え */}
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between', // 右端にボタンを配置
                    mb: 1, // Paperとの間に少しスペース
                }}
            >
                {/* ⭐️ 追加: Typography */}
                <Typography variant="subtitle2" gutterBottom sx={{ ml:0}}>
                    カスタムフィールド
                </Typography>

                {/* ⭐️ 修正: hideSettingsButton が false の場合のみ表示 ⭐️ */}
                {!hideSettingsButton && (
                    <EnhancedIconButton
                        icon={<SettingsIcon />}
                        tooltipText="カスタムフィールド設定"
                        onClick={handleOpenModal}
                        disabled={isReadOnly}
                        size="small"
                        color="primary"
                    />
                )}
            </Box>

            <Paper
                elevation={1}
                sx={{
                    p: 2,
                    mb: 0,
                    height: `${fixedHeight}px`,
                    overflowY: 'auto',
                }}
            >
                <Grid container spacing={2} sx={{ mb: activeFields.length > 0 ? 0 : 2 }}>

                    {activeFields.length === 0 ? (
                        // 既存の Grid size={{ xs: 12 }} を維持
                        <Grid size={{ xs: 12 }}> 
                            <Typography color="textSecondary">カスタムフィールドが設定されていません。</Typography>
                        </Grid>
                    ) : (
                        activeFields.map((activeField) => {
                            const { fieldKey, type, setting } = activeField;

                            // ⭐️ itemData[fieldKey as keyof ItemWithCustomFields] で値を取得する
                            const value = itemData[fieldKey as keyof ItemWithCustomFields];

                            let inputControl = (
                                <TextField
                                    fullWidth
                                    // ラベルは setting.displayName があればそれを使用、なければ物理名
                                    label={setting?.displayName || `${type.toUpperCase()} ${activeField.index}`}
                                    type={type === 'num' ? 'number' : 'text'}
                                    // 値は変更されていないので、そのまま表示
                                    value={(value ?? '') as string | number}
                                    onChange={(e) => onFieldChange(fieldKey as keyof ItemWithCustomFields, e.target.value)}
                                    size="small"
                                    InputLabelProps={{ shrink: true }}

                                    disabled={isReadOnly}
                                    InputProps={{
                                        readOnly: isReadOnly,
                                    }}
                                />
                            );

                            return (
                                // ⭐️ Grid size={{...gridSize}} を維持
                                <Grid size={{...gridSize}} key={fieldKey} sx={{ display: 'flex', alignItems: 'center', mb: 0 }}>
                                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                                        {inputControl}
                                    </Box>
                                </Grid>
                            );
                        })
                    )}
                </Grid>

            </Paper>

            {/* ⚠️ 削除: フッターの「フィールド設定」ButtonとドロップダウンのGridを削除 */}
            {/* {!isReadOnly && (
                <>
                    <Grid container spacing={2} alignItems="center"> 
                        <Grid size={{...gridSize}}> ... </Grid>
                        <Grid size={{...gridSize}}>
                            <Button ... > フィールド設定 </Button>
                        </Grid>
                    </Grid>
                </>
            )} */}

            {/* CustomFieldModal の表示 (変更なし) */}
            {!isReadOnly && onSettingChange && (
                <CustomFieldModal
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    itemType={itemType}
                    onSettingChange={onSettingChange}
                    // 全フィールドの情報を渡す
                    allFieldInfo={allCustomFields.map(f => ({
                        ...f,
                        setting: customFieldSettings?.[f.fieldKey]
                    }))}
                />
            )}
        </Box>
    );
};

export default CustomFieldManager;