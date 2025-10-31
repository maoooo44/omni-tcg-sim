/**
 * src/features/archive/ArchiveList.tsx
 *
 * * アーカイブ機能の主要な一覧コンポーネント。
 * このコンポーネントは、アイテムタイプ（パックバンドル/デッキ）の切り替えと、
 * 選択されたコレクションタイプ（ゴミ箱/履歴）に応じたアーカイブアイテムのリスト表示を責務とします。
 *
 * * 責務:
 * 1. 親からコレクションタイプ（'trash' or 'history'）を受け取る。
 * 2. アイテムタイプ（'packBundle' or 'deck'）を切り替えるUI（Segmented Controls）と状態を管理する。
 * 3. useArchiveListフックからデータを取得し、ソート・フィルタUIにバインドする。
 * 4. 取得したデータと設定を用いて、ReusableItemGridに基づいたアーカイブアイテム一覧UIを描画する。
 */
import React, { useState, useMemo } from 'react';
import { Box, Typography, Alert, ToggleButton, ToggleButtonGroup } from '@mui/material';
import InventoryIcon from '@mui/icons-material/Inventory';
import GroupWorkIcon from '@mui/icons-material/GroupWork';

// useArchiveListフック
import { useArchiveList } from './hooks/useArchiveList';
import { useGridDisplay } from '../../hooks/useGridDisplay';
import ReusableItemGrid from '../../components/common/ReusableItemGrid';
// import SortAndFilterControls from '../../components/controls/SortAndFilterControls'; // 削除
import SortAndFilterButton from '../../components/controls/SortAndFilterButton'; // 💡 追加
import GridColumnToggle from '../../components/controls/GridColumnToggle';

// 実際のItemComponent、GridSettings、FilterFieldsをインポートする必要があります
import ArchivePackItem from './components/ArchivePackItem';
import ArchiveDeckItem from './components/ArchiveDeckItem';
import { ArchiveListGridSettings } from '../../configs/gridDefaults';
import { ARCHIVE_FILTER_FIELDS } from '../../configs/sortAndFilterDefaults';

// === 修正点 1: ItemTypeの型を 'packBundle' | 'deck' に修正 ===
import type { ArchiveItemType, ArchiveCollectionKey, ArchivePack, ArchiveDeck } from '../../models/archive';
// ArchiveListフックが返すリスト表示用の統合型（ArchivePack | ArchiveDeck）
// useArchiveListフックが返すdisplayedItemsの要素の型と一致させる
type ArchiveDisplayItem = ArchivePack | ArchiveDeck; // 正しい型に戻す

// コンポーネントのProps型定義
interface ArchiveListProps {
    collectionType: ArchiveCollectionKey; // 'trash' (ゴミ箱) または 'history' (履歴)
}

// ItemTypeを 'packBundle' に修正
type ItemType = ArchiveItemType; // 'packBundle' | 'deck'

