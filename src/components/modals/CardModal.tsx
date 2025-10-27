/**
 * src/components/modals/CardModal.tsx (CardEditorModalをCardModalに統合・isReadOnly対応)
 *
 * カードの新規作成・編集・閲覧を行うための汎用モーダルコンポーネント。
 * isReadOnly propsによって編集可/不可を切り替えます。
 */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, TextField, Box, Typography, Grid, Select, MenuItem,
    InputLabel, FormControl, Paper, Divider, type SelectChangeEvent
} from '@mui/material';
// 💡 修正1: Card と RarityConfig のインポートを補完
import type { Card } from '../../models/card'; 
import type { RarityConfig, CardFieldSettings } from '../../models/pack'; 

// 💡 修正2: CustomFieldManager の代わりに CustomFieldModal から型をインポートしているため、
// CustomFieldModal へのパスが正しく、そこから型をインポートしていることを確認します。
import type { FieldSetting } from '../../models/customField';

// CustomFieldManager をインポート
import CustomFieldManager from '../controls/CustomFieldManager'; 

// 共通画像ユーティリティをインポート
import { getDisplayImageUrl, DEFAULT_CARD_PREVIEW_WIDTH as PREVIEW_W, DEFAULT_CARD_PREVIEW_HEIGHT as PREVIEW_H } from '../../utils/imageUtils';
import { createDefaultCard } from '../../utils/dataUtils';


// ----------------------------------------
// 💡 追加: モーダルサイズを定数で定義
// ----------------------------------------
const MODAL_WIDTH = '1200px'; 
const MODAL_HEIGHT = '750px'; 


// 💡 修正: Props名を CardModalProps に変更し、isReadOnly を追加
export interface CardModalProps {
    open: boolean;
    onClose: () => void;
    card: Card | null;
    onSave: (cardToSave: Card) => void;
    onRemove: (cardId: string) => Promise<void>; 
    packRaritySettings: RarityConfig[];
    currentPackName: string; // 💡 収録パック名
    currentPackId: string;
    // 💡 CustomFieldCategory は必須です
    customFieldSettings: CardFieldSettings;
    
    /** 💡 新規追加: 閲覧モード (true) か編集モード/新規作成 (false) か */
    isReadOnly: boolean; 
    
    onCustomFieldSettingChange: (
        itemType: 'Card' | 'Deck' | 'Pack',
        type: 'num' | 'str',
        index: number,
        settingUpdates: Partial<FieldSetting>
    ) => void;
}


// ----------------------------------------
// CardModal 本体 (コンポーネント名変更)
// ----------------------------------------

