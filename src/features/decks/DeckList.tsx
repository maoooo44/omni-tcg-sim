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

// 💡 修正: useUserDataStore から isAllViewMode を取得
import { useShallow } from 'zustand/react/shallow'; 
import { useDeckStore } from '../../stores/deckStore'; 
import { useUserDataStore } from '../../stores/userDataStore'; // 💡 追加

import type { Deck } from '../../models/deck'; 
import { useSortAndFilter } from '../../hooks/useSortAndFilter';
import { type SortField } from '../../utils/sortingUtils'; 
import SortAndFilterControls from '../../components/controls/SortAndFilterControls'; 
// 💡 修正: 共通コンポーネントからインポート
import { SortableTableCell } from '../../components/common/SortableTableCell'; 
import { FadedOverlay } from '../../components/common/FadedOverlay'; // 💡 追加

// 💡 修正: ユーティリティをインポート
import { 
    getDisplayImageUrl, 
    type ImageDisplayOptions, 
} from '../../utils/imageUtils'; 
// 💡 修正: 切り出したユーティリティをインポート
import { deckFieldAccessor, calculateTotalCards } from './deckUtils'; 

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
        handleDeleteDeck,
    } = useDeckList();
    
    const navigate = useNavigate(); 
    
    const { startNewDeckEditing } = useDeckStore(useShallow(state => ({
        startNewDeckEditing: state.startNewDeckEditing,
    })));

    // 💡 追加: UserDataStoreから isAllViewMode を取得
    const { isAllViewMode } = useUserDataStore(useShallow(state => ({
        isAllViewMode: state.isAllViewMode,
    })));

    // 💡 2. ソート＆フィルタリングフックの適用 (deckFieldAccessorをutilsからインポート)
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

                                // 💡 制御フラグの定義
                                // isAllViewMode ON かつ isInStore が false の場合に薄く表示
                                const isLogicallyDeleted = isAllViewMode && !deck.isInStore;
                                // 薄く表示されるアイテム（論理削除済み）以外に簡易削除ボタンを表示
                                const showSimpleDeleteButton = !isLogicallyDeleted;
                                
                                return (
                                    // 💡 FadedOverlay の適用
                                    <FadedOverlay key={deck.deckId} opacity={isLogicallyDeleted ? 0.4 : 1}>
                                        <TableRow hover>
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
                                                {/* 💡 簡易削除ボタンの表示制御 */}
                                                {showSimpleDeleteButton && (
                                                    <Tooltip title="この操作は論理削除（非表示）を行います">
                                                        <Button
                                                            variant="outlined"
                                                            color="error"
                                                            size="small"
                                                            startIcon={<DeleteIcon />}
                                                            onClick={() => handleDeleteDeck(deck.deckId)}
                                                        >
                                                            削除
                                                        </Button>
                                                    </Tooltip>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    </FadedOverlay>
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