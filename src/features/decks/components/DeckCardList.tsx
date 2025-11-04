/**
 * src/features/decks/components/DeckCardList.tsx (統合CardList使用版)
 *
 * デッキ詳細画面・デッキ構築画面のカードリスト表示コンポーネント。
 * 統合CardListを使用して、デッキエリア切り替え、枚数表示、増減コントロールを提供します。
 * 責務: ControlBarを含めたリスト全体のロジックとUIを管理する。
 */

import React, { useMemo, useCallback } from 'react';
import { Paper, Box, Alert } from '@mui/material';
import type { Card as CardType, Deck, DeckArea, DeckListItem, ToggleOption, } from '../../../models/models';
import CardList from '../../cards/components/CardList';

// 必要なフックとコンポーネントをインポート
import { useSortFilter } from '../../../hooks/useSortFilter';
import { useGridDisplay } from '../../../hooks/useGridDisplay';
import ControlBar from '../../../components/common/ControlBar';
import type { ControlBarProps } from '../../../models/models';

import { 
    CARD_SORT_OPTIONS, 
    CARD_DEFAULT_SORT, 
    PACK_CARD_FILTER_FIELDS 
} from '../../../configs/sortFilterConfigs';
import { DeckEditorCardGridSettings } from '../../../configs/gridConfigs';
import { mapToDeckCardList } from '../deckUtils';


const DECK_AREA_TITLES: Record<DeckArea, string> = {
    mainDeck: 'メインデッキ',
    sideDeck: 'サイドデッキ',
    extraDeck: 'エクストラデッキ',
};

// ToggleButtonのオプション定義
const DECK_AREA_OPTIONS: ToggleOption<DeckArea>[] = [
    { value: 'mainDeck', label: 'メイン' },
    { value: 'sideDeck', label: 'サイド' },
    { value: 'extraDeck', label: 'エクストラ' },
];

export interface DeckCardListProps {
    deck: Deck;
    allCards: CardType[];
    ownedCards: Map<string, number>;
    selectedDeckArea: DeckArea;
    onAreaChange: (newArea: DeckArea) => void;
    onCardClick?: (card: CardType) => void;
    
    /** 編集モード（増減コントロール表示）*/
    isEditorMode?: boolean;
    /** カード追加ハンドラ（編集モード時のみ）*/
    onCardAdd?: (cardId: string) => void;
    /** カード削除ハンドラ（編集モード時のみ）*/
    onCardRemove?: (cardId: string) => void;
    isKeyCardSelectable?: boolean;
    
}

