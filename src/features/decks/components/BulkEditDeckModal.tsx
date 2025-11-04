import React, { useState, useMemo } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    Typography,
    Alert,
    Chip,
    Stack
} from '@mui/material';
import type { Deck, FieldSetting } from '../../../models/models';
import DeckInfoForm from './DeckInfoForm';
import FavoriteToggleButton from '../../../components/common/FavoriteToggleButton';

interface BulkEditDeckModalProps {
    open: boolean;
    onClose: () => void;
    selectedDeckIds: string[];
    onSave: (fields: Partial<Deck>) => Promise<void>;
}

const BulkEditDeckModal: React.FC<BulkEditDeckModalProps> = ({
    open,
    onClose,
    selectedDeckIds,
    onSave,
}) => {
    // 編集用のダミーDeckデータ（初期値として空の状態を用意）
    const [editData, setEditData] = useState<Partial<Deck>>({});

    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    // お気に入り状態: null（変更なし）, true（お気に入りに設定）, false（お気に入り解除）
        const [favoriteState, setFavoriteState] = useState<boolean | null>(null);

    // カスタムフィールド設定（編集可能）
    // editDataの一部として管理されるため、初期値は空オブジェクト
    const customFieldSettings = (editData.deckFieldSettings || {}) as Record<string, FieldSetting>;

    // 入力変更ハンドラ
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setEditData(prev => ({
            ...prev,
            [name]: name === 'number' || name === 'price' ? (value === '' ? null : Number(value)) : value
        }));
    };

    // Select変更ハンドラ
    const handleSelectChange = (e: { target: { name: string; value: unknown } }) => {
        const { name, value } = e.target;
        setEditData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // カスタムフィールド変更ハンドラ
    const handleDeckCustomFieldChange = (field: string, value: any) => {
        setEditData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    // 変更されたフィールドを抽出
    const changedFields = useMemo(() => {
        const fields: Array<{ key: keyof Deck; label: string; value: any }> = [];
        
        Object.entries(editData).forEach(([key, value]) => {
            // 値が存在する（空でない）場合のみ追加
            if (value !== '' && value !== null && value !== undefined) {
                // 配列の場合は空配列でないことを確認
                if (Array.isArray(value) && value.length === 0) return;
                
                // ラベルの生成（フィールド名を日本語化）
                const fieldLabels: Record<string, string> = {
                    name: 'デッキ名',
                    number: '番号',
                    deckType: 'デッキタイプ',
                    series: 'シリーズ',
                    description: '説明',
                    imageUrl: '画像URL',
                    imageColor: '画像カラー',
                    tag: 'タグ',
                    deckFieldSettings: 'カスタムフィールド設定',
                    num_1: 'カスタム数値1',
                    num_2: 'カスタム数値2',
                    num_3: 'カスタム数値3',
                    num_4: 'カスタム数値4',
                    str_1: 'カスタム文字列1',
                    str_2: 'カスタム文字列2',
                    str_3: 'カスタム文字列3',
                    str_4: 'カスタム文字列4',
                };
                
                fields.push({
                    key: key as keyof Deck,
                    label: fieldLabels[key] || key,
                    value
                });
            }
        });

        // お気に入り状態が設定されている場合は追加
                if (favoriteState !== null) {
                    fields.push({
                        key: 'isFavorite' as keyof Deck,
                        label: 'お気に入り設定',
                        value: favoriteState
                    });
                }
        
        return fields;
    }, [editData, favoriteState]);

    // 個別フィールドのキャンセル
    const handleRemoveField = (fieldKey: keyof Deck) => {

        // お気に入りフィールドの場合は特別処理
        if (fieldKey === 'isFavorite') {
            setFavoriteState(null);
            return;
        }
        setEditData(prev => {
            const newData = { ...prev };
            // フィールドを削除（undefinedに戻す）
            delete newData[fieldKey];
            return newData;
        });
    };

    // 保存処理
    const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSaving(true);

        try {
            // 変更されたフィールドのみを抽出
            const fieldsToUpdate: Partial<Deck> = {};
            changedFields.forEach(field => {
                fieldsToUpdate[field.key] = field.value;
            });

            // お気に入り状態が変更されている場合は追加
            if (favoriteState !== null) {
                fieldsToUpdate.isFavorite = favoriteState;
            }

            if (Object.keys(fieldsToUpdate).length === 0) {
                console.warn('No fields to update');
                handleClose();
                return;
            }

            await onSave(fieldsToUpdate);
            handleClose();
        } catch (error) {
            console.error('Failed to bulk update decks:', error);
        } finally {
            setIsSaving(false);
        }
    };

    // モーダルを閉じる
    const handleClose = () => {
        setEditData({});
        setIsCollapsed(false);
        setFavoriteState(null);
        onClose();
    };

    // お気に入り状態のトグル処理
    const handleFavoriteToggle = async (_itemIds: string[], _newState: boolean) => {
        // 3値サイクル: null -> true -> false -> true -> ...
        if (favoriteState === null) {
            setFavoriteState(true);
        } else {
            setFavoriteState(!favoriteState);
        }
    };


    // カスタムフィールド設定の変更ハンドラ
    const handleCustomFieldSettingChange = (
        _itemType: 'Card' | 'Deck' | 'Pack', // 将来の拡張用
        type: 'num' | 'str',
        index: number,
        settingUpdates: Partial<FieldSetting>
    ) => {
        // 一括編集でもカスタムフィールド設定を変更可能にする
        setEditData(prev => {
            const currentSettings = prev.deckFieldSettings || {} as any;
            const fieldKey = `${type}_${index}` as keyof typeof currentSettings;
            
            return {
                ...prev,
                deckFieldSettings: {
                    ...currentSettings,
                    [fieldKey]: {
                        ...currentSettings[fieldKey],
                        ...settingUpdates,
                    },
                } as any,
            };
        });
    };

    return (
        <>
            <Dialog 
                open={open} 
                onClose={handleClose}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Typography variant="h6" component="div">
                            デッキ一括編集
                        </Typography>
                        <FavoriteToggleButton
                            itemId="bulk-edit"
                            isFavorite={favoriteState ?? false}
                            onToggleBulk={handleFavoriteToggle}
                            size="medium"
                        />
                    </Box>
                </DialogTitle>
            
            <DialogContent>
                <Box sx={{ mb: 2 }}>
                    <Alert severity="info">
                        {selectedDeckIds.length}件のデッキを一括編集します。
                        入力したフィールドのみが更新されます（空欄のフィールドは変更されません）。
                    </Alert>
                </Box>

                {/* 変更フィールドのリスト表示 */}
                {changedFields.length > 0 && (
                    <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" sx={{ mb: 1 }}>
                            変更するフィールド ({changedFields.length}件):
                        </Typography>
                        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                            {changedFields.map(field => (
                                <Chip
                                    key={field.key}
                                    label={field.label}
                                    onDelete={() => handleRemoveField(field.key)}
                                    color="primary"
                                    variant="outlined"
                                    size="small"
                                />
                            ))}
                        </Stack>
                    </Box>
                )}

                <form id="bulk-edit-form" onSubmit={handleSave}>
                    <DeckInfoForm
                        deckData={editData as Deck}
                        isEditable={true}
                        handleInputChange={handleInputChange}
                        handleSelectChange={handleSelectChange}
                        handleSave={handleSave}
                        onDeckCustomFieldChange={handleDeckCustomFieldChange}
                        customFieldSettings={customFieldSettings}
                        onCustomFieldSettingChange={handleCustomFieldSettingChange}
                        isCollapsed={isCollapsed}
                        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
                        showCollapseButton={false}
                        showMetadata={false}
                        forceShowAllFields={true}
                    />
                </form>
            </DialogContent>

            <DialogActions>
                <Button onClick={handleClose} disabled={isSaving}>
                    キャンセル
                </Button>
                <Button
                    type="submit"
                    form="bulk-edit-form"
                    variant="contained"
                    disabled={isSaving || changedFields.length === 0}
                >
                    {isSaving ? '保存中...' : `${selectedDeckIds.length}件を更新`}
                </Button>
            </DialogActions>
            </Dialog>
        </>
    );
};

export default BulkEditDeckModal;
