/**
 * src/features/decks/components/DeckItem.tsx
 */
import React from 'react';
import type { Deck } from '../../../models/models';
// InteractiveContainerProps と CommonItemData をインポート
import InteractiveItemContainer, { type InteractiveContainerProps, type CommonItemData } from '../../../components/common/InteractiveItemContainer';
// ImagePreview から ItemImageOptions をインポート
import { type ItemImageOptions } from '../../../components/common/ImagePreview'; 

// ⭐ 修正: InteractiveContainerProps と ItemImageOptions を両方継承
interface DeckItemProps extends InteractiveContainerProps, ItemImageOptions {
    // InteractiveContainerProps の item を Deck に特化してオーバーライド
    item: Deck & { isSelected?: boolean }; 
    
    // ⭐ 修正: onSelectDeck を削除し、onSelect は InteractiveContainerProps から継承したものをそのまま使用
}

const DeckItem: React.FC<DeckItemProps> = ({
    item: deck,
    // item: deck 以外は全て props にまとめてリレーする
    ...props 
}) => {
    
    // 💡 Deck型を CommonItemData型にマッピングし、全てのプロパティをスプレッドで渡す
    const commonItem: CommonItemData = {
        id: deck.deckId, // idとしてdeckIdを使用
        ...deck,
    };
        
    return (
        <InteractiveItemContainer 
            // ⭐ 修正: props をスプレッド構文で渡すことで、aspectRatio, onSelect, onToggleSelection, enableHoverEffect, imageSxなどを一括リレー
            {...props}
            
            // ⭐ 修正: item と isSelected はスプレッドの後に記述し、上書きする
            item={commonItem}
            isSelected={deck.isSelected} // DeckItemPropsのitemから取得したisSelectedを優先し上書き
        />
    );
};

export default DeckItem;