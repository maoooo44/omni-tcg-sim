/**
 * src/features/packs/components/PackCardList.tsx (統合CardList使用版)
 *
 * パック編集画面のカードリスト表示コンポーネント。
 * 統合CardListを使用して、カードの選択・一括操作・表示を行います。
 * 責務: ControlBarを含めたリスト全体のロジックとUIを管理する。
 */

import React, { useCallback, useMemo, useState } from 'react';
import { Box } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
// 💡 削除: ControlBar側で自動生成されるため、以下のアイコンは不要
// import EditIcon from '@mui/icons-material/Edit';
// import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
// import StarIcon from '@mui/icons-material/Star';
// import StarBorderIcon from '@mui/icons-material/StarBorder';

import type { Card,  /* CustomActionButton */ } from '../../../models/models'; // CustomActionButtonは不要に
import CardList from '../../cards/components/CardList';

// 必要なフックとコンポーネントをインポート
import { useCardStore } from '../../../stores/cardStore';
import { useSortFilter } from '../../../hooks/useSortFilter';
import { useGridDisplay } from '../../../hooks/useGridDisplay';
import { useSelection } from '../../../hooks/useSelection';
import { useBulkOperations } from '../../../hooks/useBulkOperations';
import ControlBar from '../../../components/common/ControlBar';
import type { ControlBarProps } from '../../../models/models';


import { 
    CARD_SORT_OPTIONS, 
    CARD_DEFAULT_SORT, 
    PACK_CARD_FILTER_FIELDS 
} from '../../../configs/sortFilterConfigs';
import { PackEditorCardGridSettings } from '../../../configs/gridConfigs';
import type { CardListBulkOperations } from '../../cards/components/CardList';


export interface PackCardListProps {
    packId: string;
    isEditable: boolean;
    cards: Card[];
    onOpenEditorModal: (card: Card | null) => void;
    onOpenViewModal: (card: Card) => void;
}

