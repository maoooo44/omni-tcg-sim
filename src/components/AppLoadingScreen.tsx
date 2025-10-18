/**
 * src/components/AppLoadingScreen.tsx
 * 
 * アプリケーションの初期データロード中に表示される、中央寄せのロード画面コンポーネント。
 * ルートコンポーネント (App.tsx) の表示ロジックを分離するために使用されます。
 */

import React from 'react';
import { Box, Typography, CircularProgress, CssBaseline } from '@mui/material';

const AppLoadingScreen: React.FC = () => {
    return (
        <CssBaseline>
            <Box 
                sx={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    justifyContent: 'center', 
                    alignItems: 'center', 
                    minHeight: '100vh' 
                }}
            >
                <CircularProgress color="primary" size={60} />
                <Typography variant="h6" sx={{ mt: 2 }}>
                    データをロード中...
                </Typography>
            </Box>
        </CssBaseline>
    );
};

export default AppLoadingScreen;