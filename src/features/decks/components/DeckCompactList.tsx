/**
 * src/features/decks/components/DeckCompactList.tsx
 *
 * * デッキ編集画面上部に配置される、デッキ内のカードを横長でコンパクトに表示するリスト。
 * * 💡 修正: リストの高さと余白を定数化し、サイズを大きく（高さ: 240px）する。
 * * 🛠️ 修正: 行モードの縦の空白を解消するため、Grid Itemに height: '100%' を適用。
 */
import { useMemo, useCallback, type FC } from 'react';
import {
    Box, Typography, Button
} from '@mui/material';
import RemoveIcon from '@mui/icons-material/Remove';
import ReusableItemGrid from '../../../components/common/ReusableItemGrid';

// Grid制御関連のインポート
import { GridColumnToggle } from '../../../components/controls/GridColumnToggle';
import { useGridDisplay } from '../../../hooks/useGridDisplay';
// ★ [利用] 定義済みのコンパクトリスト設定
import { COMPACT_LIST_ROW_SETTINGS } from '../../../configs/gridDefaults'; 

// DeckCardItemのインポート
import DeckCompactCardItem from './DeckCompactCardItem'; 
import type { Card } from '../../../models/card';
import { mapToDeckCardList } from '../deckUtils';
import type { GridDisplayDefault } from '../../../models/userData';

import type { DeckListItem } from './DeckCardList';

// =========================================================================
// ★ [追加] 定数定義
// =========================================================================
/** コンポーネント全体の高さ (例: 120px -> 240px に拡大) */
const COMPACT_LIST_HEIGHT_PX = 240; 
/** ヘッダー下のマージン (Boxのmb={0.5} から変更) */
const HEADER_MARGIN_BOTTOM_PX = 4; // 0.5*8=4px 程度に維持
/** コンテナの上下パディング (Boxのpy={0.5} から変更) */
const CONTAINER_PADDING_Y_PX = 4; // 0.5*8=4px 程度に維持
// 30px は Typography の高さの目安
const HEADER_HEIGHT_PX_EST = 30;
const CONTAINER_CALC_HEIGHT = COMPACT_LIST_HEIGHT_PX - HEADER_HEIGHT_PX_EST;
// =========================================================================

// 未定義エラー解消のため、型定義を再追加 (DeckEditor.tsxと同期)
interface Deck {
    mainDeck: Map<string, number>;
    sideDeck: Map<string, number>;
    extraDeck: Map<string, number>;
}
type DeckArea = 'mainDeck' | 'sideDeck' | 'extraDeck';

// ReusableItemGrid のカスタム Props (P) を DeckCompactCardItem に合わせる
interface ItemGridCustomProps {
    onCardClick: (card: Card) => void;
    isEditMode?: boolean; 
    onCardAdd?: (cardId: string) => void; 
    onCardRemove?: (cardId: string) => void; 
    allCards?: Card[];
}

// DeckCompactListProps の型定義
interface DeckCompactListProps {
    deck: Deck;
    allCards: Card[];
    ownedCards: Map<string, number>; 
    selectedDeckArea: DeckArea;
    onCardRemove: (cardId: string, deckArea: DeckArea) => void;
    isEditMode: boolean;
    onToggleDeckBuildingMode: () => void;
    onCardAdd: (cardId: string, deckArea: DeckArea) => void; 
}


// ローカルストレージキーはDeckAreaごとにユニークにする
const STORAGE_KEY_BASE = 'deck-compact-rows-';

// ★ [修正] グローバル設定の適用を無効化することで、COMPACT_LIST_ROW_SETTINGS のデフォルト値を強制的に使用する
const DUMMY_GLOBAL_DEFAULTS: GridDisplayDefault = {
    isUserDefaultEnabled: false, // グローバル設定は適用しない
    globalColumns: null,
    advancedResponsive: { isEnabled: false, columns: { xs: 2, sm: 2, md: 2, lg: 2, xl: 2 } }
};


