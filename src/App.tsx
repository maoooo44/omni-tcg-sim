/**
 * src/App.tsx
 * * アプリケーションのルートコンポーネント。
 * 全てのZustandストアを初期化し、useInitialLoadフックでIndexedDBからのデータロード完了を監視します。
 * ロード完了後は、TanStack Routerを通じてアプリケーションのルーティング構造全体をレンダリングします。
 */

import { RouterProvider } from '@tanstack/react-router';
import { router } from './router';
import { useInitialLoad } from './hooks/useInitialLoad'; 
// ロード画面を切り出したコンポーネントをインポート
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
    console.log("[App] 💡 Initializing Zustand Stores...");
    console.log("[App] - CardPool Store Hook...");
    useCardPool();      
    console.log("[App] - Deck Store Hook...");
    useDeckStore();     
    console.log("[App] - UserData Store Hook...");
    useUserDataStore(); 
    console.log("[App] - Pack Store Hook...");
    usePackStore();     
    console.log("[App] - Currency Store Hook...");
    useCurrencyStore(); 
    
    // 初期ロードフックを呼び出し、ロード完了を待つ 
    const isReady = useInitialLoad(); 
    console.log(`[App] Initial Load Status: isReady=${isReady}`);
    
    // ----------------------------------------------------
    // ロード完了待ち (切り出したコンポーネントを使用)
    // ----------------------------------------------------
    if (!isReady) {
        return <AppLoadingScreen />;
    }
    
    // ----------------------------------------------------
    // メインアプリケーション
    // ----------------------------------------------------
    return (
        <CssBaseline>
            {/* 全てのデータがロードされたらルーターをレンダリング */}
            <RouterProvider router={router} />
        </CssBaseline>
    );
}

export default App;