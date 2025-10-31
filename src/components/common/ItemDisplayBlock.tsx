/**
 * src/components/common/ItemDisplayBlock.tsx
 * * Pack/Deck/ArchiveItemなど、グリッド表示されるアイテムの共通UIコンポーネント。
 */
import React from 'react';
import { Card, CardContent, Typography, CardActionArea, CardMedia } from '@mui/material';
import { getDisplayImageUrl, } from '../../utils/imageUtils';

// 汎用アイテムのインターフェース (変更なし)
interface CommonItemData {
    // Pack, Deck, ArchiveItemのいずれかが持つID
    id: string; 
    name: string;
    number: number | null | undefined;
    imageUrl?: string;
    imageColor?: string;
    // アーカイブアイテムなどで追加される可能性があるメタデータをオプションで受け取る
    metaData?: React.ReactNode; 
}

interface ItemDisplayBlockProps {
    item: CommonItemData;
    aspectRatio: number;
    // 汎用化された選択ハンドラ。引数にはitem.idを渡す
    onSelect: (itemId: string) => void; 
    // CardContent内に表示する追加の要素（例: アーカイブ日時、お気に入りアイコンなど）
    AdditionalContent?: React.FC<{ item: CommonItemData }>;
}

const ItemDisplayBlock: React.FC<ItemDisplayBlockProps> = ({
    item,
    aspectRatio,
    onSelect,
    AdditionalContent,
}) => {
    
    const itemId = item.id; 

    return (
        <Card
            // 内部的にはMUIのCardを使用しますが、コンポーネント名には出しません
            sx={{
                width: '100%',
                aspectRatio: aspectRatio,
                boxShadow: 1,
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
            }}
        >
            <CardActionArea
                onClick={() => onSelect(itemId)}
                sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-start',
                    alignItems: 'stretch',
                }}
            >
                {/* 画像部分 (約80%) */}
                <CardMedia
                    component="img"
                    image={getDisplayImageUrl(
                        item.imageUrl,
                        {
                            text: item.name,
                            imageColor: item.imageColor,
                        }
                    )}
                    alt={item.name}
                    sx={{
                        height: '80%',
                        objectFit: 'contain',
                    }}
                />
                
                {/* テキスト情報 (約20%) */}
                <CardContent
                    sx={{
                        p: 0.5,
                        '&:last-child': { pb: 0.5 },
                        height: '20%',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                    }}
                >
                    {item.number !== null && (
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
            </CardActionArea>
        </Card>
    );
};

export default ItemDisplayBlock;