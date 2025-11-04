/**
 * src/components/common/ControlBar.tsx
 *
 * リスト表示のコントロール部分を統合した汎用コンポーネント。
 * 左から右へ：選択ツールバー、列数トグル、ソート/フィルター、追加ボタン、表示切り替えトグル等を配置。
 *
 * 使用例:
 * - PackList、DeckList、CardPool、ArchiveList等のコントロール部分
 * - 各要素の表示/非表示をpropsで制御可能
 */

import React from 'react';
import { Box, Grid, Typography } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';

// 外部ファイルから必要な型をインポート
import type { 
    ControlBarProps, 
    CustomActionButton 
} from '../../models/models'; 

// 埋め込みコンポーネント
import SelectionModeToolbar from './SelectionModeToolbar';
import GridColumnToggle from '../controls/GridColumnToggle';
import SortFilterButton from '../controls/SortFilterButton';
import EnhancedIconButton from './EnhancedIconButton';
import EnhancedToggleButtonGroup from './EnhancedToggleButtonGroup';
import FavoriteToggleButton from './FavoriteToggleButton';

// ------------------------------------------------
// ⚠️ 以前ここに定義されていた CustomActionButton と ControlBarProps は
//    src/models/props.ts に移動されました。
// ------------------------------------------------

/**
 * ControlBar
 * * リスト表示用の汎用コントロールバー。
 * タイトル、選択ツールバー、列数トグル、ソート/フィルター、追加ボタン、表示切り替えトグルを配置。
 */
