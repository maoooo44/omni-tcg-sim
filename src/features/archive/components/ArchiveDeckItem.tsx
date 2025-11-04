/**
 * src/features/archive/components/ArchiveDeckItem.tsx
 * * * アーカイブデッキの情報を、メインのデッキリストと同じシンプルなUIで表示するコンポーネント。
 * * 責務:
 * 1. ArchiveDeckオブジェクトからデータを抽出し、共通コンポーネント InteractiveItemContainer に渡す。
 * 2. InteractiveItemContainerを利用し、Pack/Deckと同様のシンプルなグリッドアイテムUIを提供する。
 */
import React from 'react';
import type { ArchiveDeck } from '../../../models/models';
import InteractiveItemContainer from '../../../components/common/InteractiveItemContainer';

interface ArchiveDeckItemProps {
    item: ArchiveDeck & { isSelected?: boolean };
    aspectRatio: number;
    // ArchiveList.tsxから渡されるハンドラ
    onSelectArchiveItem?: (itemId: string, itemType: 'packBundle' | 'deck') => void;
    isSelectable?: boolean;
    onToggleSelection?: (archiveId: string) => void;
}

const ArchiveDeckItem: React.FC<ArchiveDeckItemProps> = ({
    item: archiveDeck,
    aspectRatio,
    onSelectArchiveItem,
    isSelectable,
    onToggleSelection,
}) => {

    // ArchiveDeck型からCommonItemDataにマッピング
    const commonItem = {
        id: archiveDeck.meta.archiveId,
        ...archiveDeck
    };

    // InteractiveItemContainerへ渡す選択ハンドラ
    const handleSelect = (itemId: string) => {
        // 選択されたアーカイブIDとアイテムタイプ ('deck') を渡す
        onSelectArchiveItem?.(itemId, 'deck');
    };

    return (
        <InteractiveItemContainer
            item={commonItem}
            aspectRatio={aspectRatio}
            onSelect={handleSelect}
            isSelectable={isSelectable}
            isSelected={archiveDeck.isSelected}
            onToggleSelection={onToggleSelection}
        // 📌 シンプルな表示のため、AdditionalContent は渡さない
        />
    );
};

export default ArchiveDeckItem;