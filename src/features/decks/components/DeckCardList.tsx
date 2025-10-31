/**
 * src/features/decks/components/DeckCardList.tsx
 *
 * デッキ内のカードリスト表示（閲覧/編集モード対応）。
 * 💡 修正: 編集モードの判定を isEditMode に変更し、増減コントロールの表示を制御する。
 * 💡 修正: ビルディングモードボタンの表示を isEditMode に依存させ、テキストを変更。(要件2, 3)
 */
import React, { useMemo, useCallback } from 'react';
import {
    Box, Typography, Paper, Alert, Button
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add'; // 💡 追加: ビルディングモードのアイコン用
import ReusableItemGrid from '../../../components/common/ReusableItemGrid';
import { useGridDisplay } from '../../../hooks/useGridDisplay';
import { useSortAndFilter } from '../../../hooks/useSortAndFilter';
import SortAndFilterButton from '../../../components/controls/SortAndFilterButton';
import GridColumnToggle from '../../../components/controls/GridColumnToggle';
import { CARD_SORT_OPTIONS, CARD_FILTER_FIELDS, CARD_DEFAULT_SORT } from '../../../configs/sortAndFilterDefaults';
import { DeckEditorCardGridSettings } from '../../../configs/gridDefaults';
import DeckCardItem from './DeckCardItem';
import type { Deck } from '../../../models/deck';
import type { Card } from '../../../models/card';
import { mapToDeckCardList } from '../deckUtils';

type DeckArea = 'mainDeck' | 'sideDeck' | 'extraDeck';

export type DeckListItem = Card & {
    deckCount: number; 
    ownedCount: number; 
    isOverOwned: boolean; 
    deckCardId: string; 
}

interface DeckCardListProps {
    deck: Deck;
    deckArea: DeckArea;
    allCards: Card[];
    ownedCards: Map<string, number>;
    onOpenViewModal: (card: Card) => void;
    onToggleDeckBuildingMode: () => void;
    
    // 💡 修正: isDeckBuildingMode を削除し、isEditMode を追加
    isEditMode: boolean; 
    // 💡 追加: DeckEditor.tsx から isDirty を受け取る
    isDirty: boolean; 
    onCardAdd: (cardId: string) => void; 
    onCardRemove: (cardId: string) => void; 
}

// DeckCardItem に渡すカスタム Props の型定義 (修正)
type DeckItemCustomProps = {
    onCardClick: (card: Card) => void; 
    // 💡 修正: DeckCardItem 側の Props 名に合わせて isEditMode に変更
    isEditMode: boolean;
    onCardAdd: (cardId: string) => void;
    onCardRemove: (cardId: string) => void;
}

const DECK_AREA_TITLES: Record<DeckArea, string> = {
    mainDeck: 'メインデッキ',
    sideDeck: 'サイドデッキ',
    extraDeck: 'エクストラデッキ',
};


const DeckCardList: React.FC<DeckCardListProps> = ({
    deck,
    deckArea,
    allCards,
    ownedCards,
    onOpenViewModal,
    onToggleDeckBuildingMode,
    // 💡 修正: isEditMode, isDirty を受け取る
    isEditMode,
    onCardAdd,
    onCardRemove,
}) => {
    // ... (中略：ロジックは変更なし) ...
    const cardsMap = deck[deckArea];
    const deckCards = mapToDeckCardList(cardsMap);
    const title = DECK_AREA_TITLES[deckArea];
    const totalCount = deckCards.reduce((sum, deckCard) => sum + deckCard.count, 0);
    const hasOverOwnedCard = useMemo(() => {
        return deckCards.some(deckCard => {
            const ownedCount = ownedCards.get(deckCard.cardId) || 0;
            return deckCard.count > ownedCount;
        });
    }, [deckCards, ownedCards]);
    const items = useMemo(() => {
        const summarizedList: DeckListItem[] = [];
        deckCards.forEach((deckCard) => {
            const card = allCards.find(c => c.cardId === deckCard.cardId);
            if (!card) return;
            const ownedCount = ownedCards.get(card.cardId) || 0;
            const deckCount = deckCard.count;
            const isOverOwned = deckCount > ownedCount;
            summarizedList.push({
                ...card,
                deckCount: deckCount,
                ownedCount: ownedCount,
                isOverOwned: isOverOwned,
                deckCardId: card.cardId,
            });
        });
        return summarizedList;
    }, [deckCards, allCards, ownedCards]);
    const {
        sortedAndFilteredData: displayedItems,
        sortField,
        sortOrder,
        searchTerm,
        filters,
        setSortField,
        setSearchTerm,
        toggleSortOrder,
        setFilters,
    } = useSortAndFilter<DeckListItem>(items, undefined, CARD_DEFAULT_SORT);
    const gridDisplayProps = useGridDisplay({
        settings: DeckEditorCardGridSettings, 
        storageKey: `deckCardList-${deckArea}`,
        userGlobalDefault: {
            isUserDefaultEnabled: false,
            globalColumns: null,
            advancedResponsive: { isEnabled: false, columns: {} }
        },
    });

    const handleCardClick = useCallback((card: Card) => {
        onOpenViewModal(card);
    }, [onOpenViewModal]);
    const isFilterActive = searchTerm.trim() !== '' || filters.length > 0;
    const hasFilteredResults = displayedItems.length > 0;
    // ... (中略：ロジックは変更なし) ...

    // 💡 isDeckBuildingMode の状態は DeckEditor.tsx で管理されているため、
    // ここで isEditMode をボタンの表示/非表示の切り替えに使用する。
    // DeckEditorのモード管理ロジックから、isEditMode = true の時にこのボタンが表示されることを期待している。
    // isEditMode = true: 編集モード (DeckInform 編集 + カードリスト表示 + カード追加ボタン表示)

    return (
        <Paper elevation={3} sx={{ p: 2, height: '100%' }}>
            <Box sx={{
                mb: 2,
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center'
            }}>
                <Typography variant="h6" gutterBottom>{title} ({totalCount}枚)</Typography>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
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
                        filterFields={CARD_FILTER_FIELDS} 
                    />

                    <GridColumnToggle
                        currentColumns={gridDisplayProps.columns}
                        setColumns={gridDisplayProps.setColumns}
                        minColumns={gridDisplayProps.minColumns}
                        maxColumns={gridDisplayProps.maxColumns}
                        label="" 
                    />

                    {/* 💡 修正: 閲覧モード時にはカードリスト編集ボタンを表示しない (isEditMode が true の時のみ表示) */}
                    {isEditMode && (
                        <Button
                            variant="outlined"
                            size="small"
                            // 💡 要件3: 「編集」という言葉を避け、「カードを追加する」で良い
                            startIcon={<AddIcon />}
                            // onToggleDeckBuildingMode を実行することで、DeckEditor のレイアウトがカードプール表示に切り替わる
                            onClick={onToggleDeckBuildingMode} 
                        >
                            カードを追加する
                        </Button>
                    )}
                </Box>
            </Box>

            {/* 💡 追加: 所持枚数超過の警告アラート */}
            {hasOverOwnedCard && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                    所持枚数を超えてデッキに入っているカードがあります。
                </Alert>
            )}

            {totalCount === 0 ? (
                <Alert severity="info" sx={{ mt: 2 }}>
                    このデッキゾーンにカードは含まれていません。
                </Alert>
            ) : (
                <Box sx={{ maxHeight: '80vh', overflowY: 'auto', p: 1 }}>
                    
                    {isFilterActive && !hasFilteredResults && (
                        <Alert severity="info" sx={{ m: 1 }}>
                            {searchTerm.trim() !== ''
                                ? `"${searchTerm}" に一致するカードが`
                                : '適用されたフィルタ条件に一致するカードが'
                            }見つかりませんでした。
                        </Alert>
                    )}

                    {hasFilteredResults && (
                        <ReusableItemGrid<DeckListItem, DeckItemCustomProps>
                            items={displayedItems} 
                            ItemComponent={DeckCardItem}
                            itemProps={{
                                onCardClick: handleCardClick,
                                // 💡 修正: isEditMode を渡す
                                isEditMode: isEditMode, 
                                onCardAdd: onCardAdd,
                                onCardRemove: onCardRemove,
                            }}
                            {...gridDisplayProps}
                        />
                    )}
                </Box>
            )}
        </Paper>
    );
};

export default DeckCardList;