const DeckCompactList: FC<DeckCompactListProps> = ({
    deck,
    allCards,
    ownedCards,
    selectedDeckArea,
    onCardRemove,
    isEditMode,
    onToggleDeckBuildingMode,
    onCardAdd,
}) => {
    // グリッド表示フックの利用 (行モード)
    const storageKey = STORAGE_KEY_BASE + selectedDeckArea;
    const {
        columns, 
        setColumns,
        minColumns,
        maxColumns,
        sxOverride, 
        gap,
    } = useGridDisplay({
        settings: COMPACT_LIST_ROW_SETTINGS, // 定義済みの設定を使用
        storageKey: storageKey,
        userGlobalDefault: DUMMY_GLOBAL_DEFAULTS, // グローバル設定は無効
        isRowMode: true,
    });


    // ★ [修正/追加] useGridDisplay から返された sxOverride に height: '100%' のみを追加
    // ReusableItemGridで padding: 0, margin: 0 が行われている前提
    const itemSxOverride = useMemo(() => ({
        ...sxOverride,
        height: '100%', 
    }), [sxOverride]);


    const deckCardsMap = useMemo(() => {
        return deck[selectedDeckArea] || new Map<string, number>();
    }, [deck, selectedDeckArea]);


    // DeckListItem[] を生成 (DeckCardListのロジックを流用)
    const displayItems = useMemo((): DeckListItem[] => {
        const baseList = mapToDeckCardList(deckCardsMap);

        const cardList: DeckListItem[] = baseList
            .map(item => {
                const card = allCards.find((c: Card) => c.cardId === item.cardId);
                
                if (!card) return null; 

                const ownedCount = ownedCards.get(card.cardId) || 0; 
                const deckCount = item.count;
                const isOverOwned = deckCount > ownedCount;

                return {
                    ...card,
                    cardId: item.cardId,
                    deckCount: deckCount,
                    ownedCount: ownedCount, 
                    isOverOwned: isOverOwned, 
                    deckCardId: item.cardId, 
                } as DeckListItem;
            })
            .filter((item): item is DeckListItem => item !== null && item.name !== undefined)
            .sort((a, b) => a.name.localeCompare(b.name));
            
        return cardList;
    }, [deckCardsMap, allCards, ownedCards]);

    // カード画像クリック時のハンドラ 
    const handleCardImageClick = useCallback((card: Card) => {
        console.log(`Compact Card clicked (View Modal): ${card.name}`);
        // TODO: カード閲覧モーダルを開くロジックを実装
    }, []);
    
    // ItemQuantityControl の onAdd ハンドラ
    const handleItemAdd = useCallback((cardId: string) => {
        if (onCardAdd) {
            onCardAdd(cardId, selectedDeckArea);
        }
    }, [onCardAdd, selectedDeckArea]);

    // ItemQuantityControl の onRemove ハンドラ
    const handleItemRemove = useCallback((cardId: string) => {
        if (onCardRemove) {
            onCardRemove(cardId, selectedDeckArea);
        }
    }, [onCardRemove, selectedDeckArea]);


    const totalCount = displayItems.reduce((a, item) => a + item.deckCount, 0);

    return (
        // ★ [修正] 定数 COMPACT_LIST_HEIGHT_PX を使用
        <Box sx={{ height: COMPACT_LIST_HEIGHT_PX }}>
            {/* ★ [修正] 定数 HEADER_MARGIN_BOTTOM_PX を使用 */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1, mb: HEADER_MARGIN_BOTTOM_PX / 8 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', flexShrink: 1 }}>
                    {selectedDeckArea === 'mainDeck' ? 'メインデッキ' : selectedDeckArea === 'sideDeck' ? 'サイドデッキ' : 'エクストラデッキ'} ({displayItems.length}種, {totalCount}枚)
                </Typography>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
                    <GridColumnToggle
                        currentColumns={columns}
                        setColumns={setColumns}
                        minColumns={minColumns}
                        maxColumns={maxColumns}
                        isRowMode={true} 
                        label="行数:"
                    />

                    <Button
                        variant="outlined"
                        size="small"
                        onClick={onToggleDeckBuildingMode}
                        startIcon={<RemoveIcon />}
                        sx={{ flexShrink: 0 }}
                    >
                        カード追加を終了
                    </Button>
                </Box>
            </Box>
            
            <Box
                sx={{
                    flexGrow: 1,
                    // 横スクロールを可能にする
                    overflowX: 'auto', 
                    overflowY: 'hidden',
                    border: '1px solid #ddd',
                    borderRadius: 1,
                    // ★ [修正] 定数 CONTAINER_PADDING_Y_PX を使用
                    py: CONTAINER_PADDING_Y_PX / 8,
                    // ★ [修正] 定数 CONTAINER_CALC_HEIGHT を使用
                    height: CONTAINER_CALC_HEIGHT, 
                }}
            >
                {displayItems.length > 0 ? (
                    <ReusableItemGrid<DeckListItem, ItemGridCustomProps>
                        items={displayItems}
                        ItemComponent={DeckCompactCardItem as FC<any>} 
                        itemProps={{
                            onCardClick: handleCardImageClick,
                            isEditMode: isEditMode,
                            onCardAdd: handleItemAdd,
                            onCardRemove: handleItemRemove,
                        }}
                        // ★ [修正] height: '100%' を追加した itemSxOverride を適用
                        sxOverride={itemSxOverride} 
                        // Gridコンテナのスタイルで縦積み・横流れを制御
                        sxContainerOverride={{ 
                            display: 'grid',
                            gridTemplateRows: `repeat(${columns}, 1fr)`, 
                            gridAutoColumns: 'min-content', // 列幅はアイテムの内容に合わせる (自動サイズ調整)
                            gridAutoFlow: 'column', // 上から下、左から右へ
                            alignItems: 'center',
                            height: '100%',
                            minHeight: 0,
                        }}
                        aspectRatio={COMPACT_LIST_ROW_SETTINGS.aspectRatio}
                        gap={gap}
                    />
                ) : (
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                        <Typography variant="body2" color="text.secondary">
                            このエリアにカードは含まれていません。
                        </Typography>
                    </Box>
                )}
            </Box>
        </Box>
    );
};

export default DeckCompactList;