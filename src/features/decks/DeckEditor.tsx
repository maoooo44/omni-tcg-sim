/**
 * src/features/decks/DeckEditor.tsx
 *
 * デッキの編集を行うメインのUIコンポーネント。
 * 💡 修正: PackEditorPage.tsx のパターンに合わせ、Props定義から不要な 'deck' を削除。
 * 💡 修正: 分割代入から 'deck' を削除し、コンポーネント内の 'deck' の参照を 'currentDeck' に置き換えるためエイリアスを定義。
 * 💡 修正: DeckEditorProps から useDeckEditor の戻り値に含まれる重複/不適合な型定義を削除し、TSエラーを解消。
 * 🚨 追加: PackEditor.tsx のパターンに合わせ、カスタムフィールド設定変更ハンドラ (onCustomFieldSettingChange) のラッパーを定義。
 * ⭐ 修正: DeckCardList/DeckCompactCardList への Props を、ゾーン切り替えトグルに関する最新の変更に合わせて更新。
 *
 * ✅ 修正: CardPoolControls と CardPoolDisplay を CardPoolList に統合
 */
import React, { useCallback, useMemo } from 'react';
import {
    Box, Paper, /*Divider,*/ Grid, Typography
} from '@mui/material';

// 分割コンポーネントのインポート
import DeckEditorToolbar from './components/DeckEditorToolbar';
import DeckInfoForm from './components/DeckInfoForm';
import DeckCardList from './components/DeckCardList';

// 💡 修正点: CardPoolDisplay, CardPoolControls ではなく CardPoolList をインポート
import CardPoolList from '../../features/card-pool/components/CardPoolList'; 

// CardPoolのロジックをインポート
import { useCardPoolDisplay, CARDS_PER_PAGE } from '../../features/card-pool/hooks/useCardPoolDisplay';
import { useGridDisplay } from '../../hooks/useGridDisplay';
import { CardPoolGridSettings } from '../../configs/configs';

// ★ 1. 仮想の useDeckEditor をインポート (フックの実装は別ファイルにあると仮定)
import { useDeckEditor } from './hooks/useDeckEditor';
// ⭐ 追加: useDeckStoreをインポート
import { useDeckStore } from '../../stores/deckStore';

// 💡 カスタムフィールドの型をインポート
import type { FieldSetting } from '../../models/models';
import { PAGE_PADDING, PAGE_FLEX_GROW, PAGE_TITLE_VARIANT } from '../../configs/configs';

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
import type { Deck, DeckArea, Card } from '../../models/models';

// ----------------------------------------------------------------------
// ★ 2. DeckEditorProps の修正: useDeckEditorの戻り値と重複する宣言を削除

// 💡 追加: useDeckEditorが返す生のハンドラのシグネチャを仮定して型を上書き
interface DeckEditorInternalProps {
    // PackEditorのパターンに合わせ、useDeckEditorの生のハンドラシグネチャを定義
    onCustomFieldSettingChange: (
        type: 'num' | 'str',
        index: number,
        field: keyof FieldSetting,
        value: any
    ) => void;
    // ゾーン切り替えハンドラのシグネチャを明示的に定義 (DeckArea型を仮定)
    handleAreaChange: (newArea: DeckArea) => void; // ゾーン切り替え
    handleCardAdd: (cardId: string, deckArea: DeckArea) => void; // カード追加
    handleCardRemove: (cardId: string, deckArea: DeckArea) => void; // カード削除
}

type UseDeckEditorReturn = ReturnType<typeof useDeckEditor> & DeckEditorInternalProps; // 生のハンドラを追加

interface DeckEditorProps extends UseDeckEditorReturn {
    allCards: Card[];
    ownedCards: Map<string, number>;
}

// ----------------------------------------------------------------------


