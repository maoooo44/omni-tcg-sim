/**
* src/components/controls/CustomFieldManager.tsx
*
* Pack, Card, Deckエンティティ共通のカスタムフィールド設定表示・編集コンポーネント。
* エンティティタイプに応じて利用可能なフィールドの入力フォーム（TextField）を表示し、
* ユーザーがカスタムフィールドの値編集、表示/非表示の切り替え、詳細設定モーダルの起動を行うUIを提供する。
*
* * 責務:
* 1. アイテムタイプ（Card/Pack/Deck）に応じて、カスタムフィールドの物理的な最大数と表示サイズ（Grid設定）を決定する。
* 2. 外部から渡された設定 (`customFieldSettings`) に基づき、表示が有効なフィールド (`activeFields`) と、利用可能な未使用/非表示フィールド (`availableFields`) のリストを生成する。
* 3. `activeFields` を設定された `order` に基づきソートして表示する。
* 4. 各フィールドの値をアイテムデータ (`itemData`) から取得し、`TextField` にバインドする。
* 5. 値の変更 (`onFieldChange`) および設定の変更 (`onSettingChange`) を外部コンポーネントに委譲する。
* 6. フィールドの非表示化（削除アイコン）および未使用フィールドの再有効化/追加 UI を提供する。
* 7. フィールド設定モーダル (`CustomFieldModal`) を制御する。
*/
import React, { useMemo, useState } from 'react';
import {
    Box, Typography, Grid, Paper, Divider,
    TextField, Select, MenuItem,
    FormControl, InputLabel, IconButton, Button,
    type SelectChangeEvent,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import SettingsIcon from '@mui/icons-material/Settings';

// 既存の型定義をインポート
import type { Card } from '../../models/card';
import type { Pack } from '../../models/pack';

import CustomFieldModal from '../modals/CustomFieldModal';
import type { CustomFieldType } from '../../models/customField';
import type { FieldSetting } from '../../models/customField';


export type CustomFieldKeys = 'num_1' | 'num_2' | 'str_1' | 'str_2' | 'num_3' | 'num_4' | 'str_3' | 'str_4' | 'num_5' | 'num_6' | 'str_5' | 'str_6';
type ItemWithCustomFields = Card | Pack;

const FIELD_LIMITS: Record<'Card' | 'Deck' | 'Pack', number> = {
    'Card': 6,
    'Deck': 4,
    'Pack': 2,
};

interface GridSizeProps {
    xs: number;
    sm: number;
    md?: number;
    lg?: number;
}

const GRID_SETTINGS: Record<'Card' | 'Deck' | 'Pack', GridSizeProps> = {
    // Card (最大12フィールド): PCでは4列表示 (サイズ3)
    'Card': { xs: 12, sm: 6, md: 6 },
    // Deck (最大8フィールド): PCでは3列表示 (サイズ4)
    'Deck': { xs: 12, sm: 12, md: 12 },
    // Pack (最大4フィールド): PCでは2列表示 (サイズ6)
    'Pack': { xs: 12, sm: 6, md: 12 },
};

const FIXED_HEIGHTS: Record<'Card' | 'Deck' | 'Pack', number> = {
    // 1行あたり約70px-80pxを想定。Cardはスペース節約のためやや低めに設定しスクロールを促す
    'Card': 300,
    'Deck': 280,
    'Pack': 140,
};


export interface CustomFieldManagerProps {
    customFieldSettings: Record<CustomFieldKeys, FieldSetting> | undefined;
    itemData: ItemWithCustomFields;
    onFieldChange: <F extends keyof ItemWithCustomFields>(field: F, value: any) => void;
    itemType: 'Card' | 'Deck' | 'Pack';

    onSettingChange: (
        itemType: 'Card' | 'Deck' | 'Pack',
        type: CustomFieldType,
        index: number,
        settingUpdates: Partial<FieldSetting>
    ) => void;

    isReadOnly: boolean;
}

export interface CustomFieldInfo {
    fieldKey: CustomFieldKeys;
    type: CustomFieldType;
    index: number;
    setting?: FieldSetting;
}

const getCustomFieldInfo = (itemType: 'Card' | 'Deck' | 'Pack', settings: Record<CustomFieldKeys, FieldSetting> | undefined): CustomFieldInfo[] => {
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
     * 1. 設定が存在する (settingがある)
     * 2. かつ、表示が有効になっている (isVisible: true)
     */
    const activeFields = useMemo(() => {
        return allCustomFields
            .filter((f): f is CustomFieldInfo & { setting: FieldSetting } => {
                // setting が存在しないか、isVisible が true でない場合は除外
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
    }, [allCustomFields]);

    /**
     * availableFields: 
     * 1. 設定が存在しない (真の未使用枠)
     * 2. または、設定は存在するが、isVisible: false になっているフィールド (非表示/再利用待ちの枠)
     */
    const availableFields = useMemo(() => {
        return allCustomFields.filter(field => {
            const hasSetting = !!field.setting;

            // 1. 設定が存在しない場合 (真の未使用)
            if (!hasSetting) return true;

            // 2. 設定は存在するが、isVisible: false の場合
            if (field.setting?.isVisible === false) return true;

            return false;
        });
    }, [allCustomFields]);


    /**
     * ゴミ箱ボタン (フィールドを非表示にする - 値はクリアしない) 
     */
    const handleRemoveField = React.useCallback((field: CustomFieldInfo) => {
        if (isReadOnly) return;
        if (!field.setting) return;

        // 値をクリアせず、設定の isVisible を false にする
        onSettingChange(itemType, field.type, field.index, { isVisible: false });

    }, [isReadOnly, onSettingChange, itemType]);

    /**
     * ドロップダウンで選択されたフィールドを直ちに有効化する (表示する) 
     */
    const handleActivateField = React.useCallback((e: SelectChangeEvent) => {
        const key = e.target.value as CustomFieldKeys;
        const fieldToActivate = allCustomFields.find(f => f.fieldKey === key);

        if (!fieldToActivate) return;

        const { type, index } = fieldToActivate;

        // onSettingChange を呼び出して、isVisible を true に設定する
        const settingUpdates: Partial<FieldSetting> = { isVisible: true };

        // 真の未使用フィールドの場合 (settingがない場合) は、displayName も設定する
        if (!fieldToActivate.setting) {
            settingUpdates.displayName = `${type.toUpperCase()} ${index}`;
        }

        onSettingChange(itemType, type, index, settingUpdates);

    }, [allCustomFields, onSettingChange, itemType]);

    const gridSize = GRID_SETTINGS[itemType];
    const fixedHeight = FIXED_HEIGHTS[itemType];

    // ----------------------------------------
    // メイン描画
    // ----------------------------------------

    return (
        <Box>
            <Typography variant="h6" gutterBottom>
                カスタムフィールド {isReadOnly && <Typography component="span" variant="caption" color="textSecondary">(閲覧モード)</Typography>}
            </Typography>
            <Paper
                elevation={1}
                sx={{
                    p: 2,
                    mb: 2,
                    height: `${fixedHeight}px`,
                    overflowY: 'auto',
                }}
            >
                <Grid container spacing={2} sx={{ mb: activeFields.length > 0 ? 0 : 2 }}>

                    {activeFields.length === 0 ? (
                        <Grid size={{ xs: 12 }}>
                            <Typography color="textSecondary">カスタムフィールドが設定されていません。</Typography>
                        </Grid>
                    ) : (
                        activeFields.map((activeField) => {
                            const { fieldKey, type, setting } = activeField;

                            const value = itemData[fieldKey as keyof ItemWithCustomFields];

                            let inputControl = null;

                            inputControl = (
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
                                <Grid size={gridSize} key={fieldKey} sx={{ display: 'flex', alignItems: 'flex-start', mb: 0 }}>
                                    <Box sx={{ flexGrow: 1, minWidth: 0, mr: 1 }}>
                                        {inputControl}
                                    </Box>

                                    {/* 削除ボタン (編集モードでのみ表示) */}
                                    {!isReadOnly && (
                                        <IconButton
                                            // 値をクリアせず、isVisible: false にして非表示にする
                                            onClick={() => handleRemoveField(activeField)}
                                            size="small"
                                            color="error"
                                            // TextField の高さに合わせて位置を調整
                                            sx={{ mt: 0, alignSelf: 'center' }}
                                        >
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    )}
                                </Grid>
                            );
                        })
                    )}
                </Grid>

            </Paper>

            {/* カスタムフィールドの追加ドロップダウンと設定ボタン (編集モードでのみ表示) */}
            {!isReadOnly && (
                <>
                    <Divider sx={{ my: 2 }} />
                    {/* Gridを使用してレスポンシブに配置 */}
                    <Grid container spacing={2} alignItems="center"> 
                        
                        {/* ドロップダウン: activeFieldsのGrid設定をそのまま適用 (1要素をフル幅で扱う) */}
                        <Grid size={{ xs: gridSize.xs, sm: gridSize.sm, md: gridSize.md }}>
                            {/* availableFields.length が 0 でない限り Select は有効になる */}
                            <FormControl fullWidth size="small" disabled={availableFields.length === 0}>
                                <InputLabel>未使用フィールドを有効化/再表示</InputLabel>
                                <Select
                                    value=""
                                    label="未使用フィールドを有効化/再表示"
                                    onChange={handleActivateField}
                                >
                                    <MenuItem value="" disabled>
                                        フィールドを選択してください
                                    </MenuItem>
                                    {availableFields.map((f) => (
                                        <MenuItem key={f.fieldKey} value={f.fieldKey}>
                                            {/* 設定があればその表示名を、なければ物理フィールド名を表示 */}
                                            {f.setting?.displayName ? `${f.setting.displayName} (${f.fieldKey})` : `${f.type.toUpperCase()} ${f.index} (${f.fieldKey})`}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>

                        {/* 設定ボタン: activeFieldsのGrid設定をそのまま適用 (1要素をフル幅で扱う) */}
                        <Grid size={{ xs: gridSize.xs, sm: gridSize.sm, md: gridSize.md }}>
                            <Button
                                fullWidth // Gridアイテム内でフル幅を使用
                                variant="outlined"
                                onClick={handleOpenModal}
                                startIcon={<SettingsIcon />}
                            >
                                フィールド設定
                            </Button>
                        </Grid>
                        
                    </Grid>
                </>
            )}

            {/* CustomFieldModal の表示 */}
            {!isReadOnly && (
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