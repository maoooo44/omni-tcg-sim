/**
 * src/components/layouts/MainLayout.tsx
 *
 * アプリケーションのメインレイアウトコンポーネントです。
 * ナビゲーションバー (Navbar) の表示と、ページコンテンツを囲むコンテナを提供します。
 * グローバルなCardViewModalを配置します。
 */
import React from 'react';
import { Outlet } from '@tanstack/react-router';
import { Container } from '@mui/material';

// Navbarとその依存関係をインポート
import Navbar from './Navbar';
// 💡 CardViewModalをインポート
import CardViewModal from '../modals/CardViewModal';
// coinsを取得するために useCurrencyStore をインポート
import { useCurrencyStore } from '../../stores/currencyStore';
//import { useUserDataStore } from '../../stores/userDataStore';
import { useShallow } from 'zustand/react/shallow';

const MainLayout: React.FC = () => {
    // Navbarに必要なPropsをここで取得
    const navbarProps = useCurrencyStore(
        useShallow(state => ({
            coins: state.coins
        }))
    );

    // userDataStore から DTCG/GodMode の設定を取得
    /*const userSettings = useUserDataStore(
        useShallow(state => ({
            isDTCGEnabled: state.isDTCGEnabled,
            isGodMode: state.isGodMode,
        }))
    );*/

    return (
        <>
            {/* Navbarをレンダリングする (MUIデザイン) */}
            <Navbar
                /*isDTCGEnabled={userSettings.isDTCGEnabled}
                isGodMode={userSettings.isGodMode}*/
                coins={navbarProps.coins}
            />

            {/* コンテンツ領域のContainerをここで定義 (MUIデザイン) */}
            <Container maxWidth="lg" sx={{ pt: 3, pb: 6, minHeight: 'calc(100vh - 64px)' }}>
                {/* ページの内容はここに入る */}
                <Outlet />
            </Container>

            {/* 💡 グローバルなCardViewModalをルートレイアウトに配置 */}
            <CardViewModal />

            {/* 以前の MainLayout のフッター（今回は省略） */}
        </>
    );
};

export default MainLayout;