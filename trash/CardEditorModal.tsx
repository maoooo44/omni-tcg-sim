/**
 * src/components/modals/CardEditorModal.tsx
 *
 * 💡 修正: カスタムフィールドの選択・入力ロジックを CustomFieldManager に委譲。
 */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, TextField, Box, Typography, Grid, Select, MenuItem,
    InputLabel, FormControl, Paper, Divider, type SelectChangeEvent
    // IconButton, Checkbox, FormControlLabel, SelectChangeEvent は不要になったか、CustomFieldManager 内に移動
} from '@mui/material';
import type { Card } from '../../models/card';
import type { RarityConfig } from '../../models/pack'; 
import type { CustomFieldCategory, CustomFieldIndex, CustomFieldType, FieldSetting } from '../../models/custom-field'; // 💡 CustomFieldConfig も必要になる可能性

// 💡 CustomFieldManager をインポート
import CustomFieldManager from '../controls/CustomFieldManager'; 

// 共通画像ユーティリティをインポート (中略)
import { getDisplayImageUrl, DEFAULT_CARD_PREVIEW_WIDTH as PREVIEW_W, DEFAULT_CARD_PREVIEW_HEIGHT as PREVIEW_H } from '../../utils/imageUtils';
import { createDefaultCard } from '../../utils/dataUtils';


// 💡 修正: CustomFieldManager を使用するため、SelectedField, ALL_CUSTOM_FIELDS, getAllCustomFieldKeys は不要。削除します。


export interface CardEditorModalProps {
    open: boolean;
    onClose: () => void;
    card: Card | null;
    onSave: (cardToSave: Card) => void;
    onRemove: (cardId: string) => Promise<void>; 
    packRaritySettings: RarityConfig[];
    currentPackName: string;
    currentPackId: string;
    // 💡 修正: CardEditorModalProps は Card の設定 Category のみを渡すようにシンプル化 (CustomFieldManager に渡す)
    customFieldSettings: CustomFieldCategory; 
    
    // 💡 追加: ユーザー設定ストアへの変更を扱うハンドラ（ここでは仮で定義）
    onCustomFieldSettingChange: (
        itemType: 'Card' | 'Deck' | 'Pack',
        type: CustomFieldType, 
        index: CustomFieldIndex, 
        settingUpdates: Partial<FieldSetting>
    ) => void;
}


// ----------------------------------------
// CardEditorModal 本体
// ----------------------------------------