const ArchiveList: React.FC<ArchiveListProps> = ({ collectionType }) => {
    // 1. アイテムタイプ（パックバンドル/デッキ）の状態管理
    const [currentItemType, setCurrentItemType] = useState<ItemType>('packBundle');

    const handleItemTypeChange = (_: React.MouseEvent<HTMLElement>, newItemType: ItemType | null) => {
        if (newItemType) {
            setCurrentItemType(newItemType);
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
        setSortField,
        toggleSortOrder,
        setSearchTerm,
        setFilters,
        handleSelectItem,
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
    const itemTypeLabel = currentItemType === 'packBundle' ? 'アーカイブパック' : 'アーカイブデッキ';

    const hasItems = archiveItems.length > 0;
    const isFilteredButEmpty = hasItems && filteredItems.length === 0 && searchTerm;
    const isTotallyEmpty = !hasItems && !searchTerm;

    // ロード中の表示を追加 (useArchiveListのisLoadingを使用)
    if (isLoading) {
        return (
            <Box sx={{ flexGrow: 1, p: 2 }}>
                <Typography variant="h6" color="text.secondary">
                    アーカイブデータをロード中...
                </Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ flexGrow: 1, p: 2 }}>
            {/* 💡 変更 1: アイテムタイプ切り替えボタンをコントロールバーに移動するため削除 */}
            {/* <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 3 }}>
                ... トグルボタン ...
            </Box> */}

            {/* 💡 変更 2: SortAndFilterControls を削除 */}
            {/* <SortAndFilterControls
                ...
            /> */}

            {/* 💡 変更 3: 件数表示＆グリッドコントロール＆トグルボタンを統合し、順序を変更 */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, mt: 0 }}>
                {/* 左側: タイトル/件数表示 */}
                <Typography variant="h6">
                    {itemTypeLabel}一覧 ({filteredItems.length}件)
                </Typography>

                {/* 右側: コントロールボタン群 (右から順に配置) */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>

                    {/* 1. パック/デッキトグル (最右) */}
                    <ToggleButtonGroup
                        value={currentItemType}
                        exclusive
                        onChange={handleItemTypeChange}
                        color="primary"
                        size="small" // 他のコントロールに合わせてサイズを小さく
                    >
                        <ToggleButton value="packBundle" aria-label="アーカイブパック">
                            <InventoryIcon sx={{ mr: 0.5 }} fontSize="small" /> パック
                        </ToggleButton>
                        <ToggleButton value="deck" aria-label="アーカイブデッキ">
                            <GroupWorkIcon sx={{ mr: 0.5 }} fontSize="small" /> デッキ
                        </ToggleButton>
                    </ToggleButtonGroup>

                    {/* 2. 列数トグル (中央) */}
                    <GridColumnToggle
                        currentColumns={gridDisplayProps.columns}
                        setColumns={gridDisplayProps.setColumns}
                        minColumns={gridDisplayProps.minColumns}
                        maxColumns={gridDisplayProps.maxColumns}
                        label="列数:"
                    />

                    {/* 3. ソートアンドフィルターボタン (最左) */}
                    <SortAndFilterButton
                        labelPrefix={itemTypeLabel}
                        sortOptions={SORT_OPTIONS}
                        sortField={sortField}
                        sortOrder={sortOrder}
                        searchTerm={searchTerm}
                        filters={filters}
                        setSortField={setSortField}
                        toggleSortOrder={toggleSortOrder}
                        setSearchTerm={setSearchTerm}
                        setFilters={setFilters}
                        filterFields={ARCHIVE_FILTER_FIELDS}
                    />
                </Box>
            </Box>

            {/* 4. ステータス表示（Alert） */}
            {isTotallyEmpty && (
                <Alert severity="info">
                    {collectionType === 'trash' ? 'ゴミ箱' : '履歴'} には {labelPrefix} が登録されていません。
                </Alert>
            )}

            {isFilteredButEmpty && (
                <Alert severity="info">
                    検索/フィルタ条件に一致する {labelPrefix} は見つかりませんでした。
                </Alert>
            )}

            {/* 5. アーカイブアイテムリストの描画 */}
            {!isTotallyEmpty && !isFilteredButEmpty && (
                <Box sx={{ mt: 2 }}>
                    {currentItemType === 'packBundle' ? (
                        <ReusableItemGrid
                            items={filteredItems as ArchivePack[]} // ArchivePack型であることを明示
                            ItemComponent={ArchivePackItem}
                            itemProps={{
                                onSelectArchiveItem: handleSelectItem,
                            }}
                            {...gridDisplayProps}
                        />
                    ) : (
                        <ReusableItemGrid
                            items={filteredItems as ArchiveDeck[]} // ArchiveDeck型であることを明示
                            ItemComponent={ArchiveDeckItem}
                            itemProps={{
                                onSelectArchiveItem: handleSelectItem,
                            }}
                            {...gridDisplayProps}
                        />
                    )}
                </Box>
            )}
        </Box>
    );
};

export default ArchiveList;