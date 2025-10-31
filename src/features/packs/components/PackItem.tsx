// 必要なインポートは最小限に
import React from 'react';
import type { Pack } from '../../../models/pack';
// ItemGridCard から ItemDisplayBlock に変更
import ItemDisplayBlock from '../../../components/common/ItemDisplayBlock';

interface PackItemProps {
    item: Pack;
    aspectRatio: number;
    onSelectPack?: (packId: string) => void;
}

const PackItem: React.FC<PackItemProps> = ({
    item: pack,
    aspectRatio,
    onSelectPack,
}) => {
    // Pack型をCommonItemData型にマッピング
    const commonItem = {
        id: pack.packId, // idとしてpackIdを使用
        name: pack.name,
        number: pack.number,
        imageUrl: pack.imageUrl,
        imageColor: pack.imageColor,
    };

    // onSelectPackのラッパー関数
    const handleSelect = (itemId: string) => {
        onSelectPack?.(itemId);
    };

    return (
        <ItemDisplayBlock // ItemGridCard から ItemDisplayBlock に変更
            item={commonItem}
            aspectRatio={aspectRatio}
            onSelect={handleSelect}
        />
    );
};

export default PackItem;