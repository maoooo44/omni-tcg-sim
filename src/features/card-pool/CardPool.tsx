/**
 * src/features/card-pool/CardPool.tsx
 *
 * カードコレクションの表示と管理を行うメインコンポーネント（ビュー）。
 * フィルタリング、並び替え、ページネーションのUIと、全体のレイアウトを管理します。
 * 個々のカード表示ロジックは OwnedCardItem コンポーネントに委譲されます。
 */

import React, { useMemo, useCallback, useState, useEffect } from 'react'; // ★ useEffect を追加
import { 
    Box, Typography, Alert, 
    ToggleButtonGroup, ToggleButton, Tooltip, Pagination
} from '@mui/material';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import ViewListIcon from '@mui/icons-material/ViewList';

// 💡 共通ロジックと設定をインポート 
import { useGridDisplay } from '../../hooks/useGridDisplay'; 
import { CardPoolGridSettings } from '../../configs/defaults'; 
import GridColumnToggle from '../../components/controls/GridColumnToggle'; 
import ReusableItemGrid from '../../components/common/ReusableItemGrid'; 
import SortAndFilterControls from '../../components/controls/SortAndFilterControls';

// ★ CardModal とその Props のインポートを追加
import CardModal from '../../components/modals/CardModal'; 
import type { CardModalProps } from '../../components/modals/CardModal';

// ★ useCardData と Card, Pack のインポートを修正
import { useCardData } from '../../hooks/useCardData';
import type { Card } from '../../models/card';
import type { Pack } from '../../models/pack'; // ★ Pack 型をインポート

// 💡 既存のインポート
// ★ OwnedCardDisplay の型をインポート
import { useCardPoolDisplay, CARDS_PER_PAGE, type ViewMode, type OwnedCardDisplay } from './hooks/useCardPoolDisplay'; 
import OwnedCardItem from './components/OwnedCard'; 
import { 
    CARD_POOL_SORT_OPTIONS, 
    CARD_POOL_SORT_OPTIONS_WITH_COUNT,
    CARD_FILTER_FIELDS 
} from '../../configs/sortAndFilterDefaults'; 


// 💡 仮のUser Dataフック (本来はDB/Contextから取得)
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

// ★ CardModal の表示に必要な Props の型を定義
type CardItemCustomProps = {
    onOpenCardViewModal: (cardId: string) => void;
}


