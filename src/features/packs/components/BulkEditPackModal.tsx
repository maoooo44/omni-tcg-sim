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
import type { Pack, FieldSetting } from '../../../models/models';
import PackInfoForm from './PackInfoForm';
import RarityEditorModal from '../../../components/modals/RarityEditorModal';
import FavoriteToggleButton from '../../../components/common/FavoriteToggleButton';

interface BulkEditPackModalProps {
    open: boolean;
    onClose: () => void;
    selectedPackIds: string[];
    onSave: (fields: Partial<Pack>) => Promise<void>;
}

const BulkEditPackModal: React.FC<BulkEditPackModalProps> = ({
    open,
    onClose,
    selectedPackIds,
    onSave,
}) => {
    // 編集用のダミーPackデータ（初期値として空の状態を用意）
    const [editData, setEditData] = useState<Partial<Pack>>({});

    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isRarityModalOpen, setIsRarityModalOpen] = useState(false);
    
    // お気に入り状態: null（変更なし）, true（お気に入りに設定）, false（お気に入り解除）
    const [favoriteState, setFavoriteState] = useState<boolean | null>(null);

    // カスタムフィールド設定（編集可能）
    // editDataの一部として管理されるため、初期値は空オブジェクト
    const customFieldSettings = (editData.packFieldSettings || {}) as Record<string, FieldSetting>;

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
    const handlePackCustomFieldChange = (field: string, value: any) => {
        setEditData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    // 変更されたフィールドを抽出
    const changedFields = useMemo(() => {
        const fields: Array<{ key: keyof Pack; label: string; value: any }> = [];
        
        Object.entries(editData).forEach(([key, value]) => {
            // 値が存在する（空でない）場合のみ追加
            if (value !== '' && value !== null && value !== undefined) {
                // 配列の場合は空配列でないことを確認
                if (Array.isArray(value) && value.length === 0) return;
                
                // ラベルの生成（フィールド名を日本語化）
                const fieldLabels: Record<string, string> = {
                    name: 'パック名',
                    number: '番号',
                    price: '価格',
                    cardsPerPack: '封入枚数',
                    packType: 'パックタイプ',
                    series: 'シリーズ',
                    description: '説明',
                    imageUrl: '画像URL',
                    imageColor: '画像カラー',
                    cardBackImageUrl: 'カード裏面URL',
                    cardBackImageColor: 'カード裏面カラー',
                    tag: 'タグ',
                    raritySettings: 'レアリティ設定',
                    packFieldSettings: 'カスタムフィールド設定',
                    num_1: 'カスタム数値1',
                    num_2: 'カスタム数値2',
                    str_1: 'カスタム文字列1',
                    str_2: 'カスタム文字列2',
                };
                
                fields.push({
                    key: key as keyof Pack,
                    label: fieldLabels[key] || key,
                    value
                });
            }
        });
        
        // お気に入り状態が設定されている場合は追加
        if (favoriteState !== null) {
            fields.push({
                key: 'isFavorite' as keyof Pack,
                label: 'お気に入り設定',
                value: favoriteState
            });
        }
        
        return fields;
    }, [editData, favoriteState]);

    // 個別フィールドのキャンセル
    const handleRemoveField = (fieldKey: keyof Pack) => {
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
            const fieldsToUpdate: Partial<Pack> = {};
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
            console.error('Failed to bulk update packs:', error);
        } finally {
            setIsSaving(false);
        }
    };

    // モーダルを閉じる
    const handleClose = () => {
        setEditData({});
        setIsCollapsed(false);
        setIsRarityModalOpen(false);
        
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

    // レアリティモーダルを開く
    const handleOpenRarityEditorModal = () => {
        setIsRarityModalOpen(true);
    };

    // レアリティモーダルを閉じる
    const handleCloseRarityEditorModal = () => {
        setIsRarityModalOpen(false);
    };

    // レアリティ設定を保存
    const handleRarityEditorSave = (updatedRaritySettings: any) => {
        setEditData(prev => ({
            ...prev,
            raritySettings: updatedRaritySettings,
        }));
        setIsRarityModalOpen(false);
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
            const currentSettings = prev.packFieldSettings || {} as any;
            const fieldKey = `${type}_${index}` as keyof typeof currentSettings;
            
            return {
                ...prev,
                packFieldSettings: {
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
                            パック一括編集
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
                        {selectedPackIds.length}件のパックを一括編集します。
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
                    <PackInfoForm
                        packData={editData as Pack}
                        isEditable={true}
                        handleInputChange={handleInputChange}
                        handleSelectChange={handleSelectChange}
                        handleOpenRarityEditorModal={handleOpenRarityEditorModal}
                        handleSave={handleSave}
                        onPackCustomFieldChange={handlePackCustomFieldChange}
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
                    {isSaving ? '保存中...' : `${selectedPackIds.length}件を更新`}
                </Button>
            </DialogActions>
            </Dialog>

            {/* レアリティエディタモーダル */}
            <RarityEditorModal
                open={isRarityModalOpen}
                onClose={handleCloseRarityEditorModal}
                packData={editData as Pack}
                onSave={handleRarityEditorSave}
            />
        </>
    );
};

export default BulkEditPackModal;
