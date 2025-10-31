/**
* src/components/layouts/Navbar.tsx
*
* アプリケーションのグローバルナビゲーションバーコンポーネント。
* * 責務:
* 1. 固定されたナビゲーションメニュー（パック管理、開封、プール、デッキ構築）を提供する。
* 2. アプリケーションのグローバル設定項目（モード切替、データI/O）へのエントリーポイント（IconButton/Menu）を提供する。
* 3. 実行中のゲームモードとユーザーの所持コイン（Props経由）を表示する。
* 4. 複雑なロジック（モード切替）はカスタムフックに、UI（ダイアログ）は外部コンポーネントに委譲し、純粋なUIレイアウトとイベントハンドリングに集中する。
*/
import React, { useState } from 'react';
import {
    AppBar, Toolbar, Typography, Button, Box, IconButton, Tooltip,
    Menu, MenuItem, Divider,
} from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import ThreeDRotationIcon from '@mui/icons-material/ThreeDRotation';
import { Link } from '@tanstack/react-router';

// useModeSwitcher にリネーム済みフックをインポート
import { useModeSwitcher } from '../../hooks/useModeSwitcher';

// 切り出したダイアログコンポーネントをインポート
import DataIOModal from '../../features/data-io/components/DataIOModal';
import GameModeSwitchModal from '../modals/GameModeSwitchModal';

// Propsの定義
interface NavbarProps {
    coins: number;
}

