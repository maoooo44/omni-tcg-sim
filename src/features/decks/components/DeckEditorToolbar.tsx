/**
 * src/features/decks/components/DeckEditorToolbar.tsx
 *
 * デッキ編集画面のツールバー。
 * 💡 修正: 編集ボタンの表示を PackEditorToolbar と同様に「編集モードへ/閲覧モードへ」に統一。
 * 💡 修正: isEditModeかつisDirtyの場合、「閲覧モードへ」ボタンをdisabledにする。
 */
import React from 'react';
import { Button, Box, Typography, Alert, ToggleButtonGroup, ToggleButton, Tooltip } from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import DeleteIcon from '@mui/icons-material/Delete';
import EditorIcon from '@mui/icons-material/Edit'; // 編集アイコン
import VisibilityIcon from '@mui/icons-material/Visibility'; // 閲覧アイコン

import type { Deck } from '../../../models/deck';

type DeckArea = 'mainDeck' | 'sideDeck' | 'extraDeck';

interface DeckEditorToolbarProps {
    deck: Deck;
    isNewDeck: boolean;
    isDirty: boolean;
    onSave: () => Promise<void>;
    onDelete: () => Promise<void>;
    saveMessage: string | null;

    // ゾーン切り替えの Props
    selectedDeckArea: DeckArea;
    onAreaChange: (newArea: DeckArea) => void;

    // 編集モード切り替えの Props
    isEditMode: boolean;
    onToggleEditMode: () => void;
}

const DeckEditorToolbar: React.FC<DeckEditorToolbarProps> = ({
    deck,
    //isNewDeck,
    isDirty,
    onSave,
    onDelete,
    saveMessage,
    selectedDeckArea,
    onAreaChange,
    isEditMode,
    onToggleEditMode,
}) => {
    const pageTitle = `デッキ${isEditMode ? '編集' : '閲覧'}`; //: ${deck.name}
    const isSaveDisabled = !isDirty;

    // 💡 修正: ダーティーな状態(isDirty=true)で編集モード(isEditMode=true)の場合、
    // 閲覧モードへの切り替えを非アクティブにする
    const isToggleDisabled = isEditMode && isDirty;

    const handleAreaChange = (
        _event: React.MouseEvent<HTMLElement>,
        newArea: DeckArea | null,
    ) => {
        if (newArea) {
            onAreaChange(newArea);
        }
    };

    return (
        <Box sx={{ mb: 1 }}> {/* mb を 1 に調整 */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>

                {/* 左側: タイトル & ゾーン切り替えトグル */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant="h4" component="h1">
                        {pageTitle}
                    </Typography>

                    {/* 💡 修正: ゾーン切り替えトグルを常に表示 */}
                    <ToggleButtonGroup
                        value={selectedDeckArea}
                        exclusive
                        onChange={handleAreaChange}
                        aria-label="deck area selection"
                        size="small"
                    >
                        <ToggleButton value="mainDeck" aria-label="main deck">
                            メイン
                        </ToggleButton>
                        <ToggleButton value="sideDeck" aria-label="side deck">
                            サイド
                        </ToggleButton>
                        <ToggleButton value="extraDeck" aria-label="extra deck">
                            エクストラ
                        </ToggleButton>
                    </ToggleButtonGroup>
                </Box>

                {/* 右側: アクションボタン群 */}
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>

                    {/* 編集モード切り替えボタン */}
                    <Tooltip 
                        title={
                            isToggleDisabled
                                ? "変更を保存してから閲覧モードへ切り替えてください"
                                : isEditMode ? "デッキ情報や設定を閲覧モードに戻す" : "デッキ情報や設定を編集する"
                        }
                    >
                        {/* 💡 修正: isToggleDisabled を disabled 属性に設定 */}
                        <Button
                            variant="outlined"
                            onClick={onToggleEditMode}
                            startIcon={isEditMode ? <VisibilityIcon /> : <EditorIcon />}
                            disabled={isToggleDisabled}
                        >
                            {isEditMode ? '閲覧モードへ' : '編集モードへ'}
                        </Button>
                    </Tooltip>

                    {/* 保存ボタン (編集モードでのみ表示) */}
                    {isEditMode && (
                        <Button
                            variant="contained"
                            startIcon={<SaveIcon />}
                            onClick={onSave}
                            disabled={isSaveDisabled}
                            sx={{ ml: 1 }}
                        >
                            保存
                        </Button>
                    )}

                    {/* 論理削除ボタン (既存デッキのみ) */}
                    {deck.deckId && (
                        <Button
                            variant="outlined"
                            color="error"
                            startIcon={<DeleteIcon />}
                            onClick={onDelete}
                        >
                            ゴミ箱へ移動
                        </Button>
                    )}
                </Box>
            </Box>

            {/* 保存結果メッセージ */}
            {saveMessage && (
                <Alert severity={saveMessage.includes('失敗') ? 'error' : 'success'} sx={{ mb: 1 }}>
                    {saveMessage}
                </Alert>
            )}
        </Box>
    );
};

export default DeckEditorToolbar;