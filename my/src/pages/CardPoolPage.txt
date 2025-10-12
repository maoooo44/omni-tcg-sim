// src/pages/CardPoolPage.tsx
import React from 'react';
import { Box, Typography } from '@mui/material';
import CardPoolManager from '../features/card-pool/CardPoolManager'; // 💡 featuresからインポート

const CardPoolPage: React.FC = () => {
    return (
        <Box sx={{ p: 1, flexGrow: 1 }}>
            {/* 💡 カード資産の確認 */}
            <Typography variant="h5" gutterBottom>
                📦 カード資産の確認
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                このページでは、あなたがパック開封などで獲得した全てのカードを確認できます。
            </Typography>
            
            {/* 💡 すべてのロジックと一覧表示を CardPoolManager に任せる */}
            <CardPoolManager />
        </Box>
    );
};

export default CardPoolPage;