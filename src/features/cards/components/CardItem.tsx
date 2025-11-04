/**
 * src/features/cards/components/CardItem.tsx (InteractiveItemContainer ラッパー版)
 *
 * 責務: CardItemDisplayBlock（InteractiveItemContainer）を利用し、カード特有のオーバーレイUIを children として注入する。
 */
import React from 'react';
import { Chip, Box, Typography, type SxProps, type Theme } from '@mui/material';
import ItemQuantityControl from '../../../components/controls/ItemQuantityControl';
import type { 
    Card as CardType, 
    CommonItemData, 
    ItemImageOptions, 
    CardDisplayOptions, 
    CardQuantityHandlers 
} from '../../../models/models';
import ImagePreview from '../../../components/common/ImagePreview';
import InteractiveItemContainer, { 
    type InteractiveContainerProps 
} from '../../../components/common/InteractiveItemContainer';

// =========================================================================
// カード固有のオプション (models/itemDisplay.ts からインポート済み)
// =========================================================================

// CardDisplayOptions と CardQuantityHandlers は models からインポート
export type { CardDisplayOptions, CardQuantityHandlers } from '../../../models/models';


// =========================================================================
// Props型定義 (継承)
// =========================================================================

/**
 * CardItemのProps 
 * InteractiveContainerProps, ItemImageOptions, CardDisplayOptions, CardQuantityHandlers を継承
 */
export interface CardItemProps 
    extends InteractiveContainerProps, 
            ItemImageOptions, 
            CardDisplayOptions, 
            CardQuantityHandlers {
    /** 必須: カードデータ（InteractiveContainerProps の item を PackItem と同様にオーバーライド） */
    item: CardType & {
        count?: number;
        ownedCount?: number;
        keycardRank?: number;
        isSelected?: boolean;
    };

    /** カードクリック時のハンドラ */
    onClick?: (card: CardType) => void;
    
    /** キーカード選択トグルのハンドラ */
    onToggleKeycard?: (cardId: string) => void;
}


// =========================================================================
// サブコンポーネント 
// =========================================================================

/**
 * キーカードランク表示
 */
const KeycardRankDisplay: React.FC<{ rank: number }> = ({ rank }) => (
    <Typography 
        color="white" 
        sx={{ 
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 3,
            fontWeight: 'bold',
            fontSize: 'clamp(1.5rem, 5vw, 4rem)',
            lineHeight: 1,
            textShadow: '0 0 8px rgba(0, 0, 0, 0.9), 0 0 4px rgba(0, 0, 0, 0.9)',
        }}
    >
        {rank}
    </Typography>
);


// =========================================================================
// メインコンポーネント
// =========================================================================

