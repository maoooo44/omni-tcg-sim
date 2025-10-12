// src/pages/PackListPage.tsx

import React from 'react';
// ✅ 修正: Outletをインポート
import { Outlet, useNavigate } from '@tanstack/react-router'; 
// 標準のGridをインポート (v7ではこれが新しいGrid)
import { Grid, Card, CardContent, Typography, CardActionArea, Box, CardMedia } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { usePackStore } from '../stores/packStore';
import { useShallow } from 'zustand/react/shallow';
import { generateUUID } from '../utils/uuidUtils'; // UUID生成を使用

const PackListPage: React.FC = () => {
  const packs = usePackStore(useShallow(state => state.packs));
  const navigate = useNavigate();

  // 既存パックをクリックしたときの処理
  const handleSelectPack = (packId: string) => {
    // 💡 URLは変わっているためナビゲーション自体は問題ない
    navigate({ to: `/data/packs/$packId`, params: { packId } });
  };
  
  // 新規作成カードが押されたときの処理
  const handleNewPack = () => {
    const newPackId = generateUUID();
    navigate({ to: `/data/packs/$packId`, params: { packId: newPackId } });
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
            <Grid>
            <Card 
                sx={{ 
                    width: PACK_CARD_WIDTH, 
                    height: PACK_CARD_HEIGHT,
                    border: '2px solid', 
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
            {packs.map(pack => ( // ✅ 修正: 即時return構文に変更
                <Grid key={pack.packId}>
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
        
        {/* 🚨 修正箇所: 子ルート（PackEditPage）を表示するためのOutletを追加 */}
        {/* 子ルートがアクティブな場合、PackListの下にEditPageが表示される */}
        <Box sx={{ mt: 4 }}>
            <Outlet />
        </Box>
        
    </Box>
  );
};

export default PackListPage;