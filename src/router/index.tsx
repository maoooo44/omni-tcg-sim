/**
* src/router/index.tsx
*
* TanStack Routerを使用したアプリケーションのルーティング設定ファイル。
* 各ページコンポーネントをルートに割り当て、ルートツリーを構成する。
*/
import { createRouter, createRootRoute, Route } from '@tanstack/react-router';
import MainLayout from '../components/layout/MainLayout';

// ページのインポート
import HomePage from '../pages/HomePage';          // ★ 修正: プレースホルダを実ファイルに置き換え
import PackListPage from '../pages/PackListPage';      // パック一覧画面
import PackEditPage from '../pages/PackEditPage';      // パック編集/作成画面
import CardPoolPage from '../pages/CardPoolPage';      // カードプール画面
import PackOpenerPage from '../pages/PackOpenerPage';  // パック開封シミュレータ画面
import DeckListPage from '../pages/DeckListPage';       // デッキ一覧ページ
import DeckEditPage from '../pages/DeckEditPage';       // デッキ編集画面

// ページのプレースホルダ。（他のルートは省略）
// const HomePage = () => <div>ホーム画面</div>; // ★ 削除: 上記で実コンポーネントをインポート
// SettingsPage = () => <div>設定ページ</div>;

// 1. ルート定義の基盤 (Root)
const rootRoute = createRootRoute({
    component: MainLayout, 
});

// 2. Index (ホーム)
const indexRoute = new Route({
    getParentRoute: () => rootRoute,
    path: '/',
    component: HomePage, // ★ 修正: インポートした HomePage コンポーネントを使用
});

// 3. データ管理領域 (/data)
const dataRoute = new Route({
    getParentRoute: () => rootRoute,
    path: 'data',
});

// 3.1. パック一覧ルート (Home)
const packListRoute = new Route({
    getParentRoute: () => dataRoute,
    path: 'packs', // /data/packs
    component: PackListPage, // <= パック一覧画面を表示
});

// 3.2. パック編集/新規作成ルート
const packEditRoute = new Route({
    // 親ルートを packListRoute から dataRoute に変更
    getParentRoute: () => dataRoute, 
    path: 'packs/$packId', // /data/packs/:packId
    component: () => <PackEditPage />, 
});


// 4. ユーザー領域 (/user)
const userRoute = new Route({
    getParentRoute: () => rootRoute,
    path: 'user',
});

interface OpenSearchParams { packId?: string; }
const cardPoolRoute = new Route({ 
    getParentRoute: () => userRoute, 
    path: 'pool', 
    // 実際のコンポーネントを参照
    component: CardPoolPage, 
});
const packOpenerRoute = new Route({
    getParentRoute: () => userRoute,
    path: 'open', 
    // 実際のコンポーネントを参照
    component: PackOpenerPage,
    validateSearch: (search: Record<string, unknown>): OpenSearchParams => ({ packId: search.packId as string | undefined }),
});

const deckListRoute = new Route({ 
    getParentRoute: () => userRoute, 
    path: 'decks', 
    component: DeckListPage,
});
// Props渡しを削除
const deckEditRoute = new Route({ 
    getParentRoute: () => userRoute, 
    path: 'decks/$deckId', 
    component: () => <DeckEditPage />, 
});
//const settingsRoute = new Route({ getParentRoute: () => rootRoute, path: 'settings', component: SettingsPage, });


// 5. ルートツリーの結合
const routeTree = rootRoute.addChildren([
    indexRoute,
    // packEditRoute を dataRoute の直下に追加
    dataRoute.addChildren([packListRoute, packEditRoute]), 
    userRoute.addChildren([
        cardPoolRoute, 
        packOpenerRoute, 
        // deckEditRoute が deckListRoute の子要素となるように修正
        deckListRoute.addChildren([deckEditRoute])
    ]),
    //settingsRoute,
]);

export const router = createRouter({ routeTree, basepath: import.meta.env.BASE_URL,});

declare module '@tanstack/react-router' {
    interface Register {
        router: typeof router;
    }
}