const DeckCardList: React.FC<DeckCardListProps> = ({
    deck,
    allCards,
    ownedCards,
    selectedDeckArea,
    onAreaChange,
    onCardClick,
    isEditorMode = false,
    // onCardAdd/onCardRemove は現在未使用だが、インターフェース互換性のため保持
}) => {
    
    // ----------------------------------------------------
    // 1. データ生成とフックの呼び出し
    // ----------------------------------------------------
    
    const cardsMap = deck[selectedDeckArea];
    const deckCards = mapToDeckCardList(cardsMap);
    const title = DECK_AREA_TITLES[selectedDeckArea];
    const totalCount = deckCards.reduce((sum, deckCard) => sum + deckCard.count, 0);

    // 所持枚数オーバーチェック
    const hasOverOwnedCard = useMemo(() => {
        return deckCards.some(deckCard => {
            const ownedCount = ownedCards.get(deckCard.cardId) || 0;
            return deckCard.count > ownedCount;
        });
    }, [deckCards, ownedCards]);
    
    // DeckListItem形式に変換 (CardListに渡すデータ)
    const items = useMemo((): DeckListItem[] => {
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

    // CardListが期待するCardType[]に変換（DeckListItem is CardType）
    const cardsForCardList = useMemo(() => items as CardType[], [items]);

    // ソート＆フィルタリング (対象データはitems)
    // 💡 修正1: 型アサーションを削除し、変数名を 'sortFilterLogic' に変更
    const sortFilterLogic = useSortFilter<DeckListItem>(
        items, // 変換済みのitemsを渡す
        undefined,
        CARD_DEFAULT_SORT
    );

    // グリッド表示設定
    const gridDisplayProps = useGridDisplay({
        settings: DeckEditorCardGridSettings,
        storageKey: `deckCardGridColumns-${selectedDeckArea}`, // エリアごとに保存キーを変える
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

    // カードクリックハンドラ
    const handleCardClick = useCallback((card: CardType) => {
        if (onCardClick) {
            onCardClick(card);
        }
    }, [onCardClick]);
    
    // エリア切り替えハンドラ (ControlBarのToggleButtonに渡す形にラップ)
    const handleToggleAreaChange = useCallback((
        newArea: DeckArea,
    ) => {
        onAreaChange(newArea);
    }, [onAreaChange]);
    
    // ----------------------------------------------------
    // 3. ControlBar Props 定義
    // ----------------------------------------------------
    
    const areaOptions = useMemo(() => {
        const options = DECK_AREA_OPTIONS.filter(opt => {
            if (opt.value === 'sideDeck') {
                return deck.deckType !== 'MainOnly';
            }
            if (opt.value === 'extraDeck') {
                return deck.deckType === 'MainSideExtra';
            }
            return true;
        });
        return options;
    }, [deck.deckType]);


    const controlBarProps: ControlBarProps = useMemo(() => ({
        // 左側タイトル
        title: title,
        itemCount: totalCount,
        itemLabel: "枚",
        
        // エリア切り替えトグル（既存のToggleButtonGroupを置き換え）
        toggleGroupProps: {
            toggleValue: selectedDeckArea,
            // 💡 修正2: newAreaの型を明示的に指定
            onToggleChange: (_event: React.MouseEvent<HTMLElement>, newValue: string | null) => {
                if (newValue) {
                    handleToggleAreaChange(newValue as DeckArea);
                }
            },
            toggleOptions: areaOptions,
        },
        
        // ソート・フィルター
        sortFilterProps: {
            labelPrefix: "カード",
            sortOptions: CARD_SORT_OPTIONS,
            sortField: sortFilterLogic.sortField, // 変数名を修正
            sortOrder: sortFilterLogic.sortOrder, // 変数名を修正
            setSortField: sortFilterLogic.setSortField, // 変数名を修正
            toggleSortOrder: sortFilterLogic.toggleSortOrder, // 変数名を修正
            searchTerm: sortFilterLogic.searchTerm, // 変数名を修正
            setSearchTerm: sortFilterLogic.setSearchTerm, // 変数名を修正
            filters: sortFilterLogic.filters, // 変数名を修正
            setFilters: sortFilterLogic.setFilters, // 変数名を修正
            filterFields: PACK_CARD_FILTER_FIELDS, // デッキ構築ではパックフィルタを流用
        },
        
        // 列数トグル
        gridToggleProps: {
            columns: gridDisplayProps.columns,
            setColumns: gridDisplayProps.setColumns,
            minColumns: gridDisplayProps.minColumns,
            maxColumns: gridDisplayProps.maxColumns,
        },
        
        // デッキリストは選択/一括操作は不要なため省略
        selectionProps: undefined,
        actionButtons: [], 
        
    }), [
        title, 
        totalCount, 
        selectedDeckArea, 
        handleToggleAreaChange,
        areaOptions,
        sortFilterLogic, // 変数名を修正
        gridDisplayProps
    ]);


    // ----------------------------------------------------
    // 4. レンダリング
    // ----------------------------------------------------
    
    return (
        <Paper elevation={3} sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
            
            {/* ControlBarを導入し、エリア切り替え、タイトル、ソート、グリッドトグルを統合 */}
            <Box sx={{ mb: 2 }}>
                <ControlBar {...controlBarProps} />
            </Box>

            {/* 所持枚数オーバー警告 */}
            {hasOverOwnedCard && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                    ⚠️ 所持枚数を超えるカードが含まれています
                </Alert>
            )}

            {/* 統合CardList */}
            <Box sx={{ flex: 1, minHeight: 0 }}>
                <CardList
                    // フィルタ後のデータを渡す
                    cards={sortFilterLogic.sortedAndFilteredData} // 変数名を修正
                    totalCardCount={cardsForCardList.length} 
                    context="deck-editor" 
                    // isEditable はデフォルト値を使用
                    onCardClick={handleCardClick}
                    cardDisplay={{
                        quantityChip: true,  
                        quantityControl: isEditorMode, // isEditorModeで制御
                        keycardRank: false,
                        grayscaleWhenZero: true, 
                    }}
                    
                    {...gridDisplayProps}
                    
                    // isSelectionMode, selectedCardIds などの一括操作Propsはオプショナルなため省略 
                    
                    isFilterActive={sortFilterLogic.searchTerm.trim() !== '' || sortFilterLogic.filters.length > 0} // 変数名を修正
                    searchTerm={sortFilterLogic.searchTerm} // 変数名を修正
                />
            </Box>
        </Paper>
    );
};

export default DeckCardList;