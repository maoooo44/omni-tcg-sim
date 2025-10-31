/**
 * src/features/decks/DeckEditor.tsx (最終修正版: Grid構造のモード別切り替え)
 *
 * デッキの編集を行うメインのUIコンポーネント。
 * 💡 修正: 
 * 1. DeckCompactListの呼び出しに、必須となったProps (ownedCards, onCardAdd) を追加。
 */
import React, { useState, useCallback, useMemo } from 'react';
import {
    Box, Grid, Paper, Divider,
} from '@mui/material';

// 分割コンポーネントのインポート
import DeckEditorToolbar from './components/DeckEditorToolbar';
import DeckInform from './components/DeckInform';
import DeckCardList from './components/DeckCardList';

import DeckCompactList from './components/DeckCompactList';

import CardPoolDisplay from '../../features/card-pool/components/CardPoolDisplay';

// 💡 必要なコンポーネントをインポート
import CardPoolControls from '../../features/card-pool/components/CardPoolControls';

// CardPoolのロジックをインポート
import { useCardPoolDisplay, CARDS_PER_PAGE } from '../../features/card-pool/hooks/useCardPoolDisplay';
import { useGridDisplay } from '../../hooks/useGridDisplay';
import { CardPoolGridSettings } from '../../configs/defaults';
//import { CARD_FILTER_FIELDS } from '../../configs/sortAndFilterDefaults'; // フィルター定義も使用

// ユーザーデータフックをインポート（または再定義）
const useUserData = () => ({
    cardPoolGridSettings: {
        isUserDefaultEnabled: false,
        globalColumns: null,
        advancedResponsive: {
            isEnabled: false,
            columns: {}
        }
    },
    // 💡 CardPoolControls のために isDTCGEnabled を追加（仮定）
    isDTCGEnabled: true,
});
import type { Deck } from '../../models/deck';
import type { Card } from '../../models/card';


type DeckArea = 'mainDeck' | 'sideDeck' | 'extraDeck';

interface DeckEditorProps {
    // ... (Propsは変更なし)
    deck: Deck;
    allCards: Card[];
    ownedCards: Map<string, number>;
    isNewDeck: boolean;
    isDirty: boolean; // ダーティーチェック
    saveMessage: string | null;

    onSave: () => Promise<void>;
    onDelete: () => Promise<void>;
    updateDeckInfo: (info: Partial<Deck>) => void;
    handleCardAdd: (cardId: string, deckArea: DeckArea) => void;
    handleCardRemove: (cardId: string, deckArea: DeckArea) => void;
}


