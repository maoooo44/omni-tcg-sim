/**
 * src/features/deck-management/DeckEditor.tsx (修正後)
 * * デッキの編集を行うメインコンポーネント。
 * データ取得はすべて親/フック層に委譲され、自身は**純粋なUI描画**と**イベントハンドラの呼び出し**に専念する。
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
// ❌ 削除: UIコンポーネントからのストア依存を排除
// import { useCardStore } from '../../stores/cardStore'; 
// import { useShallow } from 'zustand/react/shallow';
// import { useCardPoolStore } from '../../stores/cardPoolStore'; 

// DeckEditorに必要なPropsを定義
interface DeckEditorProps {
    deck: Deck;
    // ✅ 追加: フックから取得した参照データをPropsとして受け取る
    allCards: Card[]; 
    ownedCards: Map<string, number>; // cardId -> count
    
    addCard: (cardId: string, deckType: 'mainDeck' | 'sideDeck' | 'extraDeck') => void;
    removeCard: (cardId: string, deckType: 'mainDeck' | 'sideDeck' | 'extraDeck') => void;
    onSave: () => Promise<void>;
    onDelete: () => Promise<void>;
    updateDeckInfo: (info: Partial<Deck>) => void;
    saveMessage: string | null;
}

// --------------------------------------------------------------------------------------
// Map<string, number> を UI表示用の DeckCard[] に変換するヘルパー関数
// --------------------------------------------------------------------------------------
// 💡 コンポーネント外に定義することで、再レンダリングごとの再生成を避けます
const mapToDeckCardList = (cardMap: Map<string, number>): DeckCard[] => {
    if (!cardMap) return [];
    // DeckCard[] に変換し、枚数の降順でソート
    return Array.from(cardMap.entries())
        .map(([cardId, count]) => ({ cardId, count }))
        .sort((a, b) => b.count - a.count);
};
// --------------------------------------------------------------------------------------

const DeckEditor: React.FC<DeckEditorProps> = ({ 
    deck, 
    allCards, // ✅ Propsとして利用
    ownedCards, // ✅ Propsとして利用
    addCard, 
    removeCard, 
    onSave, 
    onDelete, 
    updateDeckInfo, 
    saveMessage 
}) => {
    // 検索フィルタリング用ローカル状態
    const [searchTerm, setSearchTerm] = useState('');

    // ❌ 削除: ストアからのデータ取得ロジックを削除
    /*
    const allCards = useCardStore(useShallow(state => state.getAllCards()));
    const ownedCards = useCardPoolStore(useShallow(state => state.cardPool));
    */

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
    const renderDeckList = (cards: DeckCard[], title: string, deckType: 'mainDeck' | 'sideDeck' | 'extraDeck') => (
        <Box sx={{ mb: 2 }}>
            <Typography variant="h6" gutterBottom>{title} ({cards.length}枚)</Typography>
            <List dense>
                {/* ... (デッキカードリストのレンダリングロジック。変更なし) */}
                {cards.map((deckCard, index) => {
                    const card = allCards.find(c => c.cardId === deckCard.cardId);
                    if (!card) return null;
                    const isOwned = ownedCards.get(card.cardId) && ownedCards.get(card.cardId)! >= deckCard.count;
                    
                    return (
                        <ListItem
                            key={`${card.cardId}-${index}`}
                            secondaryAction={
                                <>
                                    <IconButton edge="end" aria-label="remove" size="small" onClick={() => removeCard(card.cardId, deckType)}>
                                        <RemoveIcon fontSize="inherit" />
                                    </IconButton>
                                    <IconButton edge="end" aria-label="add" size="small" onClick={() => addCard(card.cardId, deckType)} sx={{ ml: 1 }}>
                                        <AddIcon fontSize="inherit" />
                                    </IconButton>
                                </>
                            }
                        >
                            <Avatar 
                                sx={{ 
                                    width: 30, height: 42, mr: 1, 
                                    // isOwnedの判定にPropsのownedCardsを使用
                                    filter: isOwned ? 'none' : 'grayscale(100%)' 
                                }} 
                            />
                            <ListItemText
                                primary={`${deckCard.count}x ${card.name}`}
                                // isOwnedの判定にPropsのownedCardsを使用
                                secondary={card.rarity + (isOwned ? '' : ' (枚数が不足)')}
                            />
                        </ListItem>
                    );
                })}
            </List>
        </Box>
    );

    // --- メインレイアウト (変更なし) ---
    return (
        <Box sx={{ p: 3, flexGrow: 1 }}>
            {/* ... (省略: ヘッダー、ボタン、アラート部分) */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h5">{deck.name}</Typography>
                <Box>
                    <Button
                        variant="contained"
                        startIcon={<SaveIcon />}
                        onClick={onSave}
                        sx={{ mr: 1 }}
                    >
                        保存
                    </Button>
                    <Button
                        variant="outlined"
                        color="error"
                        startIcon={<DeleteIcon />}
                        onClick={onDelete}
                    >
                        削除
                    </Button>
                </Box>
            </Box>

            {saveMessage && (
                <Alert severity={saveMessage.includes('失敗') ? 'error' : 'success'} sx={{ mb: 2 }}>
                    {saveMessage}
                </Alert>
            )}

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
                                const isOwned = (ownedCards.get(card.cardId) || 0) > 0; // ✅ PropsのownedCardsを使用
                                return (
                                    <ListItem
                                        key={card.cardId}
                                        secondaryAction={
                                            <IconButton edge="end" aria-label="add" onClick={() => addCard(card.cardId, 'mainDeck')}>
                                                <AddIcon />
                                            </IconButton>
                                        }
                                    >
                                        <Avatar 
                                            // ... (アバターの描画)
                                            sx={{ 
                                                width: 30, height: 42, mr: 1, 
                                                filter: isOwned ? 'none' : 'grayscale(100%)' // 未所持はグレー
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
                        {renderDeckList(mapToDeckCardList(deck.mainDeck), 'メインデッキ', 'mainDeck')}
                        <Divider sx={{ my: 2 }} />
                        {renderDeckList(mapToDeckCardList(deck.sideDeck), 'サイドデッキ', 'sideDeck')}
                        <Divider sx={{ my: 2 }} />
                        {renderDeckList(mapToDeckCardList(deck.extraDeck), 'エクストラデッキ', 'extraDeck')}
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

export default DeckEditor;