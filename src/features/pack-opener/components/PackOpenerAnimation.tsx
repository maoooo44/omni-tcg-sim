/**
 * src/features/pack-opener/components/PackOpenerAnimation.tsx
 *
 * パック開封シミュレーションの結果表示領域全体と、カードの連続フリップアニメーションを制御するコンポーネント。
 * * 責務:
 * 1. 汎用グリッドコンポーネント (ReusableItemGrid) を利用して、開封されたカードリスト (openedCards) を整列表示する。
 * 2. ReusableItemGridがアイテムの配列を処理する際に、OpenerCardにアニメーション遅延 (delay) を与えるためのラッパーコンポーネント (OpenerCardWrapper) を提供する。
 * 3. 開封状態 (isRevealed) に応じて、カードをクリック可能にするか、結果のサマリーメッセージを表示するかを制御する。
 * 4. グリッドの表示スタイル (aspectRatio, gap, sxOverride) を親コンポーネントから受け取り、ReuasbleItemGridに渡す。
 */

import React from 'react';
import { Box, Typography } from '@mui/material';

// OpenerCard (CardFaceを使用する採用版) をインポート
import OpenerCard from './OpenerCard';
import ReusableItemGrid from '../../../components/common/ReusableItemGrid';
import type { OpenerCardData } from '../../../models/packOpener';

interface PackOpenerAnimationProps {
    openedCards: OpenerCardData[]; // 封入されたカードのリスト
    isRevealed: boolean; // フリップ状態 (PackOpenerから受け取る)
    cardBackImageUrl: string; // 裏面画像URL (PackOpenerから受け取る)
    onCardClick: (card: OpenerCardData) => void;
    sxOverride: any;
    aspectRatio: number;
    gap: number;
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
    sxOverride,
    aspectRatio,
    gap,
}) => {

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>

            {/* 2. カード表示グリッド */}
            <ReusableItemGrid
                items={openedCards}
                ItemComponent={OpenerCardWrapper as any}
                itemProps={{
                    isRevealed,
                    cardBackImageUrl,
                    onCardClick,
                }}
                sxOverride={sxOverride}
                aspectRatio={aspectRatio}
                gap={gap}
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