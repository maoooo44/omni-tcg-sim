import React from 'react';
import ArchiveList from '../features/archive/ArchiveList';

/**
 * src/pages/ArchivePage.tsx
 *
 * アーカイブページのルーティング用コンポーネント。
 * 実際のUI表示とロジックはArchiveListに委譲。
 */
const ArchivePage: React.FC = () => {
  return <ArchiveList />;
};

export default ArchivePage;