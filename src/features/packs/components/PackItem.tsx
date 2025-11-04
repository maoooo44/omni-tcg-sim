/**
 * src/features/packs/components/PackItem.tsx
 */
import React from 'react';
import type { Pack } from '../../../models/models';
// InteractiveContainerProps と CommonItemData をインポート
import InteractiveItemContainer, { 
    type InteractiveContainerProps, 
    type CommonItemData 
} from '../../../components/common/InteractiveItemContainer'; 
// ImagePreview から ItemImageOptions をインポート
import { type ItemImageOptions } from '../../../components/common/ImagePreview'; 

// ⭐ 修正: InteractiveContainerProps と ItemImageOptions を両方継承
interface PackItemProps extends InteractiveContainerProps, ItemImageOptions {
    // InteractiveContainerProps の item を Pack に特化してオーバーライド
    item: Pack & { isSelected?: boolean };
    
    // ⭐ 修正: onSelectPack は使用せず、onSelect を InteractiveContainerProps から継承
}

const PackItem: React.FC<PackItemProps> = ({
    item: pack,
    // item: pack 以外は全て props にまとめてリレーする
    ...props 
}) => {
    
    // 💡 Pack型を CommonItemData型にマッピングし、全てのプロパティをスプレッドで渡す
    const commonItem: CommonItemData = {
        id: pack.packId, // idとしてpackIdを使用
        // 💡 Pack型の他のプロパティを CommonItemData の拡張として渡す
        ...pack,
    };

    // onSelect, onToggleSelection, enableHoverEffect などは全て props に含まれており、
    // InteractiveItemContainer のプロパティと一致しているため、そのままリレー可能です。
        
    return (
        <InteractiveItemContainer 
            // ⭐ 修正: props をスプレッド構文で渡すことで、aspectRatio, onSelect, onToggleSelection, enableHoverEffect, imageSxなどを一括リレー
            {...props}
            
            // ⭐ 修正: item と isSelected はスプレッドの後に記述し、上書きする
            item={commonItem}
            isSelected={pack.isSelected} // PackItemPropsのitemから取得したisSelectedを優先し上書き

            // 💡 enableImageHoverEffect は ItemImageOptions の enableHoverEffect に置き換わっているため、
            // propsに含まれている enableHoverEffect がそのままリレーされます。
        />
    );
};

export default PackItem;