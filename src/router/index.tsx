/**
 * src/router/index.tsx
 *
 * TanStack Routerを使用したアプリケーションのルーティング設定ファイル。
 * 各ページコンポーネントをルートに割り当て、ルートツリーを構成する。
 */
import { createRouter, createRootRoute, Route } from '@tanstack/react-router';
import MainLayout from '../components/layouts/MainLayout';

// ページのインポート
import HomePage from '../pages/HomePage';          
import PackListPage from '../pages/PackListPage';      
import PackEditorPage from '../pages/PackEditorPage';      
import CardPoolPage from '../pages/CardPoolPage';      
import PackOpenerPage from '../pages/PackOpenerPage';  
import DeckListPage from '../pages/DeckListPage';       
import DeckEditorPage from '../pages/DeckEditorPage';       

// 1. ルート定義の基盤 (Root)
const rootRoute = createRootRoute({
    component: MainLayout, 
});

// 2. Index (ホーム)
const indexRoute = new Route({
    getParentRoute: () => rootRoute,
    path: '/',
    component: HomePage, 
});

// 3. データ管理領域 (/data)
const dataRoute = new Route({
    getParentRoute: () => rootRoute,
    path: 'data',
});

// 3.1. パック一覧ルート 
const packListRoute = new Route({
    getParentRoute: () => dataRoute,
    path: 'packs', // /data/packs
    component: PackListPage, 
});

// 3.2. パック編集/新規作成ルート
const packEditorRoute = new Route({
    getParentRoute: () => dataRoute, 
    path: 'packs/$packId', // /data/packs/:packId
    component: PackEditorPage, // ラッパーを外し、直接コンポーネントを参照
    //component: () => <PackEditorPage />, 
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
    component: CardPoolPage, 
});
const packOpenerRoute = new Route({
    getParentRoute: () => userRoute,
    path: 'open', 
    component: PackOpenerPage,
    // クエリパラメータの型安全な定義
    validateSearch: (search: Record<string, unknown>): OpenSearchParams => ({ packId: search.packId as string | undefined }),
});

const deckListRoute = new Route({ 
    getParentRoute: () => userRoute, 
    path: 'decks', 
    component: DeckListPage,
});

const deckEditorRoute = new Route({ 
    getParentRoute: () => userRoute, // userRouteの子ルートとして定義
    path: 'decks/$deckId', // /user/decks/:deckId
    component: DeckEditorPage, // ラッパーを外し、直接コンポーネントを参照
    //component: () => <DeckEditorPage />, 
});


// 5. ルートツリーの結合
const routeTree = rootRoute.addChildren([
    indexRoute,
    dataRoute.addChildren([packListRoute, packEditorRoute]), 
    userRoute.addChildren([
        cardPoolRoute, 
        packOpenerRoute, 
        deckListRoute.addChildren([deckEditorRoute])
    ]),
]);

export const router = createRouter({ routeTree, basepath: import.meta.env.BASE_URL,});

declare module '@tanstack/react-router' {
    interface Register {
        router: typeof router;
    }
}