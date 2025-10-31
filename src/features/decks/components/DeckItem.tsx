// 必要なインポートは最小限に
import React from 'react';
import type { Deck } from '../../../models/deck';
// ItemGridCard から ItemDisplayBlock に変更
import ItemDisplayBlock from '../../../components/common/ItemDisplayBlock';

interface DeckItemProps {
    item: Deck;
    aspectRatio: number;
    onSelectDeck?: (deckId: string) => void;
}

const DeckItem: React.FC<DeckItemProps> = ({
    item: deck,
    aspectRatio,
    onSelectDeck,
}) => {
    // Deck型をCommonItemData型にマッピング
    const commonItem = {
        id: deck.deckId, // idとしてdeckIdを使用
        name: deck.name,
        number: deck.number,
        imageUrl: deck.imageUrl,
        imageColor: deck.imageColor,
    };

    // onSelectDeckのラッパー関数
    const handleSelect = (itemId: string) => {
        onSelectDeck?.(itemId);
    };

    return (
        <ItemDisplayBlock // ItemGridCard から ItemDisplayBlock に変更
            item={commonItem}
            aspectRatio={aspectRatio}
            onSelect={handleSelect}
        />
    );
};

export default DeckItem;