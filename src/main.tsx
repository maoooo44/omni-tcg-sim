/**
 * src/main.tsx
 *
 * * アプリケーションのエントリーポイント（ブートストラップモジュール）。
 * 主な責務は、ReactアプリケーションをDOMにマウントし、レンダリングを開始することです。
 * グローバルな初期化処理（IndexedDBの接続、データロードなど）は、App.tsxおよびカスタムフック（useInitialLoadなど）に委譲されています。
 *
 * * 責務:
 * 1. React, ReactDOM, Appコンポーネントをインポートする。
 * 2. ドキュメント内のルート要素（'#root'）を特定する。
 * 3. ReactDOM.createRootを使用してアプリケーション（Appコンポーネント）をDOMにマウントし、レンダリングを開始する。
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css'


// ルート要素が存在することを確認してからレンダリング
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Failed to find the root element');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);