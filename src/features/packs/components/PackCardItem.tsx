/**
 * src/features/packs/components/PackCardItem.tsx
 *
 * PackCardList（ReusableItemGrid）内で使用される、個々のカードを視覚的に表示するコンポーネント。
 * * 責務:
 * 1. 渡されたカードデータ（CardType）に基づき、カードの画像（imageUrl）または代替画像（プレースホルダー）を CardMedia で表示する。
 * 2. クリック可能な領域（CardActionArea）を提供し、カードが選択された際に親から渡されたコールバック `onSelectCard` を実行する。
 * 3. カードの縦横比（63:88）を維持するためのスタイルを適用する。
 */
import React from 'react';
import { Card, CardActionArea, CardMedia } from '@mui/material';
// 【修正点】DEFAULT_PACK_DECK_WIDTH, DEFAULT_PACK_DECK_HEIGHT のインポートを削除
import { getDisplayImageUrl } from '../../../utils/imageUtils';
import type { Card as CardType } from '../../../models/card';

interface PackCardItemProps {
    item: CardType;
    index?: number;
    aspectRatio: number;
    onSelectCard?: (card: CardType) => void;
}

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
                            // 【修正点】width, heightの指定を削除
                            // textとimageColorはCardデータから渡す
                            text: card.name,
                            imageColor: card.imageColor,
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