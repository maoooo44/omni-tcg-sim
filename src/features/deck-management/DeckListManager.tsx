// src/features/deck-management/DeckListManager.tsx

/**
 * ユーザーが作成したデッキの一覧を表示し、新規作成、編集、削除の操作を提供するコンポーネント。
 * useDeckListカスタムフック、useSortAndFilterフックを使用してデッキデータをロード、ソート、フィルタリングし、テーブル形式で表示する。
 */
import React, { useCallback } from 'react';
import { useDeckList } from './hooks/useDeckList';
import { useNavigate } from '@tanstack/react-router'; 
import { 
    Box, Typography, Button, CardMedia, 
    TableContainer, Table, TableHead, TableRow, TableCell, TableBody, Paper, Tooltip, Alert,
    IconButton,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import { useShallow } from 'zustand/react/shallow'; 
import { useDeckStore } from '../../stores/deckStore'; 

// 💡 ソート・フィルタリング機能のインポート
import type { Deck } from '../../models/deck'; // Deckモデルをインポート
import { useSortAndFilter, type UseSortAndFilterResult } from '../../hooks/useSortAndFilter';
import { type SortField, /*type SortOrder*/ } from '../../utils/sortingUtils'; // SortField, SortOrderは定義元からインポート
import SortAndFilterControls from '../../components/SortAndFilterControls'; // UIコンポーネント

import { 
    getDisplayImageUrl, 
    type ImageDisplayOptions, // 型もインポートしておくと安全
} from '../../utils/imageUtils'; 

const DECK_EDIT_PATH_PREFIX = '/user/decks'; 
const THUMBNAIL_WIDTH = 64; 
const THUMBNAIL_HEIGHT = 64; 

const DECK_PLACEHOLDER_OPTIONS: Omit<ImageDisplayOptions, 'text'> = {
    width: THUMBNAIL_WIDTH,
    height: THUMBNAIL_HEIGHT, 
    imgColorPresetKey: 'blue',
};


// =========================================================================
// 1. ソート・フィルタリング用設定
// =========================================================================

/**
 * Deckオブジェクトから指定されたフィールドの値を取得するアクセサ関数
 */
const deckFieldAccessor = (item: Deck, field: SortField): string | number | null | undefined => {
    switch (field) {
        case 'number':
            return item.number;
        case 'name':
            return item.name;
        case 'deckId':
            return item.deckId;
        // 💡 カード枚数をソート対象に追加（文字列として扱うため、ここでは数値を返す）
        case 'cardCount': 
            // useDeckListの calculateTotalCards 関数が利用可能であることを前提とする
            return Array.from(item.mainDeck.values()).reduce((s, c) => s + c, 0) +
                   Array.from(item.sideDeck.values()).reduce((s, c) => s + c, 0) +
                   Array.from(item.extraDeck.values()).reduce((s, c) => s + c, 0);
        default:
            return (item as any)[field] ?? null;
    }
};

/**
 * ソートオプションの定義
 */
const DECK_SORT_OPTIONS: { label: string, value: SortField, align: 'left' | 'right' | 'center' }[] = [
    { label: 'No.', value: 'number', align: 'left' },
    { label: 'デッキ名', value: 'name', align: 'left' },
    { label: 'カード枚数', value: 'cardCount', align: 'right' },
    { label: 'ID', value: 'deckId', align: 'left' },
];

/**
 * TableCellのソートヘッダー用コンポーネント
 */
interface SortableTableCellProps {
    field: SortField;
    label: string;
    align: 'left' | 'right' | 'center';
    sortState: Pick<UseSortAndFilterResult<Deck>, 'sortField' | 'sortOrder' | 'setSortField' | 'toggleSortOrder'>;
}

const SortableTableCell: React.FC<SortableTableCellProps> = ({ field, label, align, sortState }) => {
    const isSorted = sortState.sortField === field;
    const isAsc = sortState.sortOrder === 'asc';

    const handleClick = () => {
        if (isSorted) {
            sortState.toggleSortOrder();
        } else {
            // 新しいフィールドを選択した場合、デフォルトで昇順にする
            sortState.setSortField(field);
        }
    };

    return (
        <TableCell 
            align={align} 
            onClick={handleClick}
            sx={{ 
                cursor: 'pointer', 
                whiteSpace: 'nowrap',
                fontWeight: isSorted ? 'bold' : 'normal',
                '&:hover': { bgcolor: 'action.hover' }
            }}
        >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: align === 'right' ? 'flex-end' : align === 'center' ? 'center' : 'flex-start' }}>
                {label}
                {isSorted && (
                    <IconButton size="small" sx={{ p: 0.5, ml: 0.5 }} color="primary">
                        {isAsc ? <ArrowUpwardIcon fontSize="inherit" /> : <ArrowDownwardIcon fontSize="inherit" />}
                    </IconButton>
                )}
            </Box>
        </TableCell>
    );
};


