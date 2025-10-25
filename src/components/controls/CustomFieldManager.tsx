/**
 * src/components/controls/CustomFieldManager.tsx
 *
 * Pack, Card, Deckエンティティ共通のカスタムフィールド設定表示・編集コンポーネント。
 */
import React, { useMemo, useState } from 'react'; 
import { 
    Box, Typography, Grid, Paper, Divider, 
    TextField, Select, MenuItem, 
    FormControl, InputLabel, Button, IconButton, 
    type SelectChangeEvent,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete'; 
import EditIcon from '@mui/icons-material/Edit'; 
import AddIcon from '@mui/icons-material/Add'; 

import type { Card } from '../../models/card';
// CustomFieldModal のパスが正しいことを前提とする
import CustomFieldModal from '../modals/CustomFieldModal'; 
import type { DisplaySetting } from '../../models/pack';

// ----------------------------------------
// 共通 Props 定義
// ----------------------------------------

// Card型をベースに、将来PackやDeck型も入る可能性があるため、汎用的な名前を維持
type ItemWithCustomFields = Card;

// CustomFieldType に基づくマップ型に変更し、将来的な型変更に追随しやすくする
// 型抽象を廃止し、DisplaySetting[] の配列や Record<string, DisplaySetting> などに整理可能


export interface CustomFieldManagerProps {
    /** 編集対象のアイテムのカスタムフィールド設定 (Card, Deck, Packのいずれか) */
    customFieldSettings: Record<string, DisplaySetting>;
    /** 編集対象のアイテムオブジェクト全体 (localCard, localDeck, localPackなど) */
    itemData: ItemWithCustomFields; // 💡 修正: item -> itemData
    /** アイテムの値の変更ハンドラ (PackInfoForm の handlePackCustomFieldChangeに相当) */
    onFieldChange: <F extends keyof ItemWithCustomFields>(field: F, value: any) => void; // 💡 修正: onValueChange -> onFieldChange
    /** 編集対象のアイテムの種別 ('Card', 'Deck', 'Pack'など) */
    itemType: 'Card' | 'Deck' | 'Pack';
    
    /** カスタムフィールド設定 (displayName, isVisible) の変更をユーザー設定ストアに伝える */
    onSettingChange: (
        itemType: 'Card' | 'Deck' | 'Pack',
        type: 'num' | 'str',
        index: number,
        settingUpdates: Partial<DisplaySetting>
    ) => void;

    /** 💡 新規追加: 閲覧モード (true) か編集モード (false) か */
    isReadOnly: boolean; 
}

// ----------------------------------------
// ヘルパー: 全カスタムフィールドのキーと情報を取得
// ----------------------------------------

interface CustomFieldInfo {
    fieldKey: keyof ItemWithCustomFields;
    type: 'num' | 'str';
    index: number;
    setting?: DisplaySetting;
}

const ALL_CUSTOM_FIELDS: CustomFieldInfo[] = (() => {
    const fields: CustomFieldInfo[] = [];
    const types: Array<'num' | 'str'> = ['num', 'str'];
    const indices: number[] = [1, 2, 3, 4, 5, 6];
    for (const type of types) {
        for (const index of indices) {
            const fieldKey = `${type}_${index}` as keyof ItemWithCustomFields;
            fields.push({ fieldKey, type, index });
        }
    }
    return fields;
})();

// ----------------------------------------
// コンポーネント本体
// ----------------------------------------

const CustomFieldManager: React.FC<CustomFieldManagerProps> = ({ 
    customFieldSettings, // 💡 修正: customFieldSettings を使用
    itemData,          // 💡 修正: itemData を使用
    onFieldChange,     // 💡 修正: onFieldChange を使用
    itemType,
    onSettingChange, 
    isReadOnly,
}) => {
    
    // ----------------------------------------
    // CustomFieldModal の状態管理
    // ----------------------------------------
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedField, setSelectedField] = useState<{ 
        fieldInfo: CustomFieldInfo; 
    setting: DisplaySetting;
    } | null>(null);

    // 💡 カスタムフィールドの選択（有効化されている/値が設定されている）リストを計算
    const activeFields = useMemo(() => {
        return ALL_CUSTOM_FIELDS
            .map(field => {
                // 💡 修正4: customFieldSettings を使用し、存在チェックを強化
                const setting = customFieldSettings[`${field.type}_${field.index}`];
                
                // 設定が存在しない、または無効なインデックスの場合はスキップ
                if (!setting) return null;

                const itemValue = itemData[field.fieldKey]; // 💡 修正: item -> itemData

                const isVisibleInSetting = setting?.isVisible;

                // 値が設定されているかの判定ロジックを再整理
                let hasValue = false;
                
                // 💡 修正5: bool 型のロジックを削除
                if (field.type === 'str') {
                    hasValue = (itemValue as string)?.trim() !== '';
                } else if (field.type === 'num') {
                    // 数値型の場合、null, undefined, 0 は値がないとみなす
                    hasValue = (itemValue !== undefined && itemValue !== null && itemValue !== 0); 
                }
                
                // 編集モードでは、設定で非表示でも値があるものを表示する
                if (isVisibleInSetting || (!isReadOnly && hasValue)) {
                    return { ...field, setting };
                }
                // 閲覧モードでは、値が設定されているものも表示する (設定が無効でも)
                if (isReadOnly && hasValue) {
                    return { ...field, setting };
                }

                return null;
            })
            // 💡 修正6: setting の存在チェックはマップ内で実施済みだが、型を絞り込むため filter は維持
            .filter((f): f is CustomFieldInfo & { setting: DisplaySetting } => f !== null)
            .sort((a, b) => a.setting.displayName.localeCompare(b.setting.displayName));
    }, [customFieldSettings, itemData, isReadOnly]); // 💡 修正: itemData を依存配列に追加

    // 💡 未使用で有効化されていないフィールド (新規追加用)
    const availableFields = useMemo(() => {
        return ALL_CUSTOM_FIELDS
            .filter(field => {
                const setting = customFieldSettings[`${field.type}_${field.index}`];
                // 設定が存在しないか、設定が存在しつつ表示中のフィールドを除外
                if (!setting || setting.isVisible) return false;
                return !activeFields.some(f => f.fieldKey === field.fieldKey);
            })
            .map(field => ({ 
                ...field, 
                displayName: `${field.type.toUpperCase()}${field.index}`,
                // 💡 修正7: customFieldSettings を使用
                setting: customFieldSettings[`${field.type}_${field.index}`]! // 上で存在チェックしているので ! を使用
            }));
    }, [customFieldSettings, activeFields]);


    // ----------------------------------------
    // UI ロジック
    // ----------------------------------------

    const openSettingModal = React.useCallback((fieldInfo: CustomFieldInfo, currentSetting: DisplaySetting) => {
        if (isReadOnly) return;
        
        setSelectedField({ fieldInfo, setting: currentSetting });
        setIsModalOpen(true);
    }, [isReadOnly]);

    const handleCloseModal = React.useCallback(() => {
        setIsModalOpen(false);
        setSelectedField(null);
    }, []);
    
    const handleRemoveField = React.useCallback((field: CustomFieldInfo) => {
        if (isReadOnly) return;

    const setting = customFieldSettings[`${field.type}_${field.index}`]; // 💡 修正: customFieldSettings を使用
        if (!setting) return; 

        if (setting.isVisible) {
            alert('このフィールドは設定で有効化されているため、削除できません。設定で無効化してください。');
            return;
        }
        
        // localItem から値をクリア (null/'' をセット)
        let clearValue: any = null;
        // 💡 修正8: bool 型のロジックを削除
        if (field.type === 'str') clearValue = '';
        if (field.type === 'num') clearValue = null; 
        onFieldChange(field.fieldKey, clearValue); // 💡 修正: onValueChange -> onFieldChange
    }, [isReadOnly, customFieldSettings, onFieldChange]); // 💡 修正: onValueChange -> onFieldChange

    const handleActivateField = React.useCallback((e: SelectChangeEvent) => {
        const key = e.target.value as keyof ItemWithCustomFields;
        const fieldToActivate = availableFields.find(f => f.fieldKey === key);

        if (!fieldToActivate) return;

        const { fieldKey, type, index } = fieldToActivate;

        // 1. 値を初期値で初期化 (item 値の更新)
        const initialValue = fieldKey.startsWith('str') ? '' : null;
        onFieldChange(fieldKey, initialValue); // 💡 修正: onValueChange -> onFieldChange

        // 2. 設定を表示状態に変更 (global 設定の更新)
        onSettingChange(itemType, type, index, { isVisible: true });
    }, [availableFields, onFieldChange, onSettingChange, itemType]); // 💡 修正: onValueChange -> onFieldChange

    // ----------------------------------------
    // メイン描画
    // ----------------------------------------
    
    return (
        <Box>
            <Typography variant="h6" gutterBottom>
                {itemType} カスタムフィールド {isReadOnly && <Typography component="span" variant="caption" color="textSecondary">(閲覧モード)</Typography>}
            </Typography>
            <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
                
                <Grid container spacing={2}>
                    {activeFields.length === 0 ? (
                        <Grid size={{xs:12}}> 
                             <Typography color="textSecondary">カスタムフィールドが設定されていません。</Typography>
                        </Grid>
                    ) : (
                        activeFields.map((activeField) => {
                            const { fieldKey, type, setting } = activeField; 
                            const value = itemData[fieldKey]; // 💡 修正: item -> itemData
                            
                            let inputControl = null;
                            
                            // num/str 型
                                    inputControl = (
                                <TextField
                                    fullWidth
                                    label={setting.displayName}
                                    type={type === 'num' ? 'number' : 'text'}
                                    value={(value ?? '') as string | number}
                                    onChange={(e) => onFieldChange(fieldKey, e.target.value)} // 💡 修正: onValueChange -> onFieldChange
                                    size="small"
                                            // DisplaySetting に description はないためヘルパーテキストは表示しない
                                    InputLabelProps={{ shrink: true }}
                                    
                                    disabled={isReadOnly} 
                                    InputProps={{ 
                                        readOnly: isReadOnly, 
                                    }}
                                />
                            );
                            
                            // 閲覧モードでのみ、値が空の場合は非表示にする (boolを削除したためロジック簡素化)
                            const isValueEmptyInReadOnly = isReadOnly && (value === undefined || value === null || value === '' || value === 0);
                            if (isValueEmptyInReadOnly) return null;


                            return (
                                <Grid size={{xs:12, sm:6}} key={fieldKey} sx={{ display: 'flex', alignItems: 'center' }}>
                                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                                        {inputControl}
                                    </Box>
                                    
                                    {/* 設定変更ボタン (編集モードでのみ表示) */}
                                    {!isReadOnly && (
                                        <IconButton 
                                            onClick={() => openSettingModal(activeField, setting)} 
                                            size="small"
                                        >
                                            <EditIcon fontSize="small" />
                                        </IconButton>
                                    )}
                                    
                                    {/* 削除ボタン (設定で無効かつ編集モードでのみ表示) */}
                                    {!setting.isVisible && !isReadOnly && (
                                        <IconButton 
                                            onClick={() => handleRemoveField(activeField)} 
                                            size="small"
                                            color="error"
                                        >
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    )}
                                </Grid>
                            );
                        })
                    )}
                </Grid>
                
                {/* カスタムフィールドの追加ドロップダウン (編集モードでのみ表示) */}
                {!isReadOnly && (
                    <>
                        <Divider sx={{ my: 2 }} /> 
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                            <FormControl size="small" sx={{ minWidth: 200 }} disabled={availableFields.length === 0}>
                                <InputLabel>未使用フィールドを有効化</InputLabel>
                                <Select
                                    value=""
                                    label="未使用フィールドを有効化"
                                    onChange={handleActivateField} 
                                >
                                    {availableFields.map((f) => (
                                        <MenuItem key={f.fieldKey} value={f.fieldKey}>
                                            {`${f.displayName} (${f.fieldKey})`}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            <Button 
                                variant="outlined" 
                                startIcon={<AddIcon />} 
                                disabled={availableFields.length === 0}
                                sx={{ minWidth: 100 }}
                            >
                                追加
                            </Button>
                            <Typography variant="caption" color="textSecondary">
                                {availableFields.length} 枠が利用可能です。
                            </Typography>
                        </Box>
                    </>
                )}
            </Paper>

            {/* CustomFieldModal の表示 */}
            {selectedField && (
                <CustomFieldModal
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    itemType={itemType}
                    type={selectedField.fieldInfo.type}
                    index={selectedField.fieldInfo.index}
                    initialSetting={selectedField.setting}
                    onSettingChange={onSettingChange}
                />
            )}
        </Box>
    );
};

export default CustomFieldManager;