const PackCardList: React.FC<PackCardListProps> = ({
    // packId は現在未使用だが、インターフェース互換性のため保持
    isEditable,
    cards,
    onOpenEditorModal,
    onOpenViewModal,
}) => {
    // ----------------------------------------------------
    // 1. Hooksの呼び出しと状態管理
    // ----------------------------------------------------
    
    // ストアアクションを取得
    const bulkUpdateCardIsFavorite = useCardStore(state => state.bulkUpdateCardIsFavorite);
    const bulkUpdateCardsFields = useCardStore(state => state.bulkUpdateCardsFields);
    const bulkDeleteCards = useCardStore(state => state.bulkDeleteCards);

    // UI状態管理
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [isBulkEditModalOpen, setIsBulkEditModalOpen] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    // 選択状態の管理
    const {
        selectedIds: selectedCardIds,
        toggleSelection: toggleCardSelection,
        toggleAllSelection,
        clearSelection,
    } = useSelection<string>();

    // 一括操作ハンドラ生成
    const { createBulkHandler } = useBulkOperations({
        selectedIds: selectedCardIds,
        clearSelection,
    });
    
    // ソート＆フィルタリング
    const {
        sortedAndFilteredData: displayedCards,
        sortField,
        sortOrder,
        searchTerm,
        filters,
        setSortField,
        setSearchTerm,
        toggleSortOrder,
        setFilters,
    } = useSortFilter<Card>(
        cards,
        undefined,
        CARD_DEFAULT_SORT
    );

    // グリッド表示設定
    const gridDisplayProps = useGridDisplay({
        settings: PackEditorCardGridSettings,
        storageKey: 'packCardGridColumns',
        userGlobalDefault: {
            isUserDefaultEnabled: false,
            globalColumns: null,
            advancedResponsive: {
                isEnabled: false,
                columns: {},
            }
        },
    });

    // ----------------------------------------------------
    // 2. ハンドラロジック
    // ----------------------------------------------------
    
    // カードクリック時のハンドラ（編集モード or 閲覧モード）
    const handleCardClick = useCallback((card: Card) => {
        if (isEditable) {
            onOpenEditorModal(card);
        } else {
            onOpenViewModal(card);
        }
    }, [isEditable, onOpenEditorModal, onOpenViewModal]);
    
    // 新規カード追加ハンドラ
    const handleAddNewCard = useCallback(() => {
        onOpenEditorModal(null);
    }, [onOpenEditorModal]);
    
    // 選択モード切り替え
    const handleToggleSelectionMode = useCallback(() => {
        if (isSelectionMode) { // 💡 修正: 選択モードを解除するときは選択もクリア
            clearSelection();
        }
        setIsSelectionMode(prev => !prev);
    }, [clearSelection, isSelectionMode]); // isSelectionModeを依存に追加
    
    // 全選択/全解除
    const toggleAllCardsSelection = useCallback(() => {
        toggleAllSelection(displayedCards.map(card => card.cardId));
    }, [toggleAllSelection, displayedCards]);
    
    // 一括削除ハンドラ（外部へ渡すロジック）
    const handleBulkDelete = useCallback(async (cardIds: string[]) => {
        await bulkDeleteCards(cardIds);
    }, [bulkDeleteCards]);
    
    // 一括編集ハンドラ（外部へ渡すロジック）
    const handleBulkEdit = useCallback(async (cardIds: string[], fields: Partial<Card>) => {
        await bulkUpdateCardsFields(cardIds, fields);
    }, [bulkUpdateCardsFields]);
    
    // 一括お気に入りトグルハンドラ（外部へ渡すロジック）
    const handleBulkToggleFavorite = useCallback(async (cardIds: string[], isFavorite: boolean) => {
        await bulkUpdateCardIsFavorite(cardIds, isFavorite);
    }, [bulkUpdateCardIsFavorite]);

    // ----------------------------------------------------
    // 3. ControlBar/CardList への Props 定義
    // ----------------------------------------------------
    
    // 選択されたカードのお気に入り状態を判定 (ControlBarのbulkFavoriteに渡すため)
    const selectedCards = useMemo(() => {
        return displayedCards.filter(card => selectedCardIds.includes(card.cardId));
    }, [displayedCards, selectedCardIds]);

    const hasNonFavoriteSelected = selectedCards.some(card => !card.isFavorite);
    // 💡 削除: favoriteActionLabel, favoriteActionIcon は ControlBar側で処理される
    
    // CardListのモーダルで使用する一括操作ハンドラ
    const bulkOperationsLogic: CardListBulkOperations = useMemo(() => ({
        // CardListに渡すハンドラ
        onBulkDelete: handleBulkDelete,
        onBulkEdit: handleBulkEdit,
        onBulkToggleFavorite: handleBulkToggleFavorite,
    }), [handleBulkDelete, handleBulkEdit, handleBulkToggleFavorite]);


    // ❌ 削除: 一括操作アクションの構築 (ControlBarのSelectionModeToolbarへ渡す用)
    // const bulkActions: CustomActionButton[] = useMemo(() => { ... }, [...]); 
    
    
    // 💡 修正: selectionProps を PackList.tsx と同じ形式で構築する
    const selectionProps = isEditable ? {
        isSelectionMode: isSelectionMode,
        selectedIds: selectedCardIds,
        totalDisplayedItems: displayedCards.length,
        onToggleSelectionMode: handleToggleSelectionMode,
        onToggleAllSelection: toggleAllCardsSelection,
        
        // ✅ 予約済みアクション: ハンドラ（アクション）のみを渡す
        bulkEdit: {
            onEdit: () => setIsBulkEditModalOpen(true), // 👈 アクションだけ渡す
        },
        bulkDelete: {
            onDelete: () => setShowDeleteDialog(true), // 👈 アクションだけ渡す
        },
        bulkFavorite: {
            onToggle: handleBulkToggleFavorite, // 👈 アクションだけ渡す
            // ControlBarは isFavorite の真偽値を見てアイコンとラベルを決定する
            isFavorite: !hasNonFavoriteSelected, 
        },
        // bulkActions はカスタムアクションがないため省略（undefined）
    } : undefined;


    // ControlBar Props
    const controlBarProps: ControlBarProps = useMemo(() => ({
        title: "登録カード",
        itemCount: displayedCards.length,
        itemLabel: "枚",
        
        // ソート・フィルター
        sortFilterProps: {
            labelPrefix: "カード",
            sortOptions: CARD_SORT_OPTIONS,
            sortField: sortField,
            sortOrder: sortOrder,
            setSortField: setSortField,
            toggleSortOrder: toggleSortOrder,
            searchTerm: searchTerm,
            setSearchTerm: setSearchTerm,
            filters: filters,
            setFilters: setFilters,
            filterFields: PACK_CARD_FILTER_FIELDS,
        },
        
        // 列数トグル
        gridToggleProps: {
            columns: gridDisplayProps.columns,
            setColumns: gridDisplayProps.setColumns,
            minColumns: gridDisplayProps.minColumns,
            maxColumns: gridDisplayProps.maxColumns,
        },
        
        // 選択モードツールバー
        // 💡 修正: bulkActions に依存せず、selectionProps があれば渡す
        selectionProps: selectionProps,

        // 新規追加ボタン 
        actionButtons: isEditable && handleAddNewCard ? [{ 
            icon: <AddIcon />,
            tooltip: '新規カードを追加',
            onClick: handleAddNewCard,
            color: 'primary',
        }] : [],
        
    }), [
        displayedCards.length,
        sortField,
        sortOrder,
        searchTerm,
        filters,
        gridDisplayProps.columns,
        gridDisplayProps.minColumns,
        gridDisplayProps.maxColumns,
        isEditable,
        isSelectionMode,
        selectedCardIds,
        handleToggleSelectionMode,
        toggleAllCardsSelection,
        handleAddNewCard,
        selectionProps, // 💡 修正: selectionProps を依存に含める
    ]);

    // CardListのモーダル処理ハンドラ
    const handleBulkEditSaveWrapper = createBulkHandler(
        async (fields: Partial<Card>) => {
            await handleBulkEdit(selectedCardIds, fields);
            setIsBulkEditModalOpen(false);
        }
    );
    
    const handleConfirmDeleteWrapper = createBulkHandler(
        async () => {
            await handleBulkDelete(selectedCardIds);
            setShowDeleteDialog(false);
        }, 
        { clearSelectionAfter: true }
    );

    
    
    // ----------------------------------------------------
    // 4. レンダリング
    // ----------------------------------------------------
    
    return (
        <Box sx={{ flexGrow: 1 }}>
            <ControlBar {...controlBarProps} />

            <CardList
                cards={displayedCards} // フィルタ済みのリストを渡す
                totalCardCount={cards.length}
                context="pack-editor"
                isEditable={isEditable}
                onCardClick={handleCardClick}
                cardDisplay={{
                    quantityChip: false,
                    quantityControl: false,
                    keycardRank: false,
                    grayscaleWhenZero: false,
                }}
                
                gridRenderUnit={gridDisplayProps.gridRenderUnit}
                isSelectionMode={isSelectionMode}
                selectedCardIds={selectedCardIds}
                toggleCardSelection={toggleCardSelection}
                clearSelection={clearSelection}
                
                bulkOperations={bulkOperationsLogic} // 実行ロジック
                isBulkEditModalOpen={isBulkEditModalOpen}
                setIsBulkEditModalOpen={setIsBulkEditModalOpen}
                showDeleteDialog={showDeleteDialog}
                setShowDeleteDialog={setShowDeleteDialog}
                handleBulkEditSave={handleBulkEditSaveWrapper}
                handleConfirmDelete={handleConfirmDeleteWrapper}

                // フィルタ情報
                isFilterActive={searchTerm.trim() !== '' || filters.length > 0}
                searchTerm={searchTerm}
            />
        </Box>
    );
};

export default PackCardList;