// =========================================================================
// 2. コンポーネント本体
// =========================================================================

const DeckListManager: React.FC = () => {
    
    // 1. データ取得とアクション
    const {
        decks,
        isLoading,
        handleDeleteDeck,
        calculateTotalCards,
    } = useDeckList();
    
    const navigate = useNavigate(); 
    
    const { startNewDeckEditing } = useDeckStore(useShallow(state => ({
        startNewDeckEditing: state.startNewDeckEditing,
    })));

    // 💡 2. ソート＆フィルタリングフックの適用
    const {
        sortedAndFilteredData: displayedDecks,
        sortField,
        sortOrder,
        searchTerm,
        setSortField,
        setSearchTerm,
        toggleSortOrder,
    } = useSortAndFilter<Deck>(decks, deckFieldAccessor, {
        defaultSortField: 'number', // numberによるデフォルトソートを適用
        defaultSortOrder: 'asc'
    });
    
    const sortStateProps = { sortField, sortOrder, setSortField, toggleSortOrder };


    // 💡 新規デッキ作成とナビゲーション
    const handleCreateNewDeck = useCallback(() => {
        const newDeckId = startNewDeckEditing();
        navigate({ 
            to: `${DECK_EDIT_PATH_PREFIX}/$deckId`, 
            params: { deckId: newDeckId } 
        }); 
    }, [navigate, startNewDeckEditing]);

    if (isLoading) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="info">デッキデータをロード中...</Alert>
            </Box>
        );
    }
    
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
    
    const hasFilteredResults = displayedDecks.length > 0;

    return (
        <Box sx={{ p: 3 }}>
            
            {/* 💡 ソート・フィルタリングUIの配置 */}
            <SortAndFilterControls
                labelPrefix="デッキ"
                sortOptions={DECK_SORT_OPTIONS}
                sortField={sortField}
                sortOrder={sortOrder}
                searchTerm={searchTerm}
                setSortField={setSortField}
                toggleSortOrder={toggleSortOrder}
                setSearchTerm={setSearchTerm}
            />

            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h5">デッキ一覧 ({decks.length}件)</Typography>
                <Button
                    variant="contained"
                    color="primary"
                    startIcon={<AddIcon />}
                    onClick={handleCreateNewDeck}
                >
                    新規デッキを作成
                </Button>
            </Box>

            {!hasFilteredResults && searchTerm ? (
                 <Alert severity="info" sx={{ mt: 2 }}>
                    "{searchTerm}" に一致するデッキが見つかりませんでした。
                </Alert>
            ) : (
                <TableContainer component={Paper}>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                {/* サムネイル列 (ソート不可) */}
                                <TableCell sx={{ width: THUMBNAIL_WIDTH + 16 }}>サムネイル</TableCell> 
                                
                                {/* 💡 ソート可能なヘッダー */}
                                <SortableTableCell 
                                    field="number"
                                    label="No."
                                    align="left"
                                    sortState={sortStateProps}
                                />
                                <SortableTableCell 
                                    field="name"
                                    label="デッキ名"
                                    align="left"
                                    sortState={sortStateProps}
                                />
                                <SortableTableCell 
                                    field="cardCount"
                                    label="カード枚数"
                                    align="right"
                                    sortState={sortStateProps}
                                />
                                {/* 操作列 (ソート不可) */}
                                <TableCell align="center" sx={{ width: 150 }}>操作</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {/* 💡 ソート・フィルタ後のデータを使用 */}
                            {displayedDecks.map((deck) => {
                                const totalCards = calculateTotalCards(deck);
                                
                                return (
                                    <TableRow key={deck.deckId} hover>
                                        {/* サムネイルセル */}
                                        <TableCell>
                                            <CardMedia
                                                component="img"
                                                image={getDisplayImageUrl(deck.imageUrl, {
                                                    ...DECK_PLACEHOLDER_OPTIONS,
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
                                        {/* No. の表示 */}
                                        <TableCell>
                                            {deck.number !== null && (
                                                <Typography variant="overline" color="text.primary" sx={{ display: 'block', lineHeight: 1.2 }}>
                                                    {deck.number}
                                                </Typography>
                                            )}
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