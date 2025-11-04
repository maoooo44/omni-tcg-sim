/**
 * src/features/pack-opener/components/OpenerCardWrapper.tsx
 *
 * 汎用アイテムグリッド (ReusableItemGrid) の子要素として OpenerCard を表示するためのアダプターコンポーネント。
 * * 責務:
 * 1. ReusableItemGridが要求する統一されたインターフェース (item, itemProps, aspectRatio) を受け取る。
 * 2. itemプロパティに含まれるカードデータ、アニメーション遅延 (delay) を抽出し、下層の OpenerCard に必要なPropsをマッピングする。
 * 3. OpenerCardの表示に必要な追加Props (isRevealed, cardBackImageUrl, onClick, useFixedSize) を親から受け取り、OpenerCardに渡す。
 * 4. cardBackImageUrlは、アイテムデータに固有の裏面画像URLがあればそれを優先し、なければ親から渡されたデフォルト画像URLを使用するロジックを提供する。
 */

import React from 'react';
import OpenerCard from './OpenerCard';
import type { OpenerCardData } from '../../../models/models';

// OpenerCardにdelayを含めた型
export type OpenerCardDataWithDelay = OpenerCardData & { delay: number };

interface OpenerCardWrapperProps {
    item: OpenerCardDataWithDelay; // ReusableItemGridから渡される
    aspectRatio: number; // ReusableItemGridから渡される（未使用だがItemComponentPropsの一部）
    isRevealed: boolean;
    cardBackImageUrl: string;
    onClick: (card: OpenerCardData) => void;
    useFixedSize: boolean;
}

const OpenerCardWrapper: React.FC<OpenerCardWrapperProps> = ({
    item,
    isRevealed,
    cardBackImageUrl,
    onClick,
    useFixedSize,
}) => {
    return (
        <OpenerCard
            cardData={item}
            isRevealed={isRevealed}
            cardBackImageUrl={item.cardBackImageUrl || cardBackImageUrl}
            delay={item.delay}
            onClick={onClick}
            useFixedSize={useFixedSize}
        />
    );
};

export default OpenerCardWrapper;