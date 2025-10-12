// src/pages/HomePage.tsx
import React from 'react';
import { Link } from '@tanstack/react-router';

const HomePage: React.FC = () => {
  return (
    <div style={{ textAlign: 'center', padding: '50px' }}>
      <h2>ようこそ！ Omni-TCG-Sim へ</h2>
      <p>このアプリケーションは、汎用的なTCGのデータ作成、開封シミュレーション、資産管理、デッキ構築を可能にします。</p>
      
      <div style={{ marginTop: '30px', display: 'flex', justifyContent: 'center', gap: '20px' }}>
        <Link to="/data/packs" style={buttonStyle}>📦 パックデータの作成・管理 (フェーズ1)</Link>
        <Link to="/user/open" style={buttonStyle}>🃏 パックを開封して遊ぶ (フェーズ2)</Link>
      </div>
      
      <p style={{ marginTop: '50px', fontSize: 'small', color: '#666' }}>
        ※全てのパック・カードデータはユーザー自身で用意する必要があります。
      </p>
    </div>
  );
};

const buttonStyle: React.CSSProperties = {
  padding: '10px 20px',
  backgroundColor: '#007bff',
  color: 'white',
  textDecoration: 'none',
  borderRadius: '5px',
  fontWeight: 'bold',
};

export default HomePage;