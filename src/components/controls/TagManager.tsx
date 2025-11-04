/**
 * src/components/controls/TagManager.tsx
 *
 * 汎用的なタグ（文字列リスト）の入力・表示・削除を管理するコンポーネント。
 * ⭐ 修正: タグ入力UIをPopoverで表示するように変更。
 * ⭐ 修正: AddIconをLabelOutlinedIconに変更。
 * ⭐ 修正: タグの表示文字数を制限し、超過分は「...」で省略。
 * ⭐ 修正: isReadOnlyの場合にボタンを無効化（disabled）してグレー表示とし、非表示にはしない。
 */
import React, { useState, useCallback, useMemo, type MouseEvent } from 'react';
import {
    Box,
    TextField,
    Grid,
    Chip,
    Typography,
    Paper,
    // Divider, 
    Popover,
} from '@mui/material';
// ⭐ アイコンをLabelOutlinedIconに変更
import LabelOutlinedIcon from '@mui/icons-material/LabelOutlined'; 
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';

// ⭐ 追加: EnhancedIconButtonをインポート
import EnhancedIconButton from '../common/EnhancedIconButton';

// =========================================================================
// ★ [追加] 定数定義
// =========================================================================
/** タグをChipで表示する際の最大文字数 (これを超えると "..." で省略) */
const MAX_TAG_DISPLAY_LENGTH = 15;
// =========================================================================


// ----------------------------------------
// Propsの定義 (変更なし)
// ----------------------------------------
interface TagManagerProps<T extends { tag?: string[] }> {
    /** 編集対象のデータオブジェクト (Card, Pack, Deckなど) */
    itemData: T;
    /** 'tag'フィールドの変更を親に通知するハンドラ */
    onFieldChange: (field: 'tag', value: string[] | undefined) => void;
    /** 閲覧モード (true) か編集モード/新規作成 (false) か */
    isReadOnly: boolean;
}

// ----------------------------------------
// TagManager 本体
// ----------------------------------------

const TagManager = <T extends { tag?: string[] }>({
    itemData,
    onFieldChange,
    isReadOnly,
}: TagManagerProps<T>) => {
    const currentTags: string[] = useMemo(() => itemData.tag || [], [itemData.tag]);

    const [newTag, setNewTag] = useState('');
    const [inputError, setInputError] = useState('');
    const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

    const isInputValid = useMemo(() => {
        const trimmedTag = newTag.trim();
        if (trimmedTag === '') {
            return false;
        }
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

    // Popoverの開閉ハンドラ
    const handleIconClick = (event: MouseEvent<HTMLButtonElement>) => {
        // ⭐ isReadOnlyの場合は、EnhancedIconButtonのdisabledプロパティによってクリックが抑制される
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
        setNewTag('');
        setInputError('');
    };

    const open = Boolean(anchorEl);
    const id = open ? 'tag-manager-popover' : undefined;

    // 既存のタグをチップとして表示
    const tagChips = useMemo(() => (
        currentTags.map((tag) => {
            const displayLabel = tag.length > MAX_TAG_DISPLAY_LENGTH
                ? `${tag.substring(0, MAX_TAG_DISPLAY_LENGTH)}...`
                : tag;
                
            const tooltipTitle = tag.length > MAX_TAG_DISPLAY_LENGTH ? tag : '';

            return (
                // ⭐ ChipにTooltopを適用するためにBoxでラップ
                <Box key={tag} {... (tooltipTitle ? {
                    component: 'span',
                    title: tooltipTitle,
                    sx: { display: 'inline-block' }
                } : {})}>
                    <Chip
                        label={displayLabel} // 省略後のラベル
                        // ⭐ 修正: isReadOnlyの場合、onDeleteはundefined (削除アイコンは非表示)
                        onDelete={isReadOnly ? undefined : () => handleDeleteTag(tag)}
                        deleteIcon={isReadOnly ? undefined : <DeleteIcon />}
                        color="default"
                        variant="outlined"
                        sx={{ m: 0.5 }}
                    />
                </Box>
            );
        })
    ), [currentTags, isReadOnly, handleDeleteTag]);


    return (
        <Paper elevation={1} sx={{ p: 1, mt: 1, mb: 0 }}>
            <Box 
                sx={{ 
                    display: 'flex', 
                    justifyContent: 'flex-start', 
                    alignItems: 'center', 
                    gap: 0, 
                    flexWrap: 'wrap', 
                    minHeight: '40px' 
                }}
            >
                {/* 1. タグ入力の表示トグルボタン (Popoverのアンカー) */}
                {/* ⭐ 修正: isReadOnlyに関わらずボタンは表示し、disabledを渡す */}
                <EnhancedIconButton
                    aria-describedby={id}
                    // color="default"はそのまま。disabledでグレー表示になる。
                    icon={<LabelOutlinedIcon />} 
                    tooltipText={isReadOnly ? "閲覧モードのためタグは追加できません" : "タグ入力欄を表示/タグを追加"}
                    onClick={handleIconClick}
                    size="small"
                    sx={{ ml: -0.5, flexShrink: 0 }}
                    // ⭐ isReadOnlyをdisabledに渡す
                    disabled={isReadOnly}
                />

                {/* 2. 既存のタグチップの表示 */}
                {tagChips.length > 0 ? (
                    <>
                        {tagChips}
                    </>
                ) : (
                    // 編集モードでタグがない場合にのみメッセージを表示
                    !isReadOnly && (
                        <Typography color="textSecondary" variant="body2" sx={{ fontStyle: 'italic', pl: 0.5 }}>
                            タグは登録されていません。
                        </Typography>
                    )
                )}
            </Box>

            {/* 3. Popoverで表示されるタグ入力UI */}
            <Popover
                id={id}
                open={open}
                anchorEl={anchorEl}
                onClose={handleClose}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'left',
                }}
            >
                {/* Popoverの中身 */}
                <Box sx={{ p: 2, minWidth: '300px' }}>
                    <Typography variant="subtitle2" gutterBottom>
                        タグの追加
                    </Typography>
                    <Grid container spacing={1} alignItems="flex-start">
                        <Grid size={10}>
                            <TextField
                                fullWidth
                                label="キーワードまたは「キー:値」形式で入力"
                                value={newTag}
                                onChange={(e) => {
                                    setNewTag(e.target.value);
                                    setInputError('');
                                }}
                                onKeyPress={handleKeyPress}
                                size="small"
                                error={!!inputError}
                                helperText={inputError}
                                sx={{ mb: inputError ? 0 : 1 }}
                                autoFocus
                            />
                        </Grid>
                        
                        <Grid size={2} sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
                            <EnhancedIconButton
                                color="primary"
                                icon={<AddIcon />}
                                tooltipText="タグを追加"
                                onClick={handleAddTag}
                                disabled={!isInputValid}
                                size="small"
                                sx={{ 
                                    mt: inputError ? -1.5 : 0, 
                                    alignSelf: 'center',
                                }} 
                            />
                        </Grid>
                    </Grid>
                </Box>
            </Popover>
        </Paper>
    );
};

export default TagManager;