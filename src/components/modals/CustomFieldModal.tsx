/**
 * src/components/modals/CustomFieldModal.tsx
 * * 特定のカスタムフィールド（bool, num, str のどれか、インデックス1-10）の設定
 * (displayName, description, isEnabled) を編集するためのモーダル。
 * * 💡 CustomFieldManager.tsx の openSettingModal から呼び出される。
 */
import React, { useState, useEffect } from 'react';
import { 
    Dialog, DialogTitle, DialogContent, DialogActions, 
    TextField, Button, FormControlLabel, Checkbox, 
    Typography, Box, Grid
} from '@mui/material';

import type { DisplaySetting } from '../../models/pack';

// ----------------------------------------
// Props 定義
// ----------------------------------------

export interface CustomFieldModalProps {
    /** モーダルの開閉状態 */
    isOpen: boolean;
    /** モーダルを閉じるハンドラ */
    onClose: () => void;

    /** 編集対象アイテムの種別 ('Card', 'Deck', 'Pack'など) */
    itemType: 'Card' | 'Deck' | 'Pack';
    /** 編集対象フィールドの型 ('bool', 'num', 'str') */
    type: 'num' | 'str';
    index: number;
    
    /** 現在の設定の初期値 */
    initialSetting: DisplaySetting;

    /**
    /** カスタムフィールド設定 (displayName, isVisible, description) の変更を親に伝える
     */
    onSettingChange: (
        itemType: 'Card' | 'Deck' | 'Pack',
        type: 'num' | 'str',
        index: number,
        settingUpdates: Partial<DisplaySetting>
    ) => void;
}

// ----------------------------------------
// コンポーネント本体
// ----------------------------------------

const CustomFieldModal: React.FC<CustomFieldModalProps> = ({ 
    isOpen, 
    onClose, 
    itemType, 
    type, 
    index, 
    initialSetting, 
    onSettingChange 
}) => {
    // フォームのローカル状態管理
    const [localSetting, setLocalSetting] = useState<DisplaySetting>(initialSetting);

    // initialSetting が変更されたとき（モーダルが開いたときなど）に状態をリセット
    useEffect(() => {
        setLocalSetting(initialSetting);
    }, [initialSetting]);

    // 入力値変更ハンドラ (Text / Checkbox)
    const handleChange = (field: keyof DisplaySetting, value: any) => {
        // 💡 修正2: TS7006 エラー解消のため、prev に明示的に FieldSetting 型を指定
        setLocalSetting((prev: DisplaySetting) => ({
            ...prev,
            [field]: value
        }));
    };

    // 保存処理
    const handleSave = () => {
        // displayNameが必須であると仮定し、空の場合は保存をブロック
        if (!localSetting.displayName.trim()) {
            alert("表示名は必須です。");
            return;
        }

        // 変更された部分のみを抽出して onSettingChange を呼び出す
        const updates: Partial<DisplaySetting> = {};
        if (localSetting.displayName !== initialSetting.displayName) {
            updates.displayName = localSetting.displayName;
        }
        // description が undefined から '' に変わる可能性も考慮
        // DisplaySetting uses isVisible for visibility toggle
        if ((localSetting as any).isVisible !== (initialSetting as any).isVisible) {
            (updates as any).isVisible = (localSetting as any).isVisible;
        }

        // 実際に更新があった場合のみストアアクションを呼び出す
        if (Object.keys(updates).length > 0) {
            onSettingChange(itemType, type, index, updates);
        }
        
        onClose(); // モーダルを閉じる
    };

    // キャンセル処理
    const handleCancel = () => {
        // 状態を初期値に戻す（useEffectが実行されるため厳密には不要だが念のため）
        setLocalSetting(initialSetting);
        onClose();
    };


    // フォームが無効化されているかチェック (displayNameが空の場合)
    const isSaveDisabled = !localSetting.displayName.trim();

    return (
        <Dialog 
            open={isOpen} 
            onClose={handleCancel} 
            maxWidth="sm" 
            fullWidth
        >
            <DialogTitle>カスタムフィールド設定の編集</DialogTitle>
            <DialogContent dividers>
                <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle1" color="textSecondary">
                        対象: **{itemType}** ({type.toUpperCase()}{index})
                    </Typography>
                </Box>
                
                <Grid container spacing={2}>
                    
                    {/* 表示名 (必須) */}
                    <Grid size={{ xs: 12 }}>
                        <TextField
                            fullWidth
                            required
                            label="表示名"
                            // localSetting.displayName は useEffect で初期化されるため、! が不要
                            value={localSetting.displayName} 
                            onChange={(e) => handleChange('displayName', e.target.value)}
                            helperText="カードの入力フォームに表示される名前です。"
                            inputProps={{ maxLength: 50 }}
                        />
                    </Grid>

                    {/* 説明フィールドは DisplaySetting に含まれないため削除（シンプル化） */}

                    {/* 有効/無効の切り替え */}
                    <Grid size={{ xs: 12 }}>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={(localSetting as any).isVisible}
                                    onChange={(e) => handleChange('isVisible' as any, e.target.checked)}
                                />
                            }
                            label="このカスタムフィールドを表示する"
                        />
                        <Typography variant="caption" color="textSecondary" sx={{ display: 'block' }}>
                            無効にすると、このフィールドはUIに表示されなくなりますが、既存の値は保持されます。
                        </Typography>
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleCancel} color="inherit">
                    キャンセル
                </Button>
                <Button 
                    onClick={handleSave} 
                    color="primary" 
                    variant="contained"
                    disabled={isSaveDisabled}
                >
                    保存
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default CustomFieldModal;