/**
 * src/features/archive/components/ArchivePackItem.tsx
 * * * アーカイブパックの情報を、メインのパックリストと同じシンプルなUIで表示するコンポーネント。
 * * 責務:
 * 1. ArchivePackオブジェクトからデータを抽出し、共通コンポーネント ItemDisplayBlock に渡す。
 * 2. ItemDisplayBlockを利用し、Pack/Deckと同様のシンプルなグリッドアイテムUIを提供する。
 */
import React from 'react';
import type { ArchivePack } from '../../../models/archive';
import ItemDisplayBlock from '../../../components/common/ItemDisplayBlock';

interface ArchivePackItemProps {
    item: ArchivePack;
    aspectRatio: number;
    // ArchiveList.tsxから渡されるハンドラ
    onSelectArchiveItem?: (itemId: string, itemType: 'packBundle' | 'deck') => void;
}

const ArchivePackItem: React.FC<ArchivePackItemProps> = ({
    item: archivePack,
    aspectRatio,
    onSelectArchiveItem,
}) => {

    // ArchivePack型からCommonItemDataにマッピング
    const commonItem = {
        // ArchivePackのID (archiveId) を使うことを想定
        id: archivePack.meta.archiveId,
        name: archivePack.name,
        number: archivePack.number,
        imageUrl: archivePack.imageUrl,
    };

    // ItemDisplayBlockへ渡す選択ハンドラ
    const handleSelect = (itemId: string) => {
        // 選択されたアーカイブIDとアイテムタイプ ('packBundle') を渡す
        onSelectArchiveItem?.(itemId, 'packBundle');
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

export default ArchivePackItem;