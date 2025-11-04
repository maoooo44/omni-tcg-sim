/**
 * src/features/archive/ArchiveList.tsx
 *
 * * アーカイブ機能の主要な一覧コンポーネント。
 * このコンポーネントは、アイテムタイプ（パックバンドル/デッキ）の切り替えと、
 * 選択されたコレクションタイプ（ゴミ箱/履歴）に応じたアーカイブアイテムのリスト表示を責務とします。
 *
 * * 責務:
 * 1. コレクションタイプ（'trash' / 'history'）を切り替えるTabsコンポーネントを配置する。
 * 2. アイテムタイプ（'packBundle' or 'deck'）を切り替えるUI（Segmented Controls）と状態を管理する。
 * 3. useArchiveListフックからデータを取得し、ソート・フィルタUIにバインドする。
 * 4. 取得したデータと設定を用いて、GridDisplayに基づいたアーカイブアイテム一覧UIを描画する。
 */
import React, { useState, useMemo } from 'react';
import { Box, Typography, Alert, Tabs, Tab } from '@mui/material';
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard';
import StyleIcon from '@mui/icons-material/Style';

// useArchiveListフック
import { useArchiveList } from './hooks/useArchiveList';
import { useGridDisplay } from '../../hooks/useGridDisplay';
import GridDisplay from '../../components/common/GridDisplay';
import ControlBar from '../../components/common/ControlBar';

// 実際のItemComponent、GridSettings、FilterFieldsをインポートする必要があります
import ArchivePackItem from './components/ArchivePackItem';
import ArchiveDeckItem from './components/ArchiveDeckItem';
import { ArchiveListGridSettings, ARCHIVE_FILTER_FIELDS, PAGE_PADDING, PAGE_FLEX_GROW, PAGE_TITLE_VARIANT } from '../../configs/configs';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import BulkActionConfirmDialog from '../../components/common/BulkActionConfirmDialog';


// === 修正点 1: ItemTypeの型を 'packBundle' | 'deck' に修正 ===
import type { ArchiveItemType, ArchiveCollectionKey, ArchivePack, ArchiveDeck } from '../../models/models';
// ArchiveListフックが返すリスト表示用の統合型（ArchivePack | ArchiveDeck）
// useArchiveListフックが返すdisplayedItemsの要素の型と一致させる
type ArchiveDisplayItem = ArchivePack | ArchiveDeck; // 正しい型に戻す

// ItemTypeを 'packBundle' に修正
type ItemType = ArchiveItemType; // 'packBundle' | 'deck'

