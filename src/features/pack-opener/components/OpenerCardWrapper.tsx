/**
 * src/features/pack-opener/components/OpenerCardWrapper.tsx
 * 
 * ReusableItemGridで使用するためのOpenerCardラッパー
 */

import React from 'react';
import OpenerCard from './OpenerCard';
import type { OpenerCardData } from '../../../models/packOpener';

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
