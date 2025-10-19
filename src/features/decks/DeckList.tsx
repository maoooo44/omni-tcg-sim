/**
 * src/features/decks/DeckList.tsx
 *
 * ユーザーが作成したデッキの一覧を表示し、新規作成、編集、削除の操作を提供するコンポーネント。
 * useDeckListフックからデータを取得し、useSortAndFilterフックでソート・フィルタリングを適用する。
 * 表示用のUIロジック（ソート可能なテーブルヘッダー、サムネイルの表示、操作ボタン）に専念する。
 */
import React, { useCallback } from 'react';
import { useDeckList } from './hooks/useDeckList';
import { useNavigate } from '@tanstack/react-router'; 
import { 
    Box, Typography, Button, CardMedia, 
    TableContainer, Table, TableHead, TableRow, TableCell, TableBody, Paper, Tooltip, Alert,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';


// import { useDeckStore } from '../../stores/deckStore'; // 💡 修正: useDeckStoreは現在不要

import type { Deck } from '../../models/deck'; 
import { useSortAndFilter } from '../../hooks/useSortAndFilter';
import { type SortField } from '../../utils/sortingUtils'; 
import SortAndFilterControls from '../../components/controls/SortAndFilterControls'; 
import { SortableTableCell } from '../../components/common/SortableTableCell'; 

import { 
    getDisplayImageUrl, 
    type ImageDisplayOptions, 
} from '../../utils/imageUtils'; 
import { deckFieldAccessor, calculateTotalCards } from './deckUtils'; 
// 💡 修正: createDefaultDeck をインポート
import { createDefaultDeck } from '../../utils/dataUtils';

const DECK_EDIT_PATH_PREFIX = '/user/decks'; 
const THUMBNAIL_WIDTH = 64; 
const THUMBNAIL_HEIGHT = 64; 

const DECK_PLACEHOLDER_OPTIONS: Omit<ImageDisplayOptions, 'text'> = {
    width: THUMBNAIL_WIDTH,
    height: THUMBNAIL_HEIGHT, 
    imageColor: 'blue',
};


// =========================================================================
// 1. ソート・フィルタリング用設定 (deckFieldAccessorはutilsに切り出し)
// =========================================================================

/**
 * ソートオプションの定義
 */
const DECK_SORT_OPTIONS: { label: string, value: SortField, align: 'left' | 'right' | 'center' }[] = [
    { label: 'No.', value: 'number', align: 'left' },
    { label: 'デッキ名', value: 'name', align: 'left' },
    { label: 'カード枚数', value: 'cardCount', align: 'right' },
    { label: 'ID', value: 'deckId', align: 'left' },
];

// =========================================================================
// 2. コンポーネント本体
// =========================================================================

const DeckList: React.FC = () => {
    
    // 1. データ取得とアクション
    const {
        decks,
        isLoading,
        handlemoveDeckToTrash, // 💡 修正: handleDeleteDeck -> handlemoveDeckToTrash
    } = useDeckList();
    
    const navigate = useNavigate(); 
    
    // 💡 修正: startNewDeckEditing の取得は不要になったため削除
    // const { startNewDeckEditing } = useDeckStore(useShallow(state => ({
    //     startNewDeckEditing: state.startNewDeckEditing,
    // })));

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
        defaultSortField: 'number', 
        defaultSortOrder: 'asc'
    });
    
    const sortStateProps = { sortField, sortOrder, setSortField, toggleSortOrder };


    // 💡 新規デッキ作成とナビゲーション (ロジック修正)
    const handleCreateNewDeck = useCallback(() => {
        // createDefaultDeck を使用して新しい一意のIDを持つ空のデッキデータを生成
        const newDeck = createDefaultDeck(); 
        const newDeckId = newDeck.deckId; 
        
        // 🚨 注意: 本来、この初期デッキを Store/ローカル状態に追加するロジックが必要ですが、
        // useDeckEditorがIDを受け取って初期化を行うと仮定し、IDのみを渡します。
        
        navigate({ 
            to: `${DECK_EDIT_PATH_PREFIX}/$deckId`, 
            params: { deckId: newDeckId } // 💡 生成された一意のIDを渡す
        }); 
    }, [navigate]);

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
                                
                                {/* 💡 SortableTableCell を共通コンポーネントとして使用 */}
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
                                // 💡 修正: utilsに切り出したcalculateTotalCardsを利用
                                const totalCards = calculateTotalCards(deck); 
                                
                                // Tooltip内の改行にはJSX要素が必要だが、ここではシンプルに\nを維持
                                const tooltipTitle = `メイン: ${Array.from(deck.mainDeck.values()).reduce((s, c) => s + c, 0)}枚\nサイド: ${Array.from(deck.sideDeck.values()).reduce((s, c) => s + c, 0)}枚\nエクストラ: ${Array.from(deck.extraDeck.values()).reduce((s, c) => s + c, 0)}枚`;

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
                                            <Tooltip title={tooltipTitle}>
                                                <Typography>{totalCards}枚</Typography>
                                            </Tooltip>
                                        </TableCell>
                                        <TableCell align="center">
                                            {/* 編集ボタン: 常に表示 */}
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
                                            {/* 💡 簡易削除ボタン: 常に表示 (論理削除/ゴミ箱移動) */}
                                            <Tooltip title="この操作はゴミ箱に移動します">
                                                <Button
                                                    variant="outlined"
                                                    color="error"
                                                    size="small"
                                                    startIcon={<DeleteIcon />}
                                                    onClick={() => handlemoveDeckToTrash(deck.deckId)} // 💡 修正
                                                >
                                                    削除
                                                </Button>
                                            </Tooltip>
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

export default DeckList;