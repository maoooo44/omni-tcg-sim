/**
 * src/features/decks/components/DeckItem.tsx
 *
 * デッキリスト画面で個々のデッキを表示するコンポーネント
 * ReusableItemGridのItemComponentとして使用
 */
import React from 'react';
import { Card, CardContent, Typography, CardActionArea, CardMedia, Box, IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { getDisplayImageUrl, DEFAULT_PACK_DECK_WIDTH, DEFAULT_PACK_DECK_HEIGHT } from '../../../utils/imageUtils';
import type { Deck } from '../../../models/deck';

interface DeckItemProps {
    item: Deck;
    index?: number;
    aspectRatio: number;
    onSelectDeck?: (deckId: string) => void;
    onDeleteDeck?: (deckId: string, deckName: string) => void;
}

const DeckItem: React.FC<DeckItemProps> = ({ 
    item: deck, 
    index: _index, 
    aspectRatio,
    onSelectDeck, 
    onDeleteDeck,
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
                onClick={() => onSelectDeck?.(deck.deckId)}
                sx={{ 
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column',
                    justifyContent: 'flex-start',
                    alignItems: 'stretch',
                }}
            >
                {/* デッキ画像 (80%) */}
                <CardMedia
                    component="img"
                    image={getDisplayImageUrl(
                        deck.imageUrl,
                        { 
                            width: DEFAULT_PACK_DECK_WIDTH,
                            height: DEFAULT_PACK_DECK_HEIGHT,
                            text: deck.name,
                        }
                    )}
                    alt={deck.name}
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
                    {deck.number !== null && (
                        <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1 }}>
                            No. {deck.number}
                        </Typography>
                    )}
                    <Typography variant="body2" noWrap sx={{ fontWeight: 'bold' }}>
                        {deck.name}
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
                        onDeleteDeck?.(deck.deckId, deck.name);
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

export default DeckItem;
