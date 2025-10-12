// src/features/pack-management/PackListDisplay.tsx

import React, { useEffect } from 'react'; // ★ 修正: useEffect をインポート
import { useNavigate } from '@tanstack/react-router'; 
import { Grid, Card, CardContent, Typography, CardActionArea, Box, CardMedia } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { usePackStore } from '../../stores/packStore'; 
import { useShallow } from 'zustand/react/shallow';
import { 
    getDisplayImageUrl, 
    DEFAULT_PACK_DECK_WIDTH as PACK_CARD_WIDTH,
    DEFAULT_PACK_DECK_HEIGHT as PACK_CARD_HEIGHT
} from '../../utils/imageUtils'; 

// 新しいフィーチャーコンポーネント: データ取得と描画ロジックをカプセル化
const PackListDisplay: React.FC = () => {
  // 1. データ取得
  // 💡 fetchPacks -> loadPacks に統一して修正
  const { packs, initializeNewPackEditing, loadPacks } = usePackStore(useShallow(state => ({ // ★ 修正: loadPacks を取得
    packs: state.packs,
    initializeNewPackEditing: state.initializeNewPackEditing,
    loadPacks: state.loadPacks, // ★ 修正: ストアからリスト再取得関数を loadPacks に修正
  })));
  // 2. ナビゲーションロジック
  const navigate = useNavigate();

  // ★ 修正: コンポーネントがマウントされたとき、および依存配列が変更されたときにパックリストをロード
  useEffect(() => {
    loadPacks(); // ★ パック一覧を強制的にロード/再ロード (loadPacks に修正)
    // 依存配列は空で、マウント時に一度だけ実行される
    // ただし、PackEditPageから戻ってきた際の更新を確実にするため、
    // ここでは依存配列を空にします。
    // 💡 もしZustandストア内でパックリストの初期ロードがマウント時に自動で行われていなければ、この記述が必要です
  }, [loadPacks]); // loadPacksが安定している前提

  // 既存パックをクリックしたときの処理
  const handleSelectPack = (packId: string) => {
    // ナビゲーションロジックはフィーチャー層で完結
    navigate({ to: `/data/packs/$packId`, params: { packId } });
  };
  
  // 新規作成カードが押されたときの処理
  const handleNewPack = () => {
    // 💡 修正: 'create'文字列への遷移を削除し、即時ID生成＆即時遷移ロジックに置き換え
    // 1. Storeで新規パックを初期化し、UUIDを取得
    const newPackId = initializeNewPackEditing(); 
    
    // 2. 取得したUUIDで編集ページに即時遷移
    navigate({ to: `/data/packs/$packId`, params: { packId: newPackId } }); 
  };

  // 定数: プレースホルダーオプション (UI描画のためのヘルパー)
  const PACK_PLACEHOLDER_OPTIONS = {
    width: PACK_CARD_WIDTH,
    height: PACK_CARD_HEIGHT,
    bgColor: 'cccccc',
  };

  return (
    // 3. UI描画ロジック
    <Box>
      <Grid container spacing={3}>
        
        {/* 新規パック作成用の + ボタン */}
        <Grid size={{ xs: 6, sm: 4, md: 3 }} sx={{ display: 'flex', justifyContent: 'center' }}>
            <Card 
                sx={{ 
                    width: PACK_CARD_WIDTH, 
                    height: PACK_CARD_HEIGHT,
                    cursor: 'pointer',
                    boxShadow: 1, 
                    border: '2px dashed #ccc',
                }}
                onClick={handleNewPack} // ナビゲーションハンドラを使用
            >
                <CardActionArea sx={{ 
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    justifyContent: 'center', 
                    alignItems: 'center' 
                }}>
                    <AddIcon sx={{ fontSize: 60, color: '#ccc' }} />
                    <Typography variant="subtitle1" color="text.secondary">
                        新規パックを作成
                    </Typography>
                </CardActionArea>
            </Card>
        </Grid>
        
        {/* 既存のパック一覧のマップ処理は省略 */}
        {packs.map((pack) => (
            // ... (既存パックのレンダリング)
            <Grid size={{ xs: 6, sm: 4, md: 3 }} key={pack.packId} sx={{ display: 'flex', justifyContent: 'center' }}>
                <Card 
                    sx={{ 
                        width: PACK_CARD_WIDTH, 
                        height: PACK_CARD_HEIGHT,
                        cursor: 'pointer',
                        boxShadow: 1, 
                    }}
                    onClick={() => handleSelectPack(pack.packId)}
                >
                    <CardActionArea sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <CardMedia
                            component="img"
                            image={getDisplayImageUrl(
                                pack.imageUrl,
                                { 
                                    ...PACK_PLACEHOLDER_OPTIONS, 
                                    text: pack.name, 
                                }
                            )}
                            alt={pack.name}
                            sx={{ height: 150, objectFit: 'cover' }}
                        />
                        <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
                            <Typography variant="subtitle1" noWrap>{pack.name}</Typography>
                            <Typography variant="caption" color="text.secondary">
                                {pack.series} | {pack.cardsPerPack}枚
                            </Typography>
                        </CardContent>
                    </CardActionArea>
                </Card>
            </Grid>
        ))}

      </Grid>
    </Box>
  );
};

export default PackListDisplay;