/**
* src/main.tsx
* 
* アプリケーションのエントリーポイント。
* Reactのレンダリング開始を行います。
* IndexedDB (Dexie) の初期化と接続は、useInitialLoadフック（または関連サービス）に移管されました。
*/

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
// DB接続ロジックを削除したため、インポートも不要です
// import { db } from './services/database/db.ts'; 

// 🚨 削除: DB接続の try...catch ブロック全体を削除し、App.tsxのロードロジックに任せます。
/*
try {
  db.open();
  console.log("Database connection established successfully.");
} catch (error) {
  console.error("Failed to open database:", error);
}
*/

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