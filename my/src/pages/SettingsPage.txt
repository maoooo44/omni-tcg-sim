// src/pages/SettingsPage.tsx
import React from 'react';

const SettingsPage: React.FC = () => {
  return (
    <div>
      <h2>⚙️ 設定</h2>
      <p>
        **フェーズ3** で実装されます。
        アプリケーションの全体設定や、DTCG要素に関するカスタムルールの設定を行います。
      </p>
      
      <ul style={{ listStyleType: 'none', padding: 0 }}>
        <li>[テーマ/言語設定]</li>
        <li>[著作権に関する情報表示]</li>
        <li>[DTCG要素の設定（ゲーム内通貨の初期値、ゴッドモードのリセットなど）]</li>
      </ul>
    </div>
  );
};

export default SettingsPage;