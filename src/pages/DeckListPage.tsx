/**
 * src/pages/DeckListPage.tsx
 *
 * ユーザーが作成したデッキの一覧を表示し、新規デッキ作成や既存デッキの編集・削除へ
 * ナビゲートする機能を提供するページコンポーネントです。
 * デッキ一覧の取得、表示、およびフィルタリング・ソートなどの実際のロジックは
 * DeckListManager コンポーネントに委譲しています。
 */

import React from 'react';
import { Outlet } from '@tanstack/react-router'; 
import { Box, Typography } from '@mui/material';
import DeckList from '../features/decks/DeckList'; 

const DeckListPage: React.FC = () => {
    return (
        <Box sx={{ p: 3, flexGrow: 1}}>
            <Typography variant="h4" gutterBottom>デッキ一覧</Typography>
            
            {/* 全ての表示とロジックをDeckListに委譲 (フィーチャーコンポーネント) */}
            <DeckList /> 

            {/* 子ルート（PackEditPageなど）を表示するためのOutlet */}
            <Box sx={{ mt: 4 }}>
              <Outlet />
            </Box>
            
        </Box>
    );
};

export default DeckListPage;