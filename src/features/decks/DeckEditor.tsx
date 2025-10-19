/**
 * src/features/decks/DeckEditor.tsx
 *
 * デッキの編集を行うメインコンポーネント。
 * データ取得はすべて親/フック層に委譲され、自身は**純粋なUI描画**と**イベントハンドラの呼び出し**に専念する。
 * デッキの編集、カードの追加/削除、デッキ情報の更新機能を提供する。
 * 💡 修正: 廃止された isAllViewMode プロップス、および論理削除/復元ロジックに関連するインポートや条件を削除し、コードを簡素化。
 */

import React, { useMemo, useState } from 'react';
import { 
    Box, Typography, Button, Alert, Grid, Paper, 
    TextField, IconButton, Divider, List, ListItem, ListItemText,
    InputAdornment, Avatar,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import SaveIcon from '@mui/icons-material/Save';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';

import type { Deck, DeckCard } from '../../models/deck';
import type { Card } from '../../models/card';
import { mapToDeckCardList } from '../decks/deckUtils'; 

// DeckEditorに必要なPropsを定義
interface DeckEditorProps {
    deck: Deck;
    allCards: Card[]; 
    ownedCards: Map<string, number>; // cardId -> count
    onSave: () => Promise<void>;
    onDelete: () => Promise<void>; // 💡 論理削除 (ゴミ箱への移動)
    updateDeckInfo: (info: Partial<Deck>) => void;
    saveMessage: string | null;
    // 💡 削除: isAllViewMode は廃止
}

const DeckEditor: React.FC<DeckEditorProps> = ({ 
    deck, 
    allCards, 
    ownedCards, 
    onSave, 
    onDelete, 
    updateDeckInfo, 
    saveMessage,
}) => {
    // 検索フィルタリング用ローカル状態
    const [searchTerm, setSearchTerm] = useState('');

    // --- カードプール (左側) のフィルタリングロジック ---
    const filteredCardPool = useMemo(() => {
        if (!searchTerm) {
            return allCards;
        }
        const lowerSearchTerm = searchTerm.toLowerCase();
        return allCards.filter(card => 
            card.name.toLowerCase().includes(lowerSearchTerm) ||
            card.rarity.toLowerCase().includes(lowerSearchTerm)
        );
    }, [allCards, searchTerm]);

    // --- デッキリスト (右側) のレンダリングロジック ---
    /**
     * 💡 修正: 以前のエラーで指摘された未使用の引数 deckType を削除
     */
    const renderDeckList = (cards: DeckCard[], title: string) => (
        <Box sx={{ mb: 2 }}>
            <Typography variant="h6" gutterBottom>{title} ({cards.length}枚)</Typography>
            <List dense>
                {cards.map((deckCard) => { 
                    const card = allCards.find(c => c.cardId === deckCard.cardId);
                    if (!card) return null;
                    const isOwned = (ownedCards.get(card.cardId) || 0) >= deckCard.count;
                    
                    return (
                        <ListItem
                            key={card.cardId}
                            secondaryAction={
                                <>
                                    <IconButton edge="end" aria-label="remove" size="small" /*onClick={() => removeCard(card.cardId, deckType)}*/>
                                        <RemoveIcon fontSize="inherit" />
                                    </IconButton>
                                    <IconButton edge="end" aria-label="add" size="small" /*onClick={() => addCard(card.cardId, deckType)} sx={{ ml: 1 }}*/>
                                        <AddIcon fontSize="inherit" />
                                    </IconButton>
                                </>
                            }
                        >
                            <Avatar 
                                sx={{ 
                                    width: 30, height: 42, mr: 1, 
                                    filter: isOwned ? 'none' : 'grayscale(100%)' 
                                }} 
                            />
                            <ListItemText
                                primary={`${deckCard.count}x ${card.name}`}
                                secondary={card.rarity + (isOwned ? '' : ' (枚数が不足)')}
                            />
                        </ListItem>
                    );
                })}
            </List>
        </Box>
    );

    // --- メインレイアウト ---
    return (
        <Box sx={{ p: 3, flexGrow: 1 }}>
            {/* ... (ヘッダー、ボタン、アラート部分) */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                {/* 💡 修正: deck.isInStore の表示ロジックを削除 */}
                <Typography variant="h5">{deck.name}</Typography>
                <Box>
                    {/* 💡 削除: 復元ボタンのロジック (isInStore === false の条件が不要になったため削除) */}
                    
                    {/* 保存ボタン */}
                    <Button
                        variant="contained"
                        startIcon={<SaveIcon />}
                        onClick={onSave}
                        sx={{ mr: 1 }}
                        // 💡 修正: disabled条件から isInStore 関連を削除し、純粋な新規作成判定のみ残す
                        disabled={!deck.deckId} 
                    >
                        保存
                    </Button>
                    
                    {/* 論理削除ボタン (ゴミ箱への移動) */}
                    {/* 💡 修正: 既存のデッキであれば削除可能とするために条件を簡素化 */}
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
                    
                    {/* 💡 削除: 物理削除ボタンのロジック (isInStore === false の条件が不要になったため削除) */}
                </Box>
            </Box>

            {saveMessage && (
                <Alert severity={saveMessage.includes('失敗') ? 'error' : 'success'} sx={{ mb: 2 }}>
                    {saveMessage}
                </Alert>
            )}
            
            {/* デッキ情報編集フィールド */}
            <TextField
                fullWidth
                label="デッキ No. (ソート順)"
                type="number"
                value={deck.number ?? ''} 
                onChange={(e) => updateDeckInfo({ number: e.target.value === '' ? null : Number(e.target.value) })}
                helperText="デッキの表示順を指定します。空欄の場合、自動採番されます。"
                inputProps={{ min: 0 }}
                sx={{ mb: 2 }}
            />
            <TextField
                fullWidth
                label="デッキ名"
                value={deck.name}
                onChange={(e) => updateDeckInfo({ name: e.target.value })}
                sx={{ mb: 2 }}
            />
            <TextField
                fullWidth
                label="説明"
                value={deck.description}
                onChange={(e) => updateDeckInfo({ description: e.target.value })}
                multiline
                rows={2}
                sx={{ mb: 3 }}
            />

            {/* MaterialUI Grid の記法を維持 */}
            <Grid container spacing={3}>
                {/* 1. カードプールリスト (左側) */}
                <Grid size={{md:4,xs:12}}>
                    <Paper elevation={3} sx={{ p: 2 }}>
                        <TextField
                            fullWidth
                            label="カードを検索"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon />
                                    </InputAdornment>
                                ),
                            }}
                            sx={{ mb: 1 }}
                        />
                        <List dense sx={{ maxHeight: 600, overflow: 'auto' }}>
                            {filteredCardPool.map((card) => {
                                const isOwned = (ownedCards.get(card.cardId) || 0) > 0; 
                                return (
                                    <ListItem
                                        key={card.cardId}
                                        secondaryAction={
                                            <IconButton edge="end" aria-label="add" /*onClick={() => addCard(card.cardId, 'mainDeck')}*/>
                                                <AddIcon />
                                            </IconButton>
                                        }
                                    >
                                        <Avatar 
                                            sx={{ 
                                                width: 30, height: 42, mr: 1, 
                                                filter: isOwned ? 'none' : 'grayscale(100%)' 
                                            }} 
                                        />
                                        <ListItemText
                                            primary={card.name}
                                            secondary={card.rarity + (isOwned ? '' : ' (未所持)')}
                                        />
                                    </ListItem>
                                );
                            })}
                        </List>
                        {filteredCardPool.length === 0 && <Alert severity="warning" sx={{ mt: 1 }}>カードが見つかりません。</Alert>}
                    </Paper>
                </Grid>

                {/* 2. デッキカードリスト (右側) */}
                <Grid size={{md:8,xs:12}}>
                    <Paper elevation={3} sx={{ p: 2 }}>
                        {renderDeckList(mapToDeckCardList(deck.mainDeck), 'メインデッキ')}
                        <Divider sx={{ my: 2 }} />
                        {renderDeckList(mapToDeckCardList(deck.sideDeck), 'サイドデッキ')}
                        <Divider sx={{ my: 2 }} />
                        {renderDeckList(mapToDeckCardList(deck.extraDeck), 'エクストラデッキ')}
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

export default DeckEditor;