const CardPool: React.FC = () => {
    // useCardDataフックを呼び出し、カード情報取得関数を取得
    // ★ fetchCardFieldSettings を fetchPackInfoForCard に変更
    const { fetchCardInfo, fetchPackInfoForCard } = useCardData();

    // ★ モーダル制御ロジック
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
    const [selectedCardForModal, setSelectedCardForModal] = useState<Card | null>(null);
    // ★ Pack 情報を保持する State を追加
    const [packInfo, setPackInfo] = useState<Pack | null>(null);

    
    // IDがセットされたら、非同期でカードとパック情報を取得
    useEffect(() => {
        const loadCardData = async () => {
            if (selectedCardId) {
                // カード情報とパック情報を非同期で同時に取得
                const [card, pack] = await Promise.all([
                    fetchCardInfo(selectedCardId),
                    fetchPackInfoForCard(selectedCardId), // ★ パック情報全体を取得
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
    }, [selectedCardId, fetchCardInfo, fetchPackInfoForCard]); // ★ 依存配列を修正


    const handleOpenCardViewModal = useCallback((cardId: string) => {
        setSelectedCardId(cardId);
        // setIsModalOpen(true) は useEffect に任せる
    }, []);
    
    const handleCloseModal = useCallback(() => {
        setIsModalOpen(false);
        setSelectedCardId(null);
        setSelectedCardForModal(null);
        // ★ packInfo もリセット
        setPackInfo(null);
    }, []);
    
    // ★ CardModal のダミー保存/削除ハンドラ
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

    // 1. 💡 修正: グリッド表示のロジックと設定をフックから取得
    const { 
        columns, 
        setColumns, 
        minColumns, 
        maxColumns,
        sxOverride, 
        aspectRatio,
        gap, // 💡 変更: spacingではなくgap（px単位、小数点対応）
    } = useGridDisplay({ 
        settings: CardPoolGridSettings, 
        storageKey: 'card-pool-list-cols', 
        userGlobalDefault: cardPoolGridSettings 
    }); 

    const totalCount = useMemo(() => filteredCards.length, [filteredCards]);
    const startIndex = (currentPage - 1) * CARDS_PER_PAGE;
    const endIndex = startIndex + CARDS_PER_PAGE;
    const cardsOnPage = useMemo(() => filteredCards.slice(startIndex, endIndex), [filteredCards, startIndex, endIndex]);

    const handleViewModeChange = (
        _event: React.MouseEvent<HTMLElement>,
        newMode: ViewMode | null,
    ) => {
        if (newMode) {
            setViewMode(newMode);
            setCurrentPage(1); 
        }
    };

    // ソートオプションを動的に選択（DTCGモードのリスト表示では枚数ソートを含む）
    const sortOptions = useMemo(() => {
        return isDTCGEnabled && viewMode === 'list' 
            ? CARD_POOL_SORT_OPTIONS_WITH_COUNT 
            : CARD_POOL_SORT_OPTIONS;
    }, [isDTCGEnabled, viewMode]);

    // ロード中、エラー表示
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
            {/* ソート＆フィルタコントロール */}
            <SortAndFilterControls
                labelPrefix="カード"
                sortOptions={sortOptions}
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

            {/* 件数表示＆コントロール */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6">
                    カード一覧 ({totalCount}件)
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <GridColumnToggle 
                        currentColumns={columns} 
                        setColumns={setColumns} 
                        minColumns={minColumns} 
                        maxColumns={maxColumns} 
                        label="列数:"
                    />
                    <ToggleButtonGroup
                        value={viewMode}
                        exclusive
                        onChange={handleViewModeChange}
                        size="medium"
                        aria-label="view mode"
                        sx={{ height: '36.5px', width: '180px' }}
                    >
                        <Tooltip title="所有カードリスト">
                            <ToggleButton value="list" aria-label="list" sx={{ height: '36.5px', flex: 1 }}>
                                <ViewListIcon sx={{ mr: 0.5 }} /> 所持
                            </ToggleButton>
                        </Tooltip>
                        <Tooltip title="図鑑表示 (全カード)">
                            <ToggleButton value="collection" aria-label="collection" sx={{ height: '36.5px', flex: 1 }}>
                                <ViewModuleIcon sx={{ mr: 0.5 }} /> 図鑑
                            </ToggleButton>
                        </Tooltip>
                    </ToggleButtonGroup>
                </Box>
            </Box>

            {/* カード表示エリア */}
            <Box sx={{ mt: 3, minHeight: 400 }}>
                {totalCount === 0 ? (
                    <Alert severity="info">
                        表示できるカードがありません。フィルターを変更するか、パックを開封してください。
                    </Alert>
                ) : (
                    <>
                        <ReusableItemGrid<OwnedCardDisplay, CardItemCustomProps>
                            items={cardsOnPage}
                            ItemComponent={OwnedCardItem}
                            // ★ itemProps に onOpenCardViewModal を渡す
                            itemProps={{
                                onOpenCardViewModal: handleOpenCardViewModal,
                            }}
                            sxOverride={sxOverride}
                            aspectRatio={aspectRatio}
                            gap={gap}
                        />
                        
                        {/* Pagination */}
                        {totalPages > 1 && (
                            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                                <Pagination 
                                    count={totalPages}
                                    page={currentPage}
                                    onChange={(_e, page) => setCurrentPage(page)}
                                    color="primary"
                                    showFirstButton 
                                    showLastButton 
                                />
                            </Box>
                        )}
                    </>
                )}
            </Box>
            
            {/* モーダル表示 */}
            {/* ★ packInfo が存在する場合にのみ CardModal をレンダリング */}
            {isModalOpen && selectedCardForModal && packInfo && (
                <CardModal 
                    open={isModalOpen}
                    onClose={handleCloseModal}
                    card={selectedCardForModal}
                    
                    // 💡 packInfo から必要な値を抽出
                    packRaritySettings={packInfo.rarityConfig}
                    currentPackName={packInfo.name}
                    currentPackId={packInfo.packId}
                    
                    onSave={handleCardSave} 
                    onRemove={handleCardRemove} 
                    
                    // 💡 packInfo から cardFieldSettings を取得
                    customFieldSettings={packInfo.cardFieldSettings} 
                    onCustomFieldSettingChange={() => {}} // ReadOnlyなのでダミー
                    
                    isReadOnly={true} 
                />
            )}
        </Box>
    );
};

export default CardPool;