// src/components/CardEditModal.tsx

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, TextField, Box, Typography, Grid, Select, MenuItem,
    InputLabel, FormControl, IconButton, Paper, Divider,
    type SelectChangeEvent,
} from '@mui/material';

import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
// 削除: パック選択が不要になったため、usePackStore は削除
// import { usePackStore } from '../stores/packStore'; 
import type { Card } from '../models/card';
import type { RarityConfig } from '../models/pack'; // ★ 追加: RarityConfig の型をインポート

// 共通画像ユーティリティをインポート
import {
    getDisplayImageUrl,
    DEFAULT_CARD_PREVIEW_WIDTH as PREVIEW_W,
    DEFAULT_CARD_PREVIEW_HEIGHT as PREVIEW_H
} from '../utils/imageUtils';

// 修正: モーダルが受け取るプロパティに onSave と onDelete, packRaritySettings, currentPackName, currentPackId を追加
export interface CardEditModalProps {
    open: boolean;
    onClose: () => void;
    card: Card | null;
    // 💡 追加: 親コンポーネント (PackEditPage) から渡される保存ハンドラ
    onSave: (cardToSave: Card) => void;
    // 💡 追加: 親コンポーネント (PackEditPage) から渡される削除ハンドラ
    onDelete: (cardId: string) => void;
    // ★ 修正: 親から渡される現在のパックのレアリティ設定リスト
    packRaritySettings: RarityConfig[];
    // ★ 修正: 収録パックの表示に使用するため、現在のパック名を受け取る
    currentPackName: string;
    // ★ 追加: 新規カード作成時に packId を初期化するために、現在のパックIDを受け取る
    currentPackId: string; // ★ 修正
}

