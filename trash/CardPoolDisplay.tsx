// src/features/card-pool/components/CardPoolDisplay.tsx
/**
 * ... (中略) ...
 */
import React, { useMemo } from 'react';
import { Box, Alert, Pagination } from '@mui/material';
import CardList from '../../cards/components/CardList';

// 外部コンポーネントのインポート
import type { OwnedCardDisplay } from '../hooks/useCardPoolDisplay';
import type { Card as CardType } from '../../../models/models';

interface CardPoolDisplayProps {
    totalCount?: number;
    totalPages?: number;
    currentPage?: number;
    cardsOnPage?: OwnedCardDisplay[]; 
    setCurrentPage?: (page: number) => void;

    // 💡 修正点: グリッド関連のPropsをフラットに受け取る
    columns?: number;
    sxOverride: Record<string, any>;
    aspectRatio: number;
    gap: number;

    onOpenCardViewModal: (cardId: string) => void;

    isFilterActive: boolean;
    searchTerm: string;
}

const CardPoolDisplay: React.FC<CardPoolDisplayProps> = ({
    totalCount = 0,
    totalPages = 1,
    currentPage = 1,
    cardsOnPage = [],
    setCurrentPage = () => { }, 

    // 💡 修正点: 個々のプロパティとして受け取る
    columns,
    sxOverride,
    aspectRatio,
    gap,
    
    onOpenCardViewModal,
    isFilterActive,
    searchTerm,
}) => {
    const handleCardClick = (card: CardType) => {
        onOpenCardViewModal(card.cardId);
    };

    const cardDisplayOptions = useMemo(() => ({
        quantityChip: true,
        quantityControl: false,
        keycardRank: false,
        grayscaleWhenZero: true, // OwnedCard の機能を統合
    }), []);

    // 💡 CardList に渡す gridProps をここで再構築する
    const cardListGridProps = useMemo(() => ({
        columns,
        sxOverride,
        aspectRatio,
        gap,
    }), [columns, sxOverride, aspectRatio, gap]);


    return (
        <Box sx={{ mt: 3, minHeight: 400 }}>
            {totalCount === 0 && !isFilterActive ? (
                // ... (中略: アラート) ...
                <Alert severity="info">
                    カードがありません。パックを開封してください。
                </Alert>
            ) : totalCount === 0 && isFilterActive ? (
                <Alert severity="info">
                    "{searchTerm}" に一致するカードが見つかりませんでした。
                </Alert>
            ) : (
                <>
                    <CardList
                        cards={cardsOnPage as CardType[]} 
                        totalCardCount={totalCount}
                        context="card-pool"
                        onCardClick={handleCardClick}
                        cardDisplay={cardDisplayOptions}
                        // 💡 修正点: 再構築した gridProps を渡す
                        gridProps={cardListGridProps} 
                        
                        isFilterActive={isFilterActive}
                        searchTerm={searchTerm}
                    />

                    {/* Pagination は CardList の外側で制御 (中略) */}
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
    );
};

export default CardPoolDisplay;