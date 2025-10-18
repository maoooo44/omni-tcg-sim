/**
 * src/pages/CardPoolPage.tsx
 *
 * ユーザーが所有するカード資産（カードプール）の一覧と管理機能を提供するページコンポーネントです。
 * 実際のロジック（フィルタリング、ソート、表示）は CardPoolManager コンポーネントに委譲しています。
 */
import React from 'react';
import { Box, Typography } from '@mui/material';
import CardPoolManager from '../features/card-pool/CardPool'; 

const CardPoolPage: React.FC = () => {
    return (
        <Box sx={{ p: 1, flexGrow: 1 }}>
            
            {/* 1. タイトルと説明 */}
            <Typography variant="h5" gutterBottom>
                📦 カード資産の確認
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                このページでは、あなたがパック開封などで獲得した全てのカードを確認できます。
            </Typography>
            
            {/* 2. カードプール管理コンポーネントの埋め込み (ロジックはfeaturesに分離) */}
            <CardPoolManager />
            
        </Box>
    );
};

export default CardPoolPage;