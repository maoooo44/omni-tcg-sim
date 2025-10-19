/**
 * src/components/controls/CustomFieldManager.tsx
 *
 * Pack, Card, Deckエンティティ共通のカスタムフィールド設定表示・編集コンポーネント。
 * 設定の表示名や有効/無効の編集と、アイテムごとのフィールド値の入力を行う。
 * 💡 修正: isReadOnly props に基づき、閲覧/編集モードを切り替える。
 * 💡 修正: CustomFieldModalの開閉と、未使用フィールド有効化ロジックを追加。
 */
import React, { useMemo, useState } from 'react'; // 💡 useState をインポート
import { 
    Box, Typography, Grid, Paper, Divider, 
    TextField, Checkbox, FormControlLabel, Select, MenuItem,
    FormControl, InputLabel, Button, IconButton,
    type SelectChangeEvent,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add'; 

import type { Card } from '../../models/card';
import type { CustomFieldCategory, CustomFieldIndex, CustomFieldType, FieldSetting } from '../../models/custom-field';
import CustomFieldModal from '../modals/CustomFieldModal'; // 💡 CustomFieldModal をインポート

// ----------------------------------------
// 共通 Props 定義 (変更なし)
// ----------------------------------------

type ItemWithCustomFields = Card;

export interface CustomFieldManagerProps {
    /** 編集対象のアイテムのカスタムフィールド設定 (Card, Deck, Packのいずれか) */
    categorySettings: CustomFieldCategory;
    /** 編集対象のアイテムオブジェクト全体 (localCard, localDeck, localPackなど) */
    item: ItemWithCustomFields;
    /** アイテムの値の変更ハンドラ (CardEditorModalの handleChangeに相当) */
    onValueChange: <F extends keyof ItemWithCustomFields>(field: F, value: any) => void;
    /** 編集対象のアイテムの種別 ('Card', 'Deck', 'Pack'など) */
    itemType: 'Card' | 'Deck' | 'Pack';
    
    /** カスタムフィールド設定 (displayName, isEnabled, description) の変更をユーザー設定ストアに伝える */
    onSettingChange: (
        itemType: 'Card' | 'Deck' | 'Pack',
        type: CustomFieldType, 
        index: CustomFieldIndex, 
        settingUpdates: Partial<FieldSetting>
    ) => void;

    /** 💡 新規追加: 閲覧モード (true) か編集モード (false) か */
    isReadOnly: boolean; 
}

// ----------------------------------------
// ヘルパー: 全カスタムフィールドのキーと情報を取得 (変更なし)
// ----------------------------------------

interface CustomFieldInfo {
    fieldKey: keyof ItemWithCustomFields;
    type: CustomFieldType;
    index: CustomFieldIndex;
}

const ALL_CUSTOM_FIELDS: CustomFieldInfo[] = (() => {
    const fields: CustomFieldInfo[] = [];
    const types: CustomFieldType[] = ['bool', 'num', 'str'];
    const indices: CustomFieldIndex[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    
    for (const type of types) {
        for (const index of indices) {
            const fieldKey = `custom_${index}_${type}` as keyof ItemWithCustomFields;
            fields.push({ fieldKey, type, index: index as CustomFieldIndex });
        }
    }
    return fields;
})();

// ----------------------------------------
// コンポーネント本体
// ----------------------------------------

const CustomFieldManager: React.FC<CustomFieldManagerProps> = ({ 
    categorySettings, 
    item, 
    onValueChange, 
    itemType,
    onSettingChange, 
    isReadOnly,
}) => {
    
    // ----------------------------------------
    // 💡 修正1: CustomFieldModal の状態管理
    // ----------------------------------------
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedField, setSelectedField] = useState<{ 
        fieldInfo: CustomFieldInfo; 
        setting: FieldSetting; 
    } | null>(null);

    // 💡 カスタムフィールドの選択（有効化されている/値が設定されている）リストを計算 (ロジック変更なし)
    const activeFields = useMemo(() => {
        return ALL_CUSTOM_FIELDS
            .map(field => {
                const setting = categorySettings[field.type][field.index];
                const itemValue = item[field.fieldKey];

                const isEnabledInSetting = setting?.isEnabled;

                // 値が設定されているかの判定ロジックを再整理
                let hasValue = false;
                if (field.type === 'bool') {
                    hasValue = itemValue === true; // true のみで判断
                } else if (field.type === 'str') {
                    hasValue = (itemValue as string)?.trim() !== '';
                } else if (field.type === 'num') {
                    // 数値型の場合、0は値がないとみなす
                    hasValue = (itemValue !== undefined && itemValue !== null && itemValue !== 0); 
                }
                
                // 編集モードでは、設定で無効でも値があるものを表示する
                if (isEnabledInSetting || (!isReadOnly && hasValue)) {
                    return { ...field, setting };
                }
                // 閲覧モードでは、値が設定されているものも表示する (設定が無効でも)
                if (isReadOnly && hasValue) {
                    return { ...field, setting };
                }

                return null;
            })
            .filter((f): f is CustomFieldInfo & { setting: FieldSetting } => f !== null)
            .sort((a, b) => a.setting.displayName.localeCompare(b.setting.displayName));
    }, [categorySettings, item, isReadOnly]);

    // 💡 未使用で有効化されていないフィールド (新規追加用) (ロジック変更なし)
    const availableFields = useMemo(() => {
        return ALL_CUSTOM_FIELDS
            .filter(field => {
                const setting = categorySettings[field.type][field.index];
                // 設定で有効化されておらず、
                if (setting?.isEnabled) return false;
                // 現在アクティブなリストにも存在しないもの
                return !activeFields.some(f => f.fieldKey === field.fieldKey);
            })
            .map(field => ({ 
                ...field, 
                displayName: `${field.type.toUpperCase()}${field.index}`,
                setting: categorySettings[field.type][field.index] // 設定自体も渡せるようにする
            }));
    }, [categorySettings, activeFields]);


    // ----------------------------------------
    // UI ロジック (編集モードでのみ実行可能)
    // ----------------------------------------

    // 💡 修正2: 設定変更モーダルを開く処理を CustomFieldModal の表示に置き換え
    const openSettingModal = (fieldInfo: CustomFieldInfo, currentSetting: FieldSetting) => {
        if (isReadOnly) return;
        
        setSelectedField({ fieldInfo, setting: currentSetting });
        setIsModalOpen(true);
    };

    // モーダルを閉じる処理
    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedField(null);
    };
    
    // フィールド値の削除 (編集モードでのみ実行可能) (ロジック変更なし)
    const handleRemoveField = (field: CustomFieldInfo) => {
        if (isReadOnly) return;

        const setting = categorySettings[field.type][field.index];
        if (setting.isEnabled) {
            alert('このフィールドは設定で有効化されているため、削除できません。設定で無効化してください。');
            return;
        }
        
        // localCard から値をクリア (null/''/false をセット)
        let clearValue: any = null;
        if (field.type === 'bool') clearValue = false;
        if (field.type === 'str') clearValue = '';
        onValueChange(field.fieldKey, clearValue); 
    };
    
    // 💡 修正3: 未使用フィールドの有効化ロジック
    const handleActivateField = (e: SelectChangeEvent) => {
        const key = e.target.value as keyof ItemWithCustomFields;
        const fieldToActivate = availableFields.find(f => f.fieldKey === key);

        if (!fieldToActivate) return;

        const { fieldKey, type, index } = fieldToActivate;

        // 1. 値を初期値で初期化 (item 値の更新)
        const initialValue = fieldKey.endsWith('_bool') ? true : (fieldKey.endsWith('_str') ? '' : null);
        onValueChange(fieldKey, initialValue);

        // 2. 設定を有効化 (global 設定の更新)
        // 既存の displayName や description はそのままに、isEnabled: true で更新
        onSettingChange(itemType, type, index, { isEnabled: true });
    };

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
                            const value = item[fieldKey];
                            
                            let inputControl = null;
                            
                            if (type === 'bool') {
                                // 閲覧モード
                                if (isReadOnly) {
                                    inputControl = (
                                        <TextField
                                            fullWidth
                                            label={setting.displayName}
                                            value={value ? '有効' : '無効'}
                                            InputProps={{ readOnly: true }}
                                            size="small"
                                            helperText={setting.description}
                                            InputLabelProps={{ shrink: true }}
                                        />
                                    );
                                } else {
                                    // 編集モード
                                    inputControl = (
                                        <FormControlLabel
                                            control={
                                                <Checkbox 
                                                    checked={!!value}
                                                    onChange={(e) => onValueChange(fieldKey, e.target.checked)}
                                                    // isReadOnlyは常にfalse
                                                />
                                            }
                                            label={setting.displayName}
                                        />
                                    );
                                }

                            } else {
                                // num/str 型
                                inputControl = (
                                    <TextField
                                        fullWidth
                                        label={setting.displayName}
                                        type={type === 'num' ? 'number' : 'text'}
                                        value={(value ?? '') as string | number}
                                        onChange={(e) => onValueChange(fieldKey, e.target.value)} 
                                        size="small"
                                        helperText={setting.description}
                                        InputLabelProps={{ shrink: true }}
                                        
                                        disabled={isReadOnly} 
                                        InputProps={{ 
                                            readOnly: isReadOnly, 
                                        }}
                                    />
                                );
                            }

                            // 閲覧モードでのみ、値が空の場合は非表示にする
                            const isValueEmptyInReadOnly = isReadOnly && (type !== 'bool' && (value === undefined || value === null || value === '' || value === 0));
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
                                    {!setting.isEnabled && !isReadOnly && (
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
                                    onChange={handleActivateField} // 💡 修正3: 専用ハンドラに置き換え
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

            {/* 💡 CustomFieldModal の表示 */}
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