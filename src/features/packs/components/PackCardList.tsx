/**
 * src/features/packs/components/PackCardList.tsx
 *
 * 特定のパックに収録されているカードの一覧（リストまたはグリッド）を表示するコンポーネントです。
 * `useSortAndFilter` カスタムフックを使用し、カードデータに対するソート、フィルタリング、およびその状態管理を抽象化しています。
 * 編集権限（isEditable）に応じて、カードの編集モーダル（新規追加または既存カード）または閲覧モーダルを開くコールバック関数を提供します。
 * ReusableItemGridを使用して統一されたグリッドレイアウトを実現します。
 */

import React from 'react';
import { Button, Box, Typography, Alert } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

import type { Card as CardType } from '../../../models/card';
import { createDefaultCard } from '../../../utils/dataUtils';

import { useSortAndFilter } from '../../../hooks/useSortAndFilter';
import { useGridDisplay } from '../../../hooks/useGridDisplay';
import { type SortField } from '../../../utils/sortingUtils';
import SortAndFilterControls, { type SortOption } from '../../../components/controls/SortAndFilterControls';
import ReusableItemGrid from '../../../components/common/ReusableItemGrid';
import PackCardItem from './PackCardItem';

import { DEFAULT_PACK_DECK_WIDTH, DEFAULT_PACK_DECK_HEIGHT } from '../../../utils/imageUtils';
import type { GridSettings } from '../../../models/grid';

// パック編集画面のカードリスト用グリッド設定
const PACK_CARD_LIST_GRID_SETTINGS: GridSettings = {
    minColumns: 2,
    maxColumns: 10,
    defaultColumns: {
        xs: 2,
        sm: 3,
        md: 4,
        lg: 5,
        xl: 6,
    },
    aspectRatio: DEFAULT_PACK_DECK_WIDTH / DEFAULT_PACK_DECK_HEIGHT,
    defaultSpacing: 16,
    baseColumns: 5,
};


// =========================================================================
// 1. ソート・フィルタリング用設定
// =========================================================================

/**
 * Cardオブジェクトから指定されたフィールドの値を取得するアクセサ関数
 */
const cardFieldAccessor = (item: CardType, field: SortField): string | number | null | undefined => {
    switch (field) {
        case 'number':
            return item.number;
        case 'name':
            return item.name;
        case 'cardId':
            return item.cardId;
        case 'rarity':
            return item.rarity;
        default:
            return (item as any)[field] ?? null;
    }
};

/**
 * ソートオプションの定義
 */
const CARD_SORT_OPTIONS: SortOption[] = [
    { label: 'No. (デフォルト)', value: 'number' },
    { label: 'カード名', value: 'name' },
    { label: 'レアリティ', value: 'rarity' },
    { label: 'ID', value: 'cardId' },
];


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
        setSortField,
        setSearchTerm,
        toggleSortOrder,
    } = useSortAndFilter<CardType>(cards, cardFieldAccessor, {
        defaultSortField: 'number', // numberによるデフォルトソートを適用
        defaultSortOrder: 'asc'
    });

    // グリッド表示設定
    const gridDisplayProps = useGridDisplay({
        settings: PACK_CARD_LIST_GRID_SETTINGS,
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
    const isSearchActive = searchTerm.trim() !== '';

    return (
        <Box sx={{ flexGrow: 1 }}>
            
            {/* ソート&フィルタリングUIの配置 */}
            <SortAndFilterControls
                labelPrefix="カード"
                sortOptions={CARD_SORT_OPTIONS}
                sortField={sortField}
                sortOrder={sortOrder}
                searchTerm={searchTerm}
                setSortField={setSortField}
                toggleSortOrder={toggleSortOrder}
                setSearchTerm={setSearchTerm}
            />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h5">収録カード ({cardsInPack.length}枚)</Typography>
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

            <Box
                sx={{
                    maxHeight: '70vh',
                    overflowY: 'auto',
                    p: 1,
                    border: '1px solid',
                    borderColor: 'grey.300',
                    borderRadius: 1
                }}
            >
                {/* 検索結果が0件の場合のメッセージ */}
                {isSearchActive && !hasFilteredResults && (
                    <Alert severity="info" sx={{ m: 1 }}>
                        "{searchTerm}" に一致するカードが見つかりませんでした。
                    </Alert>
                )}

                {/* カードが元々1枚もなく、検索もされていない場合のメッセージ */}
                {!hasFilteredResults && !isSearchActive && (
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