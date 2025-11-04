/**
 * src/features/cards/components/CardList.tsx
 *
 * カード一覧表示の統合コンポーネント。
 * パック編集、デッキ構築、カードプールなど、様々なコンテキストで使用可能。
 */

import React, { useCallback } from 'react';
import { Box, Alert, Typography, } from '@mui/material';

import type { Card, GridRenderUnit  } from '../../../models/models';

import GridDisplay from '../../../components/common/GridDisplay';
import BulkEditCardModal from './BulkEditCardModal';
import BulkActionConfirmDialog from '../../../components/common/BulkActionConfirmDialog';

// ⭐ 修正: CardItemProps をインポートし、ItemImageOptions もインポートする
import CardItem, { type CardItemProps, type CardDisplayOptions } from './CardItem';
import { type ItemImageOptions } from '../../../components/common/ImagePreview'; 

// =========================================================================
// 型定義
// =========================================================================

/**
 * カードリストのコンテキスト
 */
export type CardListContext = 'pack-editor' | 'deck-editor' | 'deck-builder' | 'card-pool' | 'pack-opener';

/**
 * 一括操作の設定 (ハンドラはCardList内に残すのではなく、外側で完結した処理として受け取る)
 */
export interface CardListBulkOperations {
    /** 一括削除ハンドラ */
    onBulkDelete?: (cardIds: string[]) => Promise<void>;
    /** 一括編集ハンドラ */
    onBulkEdit?: (cardIds: string[], fields: Partial<Card>) => Promise<void>;
    /** 一括お気に入りトグルハンドラ */
    onBulkToggleFavorite?: (cardIds: string[], isFavorite: boolean) => Promise<void>;
}

/**
 * CardItemにリレーする表示オプション群
 */
export interface CardListDisplayOptions extends CardDisplayOptions, ItemImageOptions {
    /** InteractiveContainerProps からリレーしたいもの */
    noTextContent?: boolean;
    children?: React.ReactNode;
}


/**
 * CardListのProps
 */
export interface CardListProps {
    /** 描画するカードデータ (ソート・フィルタ済み) */
    cards: Card[]; 
    
    /** 全件数（アラート表示用） */
    totalCardCount: number;

    /** コンテキスト */
    context: CardListContext;
    
    /** 編集可能かどうか */
    isEditable?: boolean;
    
    /** カードクリック時のハンドラ (CardItemの onClick にバインドされる) */
    onCardClick?: (card: Card) => void;
    
    /** カードアイテムの表示オプション */
    // ⭐ 修正: CardListDisplayOptions を使用し、CardItemに必要な表示オプションを全て受け取る
    cardDisplay?: CardListDisplayOptions; 
    
    /** グリッド表示設定 */
    // GridRenderUnit 型として定義を維持 (コンポーネントで受け取る際は組み込み)
    gridRenderUnit: GridRenderUnit;
    
    // ⬇️ 選択モードの状態とハンドラ (オプショナル)
    isSelectionMode?: boolean;
    selectedCardIds?: string[];
    toggleCardSelection?: (cardId: string) => void;
    clearSelection?: () => void;
    
    // ⬇️ 一括操作の設定とモーダル状態の制御 (オプショナル)
    bulkOperations?: CardListBulkOperations;
    isBulkEditModalOpen?: boolean;
    setIsBulkEditModalOpen?: (open: boolean) => void;
    showDeleteDialog?: boolean;
    setShowDeleteDialog?: (open: boolean) => void;
    handleBulkEditSave?: (fields: Partial<Card>) => Promise<void>;
    handleConfirmDelete?: () => Promise<void>;

    /** フィルタリングが有効かどうか */
    isFilterActive: boolean;
    /** フィルタリングが適用されたsearchTerm (アラート表示用) */
    searchTerm: string;

    /** サブタイトル（オプション） */
    subtitle?: string;

    /** 💡 新規: アイテムコンポーネントを上書きするためのプロパティ (OpenerCardWrapperなど) */
    itemComponentOverride?: React.ComponentType<any>;

    /** 💡 新規: itemComponentOverride に渡す追加のProps */
    extraItemProps?: Record<string, any>;
}

// =========================================================================
// メインコンポーネント
// =========================================================================

