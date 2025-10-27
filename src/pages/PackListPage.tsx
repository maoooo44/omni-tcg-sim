/**
 * src/pages/PackListPage.tsx
 *
 * ページラッパーコンポーネント。このアプリケーションのパック管理機能のルートページを定義する。
 * 責務は、ルーティングのコンテキスト内でページ全体のレイアウト（パディング、マージン）を構築し、
 * タイトルを表示し、主要なフィーチャーコンポーネントであるPackList（一覧表示UI）を配置することに専念する。
 * データ取得やビジネスロジックは全てPackListフィーチャーに委譲するため、自身は純粋なプレゼンテーション層として機能する。
 */
import React from 'react';
import { Outlet } from '@tanstack/react-router'; 
import { Box, Typography } from '@mui/material';
// 必要なコンポーネントのみをインポート
import PackList from '../features/packs/PackList'; 


const PackListPage: React.FC = () => {

  return (
    <Box sx={{ p: 3, flexGrow: 1 }}>
      <Typography variant="h4" gutterBottom>パック管理</Typography>
      
      {/* パック一覧のフィーチャーコンポーネントを配置 */}
      <PackList />
      
      {/* 子ルート（PackEditPageなど）を表示するためのOutlet */}
      <Box sx={{ mt: 4 }}>
        <Outlet />
      </Box>
    </Box>
  );
};

export default PackListPage;