// src/pages/PackListPage.tsx (FULL REVISION)

import React from 'react';
// 標準のGridをインポート (v7ではこれが新しいGrid)
import { Grid, Card, CardContent, Typography, CardActionArea, Box, CardMedia } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { usePackStore } from '../stores/packStore';
import { useNavigate } from '@tanstack/react-router';
import { useShallow } from 'zustand/react/shallow';
// import { generateUUID } from '../utils/uuidUtils'; // UUID生成を使用

const PackListPage: React.FC = () => {
  const packs = usePackStore(useShallow(state => state.packs));
  const navigate = useNavigate();

  // 💡 パスをルートからの相対パスに変更: /packs/$packId
  // 既存パックをクリックしたときの処理
  const handleSelectPack = (packId: string) => {
    navigate({ to: `/data/packs/$packId`, params: { packId } });
  };
  
  // 💡 パスをルートからの相対パスに変更: /packs/create
  // 新規作成カードが押されたときの処理
  const handleNewPack = () => {
    // 💡 新規作成はID 'create' を使用し、Editor側で新規Deck/Packを生成するのが一般的
    navigate({ to: `/data/packs/$packId`, params: { packId: 'create' } });
  };

  const PACK_CARD_WIDTH = 200; 
  const PACK_CARD_HEIGHT = 280; 

  return (
    <Box sx={{ flexGrow: 1, p: 1 }}>
        <Typography variant="h4" gutterBottom>
            パック一覧
        </Typography>
        
        {/* Gridをcontainerとして使用 */}
        <Grid container spacing={2}>
            
            {/* 1. 新規作成のカード（左上） */}
            <Grid> {/* 💡 Grid item を追加 */}
            <Card 
                sx={{ 
                    width: PACK_CARD_WIDTH, 
                    height: PACK_CARD_HEIGHT,
                    border: '2px dashed', // 💡 dashedに変更
                    borderColor: 'grey.400', 
                    backgroundColor: 'grey.50',
                    boxShadow: 0,
                    transition: 'box-shadow 0.3s',
                    '&:hover': {
                        boxShadow: 3, 
                    }
                }}
                onClick={handleNewPack}
            >
                <CardActionArea sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                    <AddIcon sx={{ fontSize: 60, color: 'grey.500' }} />
                    <Typography variant="subtitle1" color="grey.600" sx={{ mt: 1 }}>
                        新規作成
                    </Typography>
                </CardActionArea>
            </Card>
            </Grid>
            
            {/* 2. 既存のパック一覧 */}
            {packs.map(pack => ( 
                <Grid key={pack.packId}> {/* 💡 Grid item を追加 */}
                    <Card 
                        sx={{ 
                            width: PACK_CARD_WIDTH, 
                            height: PACK_CARD_HEIGHT,
                            cursor: 'pointer',
                            boxShadow: 1, 
                        }}
                        onClick={() => handleSelectPack(pack.packId)}
                    >
                        <CardActionArea sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                            <CardMedia
                                component="img"
                                image={pack.imageUrl || 'https://via.placeholder.com/200x150?text=Pack+Image'}
                                alt={pack.name}
                                sx={{ height: 150, objectFit: 'cover' }}
                            />
                            <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
                                <Typography variant="subtitle1" noWrap>{pack.name}</Typography>
                                <Typography variant="caption" color="text.secondary">
                                    {pack.series} | {pack.cardsPerPack}枚
                                </Typography>
                            </CardContent>
                        </CardActionArea>
                    </Card>
                </Grid>
            ))}
        </Grid>
    </Box>
  );
};

export default PackListPage;