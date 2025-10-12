// src/pages/HomePage.tsx

import React from 'react';
import { Box, Grid, Typography, Paper, Button, Alert, Divider } from '@mui/material';
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard'; // パック管理
import OpenInNewIcon from '@mui/icons-material/OpenInNew';      // パック開封
import InventoryIcon from '@mui/icons-material/Inventory';      // カードプール
import StyleIcon from '@mui/icons-material/Style';              // デッキ管理
import SettingsIcon from '@mui/icons-material/Settings';        // 設定・データ管理

import { Link } from '@tanstack/react-router'; 
import { useShallow } from 'zustand/react/shallow';
// 状態ストア
import { useCardPoolStore } from '../stores/cardPoolStore';
import { useCurrencyStore } from '../stores/currencyStore';
import { useDeckStore } from '../stores/deckStore';
import { useUserDataStore } from '../stores/userDataStore';
import { usePackStore } from '../stores/packStore'; // ★ 修正 1: usePackStoreのインポートを追加

const HomePage: React.FC = () => {
    // 状態の取得
    const { packs } = usePackStore(useShallow(state => ({ packs: state.packs }))); // ★ usePackStoreを使用
    const { totalOwnedCards, ownedCardsSize } = useCardPoolStore(useShallow(state => ({
        totalOwnedCards: state.totalOwnedCards,
        ownedCardsSize: state.ownedCards.size,
    })));
    const { decksCount } = useDeckStore(useShallow(state => ({ decksCount: state.decks.length })));
    const { coins } = useCurrencyStore(useShallow(state => ({ coins: state.coins })));
    const { isGodMode, /*isDTCGEnabled*/ } = useUserDataStore(useShallow(state => ({ // ★ エラー箇所 1 の原因はインポート漏れ
        isGodMode: state.isGodMode,
        isDTCGEnabled: state.isDTCGEnabled,
    })));
    
    // 機能カードの共通コンポーネント (コードの簡略化のため内部で定義)
    const FeatureCard: React.FC<{ 
        title: string, 
        subtitle: string, 
        stat: React.ReactNode, // 統計情報（文字列またはコンポーネント）
        path: string, 
        buttonText: string, 
        icon: React.ReactElement<any> // ★ 修正 2: 型エラー回避のため any を使用
    }> = ({ title, subtitle, stat, path, buttonText, icon }) => (
        <Paper elevation={2} sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                {/* ★ 修正 2: cloneElement の呼び出しに問題なし。型定義の変更でエラー回避 */}
                {React.cloneElement(icon, { sx: { mr: 1, fontSize: 30, color: 'primary.main' } })}
                <Typography variant="h5" component="h2">
                    {title}
                </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                {subtitle}
            </Typography>
            <Typography variant="h6" color="text.primary" sx={{ my: 1, flexGrow: 1 }}>
                {stat}
            </Typography>
            <Button 
                component={Link} 
                to={path} 
                fullWidth 
                variant="contained" 
                size="medium"
            >
                {buttonText}
            </Button>
        </Paper>
    );

    return (
        <Box sx={{ mt: 2 }}>
            <Typography variant="h3" component="h1" gutterBottom>
                🃏 OmniTCGSim
            </Typography>
            <Typography variant="h6" color="text.secondary" gutterBottom>
                デジタルTCG資産管理シミュレータ
            </Typography>

            <Divider sx={{ my: 3 }} />

            {/* 1. 警告/免責事項エリア (重要なので上部に残す) */}
            <Alert severity="warning" sx={{ mb: 3 }}>
                本アプリは**私的利用**を目的としたシミュレータです。**データは全てユーザー自身で用意**してください。著作権侵害を避けるため、既存TCGのデータを不特定多数に**配布することは厳禁**です。
            </Alert>

            {/* 2. 主要機能ブロック (指定された順序で2x2グリッドに配置) */}
            <Grid container spacing={4}>
                
                {/* 1. パック管理 - 左上 */}
                <Grid size={6}>
                    <FeatureCard 
                        title="パック管理" 
                        subtitle="シミュレータのベースデータを作成・編集します。" 
                        stat={`収録データ: ${packs.length.toLocaleString()} 種類`}
                        path="/data/packs"
                        buttonText="パック一覧へ"
                        icon={<CardGiftcardIcon />}
                    />
                </Grid>

                {/* 2. パック開封 - 右上 */}
                <Grid size={6}>
                    <FeatureCard 
                        title="パック開封" 
                        subtitle="作成したパックの開封シミュレーションを実行します。" 
                        stat="あなたの資産を増やす"
                        path="/user/open"
                        buttonText="開封シミュレータへ"
                        icon={<OpenInNewIcon />}
                    />
                </Grid>

                {/* 3. カードプール - 左下 */}
                <Grid size={6}>
                    <FeatureCard 
                        title="カードプール" 
                        subtitle="開封結果がここに反映されます。所有カードの資産状況です。" 
                        stat={
                            <>
                                総所有枚数: **{totalOwnedCards.toLocaleString()}枚**
                                <br/>
                                ユニーク種数: {ownedCardsSize.toLocaleString()}種
                            </>
                        }
                        path="/user/pool"
                        buttonText="カードプールを確認"
                        icon={<InventoryIcon />}
                    />
                </Grid>

                {/* 4. デッキ管理 - 右下 */}
                <Grid size={6}>
                    <FeatureCard 
                        title="デッキ管理" 
                        subtitle="所有カードからデッキを構築・保存します。" 
                        stat={`構築済みデッキ: ${decksCount.toLocaleString()}個`}
                        path="/user/decks"
                        buttonText="デッキ編集へ"
                        icon={<StyleIcon />}
                    />
                </Grid>
            </Grid>

            {/* 3. その他の重要な導線/ステータス */}
            <Typography variant="h5" gutterBottom sx={{ mt: 5 }}>
                その他の機能
            </Typography>
            <Grid container spacing={2}>
                <Grid size={4}>
                    <Button component={Link} to="/settings" fullWidth variant="outlined" startIcon={<SettingsIcon />} sx={{ py: 1.5 }}>
                        設定・データ管理
                    </Button>
                </Grid>
                <Grid size={4}>
                    <Paper sx={{ p: 1.5, textAlign: 'center' }}>
                        <Typography variant="body1" color="text.secondary">
                            ゲーム内通貨: **{coins.toLocaleString()} G**
                        </Typography>
                    </Paper>
                </Grid>
                <Grid size={4}>
                    <Paper sx={{ p: 1.5, textAlign: 'center' }}>
                        <Typography variant="body1" color={isGodMode ? 'error.main' : 'text.secondary'}>
                            ステータス: {isGodMode ? '⚠️ ゴッドモード有効' : '✅ 通常モード'}
                        </Typography>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

export default HomePage;