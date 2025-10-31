/**
 * src/components/AppLoadingScreen.tsx
 * * アプリケーションの初期データロード中に表示される、中央寄せのロード画面コンポーネント。
 * アプリケーションのルートコンポーネント (App.tsx など) で、重要な非同期処理（ユーザー認証、初期データ取得など）が完了するまで
 * ユーザーに待機状態を示すUIを提供する責務を持ちます。
 *
 * * 責務:
 * 1. 画面全体（`minHeight: '100vh'`）の中央に、ロードインジケータ（`CircularProgress`）とメッセージを表示する。
 * 2. Material-UI の `CssBaseline` を適用し、画面の初期化を確実にする。
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