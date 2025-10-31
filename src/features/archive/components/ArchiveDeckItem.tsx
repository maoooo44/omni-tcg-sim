/**
 * src/features/archive/components/ArchiveDeckItem.tsx
 * * * アーカイブデッキの情報を、メインのデッキリストと同じシンプルなUIで表示するコンポーネント。
 * * 責務:
 * 1. ArchiveDeckオブジェクトからデータを抽出し、共通コンポーネント ItemDisplayBlock に渡す。
 * 2. ItemDisplayBlockを利用し、Pack/Deckと同様のシンプルなグリッドアイテムUIを提供する。
 */
import React from 'react';
import type { ArchiveDeck } from '../../../models/archive';
import ItemDisplayBlock from '../../../components/common/ItemDisplayBlock';

interface ArchiveDeckItemProps {
    item: ArchiveDeck;
    aspectRatio: number;
    // ArchiveList.tsxから渡されるハンドラ
    onSelectArchiveItem?: (itemId: string, itemType: 'packBundle' | 'deck') => void;
}

const ArchiveDeckItem: React.FC<ArchiveDeckItemProps> = ({
    item: archiveDeck,
    aspectRatio,
    onSelectArchiveItem,
}) => {

    // ArchiveDeck型からCommonItemDataにマッピング
    const commonItem = {
        id: archiveDeck.meta.archiveId,
        name: archiveDeck.name,
        // ArchiveDeck型が number を持つと仮定（ArchivePackItemと合わせる）
        number: archiveDeck.number,
        imageUrl: archiveDeck.imageUrl,
    };

    // ItemDisplayBlockへ渡す選択ハンドラ
    const handleSelect = (itemId: string) => {
        // 選択されたアーカイブIDとアイテムタイプ ('deck') を渡す
        onSelectArchiveItem?.(itemId, 'deck');
    };

    return (
        <ItemDisplayBlock
            item={commonItem}
            aspectRatio={aspectRatio}
            onSelect={handleSelect}
        // 📌 シンプルな表示のため、AdditionalContent は渡さない
        />
    );
};

export default ArchiveDeckItem;