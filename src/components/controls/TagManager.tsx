/**
 * src/components/controls/TagManager.tsx
 *
 * 汎用的なタグ（文字列リスト）の入力・表示・削除を管理するコンポーネント。
 * ※タグはキーを持たず、値（文字列）のみを扱います。
 * キー/値の構造が必要な場合は、「キー:値」のようにユーザーに直接入力してもらい、searchTextで検索することを想定します。
 */
import React, { useState, useCallback, useMemo } from 'react';
import {
    Box,
    TextField,
    Button,
    Grid,
    Chip,
    Typography,
    Paper,
    Divider,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';

// ----------------------------------------
// Propsの定義
// ----------------------------------------

// Tのtagフィールドは string[] であることを前提とする
interface TagManagerProps<T extends { tag?: string[] }> {
    /** 編集対象のデータオブジェクト (Card, Pack, Deckなど) */
    itemData: T;
    /** 'tag'フィールドの変更を親に通知するハンドラ */
    onFieldChange: (field: 'tag', value: string[] | undefined) => void;
    /** 閲覧モード (true) か編集モード/新規作成 (false) か */
    isReadOnly: boolean;
    /** コンポーネントのタイトル */
    title?: string;
}

// ----------------------------------------
// TagManager 本体
// ----------------------------------------

const TagManager = <T extends { tag?: string[] }>({
    itemData,
    onFieldChange,
    isReadOnly,
    title = "タグ",
}: TagManagerProps<T>) => {
    // tag が null, undefined の場合は空配列として扱う
    const currentTags: string[] = useMemo(() => itemData.tag || [], [itemData.tag]);

    const [newTag, setNewTag] = useState('');
    const [inputError, setInputError] = useState('');

    const isInputValid = useMemo(() => {
        const trimmedTag = newTag.trim();
        // 入力が空でないこと
        if (trimmedTag === '') {
            return false;
        }
        // 既存のタグに同じものが含まれていないこと (大文字・小文字を区別しない)
        if (currentTags.map(t => t.toLowerCase()).includes(trimmedTag.toLowerCase())) {
            return false;
        }
        return true;
    }, [newTag, currentTags]);

    /**
     * 新しいタグを追加するハンドラ
     */
    const handleAddTag = useCallback(() => {
        if (isReadOnly || !isInputValid) {
            return;
        }

        const tag = newTag.trim();

        if (tag === '') {
            setInputError('キーワードは必須です。');
            return;
        }

        // 重複チェックは useMemo で行われているが、念のため最終チェック
        if (currentTags.map(t => t.toLowerCase()).includes(tag.toLowerCase())) {
            setInputError(`キーワード「${tag}」は既に使用されています。`);
            return;
        }

        const updatedTags = [...currentTags, tag];

        onFieldChange('tag', updatedTags);
        setNewTag('');
        setInputError('');
    }, [isReadOnly, isInputValid, newTag, currentTags, onFieldChange]);

    /**
     * タグを削除するハンドラ
     */
    const handleDeleteTag = useCallback((tagToDelete: string) => {
        if (isReadOnly) return;

        const updatedTags = currentTags.filter(tag => tag !== tagToDelete);

        // タグが空になった場合は undefined を渡す
        const finalTags = updatedTags.length === 0 ? undefined : updatedTags;

        onFieldChange('tag', finalTags as string[] | undefined);
    }, [isReadOnly, currentTags, onFieldChange]);

    // Enterキーでの追加を許可
    const handleKeyPress = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault(); // フォーム送信を防止
            handleAddTag();
        }
    }, [handleAddTag]);

    // 既存のタグをチップとして表示
    const tagChips = useMemo(() => (
        currentTags.map((tag) => {
            return (
                <Chip
                    key={tag}
                    label={tag}
                    onDelete={isReadOnly ? undefined : () => handleDeleteTag(tag)}
                    deleteIcon={isReadOnly ? undefined : <DeleteIcon />}
                    color="default"
                    variant="outlined"
                    sx={{ m: 0.5 }}
                />
            );
        })
    ), [currentTags, isReadOnly, handleDeleteTag]);


    return (
        <Paper elevation={1} sx={{ p: 2, mt: 2, mb: 1 }}>
            <Typography variant="h6" gutterBottom>{title}</Typography>
            {!isReadOnly && (
                <Box sx={{ mb: 2 }}>
                    <Grid container spacing={2} alignItems="flex-start">
                        {/* キー入力は不要になったため、入力フィールドは一つに */}
                        <Grid size={10}>
                            <TextField
                                fullWidth
                                label="キーワードまたは「キー:値」形式で入力" // ユーザーに構造化を促すラベル
                                value={newTag}
                                onChange={(e) => {
                                    setNewTag(e.target.value);
                                    setInputError(''); // 入力開始でエラーをリセット
                                }}
                                onKeyPress={handleKeyPress}
                                size="small"
                                error={!!inputError}
                                helperText={inputError}
                            />
                        </Grid>
                        <Grid size={2}>
                            <Button
                                fullWidth
                                variant="contained"
                                onClick={handleAddTag}
                                startIcon={<AddIcon />}
                                disabled={!isInputValid}
                                sx={{ height: '100%' }}
                            >
                                追加
                            </Button>
                        </Grid>
                    </Grid>
                </Box>
            )}

            <Divider sx={{ my: 2 }} />

            <Box sx={{ minHeight: '50px' }}>
                <Typography variant="subtitle2" gutterBottom>登録済みタグ</Typography>
                {tagChips.length > 0 ? (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                        {tagChips}
                    </Box>
                ) : (
                    <Typography color="textSecondary" sx={{ fontStyle: 'italic' }}>
                        タグは登録されていません。
                    </Typography>
                )}
            </Box>
        </Paper>
    );
};

export default TagManager;
