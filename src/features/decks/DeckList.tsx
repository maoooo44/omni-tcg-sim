/**
 * src/features/decks/DeckList.tsx
 *
 * * ユーザーが作成したデッキの一覧を表示し、新規作成、編集、ゴミ箱への移動操作を提供するメインコンポーネント。
 * * 責務:
 * 1. useDeckListフックを呼び出し、デッキデータ（全件/ソート・フィルタ適用済み）とソート/フィルタリング状態・ハンドラを取得する。
 * 2. useGridDisplayフックを呼び出し、一覧表示の列数設定（レスポンシブ設定含む）を管理する。
 * 3. 取得したデータと設定に基づき、汎用グリッドコンポーネント（ReusableItemGrid）にUI描画とイベント処理を委譲する。
 * 4. 新規デッキ作成ボタンを提供し、デフォルトデッキを作成した上で編集画面へ遷移させる。
 * 5. ソート・フィルタリングコントロールUI、列数トグル、ステータス表示（ロード中/デッキなし/フィルタリング結果なし）を提供する。
 */
import React, { useCallback } from 'react';
import { useDeckList } from './hooks/useDeckList';
import { useNavigate } from '@tanstack/react-router';
import {
    Box, Typography, Button, Alert,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';


import { useGridDisplay } from '../../hooks/useGridDisplay';
import ReusableItemGrid from '../../components/common/ReusableItemGrid';
import DeckItem from './components/DeckItem';
import GridColumnToggle from '../../components/controls/GridColumnToggle';

// import SortAndFilterControls from '../../components/controls/SortAndFilterControls'; // 削除
import SortAndFilterButton from '../../components/controls/SortAndFilterButton'; // 💡 統合コンポーネントを追加

import { createDefaultDeck } from '../../utils/dataUtils';
import { DeckListGridSettings } from '../../configs/gridDefaults';
import { DECK_FILTER_FIELDS } from '../../configs/sortAndFilterDefaults';
const DECK_EDIT_PATH_PREFIX = '/decks';


// =========================================================================
// コンポーネント本体
// =========================================================================

const DeckList: React.FC = () => {

    // 1. データ取得とアクション
    const {
        decks,
        displayedDecks, // 高度なフィルタリング適用後のリスト
        sortField,
        sortOrder,
        searchTerm,
        filters,
        setSortField,
        toggleSortOrder,
        setSearchTerm,
        setFilters,
        DECK_SORT_OPTIONS,
        // 既存プロパティ
        isLoading,
        //handlemoveDeckToTrash,
    } = useDeckList();

    const navigate = useNavigate();

    // 2. グリッド表示フックの適用 (変更なし)
    const gridDisplayProps = useGridDisplay({
        settings: DeckListGridSettings,
        storageKey: 'deckList',
        userGlobalDefault: {
            isUserDefaultEnabled: false,
            globalColumns: null,
            advancedResponsive: {
                isEnabled: false,
                columns: {},
            }
        },
    });

    // 3. 新規デッキ作成ハンドラ (変更なし)
    const handleCreateNewDeck = useCallback(() => {
        const newDeck = createDefaultDeck();
        const newDeckId = newDeck.deckId;

        navigate({
            to: `${DECK_EDIT_PATH_PREFIX}/$deckId`,
            params: { deckId: newDeckId }
        });
    }, [navigate]);

    // 4. アイテムクリック時の編集画面遷移ハンドラ (変更なし)
    const handleSelectDeck = useCallback((deckId: string) => {
        navigate({
            to: `${DECK_EDIT_PATH_PREFIX}/$deckId`,
            params: { deckId: deckId }
        });
    }, [navigate]);

    const hasDecks = decks.length > 0;
    const isFilteredButEmpty = hasDecks && displayedDecks.length === 0; // searchTermだけでなく高度なフィルタによる空も含む
    const isTotallyEmpty = !hasDecks && !isLoading; // デッキがゼロ件で、ロード完了している状態

    if (isLoading) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="info">デッキデータをロード中...</Alert>
            </Box>
        );
    }

    if (isTotallyEmpty) {
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
        <Box sx={{ flexGrow: 1, p: 2 }}>

            {/* ソート・フィルタリングUIの配置 (旧: SortAndFilterControls) は削除 */}
            {/* <SortAndFilterControls ... /> */}

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6">デッキ一覧 ({displayedDecks.length}件)</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    {/* 💡 SortAndFilterButtonをGridColumnToggleの左隣に配置 */}
                    <SortAndFilterButton
                        labelPrefix="デッキ"
                        sortOptions={DECK_SORT_OPTIONS}
                        sortField={sortField}
                        sortOrder={sortOrder}
                        searchTerm={searchTerm}
                        filters={filters}
                        setSortField={setSortField}
                        toggleSortOrder={toggleSortOrder}
                        setSearchTerm={setSearchTerm}
                        setFilters={setFilters}
                        filterFields={DECK_FILTER_FIELDS}
                    />
                    <GridColumnToggle
                        currentColumns={gridDisplayProps.columns}
                        setColumns={gridDisplayProps.setColumns}
                        minColumns={gridDisplayProps.minColumns}
                        maxColumns={gridDisplayProps.maxColumns}
                        label="列数:"
                    />
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<AddIcon />}
                        onClick={handleCreateNewDeck}
                        sx={{ width: '180px' }}
                    >
                        新規デッキを作成
                    </Button>
                </Box>
            </Box>

            {/* 検索結果がゼロの場合のAlert (高度なフィルタリング結果も含む) */}
            {isFilteredButEmpty ? (
                <Alert severity="info" sx={{ mt: 2 }}>
                    選択された条件に一致するデッキが見つかりませんでした。
                </Alert>
            ) : (
                <Box sx={{ mt: 2 }}>
                    <ReusableItemGrid
                        items={displayedDecks as any}
                        ItemComponent={DeckItem as any}
                        itemProps={{
                            onSelectDeck: handleSelectDeck,
                            //onDeleteDeck: handlemoveDeckToTrash, 
                        }}
                        {...gridDisplayProps}
                    />
                </Box>
            )}
        </Box>
    );
};

export default DeckList;