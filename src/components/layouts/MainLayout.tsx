/**
* src/components/layouts/MainLayout.tsx
*
* アプリケーションのメインレイアウトコンポーネントです。
* * 責務:
* 1. ナビゲーションバー (Navbar) を配置し、必要なグローバル状態（coinsなど）を注入する。
* 2. アプリケーションのページコンテンツを囲むメインのコンテナ (MUI Container) を提供する。
* 3. ルーターのコンテンツ（<Outlet />）をレンダリングする。
* 4. グローバルなモーダル（CardViewModalなど、コメント部）をルートレイアウトに配置する。
*/
import React from 'react';
import { Outlet } from '@tanstack/react-router';
import { Container } from '@mui/material';

// Navbarとその依存関係をインポート
import Navbar from './Navbar';
// coinsを取得するために useCurrencyStore をインポート
import { useCurrencyStore } from '../../stores/currencyStore';
import { useShallow } from 'zustand/react/shallow';

const MainLayout: React.FC = () => {
    // Navbarに必要なPropsをここで取得
    const navbarProps = useCurrencyStore(
        useShallow(state => ({
            coins: state.coins
        }))
    );

    return (
        <>
            {/* Navbarをレンダリングする (MUIデザイン) */}
            <Navbar
                coins={navbarProps.coins}
            />

            {/* コンテンツ領域のContainerをここで定義 (MUIデザイン) */}
            <Container maxWidth="lg" sx={{ pt: 3, pb: 6, minHeight: 'calc(100vh - 64px)' }}>
                {/* ページの内容はここに入る */}
                <Outlet />
            </Container>

            {/* 💡 グローバルなCardViewModalをルートレイアウトに配置 */}

            {/* 以前の MainLayout のフッター（今回は省略） */}
        </>
    );
};

export default MainLayout;