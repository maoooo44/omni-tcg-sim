/**
 * src/features/card-pool/CardPool.tsx
 *
 * * カードコレクションの表示と管理を行うメインコンポーネント（ビュー）。
 * * 責務:
 * 1. フィルタリング、並び替え、表示モード切り替えなどのUIコントロールと、全体のレイアウトを提供する。
 * 2. useCardPoolDisplayフックから、表示用に準備されたカードリスト、ソート/フィルタの状態、ページネーション情報を取得する。
 * 3. useGridDisplayフックから、ユーザー設定に基づいたグリッドの列数とスタイルを取得し、ReusableItemGridに適用する。
 * 4. 個々のカードアイテムのクリックイベントを受け取り、CardModalを表示するための状態と非同期データ取得ロジックを管理する（モーダル表示ロジックのカプセル化）。
 * 5. 取得したデータを、切り出したコンポーネント（CardPoolDisplay）に適切に渡す。
 */

import React, { useMemo, useCallback, useState, useEffect } from 'react';
import {
    Box, Typography, Alert,
    // 💡 修正: ToggleButtonGroup, ToggleButton, Tooltip, ViewModuleIcon, ViewListIcon は CardPoolControls に移動
} from '@mui/material';
// 💡 修正: ToggleButton 関連のインポートは CardPoolControls に移動したため削除
// import ViewModuleIcon from '@mui/icons-material/ViewModule';
// import ViewListIcon from '@mui/icons-material/ViewList';

import { useGridDisplay } from '../../hooks/useGridDisplay';
import { CardPoolGridSettings } from '../../configs/defaults';
// 💡 修正: GridColumnToggle, SortAndFilterControls は CardPoolControls に移動したため削除
// import GridColumnToggle from '../../components/controls/GridColumnToggle';
// import SortAndFilterControls from '../../components/controls/SortAndFilterControls';

import CardModal from '../../components/modals/CardModal';
import type { CardModalProps } from '../../components/modals/CardModal';

import { useCardData } from '../../hooks/useCardData';
import type { Card } from '../../models/card';
import type { Pack } from '../../models/pack';

import { useCardPoolDisplay, CARDS_PER_PAGE } from './hooks/useCardPoolDisplay'; // 💡 ViewMode は CardPoolControls に移動したため削除
// 💡 修正: CARD_POOL_SORT_OPTIONS, CARD_POOL_SORT_OPTIONS_WITH_COUNT, CARD_FILTER_FIELDS は CardPoolControls に移動したため削除
// import {
//     CARD_POOL_SORT_OPTIONS,
//     CARD_POOL_SORT_OPTIONS_WITH_COUNT,
//     CARD_FILTER_FIELDS
// } from '../../configs/sortAndFilterDefaults';

import CardPoolDisplay from './components/CardPoolDisplay';
import CardPoolControls from './components/CardPoolControls'; // 💡 新規インポート


// 仮のUser Dataフック (本来はDB/Contextから取得)
const useUserData = () => ({
    // UserDataState.gridSettings.cardPool の仮のデータ構造
    cardPoolGridSettings: {
        isUserDefaultEnabled: false,
        globalColumns: null,
        advancedResponsive: {
            isEnabled: false,
            columns: {}
        }
    }
});


