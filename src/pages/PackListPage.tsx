// src/pages/PackListPage.tsx (修正後)

/**
* src/pages/PackListPage.tsx
*
* 登録されているすべてのパックを一覧表示するページ。
* このページはレイアウトとフィーチャーの配置に専念し、データ取得ロジックは持たない。
*/
import React from 'react';
import { Outlet } from '@tanstack/react-router'; 
import { Box, Typography } from '@mui/material';
// 必要なコンポーネントのみをインポート
import PackListDisplay from '../features/pack-management/PackListDisplay'; 

// 不必要なインポートを削除: 
// import { useNavigate } from '@tanstack/react-router'; 
// import { Grid, Card, CardContent, Typography, CardActionArea, Box, CardMedia } from '@mui/material';
// import AddIcon from '@mui/icons-material/Add'; 
// import { usePackStore } from '../stores/packStore'; // ❌ 削除
// import { useShallow } from 'zustand/react/shallow'; // ❌ 削除
// import { getDisplayImageUrl, ... } from '../utils/imageUtils'; // ❌ 削除


const PackListPage: React.FC = () => {
  // データ取得、ナビゲーションロジックを全て削除
  // const packs = usePackStore(...) // ❌ 削除
  // const navigate = useNavigate(); // ❌ 削除
  // const handleSelectPack = ... // ❌ 削除
  // const handleNewPack = ... // ❌ 削除

  return (
    <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>パック管理</Typography>
      
        {/* 全てのパック一覧のデータ取得と描画ロジックをフィーチャーコンポーネントに委譲 */}
        <PackListDisplay />
      
        {/* 子ルート（PackEditPage）を表示するためのOutlet */}
        <Box sx={{ mt: 4 }}>
            <Outlet />
        </Box>
    </Box>
  );
};

export default PackListPage;