const Navbar: React.FC<NavbarProps> = ({ coins }) => {

    // フックの戻り値を modeSwitcherProps として全て取得
    const modeSwitcherProps = useModeSwitcher(coins);

    // 必要な状態・セッターを modeSwitcherProps から分割代入
    const {
        currentModeText,
        currentModeColor,
        setIsModeSelectOpen, // モード選択ダイアログを開くセッター
    } = modeSwitcherProps;

    // DataImportExportDialog の状態
    const [isIoDialogOpen, setIsIoDialogOpen] = useState(false);
    // 設定プルダウンメニュー用の状態
    const [settingsAnchorEl, setSettingsAnchorEl] = useState<null | HTMLElement>(null);

    // モバイルメニュー用の状態
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => { setAnchorEl(event.currentTarget); };
    const handleMenuClose = () => { setAnchorEl(null); };


    // --- メニュー/ダイアログ制御ハンドラ ---
    const handleSettingsMenuOpen = (event: React.MouseEvent<HTMLButtonElement | HTMLElement>) => { setSettingsAnchorEl(event.currentTarget); };
    const handleSettingsMenuClose = () => { setSettingsAnchorEl(null); };

    const handleOpenImportExportDialog = () => {
        handleSettingsMenuClose();
        setIsIoDialogOpen(true);
    };

    const handleOpenModeSelectDialog = () => {
        handleSettingsMenuClose();
        setIsModeSelectOpen(true); // フックのセッターを使用
    };

    return (
        <AppBar position="static" color="primary">
            <Toolbar>

                {/* 1. タイトル/ホームリンク */}
                <Typography variant="h6" component={Link} to="/" sx={{ flexGrow: 1, textDecoration: 'none', color: 'inherit' }}>
                    TCG Builder
                </Typography>

                {/* 2. モード表示 (モバイルでは非表示) */}
                <Box sx={{ flexGrow: 1, display: { xs: 'none', sm: 'block' } }}>
                    <Typography
                        variant="body1"
                        sx={{ ml: 2, fontWeight: 'bold', color: currentModeColor, display: 'inline-block' }}
                    >
                        {currentModeText}
                    </Typography>
                </Box>

                {/* 3. ナビゲーションボタン (デスクトップ向け) */}
                <Box sx={{ display: { xs: 'none', md: 'flex' } }}>
                    <Button color="inherit" component={Link} to="/packs">パック管理</Button>
                    <Button color="inherit" component={Link} to="/open">パック開封</Button>
                    <Button color="inherit" component={Link} to="/pool">カードプール</Button>
                    <Button color="inherit" component={Link} to="/decks">デッキ構築</Button>
                    <Button color="inherit" component={Link} to="/archive">アーカイブ</Button>

                    {/* 設定ボタン (データI/Oとモード切替ボタンを含むプルダウン) */}
                    <Tooltip title="設定 / データ管理">
                        <IconButton
                            color="inherit"
                            onClick={handleSettingsMenuOpen}
                            aria-controls={settingsAnchorEl ? 'settings-menu-desktop' : undefined}
                            aria-haspopup="true"
                        >
                            <SettingsIcon />
                        </IconButton>
                    </Tooltip>
                </Box>

                {/* 設定プルダウンメニューの定義 (デスクトップ/モバイル共通の項目をレンダリング) */}
                <Menu
                    id="settings-menu-desktop"
                    anchorEl={settingsAnchorEl}
                    open={Boolean(settingsAnchorEl)}
                    onClose={handleSettingsMenuClose}
                >
                    {/* 1. モード切り替えボタン (UI変更) */}
                    <MenuItem onClick={handleOpenModeSelectDialog}>
                        <ThreeDRotationIcon sx={{ mr: 1 }} />
                        **DTCG モード切り替え** ({currentModeText})
                    </MenuItem>

                    <Divider />

                    {/* 2. データ I/O セクション (既存機能) */}
                    <MenuItem onClick={handleOpenImportExportDialog}>
                        <FileDownloadIcon sx={{ mr: 1 }} />
                        データのインポート/エクスポート
                    </MenuItem>
                </Menu>


                {/* 5. モバイル向けメニューボタン */}
                <Box sx={{ display: { xs: 'block', md: 'none' } }}>
                    <IconButton
                        color="inherit"
                        onClick={handleMenuOpen}
                        aria-controls={anchorEl ? 'menu-appbar-mobile' : undefined}
                        aria-haspopup="true"
                    >
                        <SettingsIcon />
                    </IconButton>
                    <Menu
                        id="menu-appbar-mobile"
                        anchorEl={anchorEl}
                        open={Boolean(anchorEl)}
                        onClose={handleMenuClose}
                        sx={{ display: { xs: 'block', md: 'none' } }}
                    >
                        {/* モバイルメニュー項目: ナビゲーション */}
                        <MenuItem onClick={handleMenuClose} component={Link} to="/">HOME</MenuItem>
                        <MenuItem onClick={handleMenuClose} component={Link} to="/packs">パック管理</MenuItem>
                        <MenuItem onClick={handleMenuClose} component={Link} to="/open">パック開封</MenuItem>
                        <MenuItem onClick={handleMenuClose} component={Link} to="/pool">カードプール</MenuItem>
                        <MenuItem onClick={handleMenuClose} component={Link} to="/decks">デッキ構築</MenuItem>
                        <MenuItem onClick={handleMenuClose} component={Link} to="/archive">アーカイブ</MenuItem>

                        <Divider />

                        {/* モード切り替えとデータI/Oを統合 */}
                        <MenuItem onClick={handleOpenModeSelectDialog}>
                            <ThreeDRotationIcon sx={{ mr: 1 }} />
                            **DTCG モード切り替え**
                        </MenuItem>

                        <MenuItem onClick={handleOpenImportExportDialog}>
                            <FileDownloadIcon sx={{ mr: 1 }} />
                            データのインポート/エクスポート
                        </MenuItem>
                    </Menu>
                </Box>
            </Toolbar>

            {/* --- 外部コンポーネントに委譲されたダイアログ --- */}

            <GameModeSwitchModal
                // modeSwitcherPropsから全ての状態とハンドラを渡す
                {...modeSwitcherProps}
                coins={coins} // coinsもそのまま渡す
            />

            <DataIOModal
                open={isIoDialogOpen}
                onClose={() => setIsIoDialogOpen(false)}
            />
        </AppBar>
    );
};

export default Navbar;