const CardPool: React.FC = () => {
    // useCardDataフックを呼び出し、カード情報取得関数を取得
    const { fetchCardInfo, fetchPackInfoForCard } = useCardData();

    // モーダル制御ロジック
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
    const [selectedCardForModal, setSelectedCardForModal] = useState<Card | null>(null);
    // Pack 情報を保持する State 
    const [packInfo, setPackInfo] = useState<Pack | null>(null);


    // IDがセットされたら、非同期でカードとパック情報を取得 (中略: 変更なし)
    useEffect(() => {
        const loadCardData = async () => {
            if (selectedCardId) {
                // カード情報とパック情報を非同期で同時に取得
                const [card, pack] = await Promise.all([
                    fetchCardInfo(selectedCardId),
                    fetchPackInfoForCard(selectedCardId),
                ]);

                setSelectedCardForModal(card ?? null);
                setPackInfo(pack ?? null);

                // カードとパックの両方があればモーダルを開く
                if (card && pack) {
                    setIsModalOpen(true);
                } else {
                    console.error(`Failed to load data for cardId: ${selectedCardId}. Card: ${!!card}, Pack: ${!!pack}`);
                }
            }
        };
        loadCardData();
    }, [selectedCardId, fetchCardInfo, fetchPackInfoForCard]);


    const handleOpenCardViewModal = useCallback((cardId: string) => {
        setSelectedCardId(cardId);
        // setIsModalOpen(true) は useEffect に任せる
    }, []);

    const handleCloseModal = useCallback(() => {
        setIsModalOpen(false);
        setSelectedCardId(null);
        setSelectedCardForModal(null);
        // packInfo もリセット
        setPackInfo(null);
    }, []);

    // CardModal のダミー保存/削除ハンドラ
    const handleCardSave: CardModalProps['onSave'] = useCallback((cardToSave) => {
        console.warn("Card Save called from CardPool. Operation ignored in view mode.", cardToSave);
    }, []);

    const handleCardRemove: CardModalProps['onRemove'] = useCallback(async (cardId) => {
        console.warn("Card Remove called from CardPool. Operation ignored in view mode.", cardId);
    }, []);


    // 従来のロジックフックから状態とハンドラを取得
    const {
        isLoading,
        error,
        filteredCards,
        searchTerm,
        filters,
        setSearchTerm,
        setFilters,
        currentPage,
        totalPages,
        setCurrentPage,
        sortField,
        setSortField,
        sortOrder,
        toggleSortOrder,
        viewMode,
        setViewMode,
        isDTCGEnabled,
    } = useCardPoolDisplay();

    // DBから永続化されたユーザー設定を取得 (仮)
    const { cardPoolGridSettings } = useUserData();

    // グリッド表示のロジックと設定をフックから取得
    const {
        columns,
        setColumns,
        minColumns,
        maxColumns,
        sxOverride,
        aspectRatio,
        gap,
    } = useGridDisplay({
        settings: CardPoolGridSettings,
        // 💡 ポイント: storageKey を指定することで、このページの列数設定を独立させる
        storageKey: 'card-pool-list-cols',
        userGlobalDefault: cardPoolGridSettings
    });

    const totalCount = useMemo(() => filteredCards.length, [filteredCards]);
    const startIndex = (currentPage - 1) * CARDS_PER_PAGE;
    const endIndex = startIndex + CARDS_PER_PAGE;
    const cardsOnPage = useMemo(() => filteredCards.slice(startIndex, endIndex), [filteredCards, startIndex, endIndex]);

    // 💡 修正: CardPoolControls にロジックを移動したため削除
    // const handleViewModeChange = (
    //     _event: React.MouseEvent<HTMLElement>,
    //     newMode: ViewMode | null,
    // ) => {
    //     if (newMode) {
    //         setViewMode(newMode);
    //         setCurrentPage(1);
    //     }
    // };

    // 💡 修正: CardPoolControls にロジックを移動したため削除
    // const sortOptions = useMemo(() => {
    //     return isDTCGEnabled && viewMode === 'list'
    //         ? CARD_POOL_SORT_OPTIONS_WITH_COUNT
    //         : CARD_POOL_SORT_OPTIONS;
    // }, [isDTCGEnabled, viewMode]);

    // ロード中、エラー表示 (中略: 変更なし)
    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <Typography>カードデータをロード中...</Typography>
            </Box>
        );
    }

    if (error) {
        return (
            <Alert severity="error" sx={{ my: 2 }}>
                カードプールのロードに失敗しました: {error.message}
            </Alert>
        );
    }


    return (
        <Box sx={{ flexGrow: 1, p: 2 }}>
            {/* 💡 新規: 切り出した CardPoolControls コンポーネントを使用 */}
            <CardPoolControls
                // useCardPoolDisplay の状態
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
                setCurrentPage={setCurrentPage}
                isDTCGEnabled={isDTCGEnabled}
                // useGridDisplay の状態（独立性を保つため useGridDisplay の結果を直接渡す）
                columns={columns}
                setColumns={setColumns}
                minColumns={minColumns}
                maxColumns={maxColumns}
            />

            {/* 💡 修正: 以前の ソート＆フィルタコントロール, 件数表示＆コントロール は削除 */}
            {/* <SortAndFilterControls ... /> */}
            {/* <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}> ... </Box> */}


            {/* カード表示エリアを CardPoolDisplay に置き換え (中略: 変更なし) */}
            <CardPoolDisplay
                totalCount={totalCount}
                totalPages={totalPages}
                currentPage={currentPage}
                cardsOnPage={cardsOnPage}
                setCurrentPage={setCurrentPage}
                sxOverride={sxOverride}
                aspectRatio={aspectRatio}
                gap={gap}
                onOpenCardViewModal={handleOpenCardViewModal}
                // 💡 修正: columns プロパティを追加
                columns={columns}
            />

            {/* モーダル表示 (中略: 変更なし) */}
            {/* packInfo が存在する場合にのみ CardModal をレンダリング */}
            {isModalOpen && selectedCardForModal && packInfo && (
                <CardModal
                    open={isModalOpen}
                    onClose={handleCloseModal}
                    card={selectedCardForModal}

                    // packInfo から必要な値を抽出
                    packRaritySettings={packInfo.rarityConfig}
                    currentPackName={packInfo.name}
                    currentPackId={packInfo.packId}

                    onSave={handleCardSave}
                    onRemove={handleCardRemove}

                    // packInfo から cardFieldSettings を取得
                    customFieldSettings={packInfo.cardFieldSettings}
                    onCustomFieldSettingChange={() => { }} // ReadOnlyなのでダミー

                    isReadOnly={true}
                />
            )}
        </Box>
    );
};

export default CardPool;