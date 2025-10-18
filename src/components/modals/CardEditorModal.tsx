/**
 * src/components/modals/CardEditorModal.tsx
 *
 * カードの新規作成・編集を行うためのモーダルコンポーネント。
 * モーダルの枠組み、カード基本情報の入力、および最終的な保存時のデータ整形 (型変換) の責務を持つ。
 * カスタムフィールドの管理は CardCustomFieldManager コンポーネントに委譲されている。
 */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, TextField, Box, Typography, Grid, Select, MenuItem,
    InputLabel, FormControl, Paper, Divider,
    type SelectChangeEvent,
} from '@mui/material';

import type { Card } from '../../models/card';
import type { RarityConfig } from '../../models/pack'; 

// 共通画像ユーティリティをインポート
import {
    getDisplayImageUrl,
    DEFAULT_CARD_PREVIEW_WIDTH as PREVIEW_W,
    DEFAULT_CARD_PREVIEW_HEIGHT as PREVIEW_H
} from '../../utils/imageUtils';

import { createDefaultCard } from '../../utils/dataUtils';

import CardCustomFieldManager from '../controls/CardCustomFieldManager';

// カスタムフィールドの型定義を再利用（ここではローカルに定義）
interface CustomField {
    key: string;
    value: string;
}

export interface CardEditorModalProps {
    open: boolean;
    onClose: () => void;
    card: Card | null;
    onSave: (cardToSave: Card) => void;
    // 削除処理は onRemove のみとする
    onRemove: (cardId: string) => Promise<void>; 
    packRaritySettings: RarityConfig[];
    currentPackName: string;
    currentPackId: string;
}