const CardItem: React.FC<CardItemProps> = (props) => {
    // InteractiveItemContainer にリレーするプロパティと、CardItem 内部で使うプロパティを分離
    const {
        item: card, // ⭐ 修正: item を card としてデストラクトする
        onClick,
        onToggleKeycard, 

        aspectRatio = 1,
        isSelectable = false,
        isSelected: isSelectedProp, // InteractiveItemContainer からの isSelected を isSelectedProp として取得

        onToggleSelection,
        enableHoverEffect = false,
        imageSx,

        // CardDisplayOptions (オーバーレイ生成ロジックに使用)
        quantityChip = false,
        quantityControl = false,
        keycardRank = false,
        grayscaleWhenZero = false,
        onAddQuantity,
        onRemoveQuantity,
        
        ...relayProps // onSelect, AdditionalContent, noTextContent, children など
    } = props;
    
    // ⭐ 修正: card を直接使用するため、型チェックがシンプルになる
    if (!card || !card.cardId) {
        console.error('CardItem: card item is required and must have cardId');
        return null;
    }
    
    // 状態の計算
    // ⭐ 修正: card.isSelected を isSelectedProp のフォールバックとして使用する
    const isSelected = isSelectedProp ?? card.isSelected ?? false; 
    
    const count = card.count ?? 0; 
    const ownedCount = card.ownedCount;
    const isOwned = count > 0; 
    const isOverLimit = ownedCount !== undefined && count > ownedCount;

    // InteractiveItemContainerに渡す onSelect ハンドラ 
    const handleSelectOrToggle = (_itemId: string) => { 
        // 選択モードでない場合に、キーカードトグルを優先する
        if (onToggleKeycard && !isSelectable) {
            onToggleKeycard(card.cardId);
        } else {
            // onSelect が呼ばれた場合（非選択時）は onClick を実行
            onClick?.(card as CardType);
        }
    };

    // InteractiveItemContainerの型に合わせてマッピング (CommonItemDataを使用)
    // ⭐ 修正: card.cardId を id として使用
    const commonItem: CommonItemData = { id: card.cardId, ...card };

    // ImagePreview に渡す ItemImageOptions
    const imageOptionsProps: ItemImageOptions = {
        enableHoverEffect,
        imageSx: [
            ...(Array.isArray(imageSx) ? imageSx : (imageSx ? [imageSx] : [])), 
            { filter: grayscaleWhenZero && !isOwned ? 'grayscale(100%)' : 'none' },
        ] as SxProps<Theme>,
    };

    return (
        <InteractiveItemContainer
            {...relayProps}

            onSelect={handleSelectOrToggle}
            
            item={commonItem} // ⭐ 修正: 共通アイテムを渡す
            aspectRatio={aspectRatio} 
            isSelected={isSelected} // ⭐ 修正: 統合された isSelected を渡す
            onToggleSelection={onToggleSelection} 
            enableHoverEffect={enableHoverEffect} // ⭐ 追加: ホバーエフェクトをInteractiveItemContainerに渡す
            imageSx={imageOptionsProps.imageSx} // ⭐ 追加: imageSxも渡す

            // カード特有の「画像100% + オーバーレイ」レイアウトを有効にする
            noTextContent={true} 
        >
            {/* children として ImagePreview + オーバーレイ全体を注入 */}
            <Box
                sx={{
                    position: 'relative',
                    height: '100%',
                    width: '100%',
                }}
            >
                {/* 1. ImagePreview: 画像のレンダリング本体とホバー効果 */}
                <ImagePreview
                    item={card as CardType} // ItemTypeとして渡す
                    {...imageOptionsProps}
                />
                
                {/* 2. オーバーレイ要素のコンテナ (ImagePreviewの上に重ねる) */}
                <Box 
                    sx={{ 
                        position: 'absolute', 
                        top: 0, left: 0, bottom: 0, right: 0, 
                        pointerEvents: 'none' // デフォルトではクリック無効
                    }}
                >
                
                    {/* キーカードランク */}
                    {keycardRank && card.keycardRank && (
                        <KeycardRankDisplay rank={card.keycardRank} />
                    )}

                    {/* 枚数チップ */}
                    {quantityChip && isOwned && (
                        <Chip
                            label={ownedCount !== undefined ? `${count}/${ownedCount}` : `x${count}`}
                            color={isOverLimit ? 'error' : 'primary'}
                            size="small"
                            sx={{
                                position: 'absolute', bottom: 4, right: 4, 
                                bgcolor: isOverLimit ? 'rgba(211, 47, 47, 0.7)' : 'rgba(0,0,0,0.7)',
                                color: 'white', fontWeight: 'bold', zIndex: 2,
                            }}
                        />
                    )}

                    {/* 枚数増減コントロール */}
                    {quantityControl && onAddQuantity && onRemoveQuantity && (
                        <Box
                            sx={{
                                position: 'absolute', bottom: 8, left: '50%', 
                                transform: 'translateX(-50%)', zIndex: 2, pointerEvents: 'auto', 
                            }}
                            onClick={(e) => { e.stopPropagation(); }} 
                        >
                            <ItemQuantityControl
                                itemId={card.cardId}
                                currentCount={count}
                                maxCount={ownedCount}
                                onAdd={onAddQuantity}
                                onRemove={onRemoveQuantity}
                            />
                        </Box>
                    )}
                </Box>
            </Box>
        </InteractiveItemContainer>
    );
};

export default CardItem;