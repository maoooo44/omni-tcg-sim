/**
 * src/pages/CardPoolPage.tsx
 *
 * * ユーザーが所有するカード資産（カードプール）の一覧と管理機能を提供するページコンポーネント。
 * このコンポーネントは、ページ全体のレイアウトとタイトル表示のみを責務とし、
 * 実際のビジネスロジック（フィルタリング、ソート、表示）は機能コンポーネントに完全に委譲することで、
 * ページ層と機能層の責任を明確に分離しています。
 *
 * * 責務:
 * 1. ページのルート要素（Box）と基本的な余白、表示領域を定義する。
 * 2. ページのタイトル（Typography: 'カードプール'）を表示する。
 * 3. 実際の機能を提供するコンポーネント（CardPoolManager）を埋め込む。
 */
import React from 'react';
import { Box, Typography } from '@mui/material';
import CardPoolManager from '../features/card-pool/CardPool';

const CardPoolPage: React.FC = () => {
    return (
        <Box sx={{ p: 3, flexGrow: 1 }}>
            <Typography variant="h4" gutterBottom>カードプール</Typography>

            <CardPoolManager />

        </Box>
    );
};

export default CardPoolPage;