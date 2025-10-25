/**
 * src/features/pack-opener/components/PackOpenerAnimation.tsx
 *
 * パック開封シミュレーションの結果を表示し、カードのフリップアニメーションを制御するコンポーネントです。
 * 開封結果のカードリストを受け取り、各カードにアニメーション遅延を適用して OpenerCard を描画します。
 * 【修正】ReusableItemGridを使用してカードプールと同じUI/UXを提供します。
 */

import React from 'react';
import { Box, Typography } from '@mui/material';

// OpenerCard (CardFaceを使用する採用版) をインポート
import OpenerCard from './OpenerCard'; 
import ReusableItemGrid from '../../../components/common/ReusableItemGrid';
import { useGridDisplay } from '../../../hooks/useGridDisplay';
import type { OpenerCardData } from '../../../models/packOpener';
import type { GridSettings } from '../../../models/grid';

interface PackOpenerAnimationProps {
    openedCards: OpenerCardData[]; // 封入されたカードのリスト
    isRevealed: boolean; // フリップ状態 (PackOpenerから受け取る)
    cardBackImageUrl: string; // 裏面画像URL (PackOpenerから受け取る)
    onCardClick: (card: OpenerCardData) => void;
    gridSettings: GridSettings; // グリッド設定を追加
}

const FLIP_DELAY_MS = 100; // カード1枚あたりのフリップ開始遅延

// OpenerCard用のラッパーコンポーネント（コンポーネント外で定義してメモ化）
interface OpenerCardWrapperProps {
    item: OpenerCardData;
    index?: number;
    aspectRatio: number;
    isRevealed: boolean;
    cardBackImageUrl: string;
    onCardClick: (card: OpenerCardData) => void;
}

const OpenerCardWrapper: React.FC<OpenerCardWrapperProps> = React.memo(({ item, index = 0, aspectRatio: _aspectRatio, isRevealed, cardBackImageUrl, onCardClick }) => {
    console.log('OpenerCardWrapper - index:', index, 'delay:', index * FLIP_DELAY_MS, 'item.id:', item.id);
    return (
        <OpenerCard
            cardData={item}
            isRevealed={isRevealed}
            cardBackImageUrl={item.cardBackImageUrl || cardBackImageUrl}
            delay={index * FLIP_DELAY_MS}
            onClick={onCardClick}
            useFixedSize={false} // 親コンテナサイズに合わせる
        />
    );
});

const PackOpenerAnimation: React.FC<PackOpenerAnimationProps> = ({
    openedCards,
    isRevealed,
    cardBackImageUrl,
    onCardClick,
    gridSettings,
}) => {
    
    // useGridDisplayフックでグリッド設定を取得
    const gridDisplayProps = useGridDisplay({
        settings: gridSettings,
        storageKey: 'packOpener', // パック開封画面用のストレージキー
        userGlobalDefault: {
            isUserDefaultEnabled: false,
            globalColumns: null,
            advancedResponsive: {
                isEnabled: false,
                columns: {},
            }
        },
    });
    
    return (
        <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', width: '100%' }}>
            
            {/* 2. カード表示グリッド */}
            <ReusableItemGrid
                items={openedCards}
                ItemComponent={OpenerCardWrapper as any}
                itemProps={{
                    isRevealed,
                    cardBackImageUrl,
                    onCardClick,
                }}
                {...gridDisplayProps}
            />
            
            {/* 3. 結果のサマリー (開封後に表示) */}
            {isRevealed && (
                <Box sx={{ mt: 4, textAlign: 'center' }}>
                    <Typography variant="h6" color="success.main">
                        開封結果が表示されました！
                    </Typography>
                </Box>
            )}
        </Box>
    );
};

export default PackOpenerAnimation;