const DeckEditor: React.FC<DeckEditorProps> = ({
    deck,
    allCards,
    ownedCards,
    isNewDeck,
    isDirty,
    onSave,
    onDelete,
    updateDeckInfo,
    saveMessage,
    handleCardAdd,
    handleCardRemove,
}) => {
    const [selectedDeckArea, setSelectedDeckArea] = useState<DeckArea>('mainDeck');
    // 💡 isEditMode: デッキ情報 (DeckInform) の編集を制御
    const [isEditMode, setIsEditMode] = useState<boolean>(isNewDeck);

    // 💡 修正: isCardPoolVisible から isDeckBuildingMode へ変更
    // 新規作成時はデッキ構築モードをデフォルトとする
    const [isDeckBuildingMode, setIsDeckBuildingMode] = useState<boolean>(isNewDeck);

    // 💡 CardPoolControlsに必要なロジックを全て取得
    const {
        filteredCards,
        currentPage,
        totalPages,
        setCurrentPage,
        // CardPoolControls に必要な Props
        viewMode,
        setViewMode,
        sortField,
        sortOrder,
        setSortField,
        toggleSortOrder,
        searchTerm,
        setSearchTerm,
        filters,
        setFilters,
    } = useCardPoolDisplay();

    // 💡 グリッド表示に必要なロジックを取得
    const { cardPoolGridSettings, isDTCGEnabled } = useUserData(); // isDTCGEnabledを仮で取得
    const {
        columns,
        setColumns, // 💡 CardPoolControls のために setColumns も取得
        minColumns, // 💡 CardPoolControls のために minColumns も取得
        maxColumns, // 💡 CardPoolControls のために maxColumns も取得
        sxOverride,
        aspectRatio,
        gap,
    } = useGridDisplay({
        settings: CardPoolGridSettings,
        storageKey: 'deck-editor-card-pool-cols',
        userGlobalDefault: cardPoolGridSettings
    });

    // ページ表示に必要なリストを計算
    const totalCount = useMemo(() => filteredCards.length, [filteredCards]);
    const startIndex = (currentPage - 1) * CARDS_PER_PAGE;
    const endIndex = startIndex + CARDS_PER_PAGE;
    const cardsOnPage = useMemo(() => filteredCards.slice(startIndex, endIndex), [filteredCards, startIndex, endIndex]);

    // ... (ハンドラ関数は変更なし) ...
    const handleAreaChange = useCallback((newArea: DeckArea) => {
        setSelectedDeckArea(newArea);
    }, []);

    // 💡 修正: DeckEditorToolbarの「編集」ボタンが押されたとき -> isEditMode のみ切り替え
    const handleToggleEditMode = useCallback(() => {
        // ダーティチェックがtrueのときはボタン自体を disabled にしているため、ここではロジックのみ
        
        // 💡 修正: isEditMode が true (編集モード) の場合、閲覧モードへ移行するため isDeckBuildingMode も false にリセットする
        if (isEditMode) {
            setIsDeckBuildingMode(false); // ビルディングモードも強制終了
        }
        
        setIsEditMode(prev => !prev);
    }, [isEditMode]);

    // 💡 修正: DeckCardListの「デッキを編集」ボタンが押されたとき -> isDeckBuildingMode のみ切り替え
    const handleToggleDeckBuildingMode = useCallback(() => {
        setIsDeckBuildingMode(prev => !prev);
    }, []);

    const handleCardSelectionFromPool = useCallback((cardId: string) => {
        // 💡 isDeckBuildingMode が true の時にのみカード追加を許可
        if (isDeckBuildingMode) {
            handleCardAdd(cardId, selectedDeckArea);
        }
    }, [handleCardAdd, selectedDeckArea, isDeckBuildingMode]);

    // 💡 追加: DeckCardList からカードがクリックされた時のハンドラ (閲覧モード専用)
    const handleOpenCardViewModal = useCallback((card: Card) => {
        // TODO: ここにカード閲覧モーダルを開くロジックを実装
        console.log("Card View Modalを開きます:", card.name);
    }, []);


    return (
        <Box sx={{ flexGrow: 1, height: '100vh', display: 'flex', flexDirection: 'column' }}>

            {/* 1. 固定ヘッダ部 (ツールバー + モード別UI) */}
            <Paper
                elevation={3}
                sx={{
                    position: 'sticky',
                    top: 0,
                    zIndex: 1000,
                    p: 1,
                    backgroundColor: 'background.paper',
                    flexShrink: 0,
                }}
            >
                {/* 1.1. ツールバー（中略） */}
                <DeckEditorToolbar
                    deck={deck}
                    isNewDeck={isNewDeck}
                    isDirty={isDirty}
                    onSave={onSave}
                    onDelete={onDelete}
                    saveMessage={saveMessage}
                    selectedDeckArea={selectedDeckArea}
                    onAreaChange={handleAreaChange}
                    isEditMode={isEditMode}
                    onToggleEditMode={handleToggleEditMode}
                />

                {/* 1.2. モード別のUI配置切り替え */}
                {isDeckBuildingMode ? (
                    // 💡 構築モード時の Grid 構造: コンパクトリスト (12) の下にコントロール (12) を縦に並べる
                    <Grid container spacing={2}>
                        <Grid size={{xs: 12}}> {/* Grid size={{xs: 12}} は Grid item xs={12} に修正 */}
                            {/* 💡 修正: DeckCompactList に ownedCards と onCardAdd を追加 */}
                            <DeckCompactList
                                deck={deck}
                                allCards={allCards}
                                ownedCards={ownedCards} // ★ 修正: ownedCards を追加
                                selectedDeckArea={selectedDeckArea}
                                onCardRemove={handleCardRemove}
                                isEditMode={true}
                                onToggleDeckBuildingMode={handleToggleDeckBuildingMode}
                                // ★ 修正: onCardAdd を追加。DeckCompactListは DeckArea も含めてハンドラを要求する
                                onCardAdd={(cardId, deckArea) => handleCardAdd(cardId, deckArea)}
                            />
                        </Grid>
                        {/* CardPoolControls */}
                        <Grid size={{xs: 12}}> {/* Grid size={{xs: 12}} は Grid item xs={12} に修正 */}
                            <CardPoolControls
                                totalCount={totalCount}
                                viewMode={viewMode}
                                setViewMode={setViewMode}
                                sortField={sortField}
                                sortOrder={sortOrder}
                                setSortField={setSortField}
                                toggleSortOrder={toggleSortOrder}
                                searchTerm={searchTerm}
                                setSearchTerm={setSearchTerm}
                                filters={filters}
                                setFilters={setFilters}
                                columns={columns}
                                setColumns={setColumns}
                                minColumns={minColumns}
                                maxColumns={maxColumns}
                                isDTCGEnabled={isDTCGEnabled}
                                setCurrentPage={setCurrentPage}
                            />
                        </Grid>
                    </Grid>
                ) : (
                    // 💡 閲覧モード時の Grid 構造
                    <Grid container spacing={2}>
                        <Grid size={{xs: 12, md: 4}}> {/* Grid size={{ xs: 12, md: 4 }} は Grid item xs={12} md={4} に修正 */}
                            <DeckInform
                                deck={deck}
                                updateDeckInfo={updateDeckInfo}
                                isEditMode={isEditMode}
                            />
                        </Grid>
                        <Grid size={{xs: 12, md: 8}}> {/* Grid size={{xs: 12, md: 8}} は Grid item xs={12} md={8} に修正 */}
                            <DeckCardList
                                deck={deck}
                                allCards={allCards}
                                ownedCards={ownedCards}
                                onOpenViewModal={handleOpenCardViewModal}
                                deckArea={selectedDeckArea}
                                onToggleDeckBuildingMode={handleToggleDeckBuildingMode}
                                /* 💡 修正: DeckCardList に isEditMode とカード増減ハンドラを渡す */
                                isEditMode={isEditMode}
                                isDirty={isDirty} 
                                // DeckCardList の onCardAdd/onCardRemove は cardId のみを受け取る (DeckAreaは不要)
                                onCardAdd={(cardId) => handleCardAdd(cardId, selectedDeckArea)}
                                onCardRemove={(cardId) => handleCardRemove(cardId, selectedDeckArea)}
                            />
                        </Grid>
                    </Grid>
                )}
            </Paper>

            <Divider />

            {/* 2. メインコンテンツ部 (カードプール) */}
            {/* 💡 isDeckBuildingMode が ON のときのみ、CardPoolDisplay を表示 */}
            {isDeckBuildingMode ? (
                <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 0 }}>
                    <CardPoolDisplay
                        // カードプールのデータとページネーション
                        totalCount={totalCount}
                        totalPages={totalPages}
                        currentPage={currentPage}
                        cardsOnPage={cardsOnPage}
                        setCurrentPage={setCurrentPage}
                        // グリッド設定
                        columns={columns}
                        sxOverride={sxOverride}
                        aspectRatio={aspectRatio}
                        gap={gap}
                        // クリックハンドラ
                        onOpenCardViewModal={handleCardSelectionFromPool}
                    />
                </Box>
            ) : (
                // 💡 閲覧モード時はデッキカードリストの内容に依存
                <Box sx={{ flexGrow: 1, p: 2 }}>
                    {/* デッキ構築モードではない場合、コンテンツはヘッダー内の DeckCardList によって占められている */}
                </Box>
            )}
        </Box>
    );
};

export default DeckEditor;