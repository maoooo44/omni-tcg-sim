/**
 * src/components/controls/CardCustomFieldManager.tsx
 *
 * カードのカスタムデータ (userCustom) のキーと値を管理するコンポーネント。
 * 親コンポーネントからカスタムフィールドのリストと、それらを操作するためのハンドラを受け取る。
 * キーの重複チェックと新規追加のロジックを内包する。
 */
import React, { useState, useCallback, /*useMemo*/ } from 'react';
import {
    TextField, Box, Typography, Grid, IconButton, Button,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';

// カスタムフィールドの型定義
interface CustomField {
    key: string;
    value: string;
}

export interface CardCustomFieldManagerProps {
    customFields: CustomField[];
    setCustomFields: React.Dispatch<React.SetStateAction<CustomField[]>>;
}

const CardCustomFieldManager: React.FC<CardCustomFieldManagerProps> = ({ customFields, setCustomFields }) => {
    const [newCustomKey, setNewCustomKey] = useState('');
    const [newCustomValue, setNewCustomValue] = useState('');

    // カスタムフィールドのキーまたは値の変更を処理
    const handleCustomFieldChange = useCallback((index: number, field: 'key' | 'value', value: string) => {
        setCustomFields(prev => prev.map((item, i) =>
            i === index ? { ...item, [field]: value } : item
        ));
    }, [setCustomFields]);

    // カスタムフィールドの削除を処理
    const handleRemoveCustomField = useCallback((keyToRemove: string) => {
        setCustomFields(prev => prev.filter(item => item.key !== keyToRemove));
    }, [setCustomFields]);

    // 新しいカスタムフィールドの追加を処理
    const handleAddCustomField = useCallback(() => {
        const trimmedKey = newCustomKey.trim();
        if (!trimmedKey) return;

        // キーの重複チェック
        if (customFields.some(f => f.key === trimmedKey)) {
            alert('そのキーは既に使用されています。');
            return;
        }

        setCustomFields(prev => [...prev, { key: trimmedKey, value: newCustomValue }]);
        setNewCustomKey('');
        setNewCustomValue('');
    }, [newCustomKey, newCustomValue, customFields, setCustomFields]);

    return (
        <Box>
            <Typography variant="h6" gutterBottom>
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
        </Box>
    );
};

export default CardCustomFieldManager;