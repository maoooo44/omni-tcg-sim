/**
 * src/features/card-pool/components/CardPoolDisplay.tsx
 *
 * * CardPool全体のロジック（フィルタ/ソート/ページネーション）が適用された
 * * カード一覧とページネーションのUI部分。
 * * 責務: ReusableItemGridとPaginationをレンダリングする。
 */
import React from 'react';
import { Box, Alert, Pagination } from '@mui/material';
import ReusableItemGrid from '../../../components/common/ReusableItemGrid';

// 外部コンポーネントのインポート
import OwnedCardItem from './OwnedCard';
import type { OwnedCardDisplay } from '../hooks/useCardPoolDisplay';

// Propsの型定義
type CardItemCustomProps = {
    onOpenCardViewModal: (cardId: string) => void;
}

interface CardPoolDisplayProps {
    // 💡 修正: DeckEditorから利用しやすくするため、必須だったPropsをオプショナルに変更
    totalCount?: number;
    totalPages?: number;
    currentPage?: number;
    cardsOnPage?: OwnedCardDisplay[];
    setCurrentPage?: (page: number) => void;

    // useGridDisplayからのPropsもオプショナルに変更
    columns?: number;
    sxOverride?: any;
    aspectRatio?: number;
    gap?: number;

    // CardPool.tsx が持つモーダル開閉ロジック（onOpenCardViewModalを必須として残す）
    onOpenCardViewModal: (cardId: string) => void;
}

// 💡 修正: Propsにデフォルト値を適用
const CardPoolDisplay: React.FC<CardPoolDisplayProps> = ({
    // デフォルト値を設定
    totalCount = 0,
    totalPages = 1,
    currentPage = 1,
    cardsOnPage = [],
    setCurrentPage = () => { }, // ダミー関数

    // グリッド関連のデフォルト値 (元の CardPoolGridSettings から取得すべきだが、ここでは仮の値を設定)
    sxOverride = {},
    aspectRatio = 1 / 1.4, // カードの一般的なアスペクト比
    gap = 2,

    onOpenCardViewModal,
}) => {
    return (
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
                        // itemProps に onOpenCardViewModal を渡す
                        itemProps={{
                            onOpenCardViewModal,
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
    );
};

export default CardPoolDisplay;