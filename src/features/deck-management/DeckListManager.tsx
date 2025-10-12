/**
 * src/features/deck-management/DeckListManager.tsx
 * * ユーザーが作成したデッキの一覧を表示し、新規作成、編集、削除の操作を提供するコンポーネント。
 * useDeckListカスタムフックを使用してデッキデータをロードし、テーブル形式で表示する。
 * 各デッキにはサムネイル画像（プレースホルダー含む）と総カード枚数を表示する。
 */

import React, { useCallback } from 'react';
import { useDeckList } from './hooks/useDeckList';
// 💡 useNavigate のインポートは既にある
import { useNavigate } from '@tanstack/react-router'; 
import { 
    Box, Typography, Button, CardMedia, 
    TableContainer, Table, TableHead, TableRow, TableCell, TableBody, Paper, Tooltip, Alert
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useShallow } from 'zustand/react/shallow'; 
import { useDeckStore } from '../../stores/deckStore'; 

import { 
    getDisplayImageUrl, 
    type ImageDisplayOptions, // 型もインポートしておくと安全
} from '../../utils/imageUtils'; 

// AppLayoutのルートパスに合わせることを想定
const DECK_EDIT_PATH_PREFIX = '/user/decks'; 

// 定義: デッキリストのサムネイル表示設定
const THUMBNAIL_WIDTH = 64; 
const THUMBNAIL_HEIGHT = 64; 

// 🚨 修正: bgColorを削除し、imgColorPresetKeyを追加
const DECK_PLACEHOLDER_OPTIONS: Omit<ImageDisplayOptions, 'text'> = {
    width: THUMBNAIL_WIDTH,
    height: THUMBNAIL_HEIGHT, 
    imgColorPresetKey: 'blue', // 青系のプリセットを使用
};


const DeckListManager: React.FC = () => {
    
    const {
        decks,
        isLoading,
        handleDeleteDeck,
        calculateTotalCards,
    } = useDeckList();
    
    // 🚨 修正1: useNavigate() フックをコンポーネント内で呼び出し、navigate を取得する
    const navigate = useNavigate(); 

    // 💡 deckStoreから新しいアクション startNewDeckEditing を取得
    const { startNewDeckEditing } = useDeckStore(useShallow(state => ({
        startNewDeckEditing: state.startNewDeckEditing,
    })));

    // 💡 新規デッキ作成とナビゲーション
    const handleCreateNewDeck = useCallback(() => {
        // 🚨 ログ追加（診断用）
        console.log(`[DeckListManager] A. handleCreateNewDeck execution start.`);

        // 1. ストアに新規デッキを準備し、UUIDを取得
        const newDeckId = startNewDeckEditing();

        // 🚨 ログ追加（診断用）
        console.log(`[DeckListManager] B. New Deck ID obtained: ${newDeckId}. Navigating...`);

        // 2. 新しいUUIDで編集画面に遷移
        // 修正2: navigate 関数が正しく定義されたため、クラッシュせずに実行される
        navigate({ 
            to: `${DECK_EDIT_PATH_PREFIX}/$deckId`, 
            params: { deckId: newDeckId } 
        }); 
        
        // 🚨 ログ追加（診断用）
        console.log(`[DeckListManager] C. Navigation command issued.`);
        
    }, [navigate, startNewDeckEditing]); // 依存配列に startNewDeckEditing を追加

    if (isLoading) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="info">デッキデータをロード中...</Alert>
            </Box>
        );
    }
    
    // ロード後のエラーチェック (デッキがない場合)
    if (!decks || decks.length === 0) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="info" action={
                    <Button color="inherit" size="small" startIcon={<AddIcon />} onClick={handleCreateNewDeck}>
                        新規作成
                    </Button>
                }>
                    まだデッキが作成されていません。
                </Alert>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h5">デッキ一覧</Typography>
                <Button
                    variant="contained"
                    color="primary"
                    startIcon={<AddIcon />}
                    onClick={handleCreateNewDeck} // ✅ 正しくバインドされている
                >
                    新規デッキを作成
                </Button>
            </Box>

            {decks.length > 0 && (
                <TableContainer component={Paper}>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                {/* サムネイル列 */}
                                <TableCell sx={{ width: THUMBNAIL_WIDTH + 16 }}>サムネイル</TableCell> 
                                <TableCell>デッキ名</TableCell>
                                <TableCell align="right">カード枚数</TableCell>
                                <TableCell align="center" sx={{ width: 150 }}>操作</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {decks.map((deck) => {
                                // ヘルパー関数を使って合計枚数を取得
                                const totalCards = calculateTotalCards(deck);
                                
                                return (
                                    <TableRow key={deck.deckId} hover>
                                        {/* サムネイルセル */}
                                        <TableCell>
                                            <CardMedia
                                                component="img"
                                                image={getDisplayImageUrl(deck.imageUrl, {
                                                    ...DECK_PLACEHOLDER_OPTIONS,
                                                    // デッキ名が長い場合を考慮し、短縮したものを表示
                                                    text: deck.name.substring(0, 3) || 'DECK', 
                                                })}
                                                alt={deck.name || 'デッキ'}
                                                sx={{ 
                                                    width: THUMBNAIL_WIDTH, 
                                                    height: THUMBNAIL_HEIGHT, 
                                                    objectFit: 'cover',
                                                    borderRadius: 1,
                                                }}
                                            />
                                        </TableCell>
                                        <TableCell component="th" scope="row">
                                            <Typography variant="subtitle1" fontWeight="bold">{deck.name}</Typography>
                                            <Typography variant="caption" color="text.secondary">{deck.deckId}</Typography>
                                        </TableCell>
                                        <TableCell align="right">
                                            <Tooltip title={`メイン: ${Array.from(deck.mainDeck.values()).reduce((s, c) => s + c, 0)}枚\nサイド: ${Array.from(deck.sideDeck.values()).reduce((s, c) => s + c, 0)}枚\nエクストラ: ${Array.from(deck.extraDeck.values()).reduce((s, c) => s + c, 0)}枚`}>
                                                <Typography>{totalCards}枚</Typography>
                                            </Tooltip>
                                        </TableCell>
                                        <TableCell align="center">
                                            {/* 編集ボタン */}
                                            <Button
                                                variant="contained"
                                                color="primary"
                                                size="small"
                                                startIcon={<EditIcon />}
                                                sx={{ mr: 1 }}
                                                onClick={() => navigate({ 
                                                    to: `${DECK_EDIT_PATH_PREFIX}/$deckId`, 
                                                    params: { deckId: deck.deckId } 
                                                })}
                                            >
                                                編集
                                            </Button>
                                            {/* 削除ボタン */}
                                            <Button
                                                variant="outlined"
                                                color="error"
                                                size="small"
                                                startIcon={<DeleteIcon />}
                                                onClick={() => handleDeleteDeck(deck.deckId)}
                                            >
                                                削除
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}
        </Box>
    );
};

export default DeckListManager;