const CardModal: React.FC<CardModalProps> = ({ 
    open, onClose, card, onSave, 
    onRemove,
    packRaritySettings, currentPackName, currentPackId, // 💡 currentPackName を受け取る
    customFieldSettings,
    onCustomFieldSettingChange,
    isReadOnly, // 💡 isReadOnly を受け取る
}) => {
    
    // 🚨 デバッグログ 1: 受け取った Props の確認
    useEffect(() => {
        if (open) {
            console.log(`\n*** CardModal Props Debug (Open) ***`);
            console.log(`isReadOnly:`, isReadOnly);
            console.log(`currentPackId:`, currentPackId);
            console.log(`card (編集対象):`, card ? card.cardId : 'NEW');
            
            // customFieldSettings の中身をチェック
            const settingsKeys = Object.keys(customFieldSettings);
            const visibleCount = settingsKeys.filter(key => customFieldSettings[key as keyof CardFieldSettings]?.isVisible === true).length;
            console.log(`customFieldSettings (生データ):`, customFieldSettings);
            console.log(`=> 設定キーの数: ${settingsKeys.length}, isVisible: true の設定数: ${visibleCount}`);
            console.log(`****************************************\n`);
        }
    }, [open, isReadOnly, currentPackId, card, customFieldSettings]);
    
    const [localCard, setLocalCard] = useState<Card | null>(card);
    
    const rarityOptions: string[] = useMemo(() => {
        return packRaritySettings.map(c => c.rarityName);
    }, [packRaritySettings]);

    const isNew = !card;

    // モーダル開閉時の初期化ロジック (変更なし)
    useEffect(() => {
        if (open) {
            const baseCard: Card = card || createDefaultCard(currentPackId);
            
            const defaultRarityName = packRaritySettings.length > 0 ? packRaritySettings[0].rarityName : '';

            const finalCard: Card = {
                ...baseCard,
                number: (baseCard.number === undefined || baseCard.number === null) ? null : baseCard.number,
                packId: baseCard.packId || currentPackId,
                rarity: baseCard.rarity || defaultRarityName,
                // Card のカスタムフィールド (str_1-6, num_1-6) は baseCard に含まれることを想定
            };
            
            setLocalCard(finalCard);
            
        } else {
            setLocalCard(null);
        }
    }, [open, card, currentPackId, packRaritySettings]);

    const handleClose = useCallback(() => {
        onClose();
    }, [onClose]);

    // 💡 汎用的な変更ハンドラ。カスタムフィールドの型変換ロジックを修正。
    const handleChange = useCallback(<F extends keyof Card>(field: F, rawValue: any) => {
        if (!localCard) return;
        
        // 閲覧モードでは変更を許可しない
        if (isReadOnly) return;

        let value: any = rawValue;

        // number 型のフィールド ('number', 'num_*') の値変換
        if (field === 'number' || String(field).startsWith('num_')) {
            const numValue = rawValue === null || rawValue === '' ? null : Number(rawValue);
            value = isNaN(numValue as number) ? null : numValue;
        } 
        
        setLocalCard(prev => prev ? {
            ...prev,
            [field]: value
        } : null);
    }, [localCard, isReadOnly]);

    // 保存ロジック (変更なし)
    const handleSave = async () => { 
        if (isReadOnly) return;
        
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
        
        const now = new Date().toISOString();

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
    const handleRemove = async () => { 
        if (isReadOnly || isNew) return;

        if (!localCard || !localCard.cardId) {
            return;
        }
        
        if (!window.confirm(`カード「${localCard.name}」を完全に削除してもよろしいですか？この操作は元に戻せません。`)) {
            return;
        }

        try {
            await onRemove(localCard.cardId);
            handleClose();
        } catch (error) {
            alert('カードの削除に失敗しました。');
            console.error(error);
        }
    };
    
    // プレビュー画像のURLを生成 (変更なし)
    const displayImageUrl = useMemo(() => getDisplayImageUrl(localCard?.imageUrl, {width: PREVIEW_W, height: PREVIEW_H, text: localCard?.name?.substring(0, 3) || '??'}), [localCard?.imageUrl, localCard?.name]);
    
    if (!localCard) return null;
    
    // 🚨 デバッグログ 2: CustomFieldManager に渡す直前の値の確認
    console.log(`\n--- CardModal Render Debug ---`);
    console.log(`isReadOnly (Render):`, isReadOnly);
    console.log(`customFieldSettings (渡す値):`, customFieldSettings);
    console.log(`******************************\n`);

    return (
        /* 💡 修正: maxWidth="lg" fullWidth を削除し、固定の幅と高さを設定 */
        <Dialog 
            open={open} 
            onClose={handleClose} 
            // 💡 固定サイズを適用
            sx={{ 
                '& .MuiDialog-paper': { // PaperComponent のスタイルを上書き
                    width: MODAL_WIDTH, 
                    maxWidth: MODAL_WIDTH, // 念のため maxWidth も設定
                    height: MODAL_HEIGHT, 
                    maxHeight: MODAL_HEIGHT, // 念のため maxHeight も設定
                }
            }}
        >
            <DialogTitle>
                {isNew 
                    ? '新規カードの作成' 
                    : isReadOnly 
                        ? `カード「${localCard.name}」の閲覧` 
                        : `カード「${localCard.name}」の編集` 
                }
            </DialogTitle>
            {/* 💡 DialogContent の高さを Dialog の高さからタイトルとアクションの高さを引いたものに設定し、オーバーフローを許可 */}
            <DialogContent 
                dividers 
                sx={{ 
                    // Dialog全体の高さからタイトル(約64px)とアクション(約64px)を引いた高さを仮定
                    flex: '1 1 auto', // 高さを柔軟に調整
                    overflowY: 'auto', // コンテンツが多い場合はスクロールを有効にする
                }}
            >
                {/* -------------------- ここから既存のコンテンツ -------------------- */}
                <Grid container spacing={4}>
                    {/* 左側: プレビュー (Grid size は v7形式) */}
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
                            {/* 画像URL入力 - 💡 isReadOnly で無効化 */}
                            <TextField
                                fullWidth
                                label="画像URL"
                                value={localCard.imageUrl || ''}
                                onChange={(e) => handleChange('imageUrl', e.target.value)}
                                size="small"
                                margin="normal"
                                disabled={isReadOnly}
                                InputProps={{ readOnly: isReadOnly }}
                            />
                        </Paper>
                    </Grid>

                    {/* 右側: フォーム入力 (Grid size は v7形式) */}
                    <Grid size={{xs:12,md:7}}>
                        {/* 基本情報入力 (Grid container) */}
                        <Grid container spacing={2}>
                            
                            <Grid size={{xs:12}}>
                                {/* カード名 - 💡 isReadOnly で無効化 */}
                                <TextField
                                    fullWidth
                                    required
                                    label="カード名"
                                    value={localCard.name || ''}
                                    onChange={(e) => handleChange('name', e.target.value)}
                                    size="small"
                                    disabled={isReadOnly}
                                    InputProps={{ readOnly: isReadOnly }}
                                />
                            </Grid>
                            
                            <Grid size={{xs:12}}>
                                {/* 収録パック名 - 編集不可 */}
                                <TextField
                                    fullWidth
                                    label="収録パック"
                                    value={currentPackName || ''}
                                    size="small"
                                    InputProps={{ 
                                        readOnly: true, // 常に読み取り専用
                                    }}
                                    disabled
                                    // ラベルが消えないようにする
                                    InputLabelProps={{ shrink: true }}
                                />
                            </Grid>
                            
                            <Grid size={{xs:6}}>
                                {/* カード番号 - 💡 isReadOnly で無効化 */}
                                <TextField
                                    fullWidth
                                    label="カード番号"
                                    type="number"
                                    value={localCard.number ?? ''}
                                    onChange={(e) => handleChange('number', e.target.value)}
                                    size="small"
                                    disabled={isReadOnly}
                                    InputProps={{ readOnly: isReadOnly }}
                                />
                            </Grid>
                            <Grid size={{xs:6}}>
                                {/* レアリティ - 💡 isReadOnly で無効化 */}
                                <FormControl fullWidth size="small" disabled={isReadOnly}> 
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

                        {/* 💡 CustomFieldManager コンポーネントを使用し、isReadOnly を渡す */}
                        <CustomFieldManager
                            customFieldSettings={customFieldSettings}
                            itemData={localCard}
                            onFieldChange={handleChange}
                            itemType="Card"
                            onSettingChange={onCustomFieldSettingChange}
                            isReadOnly={isReadOnly}
                        />
                        
                    </Grid>
                </Grid>
                {/* -------------------- ここまで既存のコンテンツ -------------------- */}

                <Divider sx={{ my: 3 }} />
                
                {/* -------------------- ここから新規追加の text/subtext -------------------- */}
                <Typography variant="h6" gutterBottom>カード詳細情報</Typography>
                <Grid container spacing={2}>
                    <Grid size={{xs:12}}>
                        {/* text フィールド (複数行入力、isReadOnly対応) */}
                        <TextField
                            fullWidth
                            multiline
                            rows={4} // 任意の値 (例: 4行)
                            label="カードテキスト (text)"
                            value={localCard.text || ''}
                            onChange={(e) => handleChange('text', e.target.value)}
                            size="small"
                            disabled={isReadOnly}
                            InputProps={{ readOnly: isReadOnly }}
                        />
                    </Grid>
                    <Grid size={{xs:12}}>
                        {/* subtext フィールド (複数行入力、isReadOnly対応) */}
                        <TextField
                            fullWidth
                            multiline
                            rows={2} // 任意の値 (例: 2行)
                            label="補足テキスト (subtext)"
                            value={localCard.subtext || ''}
                            onChange={(e) => handleChange('subtext', e.target.value)}
                            size="small"
                            disabled={isReadOnly}
                            InputProps={{ readOnly: isReadOnly }}
                        />
                    </Grid>
                </Grid>
                {/* -------------------- ここまで新規追加の text/subtext -------------------- */}
            </DialogContent>
            <DialogActions>
                
                {/* 💡 削除ボタン: 新規作成でない かつ 閲覧モードでない 場合のみ表示 */}
                {!isNew && !isReadOnly && (
                    <Button onClick={handleRemove} color="error" variant="outlined" sx={{ mr: 'auto' }}>
                        カードを削除
                    </Button>
                )}
                
                {/* キャンセル/閉じるボタン */}
                <Button onClick={handleClose} variant="outlined">
                    {isReadOnly ? '閉じる' : 'キャンセル'} 
                </Button>
                
                {/* 💡 保存ボタン: 閲覧モードでない 場合のみ表示 */}
                {!isReadOnly && (
                    <Button onClick={handleSave} variant="contained" color="primary">
                        {isNew ? 'カードを作成' : '変更を保存'}
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
};

export default CardModal;