const ArchiveList: React.FC = () => {
    // 1. コレクションタイプ（ゴミ箱/履歴）の状態管理
    const [collectionType, setCollectionType] = useState<ArchiveCollectionKey>('trash');
    
    // 2. アイテムタイプ（パックバンドル/デッキ）の状態管理
    const [currentItemType, setCurrentItemType] = useState<ItemType>('packBundle');
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    const handleCollectionChange = (_: React.SyntheticEvent, newValue: ArchiveCollectionKey) => {
        setCollectionType(newValue);
    };

    const handleItemTypeChange = (_: React.MouseEvent<HTMLElement>, newItemType: string | null) => {
        if (newItemType && (newItemType === 'packBundle' || newItemType === 'deck')) {
            setCurrentItemType(newItemType as ItemType);
        }
    };

    // 2. データ取得と操作ハンドラ
    // useArchiveListに渡すcurrentItemTypeは 'packBundle' | 'deck' の型
    const {
        archiveItems,
        displayedItems,
        sortField,
        sortOrder,
        searchTerm,
        filters,
        selectedArchiveIds,
        setSortField,
        toggleSortOrder,
        setSearchTerm,
        setFilters,
        handleSelectItem,
        toggleArchiveSelection,
        toggleAllArchivesSelection,
        handleBulkDelete,
        handleBulkToggleFavorite,
        clearSelection,
        isLoading,
        SORT_OPTIONS,
    } = useArchiveList({ collectionType, currentItemType });

    // 3. グリッド表示設定（変更なし）
    const gridDisplayProps = useGridDisplay({
        settings: ArchiveListGridSettings,
        storageKey: 'archiveList',
        userGlobalDefault: {
            isUserDefaultEnabled: false,
            globalColumns: null,
            advancedResponsive: { isEnabled: false, columns: {} }
        },
    });

    // 4. 表示用のデータとコンポーネントをcurrentItemTypeに基づいて選択
    const filteredItems = useMemo(() => {
        return displayedItems as ArchiveDisplayItem[];
    }, [displayedItems]);

    const labelPrefix = currentItemType === 'packBundle' ? 'パック' : 'デッキ';
    const itemTypeLabel = currentItemType === 'packBundle' ? 'パックアーカイブ' : 'デッキアーカイブ';

    const hasItems = archiveItems.length > 0;
    const isFilteredButEmpty = hasItems && filteredItems.length === 0 && searchTerm;
    const isTotallyEmpty = !hasItems && !searchTerm;

    // 選択されたアイテムのお気に入り状態を判定
    const selectedItems = useMemo(() => {
        return filteredItems.filter(item =>
            selectedArchiveIds.includes(
                currentItemType === 'packBundle'
                    ? (item as ArchivePack).meta.archiveId
                    : (item as ArchiveDeck).meta.archiveId
            )
        );
    }, [filteredItems, selectedArchiveIds, currentItemType]);

    const hasNonFavoriteSelected = selectedItems.length > 0 ? selectedItems.some(item => !item.meta.isFavorite) : true;

    const handleBulkDeleteClick = async () => {
        setShowDeleteDialog(true);
    };

    const handleConfirmDelete = async () => {
        await handleBulkDelete();
        setShowDeleteDialog(false);
    };

    const handleToggleSelectionMode = () => {
        if (isSelectionMode) {
            clearSelection();
        }
        setIsSelectionMode(!isSelectionMode);
    };

    // ロード中の表示を追加 (useArchiveListのisLoadingを使用)
    if (isLoading) {
        return (
            <Box sx={{ p: PAGE_PADDING, flexGrow: PAGE_FLEX_GROW }}>
                <Typography variant="h6" color="text.secondary">
                    アーカイブデータをロード中...
                </Typography>
            </Box>
        );
    }
    
    // ⭐️ 修正点 1: ControlBarに渡す構造化Propsの定義 ⭐️

    // 1. トグルProps
    const toggleGroupProps = {
        toggleValue: currentItemType,
        onToggleChange: handleItemTypeChange,
        toggleOptions: [
            { value: 'packBundle', icon: <CardGiftcardIcon />, tooltip: 'パックアーカイブ' }, // ⬅️ labelを追加
            { value: 'deck',  icon: <StyleIcon />, tooltip: 'デッキアーカイブ' }, // ⬅️ labelを追加
        ],
        toggleSize: "small" as const,
        toggleColor: "primary" as const,
    };

    // 2. 選択モードProps
    const selectionProps = {
        isSelectionMode: isSelectionMode,
        selectedIds: selectedArchiveIds,
        totalDisplayedItems: filteredItems.length,
        onToggleSelectionMode: handleToggleSelectionMode,
        onToggleAllSelection: toggleAllArchivesSelection,
        bulkDelete: {
            onDelete: handleBulkDeleteClick,
            // ラベルやアイコンはそのまま使用
            label: collectionType === 'trash' ? "ゴミ箱から完全に削除" : "履歴から完全に削除",
            icon: <DeleteForeverIcon />,
        },
        bulkFavorite: {
            selectedIds: selectedArchiveIds,
            isFavorite: !hasNonFavoriteSelected,
            onToggle: handleBulkToggleFavorite,
        },
        // bulkEditはアーカイブにはないので除外
    };

    // 3. グリッドトグルProps
    const gridToggleProps = {
        columns: gridDisplayProps.columns,
        setColumns: gridDisplayProps.setColumns,
        minColumns: gridDisplayProps.minColumns,
        maxColumns: gridDisplayProps.maxColumns,
    };

    // 4. ソート・フィルタProps
    const sortFilterProps = {
        labelPrefix: itemTypeLabel,
        sortOptions: SORT_OPTIONS,
        sortField: sortField,
        sortOrder: sortOrder,
        setSortField: setSortField,
        toggleSortOrder: toggleSortOrder,
        searchTerm: searchTerm,
        setSearchTerm: setSearchTerm,
        filters: filters,
        setFilters: setFilters,
        filterFields: ARCHIVE_FILTER_FIELDS,
    };


    return (
        <Box sx={{ p: PAGE_PADDING, flexGrow: PAGE_FLEX_GROW }}>
            {/* ページタイトルとコレクションタイプのタブ切り替え */}
            <Typography variant={PAGE_TITLE_VARIANT} gutterBottom>アーカイブ管理</Typography>
            
            <Tabs value={collectionType} onChange={handleCollectionChange} indicatorColor="primary" textColor="primary">
                <Tab label="ゴミ箱" value="trash" />
                <Tab label="履歴" value="history" />
            </Tabs>
            
            {/* 水平線で区切り */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }} />

            <Box sx={{ flexGrow: 1, p: 2 }}>
            {/* ControlBarでコントロール群を統合（アイテムタイプ切り替えトグル含む） */}
            <ControlBar
                title={`${itemTypeLabel}一覧`}
                itemCount={filteredItems.length}
                
                // ⭐️ 修正点 2: 構造化されたPropsを渡す ⭐️
                // showToggle, toggleValue, onToggleChange, toggleOptions, toggleSize, toggleColor を置き換え
                toggleGroupProps={toggleGroupProps}

                // showSelectionMode, isSelectionMode, selectedIds, totalDisplayedItems, onToggleSelectionMode, onToggleAllSelection, bulkDelete, bulkFavorite を置き換え
                selectionProps={selectionProps}

                // showGridColumnToggle, columns, setColumns, minColumns, maxColumns を置き換え
                gridToggleProps={gridToggleProps}

                // showSortFilter, sortFilterLabelPrefix, sortOptions, sortField, sortOrder, setSortField, toggleSortOrder, searchTerm, setSearchTerm, filters, setFilters, filterFields を置き換え
                sortFilterProps={sortFilterProps}
            />

            {/* 4. ステータス表示（Alert） */}
            {isTotallyEmpty && (
                <Alert severity="info" sx={{ mt: 2 }}>
                    {collectionType === 'trash' ? 'ゴミ箱' : '履歴'} には {labelPrefix} が登録されていません。
                </Alert>
            )}

            {isFilteredButEmpty && (
                <Alert severity="info" sx={{ mt: 2 }}>
                    検索/フィルタ条件に一致する {labelPrefix} は見つかりませんでした。
                </Alert>
            )}

            {/* 5. アーカイブアイテムリストの描画 */}
            {!isTotallyEmpty && !isFilteredButEmpty && (
                <Box sx={{ mt: 2 }}>
                    {currentItemType === 'packBundle' ? (
                        <GridDisplay
                            items={filteredItems.map(item => ({
                                ...(item as ArchivePack),
                                isSelected: selectedArchiveIds.includes((item as ArchivePack).meta.archiveId),
                            })) as ArchivePack[]}
                            ItemComponent={ArchivePackItem}
                            itemProps={{
                                onSelectArchiveItem: handleSelectItem,
                                isSelectable: isSelectionMode,
                                onToggleSelection: toggleArchiveSelection,
                            }}
                            {...gridDisplayProps}
                        />
                    ) : (
                        <GridDisplay
                            items={filteredItems.map(item => ({
                                ...(item as ArchiveDeck),
                                isSelected: selectedArchiveIds.includes((item as ArchiveDeck).meta.archiveId),
                            })) as ArchiveDeck[]}
                            ItemComponent={ArchiveDeckItem}
                            itemProps={{
                                onSelectArchiveItem: handleSelectItem,
                                isSelectable: isSelectionMode,
                                onToggleSelection: toggleArchiveSelection,
                            }}
                            {...gridDisplayProps}
                        />
                    )}
                </Box>
            )}

            {/* 削除確認ダイアログ */}
                <BulkActionConfirmDialog
                    open={showDeleteDialog}
                    onClose={() => setShowDeleteDialog(false)}
                    onConfirm={handleConfirmDelete}
                    itemCount={selectedArchiveIds.length}
                    itemLabel="アーカイブ"
                    actionLabel="完全に削除"
                />
            </Box>
        </Box>
    );
};

export default ArchiveList;