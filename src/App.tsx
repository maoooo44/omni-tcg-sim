/**
 * src/App.tsx
 *
 * * アプリケーションのルートコンポーネント。
 * 主な責務は、アプリケーション全体で共有されるグローバル状態管理システム（Zustandストア群）の初期化と、
 * IndexedDBからの初期データロード完了の監視です。ロード完了後、TanStack Routerを通じて
 * アプリケーションのルーティング構造全体をレンダリングします。
 *
 * * 責務:
 * 1. アプリケーションの全Zustandストア（useCardPool, useDeckStoreなど）を呼び出し、グローバルな状態を初期化する。
 * 2. 初期ロード完了を判定するカスタムフック（useInitialLoad）を呼び出す。
 * 3. ロードが完了するまで専用のローディングコンポーネント（AppLoadingScreen）をレンダリングする。
 * 4. ロード完了後、MUIのCssBaselineを適用し、TanStack Routerを介してメインアプリケーションをレンダリングする。
 */

import { RouterProvider } from '@tanstack/react-router';
import { router } from './router';
import { useInitialLoad } from './hooks/useInitialLoad';
import AppLoadingScreen from './components/AppLoadingScreen';

// ZUSTANDストア群のインポート
import { useCardPool } from './features/card-pool/hooks/useCardPool';
import { useDeckStore } from './stores/deckStore';
import { useUserDataStore } from './stores/userDataStore';
import { usePackStore } from './stores/packStore';
import { useCurrencyStore } from './stores/currencyStore';

// MUIコンポーネントのインポートはロード画面コンポーネントに移動したため、CssBaselineのみ残す
import { CssBaseline } from '@mui/material';


function App() {
    // 必須: 全てのZustandストアのフックを呼び出し、アプリケーションのルートでストアのコンテキストを確立します。
    // useInitialLoad 内でこれらのストアが利用されるため、必ず先に呼び出す必要がある
    useCardPool();
    useDeckStore();
    useUserDataStore();
    usePackStore();
    useCurrencyStore();

    // 初期ロードフックを呼び出し、ロード完了を待つ 
    const isReady = useInitialLoad();

    // ロード完了待ち (切り出したコンポーネントを使用)
    if (!isReady) {
        return <AppLoadingScreen />;
    }

    // メインアプリケーション
    return (
        <CssBaseline>
            {/* 全てのデータがロードされたらルーターをレンダリング */}
            <RouterProvider router={router} />
        </CssBaseline>
    );
}

export default App;