const CardEditorModal: React.FC<CardEditorModalProps> = ({ 
    open, onClose, card, onSave, 
    onRemove, // 削除処理
    packRaritySettings, currentPackName, currentPackId,
}) => {
    
    const [localCard, setLocalCard] = useState<Card | null>(card);
    const [customFields, setCustomFields] = useState<CustomField[]>([]);
    
    const rarityOptions: string[] = useMemo(() => {
        return packRaritySettings.map(c => c.rarityName);
    }, [packRaritySettings]);

    const isNew = !card;

    // モーダル開閉時の初期化ロジック
    useEffect(() => {
        if (open) {
            
            const baseCard: Card = card || createDefaultCard(currentPackId);
            
            const defaultRarityName = packRaritySettings.length > 0 
                ? packRaritySettings[0].rarityName
                : '';

            const finalCard: Card = {
                ...baseCard,
                number: (baseCard.number === undefined || baseCard.number === null) ? null : baseCard.number,
                packId: baseCard.packId || currentPackId,
                rarity: baseCard.rarity || defaultRarityName,
            };
            
            setLocalCard(finalCard);

            const initialFields: CustomField[] = Object.entries(finalCard.userCustom || {}).map(([key, value]) => ({ 
                key, 
                value: String(value ?? '') 
            }));
            setCustomFields(initialFields);
        } else {
            setLocalCard(null);
            setCustomFields([]); 
        }
    }, [open, card, currentPackId, packRaritySettings]); 

    const handleClose = useCallback(() => {
        onClose();
    }, [onClose]);

    const handleChange = useCallback((field: keyof Card, value: string) => {
        if (!localCard) return;
        setLocalCard({
            ...localCard,
            [field]: value
        });
    }, [localCard]);


    // 保存ロジック
    const handleSave = async () => {
        if (!localCard || !localCard.name || !localCard.packId) { 
            alert('カード名と収録パックは必須です。');
            return;
        }

        const rawNumberValue = localCard.number;
        let finalNumber: number | null = null;
        
        const numberString = String(rawNumberValue ?? ''); 
        if (numberString.trim()) {
            const parsed = parseInt(numberString, 10);
            finalNumber = (isNaN(parsed) || parsed <= 0) ? null : parsed; 
        } else {
            finalNumber = null;
        }

        const userCustom: Record<string, any> = customFields.reduce((acc, field) => {
            if (field.key.trim()) {
                acc[field.key.trim()] = field.value;
            }
            return acc;
        }, {} as Record<string, any>);
        
        const now = new Date().toISOString();

        const cardToSave: Card = { 
            ...localCard, 
            userCustom,
            number: finalNumber, 
            updatedAt: now,
            cardId: localCard.cardId || (isNew ? createDefaultCard(localCard.packId).cardId : ''),
        };

        try {
            onSave(cardToSave); 
        } catch (error) {
            alert('カードの保存に失敗しました。コンソールを確認してください。');
            console.error(error);
        }
    };

    // 削除ロジック
    const handleRemove = async () => {
        if (!localCard || !localCard.cardId) {
            return;
        }
        
        // 削除確認 (任意で追加)
        if (!window.confirm(`カード「${localCard.name}」を削除してもよろしいですか？`)) {
             return;
        }

        try {
            await onRemove(localCard.cardId); 
            handleClose();
        } catch (error) {
            alert('カードの削除処理に失敗しました。');
            console.error(error);
        }
    };
    
    // handleRestore の削除

    // handlePhysicalDelete の削除


    // プレビュー画像のURLを生成
    const displayImageUrl = useMemo(() => {
        return getDisplayImageUrl(
            localCard?.imageUrl,
            {
                width: PREVIEW_W,
                height: PREVIEW_H,
                text: localCard?.name?.substring(0, 3) || '??', 
            }
        );
    }, [localCard?.imageUrl, localCard?.name]);
    
    // isAllViewMode および isInStore 依存のロジックはすべて削除済み

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth>
            <DialogTitle>
                {isNew ? '新規カードの作成' : `カード「${card?.name}」の編集`}
            </DialogTitle>
            <DialogContent dividers>
                <Grid container spacing={4}>
                    {/* 左側: プレビュー */}
                    <Grid size={{xs:12,md:5}}>
                        <Paper elevation={3} sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <Typography variant="h6" gutterBottom>カードプレビュー</Typography>
                            {/* プレビュー画像 */}
                            <Box sx={{ width: PREVIEW_W, height: PREVIEW_H, mb: 2, border: '1px solid #ccc', overflow: 'hidden' }}>
                                <img
                                    src={displayImageUrl}
                                    alt={localCard?.name || 'プレビュー'}
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover'
                                    }}
                                />
                            </Box>
                        </Paper>
                    </Grid>

                    {/* 右側: フォーム入力 */}
                    <Grid size={{xs:12,md:7}}>
                        <Typography variant="h6" gutterBottom>基本情報</Typography>
                        <Grid container spacing={2}>
                            {/* カードID (編集不可) */}
                            <Grid size={{xs:12, sm:6}}>
                                <TextField
                                    fullWidth
                                    label="カードID"
                                    value={localCard?.cardId || '(新規作成時に自動生成)'}
                                    disabled
                                    size="small"
                                />
                            </Grid>

                            {/* 図鑑 No. (ソート順) */}
                            <Grid size={{xs:12, sm:6}}>
                                <TextField
                                    fullWidth
                                    label="図鑑 No. (ソート順)"
                                    name="number"
                                    type="number"
                                    value={localCard?.number ?? ''} 
                                    onChange={(e) => handleChange('number', e.target.value)}
                                    size="small"
                                    helperText="空欄の場合、パック編集画面で自動採番されます。"
                                    InputLabelProps={{ shrink: true }}
                                />
                            </Grid>

                            {/* カード名 (必須) */}
                            <Grid size={{xs:12}}>
                                <TextField
                                    fullWidth
                                    label="カード名"
                                    name="name"
                                    value={localCard?.name || ''}
                                    onChange={(e) => handleChange('name', e.target.value)}
                                    required
                                    size="small"
                                />
                            </Grid>

                            {/* imageUrl 入力欄 */}
                            <Grid size={{xs:12}}>
                                <TextField
                                    fullWidth
                                    label="画像URL (imageUrl)"
                                    name="imageUrl"
                                    value={localCard?.imageUrl || ''}
                                    onChange={(e) => handleChange('imageUrl', e.target.value)}
                                    size="small"
                                />
                            </Grid>

                            {/* 収録パック (packId) - 読み取り専用 */}
                            <Grid size={{xs:12, sm:6}}>
                                <TextField
                                    fullWidth
                                    label="収録パック (packId)"
                                    value={`${currentPackName} (${localCard?.packId || '未設定'})`} 
                                    disabled 
                                    size="small"
                                    InputLabelProps={{ shrink: true }}
                                />
                            </Grid>

                            {/* レアリティ (Select) */}
                            <Grid size={{xs:12, sm:6}}>
                                <FormControl fullWidth size="small" required>
                                    <InputLabel>レアリティ (rarity)</InputLabel>
                                    <Select
                                        value={localCard?.rarity || ''}
                                        label="レアリティ (rarity)"
                                        onChange={(e: SelectChangeEvent) => handleChange('rarity', e.target.value)}
                                        disabled={rarityOptions.length === 0}
                                    >
                                        {rarityOptions.map((rarity) => (
                                            <MenuItem key={rarity} value={rarity}>
                                                {rarity}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                    {rarityOptions.length === 0 && localCard?.packId && (
                                        <Typography variant="caption" color="error" sx={{ ml: 1, mt: 0.5 }}>
                                            収録パックのレアリティ設定が見つかりません。
                                        </Typography>
                                    )}
                                </FormControl>
                            </Grid>
                        </Grid>

                        <Divider sx={{ my: 3 }} />

                        {/* カスタムフィールドの管理 */}
                        <CardCustomFieldManager
                            customFields={customFields}
                            setCustomFields={setCustomFields}
                        />

                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions>
                {/* 削除ボタン（編集時のみ表示） */}
                {!isNew && (
                    <Button onClick={handleRemove} color="error" variant="outlined" sx={{ mr: 'auto' }}>
                        カードを削除
                    </Button>
                )}
                
                {/* 通常操作ボタン */}
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