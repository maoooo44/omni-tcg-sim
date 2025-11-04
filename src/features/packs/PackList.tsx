/**
 * src/features/packs/PackList.tsx
 *
 * パック管理フィーチャーの核となるコンポーネント。
 * ControlBarを使用して統一されたUIを提供。
 */
import React, { useState } from 'react';
import { Box, Alert, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

import { usePackList } from './hooks/usePackList';
import { useGridDisplay } from '../../hooks/useGridDisplay';
import GridDisplay from '../../components/common/GridDisplay';
import PackItem from './components/PackItem';
import ControlBar from '../../components/common/ControlBar';
import { PAGE_PADDING, PAGE_FLEX_GROW, PAGE_TITLE_VARIANT, PackListGridSettings, PACK_FILTER_FIELDS } from '../../configs/configs';
import BulkEditPackModal from './components/BulkEditPackModal';
import BulkActionConfirmDialog from '../../components/common/BulkActionConfirmDialog';
import type { Pack } from '../../models/models'; // models/modelsからインポート済み

// ----------------------------------------------------
// ⚠️ 以前のControlBarPropsのフラットな構造から、オブジェクト構造に変更
// ----------------------------------------------------

const PackList: React.FC = () => {
    const {
        packs,
        displayedPacks,
        sortField,
        sortOrder,
        searchTerm,
        filters,
        PACK_SORT_OPTIONS,
        selectedPackIds,
        setSortField,
        toggleSortOrder,
        setSearchTerm,
        setFilters,
        handleSelectPack,
        handleNewPack,
        togglePackSelection,
        toggleAllPacksSelection,
        handleBulkDelete,
        handleBulkEdit,
        clearSelection,
    } = usePackList();

    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [showBulkEditModal, setShowBulkEditModal] = useState(false);

    // グリッド表示設定
    const gridDisplayProps = useGridDisplay({
        settings: PackListGridSettings,
        storageKey: 'packList',
        userGlobalDefault: {
            isUserDefaultEnabled: false,
            globalColumns: null,
            advancedResponsive: {
                isEnabled: false,
                columns: {},
            }
        },
    });

    const hasPacks = packs.length > 0;
    const isFilteredButEmpty = packs.length > 0 && displayedPacks.length === 0 && searchTerm;
    const isTotallyEmpty = !hasPacks && !searchTerm; // パックがゼロで、検索もしていない状態

    const handleBulkDeleteClick = async () => {
        setShowDeleteDialog(true);
    };

    // UI状態管理ハンドラ
    const handleBulkEditClick = () => {
        setShowBulkEditModal(true);
    };

    const handleBulkEditSave = async (fields: Partial<Pack>) => {
        await handleBulkEdit(fields);
        setShowBulkEditModal(false);
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

    // ⭐️ 修正点 1: SelectionPropsオブジェクトの構築 ⭐️
    const selectionProps = {
        isSelectionMode: isSelectionMode,
        selectedIds: selectedPackIds,
        totalDisplayedItems: displayedPacks.length,
        onToggleSelectionMode: handleToggleSelectionMode,
        onToggleAllSelection: toggleAllPacksSelection,
        // bulkDeleteとbulkEditは以前の形式を踏襲
        bulkDelete: {
            onDelete: handleBulkDeleteClick,
        },
        bulkEdit: {
            onEdit: handleBulkEditClick,
        },
        // bulkFavoriteはPackListでは未使用のため含めない
        // customSelectionActions, customSelectionComponentsは未使用のため含めない
    };

    // ⭐️ 修正点 2: GridTogglePropsオブジェクトの構築 ⭐️
    const gridToggleProps = {
        columns: gridDisplayProps.columns,
        setColumns: gridDisplayProps.setColumns,
        minColumns: gridDisplayProps.minColumns,
        maxColumns: gridDisplayProps.maxColumns,
    };

    // ⭐️ 修正点 3: SortFilterPropsオブジェクトの構築 ⭐️
    const sortFilterProps = {
        labelPrefix: "パック",
        sortOptions: PACK_SORT_OPTIONS,
        sortField: sortField,
        sortOrder: sortOrder,
        setSortField: setSortField,
        toggleSortOrder: toggleSortOrder,
        searchTerm: searchTerm,
        setSearchTerm: setSearchTerm,
        filters: filters,
        setFilters: setFilters,
        filterFields: PACK_FILTER_FIELDS,
    };


    return (
        <Box sx={{ p: PAGE_PADDING, flexGrow: PAGE_FLEX_GROW }}>
            <Typography variant={PAGE_TITLE_VARIANT} gutterBottom>パック管理</Typography>
            <Box sx={{ flexGrow: 1, p: 2 }}>

                {/* コントロールバー */}
                <Box sx={{ mb: 3 }}>
                    <ControlBar
                        title="パック一覧"
                        itemCount={displayedPacks.length}
                        
                        // ⭐️ 修正点 4: 構造化されたPropsを渡す ⭐️
                        // showSelectionMode が true のときのみ selectionProps を渡す
                        selectionProps={selectionProps}

                        // showGridColumnToggle は削除。gridTogglePropsを渡すことで表示を制御する
                        gridToggleProps={gridToggleProps} 

                        // showSortFilter は削除。sortFilterPropsを渡すことで表示を制御する
                        sortFilterProps={sortFilterProps} 
                        
                        // actionButtons は変更なし
                        actionButtons={[
                            {
                                icon: <AddIcon />,
                                tooltip: '新規パックを作成',
                                onClick: handleNewPack,
                                color: 'primary',
                            },
                        ]}
                    />
                </Box>

                {/* 1. 検索結果がゼロの場合のAlert */}
                {isFilteredButEmpty && (
                    <Alert severity="info" sx={{ mt: 2 }}>
                        "{searchTerm}" に一致するパックが見つかりませんでした。
                    </Alert>
                )}

                {/* 2. パックがゼロ件の場合のAlert */}
                {isTotallyEmpty && (
                    <Alert severity="info" sx={{ mt: 2 }}>
                        パックが登録されていません。新しいパックを作成してください。
                    </Alert>
                )}

                {/* 3. パックリストの描画 */}
                {!isFilteredButEmpty && hasPacks && (
                    <Box sx={{ mt: 2 }}>
                        <GridDisplay
                            items={displayedPacks.map(pack => ({
                                ...pack,
                                isSelected: selectedPackIds.includes(pack.packId),
                            })) as any}
                            ItemComponent={PackItem as any}
                            itemProps={{
                                onSelect: handleSelectPack,
                                isSelectable: isSelectionMode,
                                onToggleSelection: togglePackSelection,
                            }}
                            {...gridDisplayProps.gridRenderUnit}
                        />
                    </Box>
                )}

                {/* 一括編集モーダル */}
                <BulkEditPackModal
                    open={showBulkEditModal}
                    onClose={() => setShowBulkEditModal(false)}
                    selectedPackIds={selectedPackIds}
                    onSave={handleBulkEditSave}
                />

                {/* 削除確認ダイアログ */}
                <BulkActionConfirmDialog
                    open={showDeleteDialog}
                    onClose={() => setShowDeleteDialog(false)}
                    onConfirm={handleConfirmDelete}
                    itemCount={selectedPackIds.length}
                    itemLabel="パック"
                    actionLabel="ゴミ箱に移動"
                />
            </Box>
        </Box>
    );
};

export default PackList;