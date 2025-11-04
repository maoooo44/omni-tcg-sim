/**
 * src/features/cards/components/BulkEditCardModal.tsx
 *
 * 複数のカードを一括編集するためのモーダルコンポーネント。
 * CardInfoFormを再利用し、変更されたフィールドのみを抽出して一括更新を行う。
 * 
 * 責務:
 * 1. 選択された複数カードのIDを受け取り、編集用のダミーデータを管理
 * 2. CardInfoFormを埋め込み、ユーザーの入力を受け取る
 * 3. 変更されたフィールドのみをChipで視覚化
 * 4. お気に入り状態の一括トグル（3値管理: null/true/false）
 * 5. 保存時に変更フィールドのみを抽出して親コンポーネントに渡す
 */
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
import type { Card } from '../../../models/models';
import CardInfoForm from './CardInfoForm';
import FavoriteToggleButton from '../../../components/common/FavoriteToggleButton';

interface BulkEditCardModalProps {
    open: boolean;
    onClose: () => void;
    selectedCardIds: string[];
    onSave: (fields: Partial<Card>) => Promise<void>;
}

const BulkEditCardModal: React.FC<BulkEditCardModalProps> = ({
    open,
    onClose,
    selectedCardIds,
    onSave,
}) => {
    // 編集用のダミーCardデータ（初期値として空の状態を用意）
    const [editData, setEditData] = useState<Partial<Card>>({});
    const [isSaving, setIsSaving] = useState(false);
    
    // お気に入り状態: null（変更なし）, true（お気に入りに設定）, false（お気に入り解除）
    const [favoriteState, setFavoriteState] = useState<boolean | null>(null);

    // フィールド変更ハンドラ
    const handleFieldChange = (field: string, value: any) => {
        setEditData(prev => ({
            ...prev,
            [field]: field === 'number' ? (value === '' ? null : Number(value)) : value
        }));
    };

    // お気に入りトグルハンドラ
    const handleFavoriteToggle = async (_itemIds: string[], _newFavoriteState: boolean) => {
        setFavoriteState(prev => {
            if (prev === null) return true;
            if (prev === true) return false;
            return null;
        });
    };

    // 変更されたフィールドを抽出
    const changedFields = useMemo(() => {
        const fields: Array<{ key: keyof Card; label: string; value: any }> = [];
        
        Object.entries(editData).forEach(([key, value]) => {
            // 値が存在する（空でない）場合のみ追加
            if (value !== '' && value !== null && value !== undefined) {
                // 配列の場合は空配列でないことを確認
                if (Array.isArray(value) && value.length === 0) return;
                
                // ラベルの生成（フィールド名を日本語化）
                const fieldLabels: Record<string, string> = {
                    name: 'カード名',
                    number: 'カード番号',
                    rarity: 'レアリティ',
                    imageUrl: '画像URL',
                    imageColor: '画像カラー',
                    text: 'カードテキスト',
                    subtext: '補足テキスト',
                    tag: 'タグ',
                    num_1: 'カスタム数値1',
                    num_2: 'カスタム数値2',
                    num_3: 'カスタム数値3',
                    num_4: 'カスタム数値4',
                    num_5: 'カスタム数値5',
                    num_6: 'カスタム数値6',
                    str_1: 'カスタム文字列1',
                    str_2: 'カスタム文字列2',
                    str_3: 'カスタム文字列3',
                    str_4: 'カスタム文字列4',
                    str_5: 'カスタム文字列5',
                    str_6: 'カスタム文字列6',
                };
                
                fields.push({
                    key: key as keyof Card,
                    label: fieldLabels[key] || key,
                    value
                });
            }
        });
        
        // お気に入り状態が設定されている場合は追加
        if (favoriteState !== null) {
            fields.push({
                key: 'isFavorite' as keyof Card,
                label: 'お気に入り設定',
                value: favoriteState
            });
        }
        
        return fields;
    }, [editData, favoriteState]);

    // 個別フィールドのキャンセル
    const handleRemoveField = (fieldKey: keyof Card) => {
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
            const fieldsToUpdate: Partial<Card> = {};
            changedFields.forEach(field => {
                fieldsToUpdate[field.key] = field.value;
            });
            
            // お気に入り状態が変更されている場合は追加
            if (favoriteState !== null) {
                fieldsToUpdate.isFavorite = favoriteState;
            }

            await onSave(fieldsToUpdate);
            
            // 成功後にリセット
            setEditData({});
            setFavoriteState(null);
            onClose();
        } catch (error) {
            console.error('[BulkEditCardModal] Failed to save:', error);
        } finally {
            setIsSaving(false);
        }
    };

    // キャンセル処理
    const handleCancel = () => {
        setEditData({});
        setFavoriteState(null);
        onClose();
    };

    return (
        <Dialog
            open={open}
            onClose={handleCancel}
            maxWidth="md"
            fullWidth
            PaperProps={{
                component: 'form',
                onSubmit: handleSave,
            }}
        >
            <DialogTitle>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography variant="h6" component="span">
                        {selectedCardIds.length}枚のカードを一括編集
                    </Typography>
                    <FavoriteToggleButton
                        itemId="bulk-edit-cards"
                        isFavorite={favoriteState === true}
                        onToggleBulk={handleFavoriteToggle}
                        disabled={false}
                        size="medium"
                    />
                </Box>
            </DialogTitle>

            <DialogContent dividers>
                {/* 変更フィールドのChip表示 */}
                {changedFields.length > 0 && (
                    <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>
                            変更するフィールド:
                        </Typography>
                        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                            {changedFields.map(field => (
                                <Chip
                                    key={field.key}
                                    label={field.label}
                                    onDelete={() => handleRemoveField(field.key)}
                                    size="small"
                                    color="primary"
                                    variant="outlined"
                                />
                            ))}
                        </Stack>
                    </Box>
                )}

                {/* 注意事項 */}
                <Alert severity="info" sx={{ mb: 2 }}>
                    値を入力したフィールドのみが、選択された{selectedCardIds.length}枚のカード全てに対して一括更新されます。
                    空欄のフィールドは変更されません。
                </Alert>

                {/* CardInfoFormを埋め込み */}
                <CardInfoForm
                    card={editData}
                    currentPack={null}
                    rarityOptions={[]} // 一括編集では自由入力
                    onFieldChange={handleFieldChange}
                    isReadOnly={false}
                    isBulkEdit={true} // カスタムフィールド設定ボタンを非表示
                />
            </DialogContent>

            <DialogActions>
                <Button onClick={handleCancel} disabled={isSaving}>
                    キャンセル
                </Button>
                <Button
                    type="submit"
                    variant="contained"
                    disabled={isSaving || changedFields.length === 0}
                >
                    {isSaving ? '保存中...' : `${selectedCardIds.length}枚を一括更新`}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default BulkEditCardModal;
