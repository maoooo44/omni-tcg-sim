/**
 * src/pages/PackListPage.tsx
 *
 * * パック管理機能のメインページコンポーネント。
 * このコンポーネントは、ルーティングのコンテキスト内でページ全体のレイアウト（パディング、マージン）を構築し、
 * タイトルを表示し、主要な機能コンポーネントであるPackList（一覧表示UI）と子ルート（Outlet）を配置する責務を担います。
 * データ取得やビジネスロジックは全てPackListフィーチャーに委譲するため、自身は純粋なプレゼンテーション層として機能します。
 *
 * * 責務:
 * 1. ページのルート要素（Box）と基本的な余白、表示領域を定義する。
 * 2. ページのタイトル（Typography: 'パック管理'）を表示する。
 * 3. 実際の機能を提供するコンポーネント（PackList）を埋め込む。
 * 4. 子ルートコンポーネント（PackEditorPageなど）のための Outlet を配置する。
 */
import React from 'react';
import PackList from '../features/packs/PackList';

const PackListPage: React.FC = () => {
  return <PackList />;
};

export default PackListPage;