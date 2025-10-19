/**
 * src/components/layouts/Navbar.tsx
 *
 * アプリケーションのグローバルナビゲーションバー。
 * 純粋にUIのレイアウトと、ナビゲーション、外部ダイアログの起動ボタンの責務を持つ。
 * DTCGモードのロジックは useModeSwitcher に、ダイアログUIは GameModeSwitchModal に分離されている。
 */
import React, { useState } from 'react';
import {
    AppBar, Toolbar, Typography, Button, Box, IconButton, Tooltip,
    Menu, MenuItem, Divider,
    // Switch, FormControlLabel は isAllViewMode 関連の削除に伴い不要
} from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import ThreeDRotationIcon from '@mui/icons-material/ThreeDRotation';
// VisibilityIcon は isAllViewMode 関連の削除に伴い不要
import { Link } from '@tanstack/react-router';

// ★ 修正: useGameModeSwitcher から useModeSwitcher へリネーム
import { useModeSwitcher } from '../../hooks/useModeSwitcher';

// ★ 修正: 切り出したダイアログコンポーネントをインポート
import DataIOModal from '../../features/data-io/components/DataIOModal';
import GameModeSwitchModal from '../modals/GameModeSwitchModal';

// Propsの定義を簡素化
interface NavbarProps {
    coins: number;
}

const Navbar: React.FC<NavbarProps> = ({ coins }) => {

    // ★ 修正箇所1: フックの戻り値を modeSwitcherProps として全て取得する
    const modeSwitcherProps = useModeSwitcher(coins);
    
    // 必要な状態・セッターを modeSwitcherProps から分割代入
    const {
        currentModeText,
        currentModeColor,
        setIsModeSelectOpen, // モード選択ダイアログを開くハンドラ
    // 💡 修正: isAllViewMode, setAllViewMode 関連の処理を全て削除
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
    
    // 💡 修正: 全データ表示モードの切り替えハンドラを削除
    
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
                    <Button color="inherit" component={Link} to="/data/packs">パック管理</Button>
                    <Button color="inherit" component={Link} to="/user/open">パック開封</Button>
                    <Button color="inherit" component={Link} to="/user/pool">カードプール</Button>
                    <Button color="inherit" component={Link} to="/user/decks">デッキ構築</Button>

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
                    
                    {/* 💡 修正: 全データ表示モードのトグルスイッチの MenuItem を削除 */}
                    

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
                        <MenuItem onClick={handleMenuClose} component={Link} to="/data/packs">パック管理</MenuItem>
                        <MenuItem onClick={handleMenuClose} component={Link} to="/user/open">パック開封</MenuItem>
                        <MenuItem onClick={handleMenuClose} component={Link} to="/user/pool">カードプール</MenuItem>
                        <MenuItem onClick={handleMenuClose} component={Link} to="/user/decks">デッキ構築</MenuItem>

                        <Divider />

                        {/* モード切り替えとデータI/Oを統合 */}
                        <MenuItem onClick={handleOpenModeSelectDialog}>
                            <ThreeDRotationIcon sx={{ mr: 1 }} />
                            **DTCG モード切り替え**
                        </MenuItem>
                        
                        {/* 💡 修正: モバイルメニューの全データ表示モードのトグルスイッチを削除 */}

                        <MenuItem onClick={handleOpenImportExportDialog}>
                            <FileDownloadIcon sx={{ mr: 1 }} />
                            データのインポート/エクスポート
                        </MenuItem>
                    </Menu>
                </Box>
            </Toolbar>

            {/* --- 外部コンポーネントに委譲されたダイアログ --- */}

            <GameModeSwitchModal
                // ★ 修正箇所2: フックから取得した全ての状態とハンドラをPropsとして渡す
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