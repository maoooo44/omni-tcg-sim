/**
 * src/features/packs/PackList.tsx
 *
 * パック管理フィーチャーの核となるコンポーネント。
 * 責務は、usePackListカスタムフックから取得したパックデータ、ソート/フィルタ状態、および操作ハンドラ（選択、新規作成、削除）を用いて、
 * ReusableItemGridに基づいたパックカード一覧UIを描画すること。
 * 純粋なビュー層として機能し、データ取得やビジネスロジックの詳細はカスタムフックに完全に委譲する。
 */
import React from 'react'; 
import { Box, Alert, Button } from '@mui/material';
import Typography from '@mui/material/Typography';
import AddIcon from '@mui/icons-material/Add';

import { usePackList } from './hooks/usePackList';
import { useGridDisplay } from '../../hooks/useGridDisplay';
import ReusableItemGrid from '../../components/common/ReusableItemGrid';
import PackItem from './components/PackItem';
import SortAndFilterControls from '../../components/controls/SortAndFilterControls';
import GridColumnToggle from '../../components/controls/GridColumnToggle';
import { PackListGridSettings } from '../../configs/gridDefaults';
import { PACK_FILTER_FIELDS } from '../../configs/sortAndFilterDefaults';


const PackList: React.FC = () => {
    const { 
        packs,
        displayedPacks,
        sortField,
        sortOrder,
        searchTerm,
        filters,
        PACK_SORT_OPTIONS,
        setSortField,
        toggleSortOrder,
        setSearchTerm,
        setFilters,
        handleSelectPack,
        handleNewPack,
        handleDeletePack,
    } = usePackList();

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

    return (
        <Box sx={{ flexGrow: 1, p: 2 }}>
            {/* フィルター＆ソート（上側） */}
            <SortAndFilterControls
                labelPrefix="パック"
                sortOptions={PACK_SORT_OPTIONS}
                sortField={sortField}
                sortOrder={sortOrder}
                searchTerm={searchTerm}
                filters={filters}
                setSortField={setSortField}
                toggleSortOrder={toggleSortOrder}
                setSearchTerm={setSearchTerm}
                setFilters={setFilters}
                filterFields={PACK_FILTER_FIELDS}
            />

            {/* 件数表示＆コントロール（下側） */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6">
                    パック一覧 ({displayedPacks.length}件)
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <GridColumnToggle
                        currentColumns={gridDisplayProps.columns}
                        setColumns={gridDisplayProps.setColumns}
                        minColumns={gridDisplayProps.minColumns}
                        maxColumns={gridDisplayProps.maxColumns}
                        label="列数:"
                    />
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={handleNewPack}
                        sx={{ width: '180px' }}
                    >
                        新規パックを作成
                    </Button>
                </Box>
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
                    <ReusableItemGrid
                        items={displayedPacks as any}
                        ItemComponent={PackItem as any}
                        itemProps={{
                            onSelectPack: handleSelectPack,
                            onDeletePack: handleDeletePack,
                        }}
                        {...gridDisplayProps}
                    />
                </Box>
            )}
        </Box>
    );
};

export default PackList;