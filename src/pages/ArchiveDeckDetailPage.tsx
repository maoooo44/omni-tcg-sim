import React from 'react';
import { useParams } from '@tanstack/react-router';
import { Box, Typography, Paper, Grid, Button, Alert, Divider } from '@mui/material';
import RestoreIcon from '@mui/icons-material/Restore';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';

/**
 * src/pages/ArchiveDeckDetailPage.tsx
 *
 * * パックアーカイブの詳細表示ページコンポーネント。
 * このページは、特定の $archiveId に基づくアーカイブパックデータ（deck）をロードし、
 * 閲覧専用のUIで表示するとともに、復元・完全削除の操作機能を提供します。
 *
 * * 責務:
 * 1. URLパラメータ（$archiveId）を取得する。
 * 2. プレースホルダとして、ロード状態やエラー状態を無視した静的なUIをレンダリングする。
 * 3. ページのタイトル、アーカイブメタ情報、主要操作ボタンを配置する。
 * 4. パック詳細、収録カード一覧の表示エリアを確保する。
 */
const ArchiveDeckDetailPage: React.FC = () => {
  // TanStack Routerから $archiveId を取得
  const { archiveId } = useParams({ strict: false });

  // 実際のデータロード（useRouteLoaderなど）は省略

  return (
    <Box sx={{ p: 3, flexGrow: 1 }}>
      {/* ページタイトル */}
      <Typography variant="h4" gutterBottom>
        アーカイブパック詳細
      </Typography>

      {/* アーカイブID表示（デバッグ用・確認用） */}
      <Alert severity="info" sx={{ mb: 2 }}>
        **Archive ID:** {archiveId || '未指定'} - **現在のパス:** /archive/decks/{archiveId || '...'}
      </Alert>

      {/* --- 主要な操作ボタン --- */}
      <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>操作</Typography>
        <Grid container spacing={2}>
          <Grid>
            <Button 
              variant="contained" 
              color="primary" 
              startIcon={<RestoreIcon />}
              // onClick={() => handleRestore(archiveId)} 
            >
              パックとカードを復元
            </Button>
          </Grid>
          <Grid>
            <Button 
              variant="outlined" 
              color="error" 
              startIcon={<DeleteForeverIcon />}
              // onClick={() => handlePermanentDelete(archiveId)} 
            >
              完全削除 (元に戻せません)
            </Button>
          </Grid>
        </Grid>
      </Paper>
      
      <Divider sx={{ my: 3 }} />

      {/* --- 詳細情報表示エリア --- */}
      <Grid container spacing={4}>
        
        {/* 左側: パック情報とメタデータ */}
        <Grid size={{xs:12,md:4}}>
          <Paper elevation={1} sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>パック概要</Typography>
            <Typography variant="subtitle1" color="text.secondary">
              **アーカイブ日時:** 2025/10/30 10:00:00 (プレースホルダ)
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              **アーカイブ種別:** ゴミ箱 (または 履歴)
            </Typography>
            <Box sx={{ mt: 2 }}>
                <Typography>元のパック名: 【プレースホルダ】古代の遺産パック</Typography>
                <Typography>封入枚数: 5枚</Typography>
                <Typography>価格: 500 コイン</Typography>
                {/*  */}
            </Box>
          </Paper>
        </Grid>

        {/* 右側: 収録カードリストのプレースホルダ */}
        <Grid size={{xs:12,md:8}}>
          <Paper elevation={1} sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>収録カードリスト</Typography>
            <Typography color="text.secondary" sx={{ mb: 1 }}>
              このエリアに、アーカイブされた時点の収録カード一覧（deckのCard群）が表示されます。
            </Typography>
            {/* 収録カードのグリッド表示（Placeholder for CardGridDisplay） */}
            <Box sx={{ border: '1px dashed #ccc', height: 300, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <Typography color="text.disabled">
                    Card List Viewer Placeholder
                </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ArchiveDeckDetailPage;