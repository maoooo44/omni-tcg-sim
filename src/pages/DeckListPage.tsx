/**
 * src/pages/DeckListPage.tsx
 *
 * * ユーザーが作成したデッキの一覧表示機能を提供するページコンポーネント。
 * このコンポーネントは、ページ全体のレイアウトとタイトル表示、および子ルートの配置のみを責務とし、
 * デッキ一覧の取得、フィルタリング、ソートなどの全てのロジックは機能コンポーネント（DeckList）に完全に委譲することで、
 * ページ層と機能層の責任を明確に分離しています。
 *
 * * 責務:
 * 1. ページのルート要素（Box）と基本的な余白、表示領域を定義する。
 * 2. ページのタイトル（Typography: 'デッキ一覧'）を表示する。
 * 3. 実際の機能を提供するコンポーネント（DeckList）を埋め込む。
 * 4. 子ルートコンポーネント（例: 詳細/編集モーダルなど）のための Outlet を配置する。
 */

import React from 'react';
//import { Outlet } from '@tanstack/react-router';
import { Box, Typography } from '@mui/material';
import DeckList from '../features/decks/DeckList';

const DeckListPage: React.FC = () => {
    return (
        <Box sx={{ p: 3, flexGrow: 1 }}>
            <Typography variant="h4" gutterBottom>デッキ一覧</Typography>

            <DeckList />

            {/* 子ルートコンポーネントを表示するためのOutlet
            <Box sx={{ mt: 4 }}>
                <Outlet />
            </Box> */}

        </Box>
    );
};

export default DeckListPage;