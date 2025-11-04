/**
 * src/components/common/InteractiveItemContainer.tsx
 * * Pack/Deck/Card/ArchiveItemなど、グリッド表示されるアイテムのコンテナ、状態管理、アクションUIを提供。
 */
import React from 'react';
import { Card, CardContent, Typography, CardActionArea, Box, type Theme } from '@mui/material';
import { type SxProps } from '@mui/system';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ImagePreview from './ImagePreview';
import type { 
    CommonItemData, 
    ItemImageOptions, 
    InteractionHandlers, 
    SelectionOptions, 
    ContainerDisplayOptions 
} from '../../models/itemDisplay';
import { HOVER_EFFECT_SCALE } from '../../configs/configs'

// =========================================================================
// 公開する共通型 (models/itemDisplay.ts からインポート済み)
// =========================================================================

// CommonItemData は models/itemDisplay.ts からインポート
export type { CommonItemData } from '../../models/itemDisplay';

/**
 * ⭐ InteractiveItemContainer の共通プロパティ
 * models/itemDisplay.ts の型を使用して構築
 */
export interface InteractiveContainerProps {
    item: CommonItemData;
    aspectRatio: number;
    
    // インタラクションハンドラ (models からの型)
    onSelect: (itemId: string) => void;
    
    // 選択状態
    isSelectable?: boolean;
    isSelected?: boolean;
    onToggleSelection?: (itemId: string) => void;
    
    // 表示オプション (models からの型を使用)
    /** 追加コンテンツのコンポーネント */
    AdditionalContent?: React.FC<{ item: CommonItemData }>;
    /** trueの場合、テキストコンテンツ(CardContent)を非表示にし、画像エリアを100%にする */
    noTextContent?: boolean;
    
    /** noTextContent=trueの場合に、画像表示とオーバーレイを完全にオーバーライドするための子要素 */
    children?: React.ReactNode;
}

// ⭐ 修正: InteractiveContainerProps と ItemImageOptions を両方継承
interface InteractiveItemContainerProps extends InteractiveContainerProps, ItemImageOptions {}

const InteractiveItemContainer: React.FC<InteractiveItemContainerProps> = ({
    item,
    aspectRatio,
    onSelect,
    AdditionalContent,
    isSelectable = false,
    isSelected = false,
    onToggleSelection,
    noTextContent = false,
    children, 
    // ⭐ 修正: InteractiveContainerPropsに属さない ItemImageOptions のプロパティを imageOptionsProps にまとめる
    // 💡 InteractiveContainerProps のプロパティはデストラクトで分離
    enableHoverEffect = false, // ItemImageOptions
    imageSx,                   // ItemImageOptions
    ...interactiveProps // 他のプロパティ（未使用だが型整合性のため）

}) => {
    
    // ⭐ 修正: ItemImageOptions のプロパティをまとめてオブジェクト化
    const imageOptionsProps: ItemImageOptions = {
        enableHoverEffect,
        imageSx
    };

    const itemId = item.id;

    // ⭐ 修正: Cardのホバーエフェクトのロジックに enableHoverEffect を使用
    const cardSx: SxProps<Theme> = [
        { 
            width: '100%',
            aspectRatio: aspectRatio,
            boxShadow: isSelected ? 8 : 1,
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            opacity: isSelectable && !isSelected ? 0.7 : 1,
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
                opacity: 1,
                // enableHoverEffect が true の場合にのみホバーエフェクトを適用
                boxShadow: enableHoverEffect ? 6 : 3, // ホバー時は少しシャドウを強める
                transform: enableHoverEffect ? ` scale(${HOVER_EFFECT_SCALE})` : 'none', // 拡大
                zIndex: 10,
            },
        },
    ];

    const handleClick = () => {
        if (!itemId) return;
        if (isSelectable) {
            onToggleSelection?.(itemId);
        } else {
            onSelect(itemId);
        }
    };
    
    const imageAreaHeight = noTextContent ? '100%' : '80%';
    const contentAreaHeight = noTextContent ? '0%' : '20%';

    // 💡 ImagePreview に渡す item は、CommonItemData の拡張である item をそのまま使用
    const imagePreviewItem = item; 

    return (
        <Card
            sx={cardSx} // ⭐ 修正: cardSxを使用
        >
            {/* 選択時の青枠オーバーレイ */}
            {isSelected && (
                <Box
                    sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        border: 3,
                        borderColor: 'primary.main',
                        borderRadius: 1,
                        pointerEvents: 'none',
                        zIndex: 2,
                    }}
                />
            )}

            {/* 選択インジケーター (右上に絶対配置) */}
            {isSelected && (
                <Box
                    sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        zIndex: 3,
                        bgcolor: 'primary.main',
                        borderRadius: '50%',
                        width: 32,
                        height: 32,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <CheckCircleIcon sx={{ color: 'white', fontSize: 24 }} />
                </Box>
            )}

            <CardActionArea
                onClick={handleClick}
                sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-start',
                    alignItems: 'stretch',
                }}
            >
                {/* 画像部分 (80% or 100%) */}
                <Box 
                    sx={{ 
                        height: imageAreaHeight, 
                        display: 'flex', 
                        justifyContent: 'center', 
                        alignItems: 'center', 
                        p: noTextContent ? 0 : 1, 
                        position: 'relative', 
                    }}
                >
                    {children ? (
                        // childrenで画像表示とオーバーレイを完全にオーバーライド
                        children
                    ) : (
                        // 通常の画像表示
                        <ImagePreview
                            item={imagePreviewItem} // 💡 item をそのまま渡す
                            // ⭐ 修正: スプレッド構文で ItemImageOptions のプロパティをリレー
                            {...imageOptionsProps}
                        />
                    )}
                </Box>
                
                {/* テキスト情報 (20% or 0%) */}
                {!noTextContent && (
                    <CardContent
                        sx={{
                            p: 0.5,
                            '&:last-child': { pb: 0.5 },
                            height: contentAreaHeight,
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                        }}
                    >
                        {item.number !== null && item.number !== undefined && (
                            <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1 }}>
                                No. {item.number}
                            </Typography>
                        )}
                        <Typography variant="body2" noWrap sx={{ fontWeight: 'bold' }}>
                            {item.name}
                        </Typography>
                        
                        {/* 追加コンテンツ（アーカイブメタデータなど） */}
                        {AdditionalContent && <AdditionalContent item={item} />}
                        
                    </CardContent>
                )}
            </CardActionArea>
        </Card>
    );
};

export default InteractiveItemContainer;