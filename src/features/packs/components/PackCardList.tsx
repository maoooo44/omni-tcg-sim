/**
 * src/features/packs/components/PackCardList.tsx
 *
 * 特定のパックに収録されているカードの一覧（リストまたはグリッド）を表示するコンポーネントです。
 * * 責務:
 * 1. 親コンポーネントから渡されたカードデータ（CardType[]）に対するソート、フィルタリングを `useSortAndFilter` フックを介して実行し、その状態を管理する。
 * 2. カード一覧の上に、ソートとフィルタリングのUI（SortAndFilterControls）を配置し、フックの状態と連携させる。
 * 3. 編集権限（isEditable）に基づき、「新規カードを追加」ボタンを表示する。
 * 4. カードアイテムのクリック時、`isEditable` に応じて編集モーダルまたは閲覧モーダルを開くコールバック関数（onOpenEditorModal / onOpenViewModal）を実行する。
 * 5. `ReusableItemGrid` と `useGridDisplay` を利用し、カードを統一されたレスポンシブなグリッドレイアウトで表示する。
 */

import React from 'react';
import { Button, Box, Typography, Alert } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

import type { Card as CardType } from '../../../models/card';
import { createDefaultCard } from '../../../utils/dataUtils';

import { useSortAndFilter } from '../../../hooks/useSortAndFilter';
import { useGridDisplay } from '../../../hooks/useGridDisplay';
// import SortAndFilterControls from '../../../components/controls/SortAndFilterControls'; // 削除
import SortAndFilterButton from '../../../components/controls/SortAndFilterButton'; // 💡 統合コンポーネントを追加
import GridColumnToggle from '../../../components/controls/GridColumnToggle'; // 💡 列数トグルを追加
import ReusableItemGrid from '../../../components/common/ReusableItemGrid';
import PackCardItem from './PackCardItem';
import { PackEditorCardGridSettings } from '../../../configs/gridDefaults';
import { CARD_SORT_OPTIONS, PACK_CARD_FILTER_FIELDS, CARD_DEFAULT_SORT } from '../../../configs/sortAndFilterDefaults';


// =========================================================================
// 2. コンポーネント本体
// =========================================================================

export interface PackCardListProps {
    packId: string;
    isEditable: boolean;
    cards: CardType[];
    onOpenEditorModal: (card: CardType | null) => void;
    onOpenViewModal: (card: CardType) => void;
}


const PackCardList: React.FC<PackCardListProps> = ({
    packId,
    isEditable,
    cards, // propsからカードリストを取得
    onOpenEditorModal,
    onOpenViewModal,
}) => {

    // useSortAndFilterフックの適用
    const {
        sortedAndFilteredData: displayedCards, // フィルタリング・ソート後のカードリスト
        sortField,
        sortOrder,
        searchTerm,
        filters,
        setSortField,
        setSearchTerm,
        toggleSortOrder,
        setFilters,
    } = useSortAndFilter<CardType>(cards, undefined, CARD_DEFAULT_SORT);

    // グリッド表示設定
    const gridDisplayProps = useGridDisplay({
        settings: PackEditorCardGridSettings,
        storageKey: 'packCardList',
        userGlobalDefault: {
            isUserDefaultEnabled: false,
            globalColumns: null,
            advancedResponsive: {
                isEnabled: false,
                columns: {},
            }
        },
    });

    // propsで受け取ったリストをそのまま使用 (フック適用前の元のリスト)
    const cardsInPack = cards;

    // 新規カードを追加する処理
    const handleAddNewCard = () => {
        if (!isEditable) return;

        const newCard: CardType = createDefaultCard(packId);
        onOpenEditorModal(newCard);
    };


    // 既存カードを選択した処理
    const handleSelectCard = (card: CardType) => {
        if (isEditable) {
            onOpenEditorModal(card);
        } else {
            onOpenViewModal(card);
        }
    };

    const hasFilteredResults = displayedCards.length > 0;
    // 検索と高度なフィルタリングの両方が適用されているかを確認する
    const isFilterActive = searchTerm.trim() !== '' || filters.length > 0;

    return (
        <Box sx={{ flexGrow: 1 }}>

            {/* ソート&フィルタリングUIの配置 (SortAndFilterControlsは削除) */}
            {/* ... (なし) */}

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h5">収録カード ({cardsInPack.length}枚)</Typography>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    {/* 💡 1. ソートアンドフィルターボタンを配置 */}
                    <SortAndFilterButton
                        labelPrefix="カード"
                        sortOptions={CARD_SORT_OPTIONS}
                        sortField={sortField}
                        sortOrder={sortOrder}
                        searchTerm={searchTerm}
                        filters={filters}
                        setSortField={setSortField}
                        toggleSortOrder={toggleSortOrder}
                        setSearchTerm={setSearchTerm}
                        setFilters={setFilters}
                        filterFields={PACK_CARD_FILTER_FIELDS}
                    />

                    {/* 💡 2. 列数トグルを配置 */}
                    <GridColumnToggle
                        currentColumns={gridDisplayProps.columns}
                        setColumns={gridDisplayProps.setColumns}
                        minColumns={gridDisplayProps.minColumns}
                        maxColumns={gridDisplayProps.maxColumns}
                        label="列数:"
                    />

                    {/* 新規カードを追加ボタン (最右) */}
                    {isEditable && (
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={handleAddNewCard}
                        >
                            新規カードを追加
                        </Button>
                    )}
                </Box>
            </Box>

            <Box
                sx={{
                    maxHeight: '150vh',
                    overflowY: 'auto',
                    p: 1,
                    border: '1px solid',
                    borderColor: 'grey.300',
                    borderRadius: 1
                }}
            >
                {/* 検索結果が0件の場合のメッセージ */}
                {isFilterActive && !hasFilteredResults && (
                    <Alert severity="info" sx={{ m: 1 }}>
                        {searchTerm.trim() !== ''
                            ? `"${searchTerm}" に一致するカードが`
                            : '適用されたフィルタ条件に一致するカードが'
                        }見つかりませんでした。
                    </Alert>
                )}

                {/* カードが元々1枚もなく、フィルタリングもされていない場合のメッセージ */}
                {!hasFilteredResults && !isFilterActive && (
                    <Box sx={{ p: 2, m: 1, border: '1px dashed grey', borderRadius: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                            カードはまだ登録されていません。
                        </Typography>
                    </Box>
                )}

                {/* カードリストの描画 (ソート・フィルタ後のデータを使用) */}
                {hasFilteredResults && (
                    <ReusableItemGrid
                        items={displayedCards as any}
                        ItemComponent={PackCardItem as any}
                        itemProps={{
                            onSelectCard: handleSelectCard,
                        }}
                        {...gridDisplayProps}
                    />
                )}
            </Box>
        </Box>
    );
};

export default PackCardList;