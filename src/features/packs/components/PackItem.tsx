/**
 * src/features/packs/components/PackItem.tsx
 *
 * パックリスト画面で個々のパックまたは新規作成ボタンを表示するコンポーネント
 * ReusableItemGridのItemComponentとして使用
 */
import React from 'react';
import { Card, CardContent, Typography, CardActionArea, CardMedia, Box, IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { getDisplayImageUrl, DEFAULT_PACK_DECK_WIDTH, DEFAULT_PACK_DECK_HEIGHT } from '../../../utils/imageUtils';
import type { Pack } from '../../../models/pack';

interface PackItemProps {
    item: Pack;
    index?: number;
    aspectRatio: number;
    onSelectPack?: (packId: string) => void;
    onDeletePack?: (packId: string, packName: string) => void;
}

const PackItem: React.FC<PackItemProps> = ({ 
    item: pack, 
    index: _index, 
    aspectRatio,
    onSelectPack, 
    onDeletePack,
}) => {
    
    return (
        <Card 
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
                onClick={() => onSelectPack?.(pack.packId)}
                sx={{ 
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column',
                    justifyContent: 'flex-start',
                    alignItems: 'stretch',
                }}
            >
                {/* パック画像 (80%) */}
                <CardMedia
                    component="img"
                    image={getDisplayImageUrl(
                        pack.imageUrl,
                        { 
                            width: DEFAULT_PACK_DECK_WIDTH,
                            height: DEFAULT_PACK_DECK_HEIGHT,
                            text: pack.name,
                        }
                    )}
                    alt={pack.name}
                    sx={{ 
                        height: '80%',
                        objectFit: 'contain',
                    }} 
                />
                {/* テキスト情報 (20%) */}
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
                    {pack.number !== null && (
                        <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1 }}>
                            No. {pack.number}
                        </Typography>
                    )}
                    <Typography variant="body2" noWrap sx={{ fontWeight: 'bold' }}>
                        {pack.name}
                    </Typography>
                </CardContent>
            </CardActionArea>
            
            {/* 削除ボタン */}
            <Box sx={{ position: 'absolute', top: 5, right: 5 }}>
                <IconButton 
                    size="small" 
                    color="error"
                    onClick={(e) => {
                        e.stopPropagation();
                        onDeletePack?.(pack.packId, pack.name);
                    }}
                    sx={{
                        bgcolor: 'rgba(255, 255, 255, 0.8)',
                        '&:hover': {
                            bgcolor: 'rgba(255, 255, 255, 0.9)',
                        }
                    }}
                >
                    <DeleteIcon fontSize="inherit" />
                </IconButton>
            </Box>
        </Card>
    );
};

export default PackItem;
