/**
 * src/features/decks/DeckList.tsx
 *
 * * ユーザーが作成したデッキの一覧を表示し、新規作成、編集、ゴミ箱への移動操作を提供するメインコンポーネント。
 * * 責務:
 * 1. useDeckListフックを呼び出し、デッキデータ（全件/ソート・フィルタ適用済み）とソート/フィルタリング状態・ハンドラを取得する。
 * 2. useGridDisplayフックを呼び出し、一覧表示の列数設定（レスポンシブ設定含む）を管理する。
 * 3. 取得したデータと設定に基づき、汎用グリッドコンポーネント（GridDisplay）にUI描画とイベント処理を委譲する。
 * 4. 新規デッキ作成ボタンを提供し、デフォルトデッキを作成した上で編集画面へ遷移させる。
 * 5. ソート・フィルタリングコントロールUI、列数トグル、ステータス表示（ロード中/デッキなし/フィルタリング結果なし）を提供する。
 */
import React, { useCallback, useState } from 'react';
import { useDeckList } from './hooks/useDeckList';
import { useNavigate } from '@tanstack/react-router';
import {
    Box, Button, Alert, Typography
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

import { useGridDisplay } from '../../hooks/useGridDisplay';
import GridDisplay from '../../components/common/GridDisplay';
import DeckItem from './components/DeckItem';
import ControlBar from '../../components/common/ControlBar';

import { createDefaultDeck } from '../../utils/dataUtils';
import { PAGE_PADDING, PAGE_FLEX_GROW, PAGE_TITLE_VARIANT, DeckListGridSettings, DECK_FILTER_FIELDS } from '../../configs/configs';
const DECK_EDIT_PATH_PREFIX = '/decks';

import BulkEditDeckModal from './components/BulkEditDeckModal';
import BulkActionConfirmDialog from '../../components/common/BulkActionConfirmDialog';

import type { Deck } from '../../models/models';


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
        selectedDeckIds,
        // 既存プロパティ
        isLoading,
        toggleDeckSelection,
        toggleAllDecksSelection,
        handleBulkDelete,
        handleBulkEdit,
        clearSelection,
        //handlemoveDeckToTrash,
    } = useDeckList();

    const navigate = useNavigate();

    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [showBulkEditModal, setShowBulkEditModal] = useState(false);


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

    const handleBulkDeleteClick = async () => {
        setShowDeleteDialog(true);
    };

    // UI状態管理ハンドラ
    const handleBulkEditClick = () => {
        setShowBulkEditModal(true);
    };

    const handleBulkEditSave = async (fields: Partial<Deck>) => {
        await handleBulkEdit(fields);
        setShowBulkEditModal(false);
        setIsSelectionMode(false);
    };

    const handleConfirmDelete = async () => {
        await handleBulkDelete();
        setShowDeleteDialog(false);
        setIsSelectionMode(false);
    };

    const handleToggleSelectionMode = () => {
        if (isSelectionMode) {
            clearSelection();
        }
        setIsSelectionMode(!isSelectionMode);
    };

    const hasDecks = decks.length > 0;
    const isFilteredButEmpty = hasDecks && displayedDecks.length === 0; // searchTermだけでなく高度なフィルタによる空も含む
    const isTotallyEmpty = !hasDecks && !isLoading; // デッキがゼロ件で、ロード完了している状態

    // ⭐️ 修正点 1: ControlBarに渡す構造化Propsの定義 ⭐️
    const selectionProps = {
        isSelectionMode: isSelectionMode,
        selectedIds: selectedDeckIds,
        totalDisplayedItems: displayedDecks.length,
        onToggleSelectionMode: handleToggleSelectionMode,
        onToggleAllSelection: toggleAllDecksSelection,
        bulkDelete: {
            onDelete: handleBulkDeleteClick,
        },
        bulkEdit: {
            onEdit: handleBulkEditClick,
        },
        // bulkFavoriteはDeckListでは未使用のため含めない
    };

    const gridToggleProps = {
        columns: gridDisplayProps.columns,
        setColumns: gridDisplayProps.setColumns,
        minColumns: gridDisplayProps.minColumns,
        maxColumns: gridDisplayProps.maxColumns,
    };

    const sortFilterProps = {
        labelPrefix: "デッキ",
        sortOptions: DECK_SORT_OPTIONS,
        sortField: sortField,
        sortOrder: sortOrder,
        setSortField: setSortField,
        toggleSortOrder: toggleSortOrder,
        searchTerm: searchTerm,
        setSearchTerm: setSearchTerm,
        filters: filters,
        setFilters: setFilters,
        filterFields: DECK_FILTER_FIELDS,
    };


    if (isLoading) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="info">デッキデータをロード中...</Alert>
            </Box>
        );
    }

    if (isTotallyEmpty) {
        return (
            <Box sx={{ p: PAGE_PADDING, flexGrow: PAGE_FLEX_GROW }}>
                <Typography variant={PAGE_TITLE_VARIANT} gutterBottom>デッキ管理</Typography>
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
        <Box sx={{ p: PAGE_PADDING, flexGrow: PAGE_FLEX_GROW }}>
            <Typography variant={PAGE_TITLE_VARIANT} gutterBottom>デッキ管理</Typography>
            <Box sx={{ flexGrow: 1, p: 2 }}>

                <ControlBar
                    title="デッキ一覧"
                    itemCount={displayedDecks.length}
                    
                    // ⭐️ 修正点 2: 構造化されたPropsを渡す ⭐️
                    // showSelectionMode は不要。isSelectionModeフラグがtrueのときのみ渡す
                    selectionProps={selectionProps}

                    // showGridColumnToggle は削除。gridTogglePropsを渡すことで表示を制御する
                    gridToggleProps={gridToggleProps} 

                    // showSortFilter は削除。sortFilterPropsを渡すことで表示を制御する
                    sortFilterProps={sortFilterProps}
                    
                    actionButtons={[
                        {
                            icon: <AddIcon />,
                            tooltip: '新規デッキを作成',
                            onClick: handleCreateNewDeck,
                            color: 'primary',
                        },
                    ]}
                />

                {/* 検索結果がゼロの場合のAlert (高度なフィルタリング結果も含む) */}
                {isFilteredButEmpty ? (
                    <Alert severity="info" sx={{ mt: 2 }}>
                        選択された条件に一致するデッキが見つかりませんでした。
                    </Alert>
                ) : (
                    <Box sx={{ mt: 2 }}>
                        <GridDisplay
                            items={displayedDecks.map(deck => ({
                                ...deck,
                                isSelected: selectedDeckIds.includes(deck.deckId),
                            })) as any}
                            ItemComponent={DeckItem as any}
                            itemProps={{
                                onSelect: handleSelectDeck,
                                isSelectable: isSelectionMode,
                                onToggleSelection: toggleDeckSelection,
                                //onDeleteDeck: handlemoveDeckToTrash, 
                            }}
                            {...gridDisplayProps.gridRenderUnit}
                        />
                    </Box>
                )}

                {/* 一括編集モーダル */}
                <BulkEditDeckModal
                    open={showBulkEditModal}
                    onClose={() => setShowBulkEditModal(false)}
                    selectedDeckIds={selectedDeckIds}
                    onSave={handleBulkEditSave}
                />

                {/* 削除確認ダイアログ */}
                <BulkActionConfirmDialog
                    open={showDeleteDialog}
                    onClose={() => setShowDeleteDialog(false)}
                    onConfirm={handleConfirmDelete}
                    itemCount={selectedDeckIds.length}
                    itemLabel="デッキ"
                    actionLabel="ゴミ箱に移動"
                />
            </Box>
        </Box>
    );
};

export default DeckList;