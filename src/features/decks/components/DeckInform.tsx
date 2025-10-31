/**
 * src/features/decks/components/DeckInform.tsx
 *
 * デッキの基本情報（番号、名前、説明）のフォーム。PackInfoFormを参考に作成。
 * 💡 修正: isEditMode を追加し、編集時のみTextFieldを有効化。
 */
import React from 'react';
import { TextField, Box, Typography, Paper } from '@mui/material';

import type { Deck } from '../../../models/deck';

interface DeckInformProps {
    deck: Deck;
    updateDeckInfo: (info: Partial<Deck>) => void;
    // 💡 修正: isEditMode を追加
    isEditMode: boolean;
}

const DeckInform: React.FC<DeckInformProps> = ({
    deck,
    updateDeckInfo,
    isEditMode, // 💡 追加
}) => {
    return (
        <Paper elevation={3} sx={{ p: 4, height: '100%' }}>
            <Typography variant="h6" gutterBottom>基本情報</Typography>

            {/* デッキ No. (ソート順) */}
            <TextField
                fullWidth
                label="デッキ No. (ソート順)"
                type="number"
                value={deck.number ?? ''}
                onChange={(e) => updateDeckInfo({ number: e.target.value === '' ? null : Number(e.target.value) })}
                helperText="デッキの表示順を指定します。空欄の場合、自動採番されます。"
                inputProps={{ min: 0 }}
                sx={{ mb: 2 }}
                // 💡 修正: isEditMode で無効化
                disabled={!isEditMode}
            />

            {/* デッキ名 */}
            <TextField
                fullWidth
                label="デッキ名"
                value={deck.name}
                onChange={(e) => updateDeckInfo({ name: e.target.value })}
                sx={{ mb: 2 }}
                required
                // 💡 修正: isEditMode で無効化
                disabled={!isEditMode}
            />

            {/* 説明 */}
            <TextField
                fullWidth
                label="説明"
                value={deck.description}
                onChange={(e) => updateDeckInfo({ description: e.target.value })}
                multiline
                rows={2}
                sx={{ mb: 3 }}
                // 💡 修正: isEditMode で無効化
                disabled={!isEditMode}
            />

            {/* カスタムフィールドエリアのプレースホルダー */}
            <Box sx={{ mt: 4 }}>
                <Typography variant="body2" color="text.secondary">
                    {/* カスタムフィールドマネージャーをここに配置 */}
                    {/* Deckのカスタムフィールドが存在する場合、CustomFieldManagerをレンダリング */}
                </Typography>
            </Box>
        </Paper>
    );
};

export default DeckInform;