const CardEditorModal: React.FC<CardEditorModalProps> = ({ 
    open, onClose, card, onSave, 
    onRemove,
    packRaritySettings, currentPackName, currentPackId,
    customFieldSettings, // Card のカスタムフィールド設定を受け取る
    onCustomFieldSettingChange, // 設定更新ハンドラを受け取る
}) => {
    
    const [localCard, setLocalCard] = useState<Card | null>(card);
    // 💡 selectedCustomFields ステートは CustomFieldManager に移譲するため削除
    
    const rarityOptions: string[] = useMemo(() => {
        return packRaritySettings.map(c => c.rarityName);
    }, [packRaritySettings]);

    const isNew = !card;

    // モーダル開閉時の初期化ロジック (selectedCustomFields の初期化ロジックを削除)
    useEffect(() => {
        if (open) {
            const baseCard: Card = card || createDefaultCard(currentPackId);
            
            const defaultRarityName = packRaritySettings.length > 0 ? packRaritySettings[0].rarityName : '';

            const finalCard: Card = {
                ...baseCard,
                number: (baseCard.number === undefined || baseCard.number === null) ? null : baseCard.number,
                packId: baseCard.packId || currentPackId,
                rarity: baseCard.rarity || defaultRarityName,
            };
            
            setLocalCard(finalCard);
            // 💡 修正: カスタムフィールドの初期化ロジックは CustomFieldManager 側で処理されるため、この部分のロジックは不要
            
        } else {
            setLocalCard(null);
            // 💡 selectedCustomFields のクリアも不要
        }
    }, [open, card, currentPackId, packRaritySettings]); // 依存配列から customFieldSettings を削除

    const handleClose = useCallback(() => {
        onClose();
    }, [onClose]);

    // 💡 修正: 汎用的な変更ハンドラ。カスタムフィールドの型変換ロジックは維持。
    const handleChange = useCallback(<F extends keyof Card>(field: F, rawValue: any) => {
        if (!localCard) return;
        
        let value: any = rawValue;

        // number 型のフィールド ('number', '*_num') の値変換
        if (field === 'number' || String(field).endsWith('_num')) {
            const numValue = rawValue === null || rawValue === '' ? null : Number(rawValue);
            // NaN の場合も null に変換
            value = isNaN(numValue as number) ? null : numValue;
        } 
        // boolean 型のフィールド ('*_bool') の値変換
        else if (String(field).endsWith('_bool')) {
            // Checkboxからの入力は boolean になる
            value = (rawValue === 'true' || rawValue === true || rawValue === 1);
        }
        // string 型はそのまま (name, imageUrl, rarity, *_str)

        setLocalCard(prev => prev ? {
            ...prev,
            [field]: value
        } : null); // null チェックを強化
    }, [localCard]);

    // 💡 修正: カスタムフィールドの選択/削除ロジック (handleSelectField, availableFieldOptions) は CustomFieldManager に移譲するため削除

    // 保存ロジック (変更なし)
    const handleSave = async () => { /* ... 略 ... */ 
        if (!localCard || !localCard.name || !localCard.packId) { 
            alert('カード名と収録パックは必須です。');
            return;
        }
        // ... 型変換ロジック ...
        const rawNumberValue = localCard.number;
        let finalNumber: number | null = null;
        
        const numberString = String(rawNumberValue ?? ''); 
        if (numberString.trim()) {
            const parsed = parseInt(numberString, 10);
            finalNumber = (isNaN(parsed) || parsed <= 0) ? null : parsed; 
        } else {
            finalNumber = null;
        }
        
        const now = new Date().toISOString();

        // 2. CardToSave を作成。カスタムフィールドは localCard にそのまま含まれている。
        const cardToSave: Card = { 
            ...localCard, 
            number: finalNumber,
            updatedAt: now,
            cardId: localCard.cardId || (isNew ? createDefaultCard(localCard.packId).cardId : ''),
        };

        try {
            onSave(cardToSave); 
            handleClose();
        } catch (error) {
            alert('カードの保存に失敗しました。コンソールを確認してください。');
            console.error(error);
        }
    };

    // 削除ロジック (変更なし)
    const handleRemove = async () => { /* ... 略 ... */ };
    
    // プレビュー画像のURLを生成 (変更なし)
    const displayImageUrl = useMemo(() => getDisplayImageUrl(localCard?.imageUrl, localCard?.name), [localCard?.imageUrl, localCard?.name]);
    
    if (!localCard) return null;

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth>
            <DialogTitle>
                {isNew ? '新規カードの作成' : `カード「${localCard.name}」の編集`}
            </DialogTitle>
            <DialogContent dividers>
                <Grid container spacing={4}>
                    {/* 左側: プレビュー (中略) */}
                    <Grid size={{xs:12,md:5}}>
                        <Paper elevation={3} sx={{ p: 2, textAlign: 'center' }}>
                            <Typography variant="subtitle1" gutterBottom>カードプレビュー</Typography>
                            <Box sx={{ width: PREVIEW_W, height: PREVIEW_H, margin: '0 auto', border: '1px solid #ccc', overflow: 'hidden' }}>
                                {/* プレビュー画像表示 */}
                                <img 
                                    src={displayImageUrl} 
                                    alt={localCard.name || 'プレビュー'}
                                    style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
                                />
                            </Box>
                            {/* ... 画像URL入力 ... */}
                            <TextField
                                fullWidth
                                label="画像URL"
                                value={localCard.imageUrl || ''}
                                onChange={(e) => handleChange('imageUrl', e.target.value)}
                                size="small"
                                margin="normal"
                            />
                        </Paper>
                    </Grid>

                    {/* 右側: フォーム入力 */}
                    <Grid size={{xs:12,md:7}}>
                        {/* 基本情報入力 (中略) */}
                        <Grid container spacing={2}>
                            <Grid size={{xs:12}}>
                                <TextField
                                    fullWidth
                                    required
                                    label="カード名"
                                    value={localCard.name || ''}
                                    onChange={(e) => handleChange('name', e.target.value)}
                                    size="small"
                                />
                            </Grid>
                            <Grid size={{xs:6}}>
                                <TextField
                                    fullWidth
                                    label="カード番号"
                                    type="number"
                                    value={localCard.number ?? ''}
                                    onChange={(e) => handleChange('number', e.target.value)}
                                    size="small"
                                />
                            </Grid>
                            <Grid size={{xs:6}}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>レアリティ</InputLabel>
                                    <Select
                                        value={localCard.rarity || ''}
                                        label="レアリティ"
                                        onChange={(e: SelectChangeEvent) => handleChange('rarity', e.target.value)}
                                    >
                                        {rarityOptions.map(r => (
                                            <MenuItem key={r} value={r}>{r}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                        </Grid>

                        <Divider sx={{ my: 3 }} />

                        {/* 💡 修正: CustomFieldManager コンポーネントを使用 */}
                        <CustomFieldManager
                            // Card のカスタムフィールド設定を渡す
                            categorySettings={customFieldSettings} 
                            // Card オブジェクト全体と、その更新ハンドラを渡す
                            item={localCard} 
                            onValueChange={handleChange} // 汎用的な変更ハンドラを渡す
                            itemType="Card" 
                            onSettingChange={onCustomFieldSettingChange} // 設定更新ハンドラを渡す
                        />
                        
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions>
                {/* ボタン類 (中略) */}
                {!isNew && (
                    <Button onClick={handleRemove} color="error" variant="outlined" sx={{ mr: 'auto' }}>
                        カードを削除
                    </Button>
                )}
                
                <Button onClick={handleClose} variant="outlined">
                    キャンセル
                </Button>
                <Button onClick={handleSave} variant="contained" color="primary">
                    {isNew ? 'カードを作成' : '変更を保存'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default CardEditorModal;