const CardList: React.FC<CardListProps> = ({
    cards: displayedCards, 
    totalCardCount,
    subtitle,
    context,
    onCardClick,
    cardDisplay = {},
    gridRenderUnit, // 組み込み型として受け取る
    // ⬇️ オプショナルPropsにデフォルト値を適用
    isSelectionMode = false,
    selectedCardIds = [],
    toggleCardSelection = () => {},
    // clearSelection = () => {}, // 今回は未使用
    bulkOperations = {},
    isBulkEditModalOpen = false,
    setIsBulkEditModalOpen = () => {},
    showDeleteDialog = false,
    setShowDeleteDialog = () => {},
    handleBulkEditSave = async () => {},
    handleConfirmDelete = async () => {},
    isFilterActive,
    searchTerm,
    // 💡 新規Props
    itemComponentOverride,
    extraItemProps = {},
}) => {

    const hasFilteredResults = displayedCards.length > 0;

    // カードクリックハンドラ（選択モードの有無で動作を切り替える）
    const handleItemClick = useCallback(
        (card: Card) => {
            if (isSelectionMode) {
                toggleCardSelection(card.cardId);
            } else {
                onCardClick?.(card);
            }
        },
        [isSelectionMode, toggleCardSelection, onCardClick]
    );
    
    // ゼロ件時のメッセージ
    if (totalCardCount === 0 && context !== 'pack-opener') { 
        return (
            <Alert severity="info" sx={{ mt: 2 }}>
                カードが登録されていません。
            </Alert>
        );
    }

    // 💡 ItemComponent を決定
    const ItemComponent = itemComponentOverride || CardItem;

    // 💡 ItemComponent に渡す Props を決定
    // ⭐ 修正: CardItemProps に含まれるすべてのプロパティをリレー
    const defaultItemProps: Partial<CardItemProps> = ItemComponent === CardItem ? {
        // CardListDisplayOptions のプロパティを全て展開（CardDisplayOptions, ItemImageOptions, etc.）
        ...cardDisplay, 
        
        // InteractiveContainerProps のプロパティをリレー
        isSelectable: isSelectionMode,
        onToggleSelection: toggleCardSelection, // InteractiveItemContainer にリレー
        
        // CardItem.tsx の onClick ハンドラに CardListの統合ロジックをバインド
        onClick: (card: Card) => handleItemClick(card),

    } : {};

    // GridDisplayに渡すアイテムデータ
    const itemsWithSelectionState = displayedCards.map(card => ({
        ...card,
        // CardItemに渡すisSelectedフラグをここで付与
        isSelected: selectedCardIds.includes(card.cardId), 
    }));


    return (
        <Box sx={{ flexGrow: 1 }}>
            {/* サブタイトルのみ残す */}
            {subtitle && <Box sx={{mb: 1}}><Typography variant="body2" color="text.secondary">{subtitle}</Typography></Box>}
            
            {/* フィルタリング結果がゼロの場合 */}
            {!hasFilteredResults && isFilterActive && (
                <Alert severity="info" sx={{ mt: 2 }}>
                    "{searchTerm}" に一致するカードが見つかりませんでした。
                </Alert>
            )}

            {/* カードリストの描画 */}
            {hasFilteredResults && (
                <Box sx={{ mt: 2 }}>
                    <GridDisplay
                        items={itemsWithSelectionState}
                        ItemComponent={ItemComponent as any} 
                        itemProps={{
                            ...defaultItemProps, // CardItem のためのProps (全てのリレープロパティを含む)
                            ...extraItemProps,  // OpenerCardWrapper などのための追加Props
                        }}
                        // ⭐ [修正] スプレッド構文で GridRenderUnit の内容をトップレベルのPropsとして渡す
                        {...gridRenderUnit}
                    />
                </Box>
            )}

            {/* モーダル/ダイアログのレンダリング (省略) */}
            {bulkOperations.onBulkEdit && (
                <BulkEditCardModal
                    open={isBulkEditModalOpen}
                    onClose={() => setIsBulkEditModalOpen(false)}
                    selectedCardIds={selectedCardIds}
                    onSave={handleBulkEditSave}
                />
            )}
            {bulkOperations.onBulkDelete && (
                <BulkActionConfirmDialog
                    open={showDeleteDialog}
                    onClose={() => setShowDeleteDialog(false)}
                    onConfirm={handleConfirmDelete}
                    itemCount={selectedCardIds.length}
                    itemLabel="カード"
                    actionLabel="削除"
                />
            )}
        </Box>
    );
};

export default CardList;