// ★ 3. DeckEditor コンポーネントの Props 修正
const DeckEditor: React.FC<DeckEditorProps> = ({
    // 🚨 修正: deckId を削除し TS6133 を解消
    currentDeck, // ✅ currentDeckを使用する
    allCards,
    ownedCards,
    isNewDeck,
    isDirty,
    onSave,
    onDelete,
    saveMessage,
    handleCardAdd,
    handleCardRemove,
    onCancelEdit,

    // ★ useDeckEditorから受け取る状態・ハンドラ
    isEditorMode,
    toggleEditorMode,
    isDeckBuildingMode,
    handleToggleDeckBuildingMode,
    selectedDeckArea,
    handleAreaChange, // ゾーン切り替えハンドラ

    isDeckInfoFormCollapsed,
    toggleDeckInfoFormCollapse,

    handleInputChange,
    handleSelectChange,
    onDeckCustomFieldChange,
    customFieldSettings,
    onCustomFieldSettingChange, // useDeckEditorからの生のハンドラ
}) => {
    // ⭐ 修正: 以前の 'deck' 参照の互換性のため、currentDeck を deck にエイリアス
    // Page側で null チェックされているため、ここでは Deck 型としてアサート（または仮定）する
    const deck = currentDeck as Deck;

    // ⭐ 【追加】useDeckStoreからアクションとストアのデッキデータを取得
    const updateDeckIsFavorite = useDeckStore(state => state.updateDeckIsFavorite);
    const storeDecks = useDeckStore(state => state.decks);

    // 🟢 修正: 閲覧モード時はストアから最新のデッキデータを取得
    const displayDeck = React.useMemo(() => {
        if (!isEditorMode) {
            // 閲覧モードの場合、ストアから最新のデッキを取得
            const latestDeck = storeDecks.find(d => d.deckId === deck.deckId);
            if (latestDeck) {
                console.log('🔍 DeckEditor - 閲覧モード: ストアから最新デッキを取得', latestDeck.deckId, 'isFavorite:', latestDeck.isFavorite);
                return latestDeck;
            }
        }
        // 編集モードまたはストアに見つからない場合はdeckを使用
        return deck;
    }, [isEditorMode, storeDecks, deck]);

    // ⭐ 【追加】isFavoriteの状態をdisplayDeckから取得
    const isFavorite = displayDeck.isFavorite || false;

    // ⭐ 【追加】handleToggleFavoriteの定義
    const handleToggleFavorite = React.useCallback(async (newState: boolean) => {
        // 新規デッキ (DB未保存) では不可
        if (isNewDeck) return;

        try {
            // ストアアクションを呼び出し、DBを直接更新する
            const updatedDeck = await updateDeckIsFavorite(deck.deckId, newState);

            if (updatedDeck) {
                console.log(`[DeckEditor] Favorite state toggled for Deck ID: ${deck.deckId}`);
            }
        } catch (error) {
            console.error('Failed to toggle deck favorite state:', error);
        }
    }, [isNewDeck, deck.deckId, updateDeckIsFavorite]);

    // 💡 CardPoolControlsに必要なロジックを全て取得 (変更なし)
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

    // 💡 グリッド表示に必要なロジックを全て取得 (変更なし)
    const { cardPoolGridSettings, isDTCGEnabled } = useUserData();
    const gridDisplayProps = useGridDisplay({
        settings: CardPoolGridSettings,
        storageKey: 'deck-editor-card-pool-cols',
        userGlobalDefault: cardPoolGridSettings
    });

    // ページ表示に必要なリストを計算 (変更なし)
    const totalCount = useMemo(() => filteredCards.length, [filteredCards]);
    const startIndex = (currentPage - 1) * CARDS_PER_PAGE;
    const endIndex = startIndex + CARDS_PER_PAGE;
    const cardsOnPage = useMemo(() => filteredCards.slice(startIndex, endIndex), [filteredCards, startIndex, endIndex]);

    // 💡 追加: フィルタが有効かどうかを計算
    const isFilterActive = useMemo(() => (
        searchTerm !== '' || Object.keys(filters).length > 0
    ), [searchTerm, filters]);


    // 🚨 簡素化されたハンドラ

    const handleCardSelectionFromPool = useCallback((cardId: string) => {
        // 💡 isDeckBuildingMode が true の時にのみカード追加を許可
        // CardPoolList の onOpenCardViewModal に渡すため、カード閲覧ではなくカード追加として利用
        if (isDeckBuildingMode) {
            handleCardAdd(cardId, selectedDeckArea);
        }
    }, [handleCardAdd, selectedDeckArea, isDeckBuildingMode]);

    // 💡 追加: DeckCardList からカードがクリックされた時のハンドラ (閲覧モード専用) (変更なし)
    const handleOpenCardViewModal = useCallback((card: Card) => {
        // TODO: ここにカード閲覧モーダルを開くロジックを実装
        console.log("Card View Modalを開きます:", card.name);
    }, []);

    // 🚨 ⭐ 修正: Pack のパターンに合わせ、カスタムフィールド設定変更ハンドラのシグネチャ変換ラッパーを定義
    const handleDeckFieldSettingWrapper = useCallback(
        (
            _itemType: 'Card' | 'Deck' | 'Pack',
            type: 'num' | 'str',
            index: number,
            settingUpdates: Partial<FieldSetting>
        ) => {
            // 💡 修正: settingUpdatesの全てのキーをループして、個別に onCustomFieldSettingChange を呼び出す
            Object.entries(settingUpdates).forEach(([field, value]) => {
                const settingKey = field as keyof FieldSetting;

                // onCustomFieldSettingChange は生のハンドラ (type, index, field, value) を持つと仮定
                onCustomFieldSettingChange(type, index, settingKey, value);
            });
        },
        [onCustomFieldSettingChange]
    );

    // 🟢 新規: キーカード保存ハンドラ
    const handleSaveKeyCards = useCallback((keyCardIds: (string | undefined)[]) => {
        // keyCardIds は [keycard_1, keycard_2, keycard_3] の順序で渡される
        const [keycard_1, keycard_2, keycard_3] = keyCardIds;

        console.log('💾 handleSaveKeyCards called:', { keycard_1, keycard_2, keycard_3 });

        // handleInputChange を使って各キーカードを更新
        // 🚨 修正: undefinedの場合は空文字列にする（handleInputChangeで再度undefinedに変換される）
        const createEvent = (name: string, value: string | undefined) => ({
            target: { name, value: value ?? '' }
        } as React.ChangeEvent<HTMLInputElement>);

        handleInputChange(createEvent('keycard_1', keycard_1));
        handleInputChange(createEvent('keycard_2', keycard_2));
        handleInputChange(createEvent('keycard_3', keycard_3));

        console.log('✅ handleSaveKeyCards completed');
    }, [handleInputChange]);


    return (
        <Box sx={{ p: PAGE_PADDING, flexGrow: PAGE_FLEX_GROW }}>
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between' }}>


                {/* 1. 固定ヘッダ部 (ツールバー) */}
                <Typography variant={PAGE_TITLE_VARIANT} gutterBottom>デッキ編集</Typography>
                <DeckEditorToolbar
                    deck={deck} // ✅ エイリアスを使用
                    isNewDeck={!!isNewDeck}
                    isDirty={isDirty}
                    onSave={onSave}
                    onDelete={onDelete}
                    saveMessage={saveMessage}
                    isEditorMode={isEditorMode}
                    toggleEditorMode={toggleEditorMode}
                    onCancelEdit={onCancelEdit}
                    isDeckBuildingMode={isDeckBuildingMode}
                    handleToggleDeckBuildingMode={handleToggleDeckBuildingMode}
                    handleImportJson={() => { }}
                    handleExportJson={() => { }}
                    jsonIOLoading={false}
                    isFavorite={isFavorite}
                    handleToggleFavorite={handleToggleFavorite}
                />
            </Box>
            <Box sx={{ flexGrow: 1, p: 2 }}>



                {/* 2.1. 上部: DeckInfoForm (PackEditorのPackInfoFormに相当) */}
                {!isDeckBuildingMode && (
                    <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
                        <DeckInfoForm
                            deckData={displayDeck} // ⭐ 統一: itemData -> deckData
                            /* 🚨 修正: updateDeckInfo を新しい汎用ハンドラに置き換え */
                            handleInputChange={handleInputChange}
                            handleSelectChange={handleSelectChange}
                            handleSave={onSave} // ⭐ 統一: PackEditorと同じくhandleSaveを渡す
                            onDeckCustomFieldChange={onDeckCustomFieldChange} // ⭐ 統一: onItemCustomFieldChange -> onDeckCustomFieldChange
                            customFieldSettings={customFieldSettings as unknown as Record<string, FieldSetting>} // ⭐ 統一: 型アサーションを追加
                            onCustomFieldSettingChange={handleDeckFieldSettingWrapper} // 🚨 修正: ラッパー関数を渡す
                            isEditable={isEditorMode} // isEditorMode を isEditable に名称変更
                            // ⭐ 追加: 折り畳み制御用のpropsを渡す (プロパティ名をフックに合わせる)
                            isCollapsed={isDeckInfoFormCollapsed}
                            onToggleCollapse={toggleDeckInfoFormCollapse}
                            // 🟢 新規: キーカード選択モーダル用のデータを渡す
                            onSaveKeyCards={handleSaveKeyCards}
                            allCards={allCards}
                            ownedCards={ownedCards}
                        />
                    </Paper>
                )}

                {/* 2.2. デッキ構築モード切り替えUI/カードリスト/カードプール */}

                {isDeckBuildingMode ? (
                    // 💡 構築モード: 左4に統合DeckCardList、右8にCardPoolList
                    // GridのsizeプロパティはMUI v5ではGrid itemのpropとしては非推奨/廃止され、Grid containerの`spacing`や`rowSpacing`/`columnSpacing`または`xs`/`sm`/`md`などを使用します。
                    <Grid container spacing={2} sx={{ mb: 4, height: 'calc(100vh - 200px)', overflow: 'hidden' }}>
                        {/* 左側: 統合DeckCardList (4/12) - 構築モード用 */}
                        <Grid size={{xs: 12, md: 4.6}} sx={{ height: '100%', overflow: 'hidden' }}>
                            <DeckCardList
                                deck={deck}
                                allCards={allCards}
                                ownedCards={ownedCards}
                                selectedDeckArea={selectedDeckArea}
                                onAreaChange={handleAreaChange}
                                onCardClick={handleOpenCardViewModal}
                                isEditorMode={false} // 構築モードは閲覧のみ（増減コントロールなし）
                            />
                        </Grid>

                        {/* 右側: CardPoolList (8/12) */}
                        <Grid size={{xs: 12, md: 7.4}} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                            <Paper elevation={3} sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                                {/* 💡 修正点: CardPoolControls と CardPoolDisplay を CardPoolList に統合 */}
                                <CardPoolList
                                    // --- Display Props ---
                                    totalCount={totalCount}
                                    totalPages={totalPages}
                                    currentPage={currentPage}
                                    cardsOnPage={cardsOnPage}
                                    setCurrentPage={setCurrentPage}
                                    onOpenCardViewModal={handleCardSelectionFromPool} // カード選択ハンドラとして利用
                                 
                                    
                                    // --- Controls/Common Props ---
                                    isFilterActive={isFilterActive}
                                    searchTerm={searchTerm}
                                    setSearchTerm={setSearchTerm}
                                    filters={filters}
                                    setFilters={setFilters}
                                    
                                    sortField={sortField}
                                    sortOrder={sortOrder}
                                    setSortField={setSortField}
                                    toggleSortOrder={toggleSortOrder}
                                    
                                    viewMode={viewMode}
                                    setViewMode={setViewMode}
                                    isDTCGEnabled={isDTCGEnabled}

                                    {...gridDisplayProps}
                                />
                            </Paper>
                        </Grid>
                    </Grid>

                ) : (
                    // 💡 閲覧/編集モード: 統合DeckCardList
                    <Paper elevation={3} sx={{ p: 4 }}>
                        <DeckCardList
                            deck={deck}
                            allCards={allCards}
                            ownedCards={ownedCards}
                            onCardClick={handleOpenCardViewModal}
                            selectedDeckArea={selectedDeckArea}
                            onAreaChange={handleAreaChange}
                            isEditorMode={isEditorMode}
                            // TODO: 統合CardItemのquantity機能実装時に接続
                            onCardAdd={(cardId) => handleCardAdd(cardId, selectedDeckArea)}
                            onCardRemove={(cardId) => handleCardRemove(cardId, selectedDeckArea)}
                        />
                    </Paper>
                )}
            </Box>
        </Box>
    );
};

export default DeckEditor;