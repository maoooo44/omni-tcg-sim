/**
 * src/features/packs/components/PackCardItem.tsx
 *
 * パック編集画面で個々のカードを表示するコンポーネント
 * ReusableItemGridのItemComponentとして使用
 */
import React from 'react';
import { Card, CardActionArea, CardMedia } from '@mui/material';
import { getDisplayImageUrl, DEFAULT_PACK_DECK_WIDTH, DEFAULT_PACK_DECK_HEIGHT } from '../../../utils/imageUtils';
import type { Card as CardType } from '../../../models/card';

interface PackCardItemProps {
    item: CardType;
    index?: number;
    aspectRatio: number;
    onSelectCard?: (card: CardType) => void;
}

const CARD_PLACEHOLDER_OPTIONS = {
    width: DEFAULT_PACK_DECK_WIDTH,
    height: DEFAULT_PACK_DECK_HEIGHT,
    bgColor: '2c3e50',
};

const PackCardItem: React.FC<PackCardItemProps> = ({ 
    item: card, 
    index: _index,
    aspectRatio: _aspectRatio,
    onSelectCard 
}) => {
    return (
        <Card
            sx={{
                width: '100%',
                height: '100%',
                cursor: 'pointer',
                boxShadow: 1,
            }}
            onClick={() => onSelectCard?.(card)}
        >
            <CardActionArea sx={{ height: '100%' }}>
                <CardMedia
                    component="img"
                    image={getDisplayImageUrl(
                        card.imageUrl,
                        {
                            ...CARD_PLACEHOLDER_OPTIONS,
                            text: card.name
                        }
                    )}
                    alt={card.name}
                    sx={{ 
                        width: '100%',
                        height: '100%',
                        aspectRatio: '63 / 88',
                        objectFit: 'contain',
                    }}
                />
            </CardActionArea>
        </Card>
    );
};

export default PackCardItem;
