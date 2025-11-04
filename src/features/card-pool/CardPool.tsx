/**
 * src/features/card-pool/CardPool.tsx
 *
 * * カードコレクションの表示と管理を行うメインコンポーネント（ビュー）。
 */

import React, { useMemo, useCallback, useState, useEffect } from 'react';
import {
    Box, Typography, Alert,
} from '@mui/material';

import { useGridDisplay } from '../../hooks/useGridDisplay';
import { PAGE_PADDING, PAGE_FLEX_GROW, PAGE_TITLE_VARIANT, CardPoolGridSettings } from '../../configs/configs';

import CardModal from '../cards/components/CardModal';
import type { CardModalProps } from '../cards/components/CardModal';

import { useCardData } from '../cards/hooks/useCardData';
import type { Card, Pack } from '../../models/models';

import { useCardPoolDisplay, CARDS_PER_PAGE } from './hooks/useCardPoolDisplay'; 

// 💡 修正点: CardPoolControls と CardPoolDisplay を CardPoolList に置き換え
import CardPoolList from './components/CardPoolList'; 


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
    const { fetchCardInfo, fetchPackInfoForCard } = useCardData();

    // モーダル制御ロジック
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
    const [selectedCardForModal, setSelectedCardForModal] = useState<Card | null>(null);
    const [packInfo, setPackInfo] = useState<Pack | null>(null);


    useEffect(() => {
        const loadCardData = async () => {
            if (selectedCardId) {
                const [card, pack] = await Promise.all([
                    fetchCardInfo(selectedCardId),
                    fetchPackInfoForCard(selectedCardId),
                ]);

                setSelectedCardForModal(card ?? null);
                setPackInfo(pack ?? null);

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
    }, []);

    const handleCloseModal = useCallback(() => {
        setIsModalOpen(false);
        setSelectedCardId(null);
        setSelectedCardForModal(null);
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
    const gridDisplayProps = useGridDisplay({
        settings: CardPoolGridSettings,
        storageKey: 'card-pool-list-cols',
        userGlobalDefault: cardPoolGridSettings
    });

    const totalCount = useMemo(() => filteredCards.length, [filteredCards]);
    const startIndex = (currentPage - 1) * CARDS_PER_PAGE;
    const endIndex = startIndex + CARDS_PER_PAGE;
    const cardsOnPage = useMemo(() => filteredCards.slice(startIndex, endIndex), [filteredCards, startIndex, endIndex]);
    
    // 💡 フィルタが有効かどうかを計算
    const isFilterActive = useMemo(() => (
        searchTerm !== '' || Object.keys(filters).length > 0
    ), [searchTerm, filters]);


    // ロード中、エラー表示 (変更なし)
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
        <Box sx={{ p: PAGE_PADDING, flexGrow: PAGE_FLEX_GROW }}>
            <Typography variant={PAGE_TITLE_VARIANT} gutterBottom>カードプール</Typography>
            <Box sx={{ flexGrow: 1, p: 2 }}>
                
                {/* 💡 修正点: CardPoolControls と CardPoolDisplay を CardPoolList 一つに置き換え */}
                <CardPoolList
                    // --- Display Props ---
                    totalCount={totalCount}
                    totalPages={totalPages}
                    currentPage={currentPage}
                    cardsOnPage={cardsOnPage}
                    setCurrentPage={setCurrentPage}
                    onOpenCardViewModal={handleOpenCardViewModal}
                    {...gridDisplayProps}

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
                    
                />

                {/* モーダル表示 (変更なし) */}
                {isModalOpen && selectedCardForModal && packInfo && (
                    <CardModal
                        open={isModalOpen}
                        onClose={handleCloseModal}
                        card={selectedCardForModal}
                        currentPack={packInfo}
                        onSave={handleCardSave}
                        onRemove={handleCardRemove}
                        onCustomFieldSettingChange={() => { }}
                        isReadOnly={true}
                    />
                )}
            </Box>
        </Box>
    );
};

export default CardPool;