// ★ 修正: 引数に currentPackName, currentPackId を追加
const CardEditModal: React.FC<CardEditModalProps> = ({ open, onClose, card, onSave, onDelete, packRaritySettings, currentPackName, currentPackId }) => { // ★ 修正
    // ユーザーカスタムフィールドを扱うための内部状態
    const initialCustomFields = useMemo(() => {
        if (!card?.userCustom) return [];
        return Object.entries(card.userCustom).map(([key, value]) => ({
            key,
            value: String(value)
        }));
    }, [card]);

     // ★ 修正 1: useState の初期値を card にし、nullの場合は空の構造体で初期化
    // 🚨 ただし、今回は新規作成時に親からUUIDを持つCardが渡される前提なので、親の値を尊重する。
    const [localCard, setLocalCard] = useState<Card | null>(card);
    const [customFields, setCustomFields] = useState<{ key: string, value: string }[]>(initialCustomFields);
    const [newCustomKey, setNewCustomKey] = useState('');
    const [newCustomValue, setNewCustomValue] = useState('');

    // 削除: パック選択を廃止したため、packs の取得は不要
    // const packs = usePackStore(state => state.packs);

    // レアリティオプションの計算 (渡された packRaritySettings を使用)
    const rarityOptions: string[] = useMemo(() => {
        // ★ 修正: Propsの packRaritySettings を直接使用 (rarityNameを使用)
        return packRaritySettings.map(c => c.rarityName);
    }, [packRaritySettings]);

    const isNew = !card;

    // ★ 修正 2: モーダル開閉時の初期化ロジックを修正
    useEffect(() => {
        if (open) {
            let initialCard = card;

            // ★ 修正: cardがnull (新規作成) の場合に、packIdとデフォルトレアリティを設定する
            if (!initialCard) {
                initialCard = {
                    cardId: '', 
                    name: '',
                    packId: currentPackId, // ★ 修正: currentPackId を使用
                    imageUrl: '',
                    rarity: packRaritySettings.length > 0 ? packRaritySettings[0].rarityName : '', // ★ レアリティ初期値も設定
                    userCustom: {},
                    registrationSequence: 0,
                };
            }
            
            setLocalCard(initialCard);

            // カスタムフィールドを初期化
            const initialFields = initialCard.userCustom // ★ initialCard を参照する
                ? Object.entries(initialCard.userCustom).map(([key, value]) => ({ key, value: String(value) }))
                : [];
            setCustomFields(initialFields);
            setNewCustomKey('');
            setNewCustomValue('');
        } else {
            // モーダルが閉じたら、localCardをリセット
            setLocalCard(null);
        }
        // ★ 修正: 依存配列に currentPackId と packRaritySettings を追加
    }, [open, card, currentPackId, packRaritySettings]); 

    const handleClose = useCallback(() => {
        onClose();
    }, [onClose]);

    const handleChange = useCallback((field: keyof Card, value: string | number) => {
        if (!localCard) return;
        setLocalCard({
            ...localCard,
            [field]: value
        });
    }, [localCard]);

    // カスタムフィールドの変更ロジック
    const handleCustomFieldChange = useCallback((index: number, field: 'key' | 'value', value: string) => {
        setCustomFields(prev => prev.map((item, i) =>
            i === index ? { ...item, [field]: value } : item
        ));
    }, []);

    const handleRemoveCustomField = useCallback((keyToRemove: string) => {
        setCustomFields(prev => prev.filter(item => item.key !== keyToRemove));
    }, []);

    const handleAddCustomField = useCallback(() => {
        if (!newCustomKey.trim()) return;

        // 重複チェック
        if (customFields.some(f => f.key === newCustomKey)) {
            alert('そのキーは既に使用されています。');
            return;
        }

        setCustomFields(prev => [...prev, { key: newCustomKey, value: newCustomValue }]);
        setNewCustomKey('');
        setNewCustomValue('');
    }, [newCustomKey, newCustomValue, customFields]);

    // 保存ロジック (💡 親の onSave を呼び出すように変更)
    const handleSave = async () => {
        // packIdは親コンポーネントで設定済み
        if (!localCard || !localCard.name || !localCard.packId) { 
            alert('カード名と収録パックは必須です。');
            return;
        }

        // カスタムフィールドをCard.userCustom形式に変換
        const userCustom: Record<string, any> = customFields.reduce((acc, field) => {
            if (field.key.trim()) {
                acc[field.key.trim()] = field.value;
            }
            return acc;
        }, {} as Record<string, any>);

        const cardToSave = { 
            ...localCard, 
            userCustom,
        };

        try {
            // 💡 修正: 親から渡された onSave ハンドラを使用
            onSave(cardToSave); 
            // handleClose()はonSave内で呼び出されることを期待
        } catch (error) {
            alert('カードの保存に失敗しました。コンソールを確認してください。');
            console.error(error);
        }
    };

    // 削除ロジック (💡 親の onDelete を呼び出すように変更)
    const handleDelete = async () => {
        if (!localCard || !localCard.cardId || !window.confirm(`カード「${localCard.name}」を削除しますか？`)) {
            return;
        }
        try {
            // 💡 修正: 親から渡された onDelete ハンドラを使用
            onDelete(localCard.cardId); 
            // handleClose()はonDelete内で呼び出されることを期待
        } catch (error) {
            alert('カードの削除に失敗しました。');
            console.error(error);
        }
    };

    // プレビュー画像のURLを生成 (No Image対応もgetDisplayImageUrlが担当)
    const displayImageUrl = useMemo(() => {
        return getDisplayImageUrl(
            localCard?.imageUrl,
            {
                width: PREVIEW_W,
                height: PREVIEW_H,
                // nameがnullの場合を考慮して、?? '??' を追加
                text: localCard?.name?.substring(0, 3) || '??', 
            }
        );
    }, [localCard?.imageUrl, localCard?.name]);

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth>
            <DialogTitle>
                {isNew ? '新規カードの作成' : `カード「${card?.name}」の編集`}
            </DialogTitle>
            <DialogContent dividers>
                {/* Grid v7対応 */}
                <Grid container spacing={4}>
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

                    {/* Grid v7対応 */}
                    <Grid size={{xs:12,md:7}}>
                        <Typography variant="h6" gutterBottom>基本情報</Typography>
                        <Grid container spacing={2}>
                            {/* カードID (編集不可) */}
                            {/* Grid v7対応 */}
                            <Grid size={{xs:12}}>
                                <TextField
                                    fullWidth
                                    label="カードID"
                                    value={localCard?.cardId || '(新規作成時に自動生成)'}
                                    disabled
                                    size="small"
                                />
                            </Grid>

                            {/* カード名 (必須) */}
                            {/* Grid v7対応 */}
                            <Grid size={{xs:12}}>
                                <TextField
                                    fullWidth
                                    label="カード名"
                                    value={localCard?.name || ''}
                                    onChange={(e) => handleChange('name', e.target.value)}
                                    required
                                    size="small"
                                />
                            </Grid>

                            {/* imageUrl 入力欄 */}
                            {/* Grid v7対応 */}
    　                       <Grid size={{xs:12}}>
                                <TextField
                                    fullWidth
                                    label="画像URL (imageUrl)"
                                    value={localCard?.imageUrl || ''}
                                    onChange={(e) => handleChange('imageUrl', e.target.value)}
                                    size="small"
                                />
                            </Grid>

                            {/* ★ 修正: パックIDの選択を廃止し、読み取り専用のTextFieldで固定値を表示 */}
                            {/* Grid v7対応 */}
                            <Grid size={{xs:12, sm:6}}>
                                <TextField
                                    fullWidth
                                    label="収録パック (packId)"
                                    // 💡 修正: 現在のパック名とIDを固定で表示
                                    value={`${currentPackName} (${localCard?.packId || '未設定'})`} 
                                    disabled 
                                    size="small"
                                    InputLabelProps={{ shrink: true }}
                                />
                            </Grid>

                            {/* レアリティ (Select) */}
                            {/* Grid v7対応 */}
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

                        {/* ユーザーカスタムデータ (Card.userCustom) */}
                        <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                            カスタムデータ
                        </Typography>
                        <Box sx={{ p: 1, border: '1px solid #eee', borderRadius: 1, backgroundColor: '#f9f9f9' }}>
                            {/* 既存のカスタムフィールド */}
                            {customFields.map((item, index) => (
                                // Grid v7対応
                                <Grid container spacing={1} key={item.key || `new-${index}`} sx={{ mb: 1, alignItems: 'center' }}>
                                    <Grid size={{ xs: 5 }}>
                                        <TextField
                                            fullWidth
                                            label="キー"
                                            value={item.key}
                                            onChange={(e) => handleCustomFieldChange(index, 'key', e.target.value)}
                                            size="small"
                                        />
                                    </Grid>
                                    <Grid size={{ xs: 5 }}>
                                        <TextField
                                            fullWidth
                                            label="値"
                                            value={item.value}
                                            onChange={(e) => handleCustomFieldChange(index, 'value', e.target.value)}
                                            size="small"
                                        />
                                    </Grid>
                                    <Grid size={{ xs: 2 }} sx={{ display: 'flex', alignItems: 'center' }}>
                                        <IconButton
                                            onClick={() => handleRemoveCustomField(item.key)}
                                            color="error"
                                            size="small"
                                            disabled={item.key.trim() === ''}
                                        >
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    </Grid>
                                </Grid>
                            ))}

                            {/* 新規カスタムフィールドの追加 */}
                            <Grid container spacing={1} sx={{ mt: 2, alignItems: 'center' }}>
                                <Grid size={{ xs: 5 }}>
                                    <TextField
                                        fullWidth
                                        label="新規キー"
                                        value={newCustomKey}
                                        onChange={(e) => setNewCustomKey(e.target.value)}
                                        size="small"
                                    />
                                </Grid>
                                <Grid size={{ xs: 5 }}>
                                    <TextField
                                        fullWidth
                                        label="新規値"
                                        value={newCustomValue}
                                        onChange={(e) => setNewCustomValue(e.target.value)}
                                        size="small"
                                    />
                                </Grid>
                                <Grid size={{ xs: 2 }} sx={{ display: 'flex', alignItems: 'center' }}>
                                    <Button
                                        variant="contained"
                                        size="small"
                                        startIcon={<AddIcon />}
                                        onClick={handleAddCustomField}
                                        disabled={!newCustomKey.trim()}
                                    >
                                        追加
                                    </Button>
                                </Grid>
                            </Grid>
                        </Box>

                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions>
                {!isNew && (
                    <Button onClick={handleDelete} color="error" sx={{ mr: 'auto' }}>
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

export default CardEditModal;