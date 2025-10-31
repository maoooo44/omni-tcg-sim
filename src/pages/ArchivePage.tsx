import React, { useState } from 'react';
//import { Outlet } from '@tanstack/react-router';
import { Box, Typography, Tabs, Tab } from '@mui/material';
// アーカイブ機能の主要なフィーチャーコンポーネントをインポート
import ArchiveList from '../features/archive/ArchiveList';

// コレクションタイプを定義（ゴミ箱 or 履歴）
type CollectionType = 'trash' | 'history';

/**
 * src/pages/ArchivePage.tsx
 *
 * * アーカイブ機能（ゴミ箱と履歴）のメインページコンポーネント。
 * このコンポーネントは、コレクションタイプ（ゴミ箱/履歴）の切り替えと、
 * ページの基本レイアウト、および主要な機能コンポーネントの配置を責務とします。
 *
 * * 責務:
 * 1. ページのルート要素（Box）と基本的な余白、表示領域を定義する。
 * 2. コレクションタイプ（'trash' / 'history'）を切り替えるTabsコンポーネントを配置する。
 * 3. 実際の機能を提供するコンポーネント（ArchiveList）を埋め込む。
 * 4. 子ルートコンポーネント（閲覧モーダルなど）のための Outlet を配置する。
 */
const ArchivePage: React.FC = () => {
  // 現在選択されているコレクションタイプ
  const [currentCollection, setCurrentCollection] = useState<CollectionType>('trash');

  const handleChange = (_: React.SyntheticEvent, newValue: CollectionType) => {
    setCurrentCollection(newValue);
  };

  return (
    <Box sx={{ p: 3, flexGrow: 1 }}>
      {/* ページタイトルとコレクションタイプのタブ切り替え */}
      <Typography variant="h4" gutterBottom>アーカイブ管理</Typography>
      
      <Tabs value={currentCollection} onChange={handleChange} indicatorColor="primary" textColor="primary">
        <Tab label="ゴミ箱" value="trash" />
        <Tab label="履歴" value="history" />
      </Tabs>
      
      {/* 水平線で区切り */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }} />

      {/* 実際のアーカイブ表示ロジックを担うフィーチャーコンポーネント */}
       <ArchiveList collectionType={currentCollection} />

      {/* 子ルートコンポーネントを表示するためのOutlet（詳細ビューア用） 
      <Box sx={{ mt: 4 }}>
        <Outlet />
      </Box>*/}
    </Box>
  );
};

export default ArchivePage;