const ControlBar: React.FC<ControlBarProps> = ({
    title,
    showTitle = true,
    itemCount,
    itemLabel = '件',

    // ⭐️ 構造化されたPropsを受け取る ⭐️
    selectionProps,
    gridToggleProps,
    sortFilterProps,
    toggleGroupProps,

    actionButtons = [],
}) => {
    
    // --- 選択モードツールバーのアクション構築 ---
    // FavoriteToggleButtonの流用を避けるため、component型を許容
    const selectionItems: Array<CustomActionButton | { component: React.ReactNode }> = [];

    if (selectionProps) {
        const {
            selectedIds,
            bulkDelete,
            bulkEdit,
            bulkFavorite,
            customSelectionActions = [],
            customSelectionComponents = [],
        } = selectionProps;

        // 標準アクションの表示判定
        const shouldShowBulkDelete = bulkDelete?.show ?? (bulkDelete?.onDelete !== undefined);
        const shouldShowBulkEdit = bulkEdit?.show ?? (bulkEdit?.onEdit !== undefined);
        const shouldShowBulkFavorite = bulkFavorite?.show ?? (bulkFavorite?.onToggle !== undefined);

        // カスタムコンポーネント（左端）
        customSelectionComponents.forEach(component => {
            selectionItems.push({ component });
        });

        // ⭐️ 修正点 1: FavoriteToggleButtonを複数ID対応（itemIds）として利用 ⭐️
        if (shouldShowBulkFavorite && bulkFavorite?.onToggle) {
            const bulkItemIds = bulkFavorite.selectedIds || selectedIds || [];
            selectionItems.push({
                component: (
                    <FavoriteToggleButton
                        key="bulk-favorite"
                        itemIds={bulkItemIds} // ⬅️ 複数IDをそのまま渡す
                        // itemIdのダミー設定、および onToggle のコールバック書き換えが不要になった
                        isFavorite={bulkFavorite.isFavorite || false}
                        onToggleBulk={bulkFavorite.onToggle} // ⬅️ onToggleをそのまま渡す (FavoriteToggleButtonが複数IDに対応した前提)
                        disabled={bulkFavorite.disabled || bulkItemIds.length === 0}
                    />
                )
            });
        }

        // カスタムアクション
        selectionItems.push(...customSelectionActions);

        // 一括編集
        if (shouldShowBulkEdit && bulkEdit?.onEdit) {
            selectionItems.push({
                label: bulkEdit.label || '一括編集',
                icon: bulkEdit.icon || <EditIcon />,
                onClick: bulkEdit.onEdit,
                color: 'primary',
                disabled: bulkEdit.disabled || (selectedIds ? selectedIds.length === 0 : true),
            });
        }

        // 一括削除（右端）
        if (shouldShowBulkDelete && bulkDelete?.onDelete) {
            selectionItems.push({
                label: bulkDelete.label || '一括削除',
                icon: bulkDelete.icon || <DeleteIcon />,
                onClick: bulkDelete.onDelete,
                color: 'error',
                disabled: bulkDelete.disabled || (selectedIds ? selectedIds.length === 0 : true),
            });
        }
    } // if (selectionProps) の終わり
    
    // --- レンダリング ---
    return (
        <Box>
            <Grid container spacing={2} alignItems="center" justifyContent="space-between">
                {/* 左側：タイトルとアイテム数 */}
                {showTitle && title && (
                    <Grid size={{ xs: 'auto' }}>
                        <Typography variant="h6">
                            {title} {itemCount !== undefined && `(${itemCount}${itemLabel})`}
                        </Typography>
                    </Grid>
                )}

                {/* 右側：コントロール群 */}
                <Grid size={{ xs: 'auto' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>

                        {/* ⭐️ 修正点 2: SelectionModeToolbar の表示条件を isSelectionMode の値に関わらず selectionProps がある場合に変更 ⭐️ */}
                        {selectionProps && ( 
                            <SelectionModeToolbar
                                isSelectionMode={selectionProps.isSelectionMode}
                                selectedIds={selectionProps.selectedIds}
                                totalDisplayedItems={selectionProps.totalDisplayedItems}
                                onToggleSelectionMode={selectionProps.onToggleSelectionMode}
                                onToggleAllSelection={selectionProps.onToggleAllSelection}
                                items={selectionItems}
                            />
                        )}

                        {/* ⭐️ 修正点 3: 構造化されたPropsを使ってレンダリング ⭐️ */}
                        {gridToggleProps && (
                            <GridColumnToggle
                                currentColumns={gridToggleProps.columns}
                                setColumns={gridToggleProps.setColumns}
                                minColumns={gridToggleProps.minColumns || 2}
                                maxColumns={gridToggleProps.maxColumns || 10}
                                label="列数:"
                            />
                        )}

                        {/* ⭐️ 修正点 4: 構造化されたPropsを使ってレンダリング ⭐️ */}
                        {sortFilterProps && (
                            <SortFilterButton
                                labelPrefix={sortFilterProps.labelPrefix || 'アイテム'}
                                sortOptions={sortFilterProps.sortOptions}
                                sortField={sortFilterProps.sortField}
                                sortOrder={sortFilterProps.sortOrder}
                                searchTerm={sortFilterProps.searchTerm || ''}
                                filters={sortFilterProps.filters || []}
                                setSortField={sortFilterProps.setSortField}
                                toggleSortOrder={sortFilterProps.toggleSortOrder}
                                setSearchTerm={sortFilterProps.setSearchTerm || (() => { })}
                                setFilters={sortFilterProps.setFilters || (() => { })}
                                filterFields={sortFilterProps.filterFields || []}
                            />
                        )}

                        {/* 追加ボタン群（EnhancedIconButton） */}
                        {actionButtons.map((button, index) => (
                            <EnhancedIconButton
                                key={index}
                                icon={button.icon}
                                tooltipText={button.tooltip}
                                onClick={button.onClick}
                                color={button.color || 'primary'}
                            />
                        ))}

                        {/* ⭐️ 修正点 5: 構造化されたPropsを使ってレンダリング ⭐️ */}
                        {toggleGroupProps && (
                            <EnhancedToggleButtonGroup
                                value={toggleGroupProps.toggleValue}
                                onChange={toggleGroupProps.onToggleChange}
                                options={toggleGroupProps.toggleOptions}
                                size={toggleGroupProps.toggleSize || 'small'}
                                color={toggleGroupProps.toggleColor || 'standard'}
                            />
                        )}
                    </Box>
                </Grid>
            </Grid>
        </Box>
    );
};

export default ControlBar;