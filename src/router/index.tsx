/**
 * src/router/index.tsx
 *
 * * TanStack Routerを使用したアプリケーションのメインルーティング設定ファイル。
 * RootLayout（MainLayout）を基盤とし、アプリケーションの主要なリソース（/packs, /decks, /pool）および機能（/open, /archive）を
 * ルート直下に配置したルートツリーを構成します。
 * 各ルートでは、対応するページコンポーネントを割り当て、ルーティング時のパラメータやクエリの型定義を行います。
 *
 * * 責務:
 * 1. TanStack Routerの createRouter, createRootRoute を使用し、ルート構造を定義する。
 * 2. Rootルートに共通レイアウト（MainLayout）を割り当てる。
 * 3. アプリケーションの主要なページコンポーネントを対応するパスに割り当てる。
 * 4. パスパラメータ（$packId, $deckId）やクエリパラメータ（packId）の型安全な定義を組み込む。
 * 5. ルートツリーを構築し、エクスポートする。
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
import ArchivePage from '../pages/ArchivePage';
import ArchivePackDetailPage from '../pages/ArchivePackDetailPage';
import ArchiveDeckDetailPage from '../pages/ArchiveDeckDetailPage';

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

// 3. パック管理ルート群 (ルート直下)
// 3.1. パック一覧ルート 
const packListRoute = new Route({
    getParentRoute: () => rootRoute,
    path: 'packs', // /packs
    component: PackListPage,
});

// 3.2. パック編集/新規作成ルート
const packEditorRoute = new Route({
    getParentRoute: () => rootRoute,
    path: 'packs/$packId', // /packs/:packId
    component: PackEditorPage,
});

// 4. デッキ管理ルート群 (ルート直下)
const deckListRoute = new Route({
    getParentRoute: () => rootRoute,
    path: 'decks', // /decks
    component: DeckListPage,
});

// デッキ編集ルート (一覧とは並列)
const deckEditorRoute = new Route({
    getParentRoute: () => rootRoute,
    path: 'decks/$deckId', // /decks/:deckId
    component: DeckEditorPage,
});

// 5. ユーザー機能・資産管理ルート群 (ルート直下)
interface OpenSearchParams { packId?: string; }
const cardPoolRoute = new Route({
    getParentRoute: () => rootRoute,
    path: 'pool', // /pool
    component: CardPoolPage,
});

const packOpenerRoute = new Route({
    getParentRoute: () => rootRoute,
    path: 'open', // /open
    component: PackOpenerPage,
    // クエリパラメータの型安全な定義
    validateSearch: (search: Record<string, unknown>): OpenSearchParams => ({ packId: search.packId as string | undefined }),
});

// 6. アーカイブ管理ルート (新規追加)
const archiveRoute = new Route({
    getParentRoute: () => rootRoute,
    path: 'archive', // /archive
    component: ArchivePage,
});

// アーカイブパック詳細ルート
const archivePackDetailRoute = new Route({
    getParentRoute: () => rootRoute,
    // パスパラメータを $archiveId に修正
    path: 'archive/packs/$archiveId', // /archive/packs/:archiveId
    component: ArchivePackDetailPage, 
});

// アーカイブデッキ詳細ルート
const archiveDeckDetailRoute = new Route({
    getParentRoute: () => rootRoute,
    path: 'archive/decks/$archiveId', // /archive/decks/:archiveId
    component: ArchiveDeckDetailPage, 
});


// 7. ルートツリーの結合
const routeTree = rootRoute.addChildren([
    indexRoute,

    // パック管理
    packListRoute,
    packEditorRoute,

    // デッキ管理
    deckListRoute,
    deckEditorRoute,

    // 機能・資産管理
    cardPoolRoute,
    packOpenerRoute,

    // アーカイブ
    archiveRoute,
    archivePackDetailRoute,
    archiveDeckDetailRoute,
]);

export const router = createRouter({ routeTree, basepath: import.meta.env.BASE_URL, });

declare module '@tanstack/react-router' {
    interface Register {
        router: typeof router;
    }
}