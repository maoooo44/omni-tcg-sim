/**
 * src/pages/DeckListPage.tsx
 *
 * ユーザーが作成したデッキの一覧を表示し、新規デッキ作成や既存デッキの編集・削除へ
 * ナビゲートする機能を提供するページコンポーネントです。
 * デッキ一覧の取得、表示、およびフィルタリング・ソートなどの実際のロジックは
 * `DeckListManager` コンポーネントに委譲しています。
 */

import React from 'react';
import { Box, Typography } from '@mui/material';
import DeckListManager from '../features/deck-management/DeckListManager'; 

const DeckListPage: React.FC = () => {
  return (
    <Box sx={{ p: 3, flexGrow: 1 }}>
        <Typography variant="h4" gutterBottom>デッキ一覧</Typography>
        
        {/* 全ての表示とロジックをDeckListManagerに委譲 */}
        <DeckListManager /> 
        
    </Box>
  );
};

export default DeckListPage;