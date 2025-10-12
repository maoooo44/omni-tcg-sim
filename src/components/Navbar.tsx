/**
 * src/components/Navbar.tsx
 *
 * アプリケーションのグローバルナビゲーションバーです。
 * アプリのタイトル、現在のモード表示 (FREE PLAY, DTCG, GOD MODE)、
 * および主要なページへのナビゲーションリンク（パック管理、カードプール、デッキ構築など）を提供します。
 * データのエクスポート/インポート機能のダイアログ起動ボタンも含まれます。
 */
import React, { useState, useCallback } from 'react';
import {
    AppBar, Toolbar, Typography, Button, Box, IconButton, Tooltip,
    Menu, MenuItem, Divider, Dialog, DialogTitle, DialogContent,
    DialogActions, Alert
} from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import ThreeDRotationIcon from '@mui/icons-material/ThreeDRotation';
import { Link } from '@tanstack/react-router';
import { useShallow } from 'zustand/react/shallow';

// 実際のストアをインポート
import { useUserDataStore, type CurrentDtcgMode } from '../stores/userDataStore';
import { useCardPoolStore } from '../stores/cardPoolStore';

// DataImportExportDialog のインポート
import DataImportExportDialog from './DataImportExportDialog';

// Propsの定義
interface NavbarProps {
    coins: number;
    isDTCGEnabled: boolean;
    isGodMode: boolean;
}

// モードオプションの定義 (FREE -> GODの禁止ロジックはハンドラ側で処理)
const MODE_OPTIONS: { label: string; value: CurrentDtcgMode; helperText: string }[] = [
    { label: 'DTCG モード', value: 'dtcg', helperText: '通常のTCGシミュレーションモード。コイン、パック開封履歴が有効。' },
    { label: 'フリーモード', value: 'free', helperText: '全ての制限を解除し、パック編集・カード編集などが自由になります。' },
    { label: 'ゴッドモード', value: 'god', helperText: '全てを自由にしつつ、シミュレーション結果も編集可能になります。' },
];

const Navbar: React.FC<NavbarProps> = ({ coins, /*isDTCGEnabled, isGodMode*/ }) => {

    const {
        getCurrentMode,
        cheatCount,
        setDTCGMode,
        setGodMode
    } = useUserDataStore(useShallow(state => ({
        getCurrentMode: state.getCurrentMode,
        cheatCount: state.cheatCount,
        setDTCGMode: state.setDTCGMode,
        setGodMode: state.setGodMode,
    })));

    // 実際のストアから resetPool アクションを取得 (カードプール削除に使用)
    const clearCardPool = useCardPoolStore.getState().resetPool;

    // DataImportExportDialog の状態
    const [isIoDialogOpen, setIsIoDialogOpen] = useState(false);
    // 設定プルダウンメニュー用の状態
    const [settingsAnchorEl, setSettingsAnchorEl] = useState<null | HTMLElement>(null);

    // モード切り替え関連の状態
    const [isModeSelectOpen, setIsModeSelectOpen] = useState(false); // モード選択ダイアログ
    const [isWarningOpen, setIsWarningOpen] = useState(false); // 最初の警告ダイアログ
    const [targetMode, setTargetMode] = useState<CurrentDtcgMode | null>(null);
    const [isDoubleConfirmOpen, setIsDoubleConfirmOpen] = useState(false); // 二重確認ダイアログ

    const currentMode = getCurrentMode();
    const safeCoins = (coins || 0);

    const currentModeText = currentMode === 'god'
        ? 'GOD MODE'
        : currentMode === 'dtcg'
            ? `DTCG (¥${safeCoins.toLocaleString()})`
            : 'FREE PLAY';
    const currentModeColor = currentMode === 'god' ? 'error.main' : currentMode === 'dtcg' ? 'success.main' : 'text.secondary';

    // --- メニュー/ダイアログ制御ハンドラ ---
    const handleSettingsMenuOpen = (event: React.MouseEvent<HTMLButtonElement | HTMLElement>) => { setSettingsAnchorEl(event.currentTarget); };
    const handleSettingsMenuClose = () => { setSettingsAnchorEl(null); };

    const handleOpenImportExportDialog = () => {
        handleSettingsMenuClose();
        setIsIoDialogOpen(true);
    };

    const handleOpenModeSelectDialog = () => {
        handleSettingsMenuClose();
        setIsModeSelectOpen(true);
    };
    
    // --- モード切り替えロジック ---

    // 1. モード選択時の処理 (警告/二重確認の開始)
    const handleModeSelection = (newMode: CurrentDtcgMode) => {
        setIsModeSelectOpen(false); // モード選択ダイアログを閉じる

        if (newMode === currentMode) return;

        // FREE -> GOD の禁止
        if (currentMode === 'free' && newMode === 'god') {
             alert('フリーモードからゴッドモードへの切り替えは禁止されています。');
             return;
        }

        setTargetMode(newMode);
        // すべての遷移で警告画面を開く
        setIsWarningOpen(true);
    };

    // 2. 最初の確認後の処理 (二重確認に進むか実行するか)
    const handleFirstConfirmation = useCallback(() => {
        if (!targetMode) return;

        // 厳格な二重確認が必要な遷移: DTCG -> FREE または DTCG -> GOD
        // DTCGモードから離脱する際に、データ整合性やチートの警告を厳しく行う
        if (currentMode === 'dtcg' && (targetMode === 'free' || targetMode === 'god')) {
            setIsWarningOpen(false); // 最初の警告を閉じる
            setIsDoubleConfirmOpen(true); // 二重確認ダイアログを開く
        } else {
            // それ以外の遷移 (FREE/GOD -> DTCG, FREE -> GODは禁止, GOD -> FREEは一発実行)
            // 例： FREE -> DTCG, GOD -> DTCG, GOD -> FREE
            handleModeChangeConfirmed(targetMode);
        }
    }, [targetMode, currentMode]);


    // 3. モード切り替えの最終実行ロジック
    const handleModeChangeConfirmed = useCallback(async (mode: CurrentDtcgMode | null) => {
        if (!mode) return;

        // 破壊的な変更の実行 (DTCG -> FREE)
        if (currentMode !== 'free' && mode === 'free') {
            await clearCardPool();
            console.log('カードプール内の所有カード情報を全て削除しました。');
            // alertは不要（UIのAlertで代替）
        }

        // モードの切り替え実行
        if (mode === 'dtcg') {
            await setDTCGMode(true);
            await setGodMode(false);
        } else if (mode === 'free') {
            await setDTCGMode(false);
            await setGodMode(false);
        } else if (mode === 'god') {
            await setDTCGMode(false);
            await setGodMode(true);
        }

        // UIの状態をリセット
        setIsWarningOpen(false);
        setIsDoubleConfirmOpen(false);
        setTargetMode(null);
    }, [currentMode, clearCardPool, setGodMode, setDTCGMode]);


    // --- ダイアログのコンテンツ生成 ---

    // 警告ダイアログのコンテンツ生成 (全てのモード遷移に対応)
    const getWarningContent = (mode: CurrentDtcgMode | null) => {
        if (!mode) return { title: '', message: '', confirmText: '続行' };
        
        const transition = `${currentMode} -> ${mode}`;

        // (A) DTCG -> FREE (破壊的変更の最初の警告)
        if (transition === 'dtcg -> free') {
            return {
                title: '⚠️ フリーモードへの切り替え警告',
                message: (
                    <>
                        <Alert severity="error" sx={{ mb: 2 }}>
                            **フリーモード**へ切り替える際は、**所有カード情報がすべて削除されます**。
                            この操作は元に戻せません。
                        </Alert>
                        <Typography>
                            よろしいですか？（**次のステップで最終確認を行います**）
                        </Typography>
                    </>
                ),
                confirmText: '次の確認に進む',
            };
        }

        // (B) DTCG/FREE -> GOD (チートモードへの警告)
        if (transition === 'dtcg -> god' || transition === 'free -> god') {
            return {
                title: '🚨 ゴッドモードへの切り替え警告',
                message: (
                    <>
                        <Alert severity="warning" sx={{ mb: 2 }}>
                            **ゴッドモード**は、デバッグ・検証用のチート機能です。
                            このモードに切り替えると、**チートカウンタが1増加**し、あなたの活動履歴として記録されます。（現在のカウント: **{cheatCount}**）
                        </Alert>
                        <Typography>
                            開封結果などのシミュレーション結果を自由に操作できるようになります。よろしいですか？
                            {/* FREE -> GOD はハンドル側で禁止されているが、念のため */}
                            {transition === 'free -> god' && <Alert severity='error'>⚠️ **この遷移は禁止されています。キャンセルしてください。**</Alert>}
                        </Typography>
                    </>
                ),
                confirmText: transition === 'free -> god' ? '続行 (禁止)' : '記録して続行',
                disabled: transition === 'free -> god',
            };
        }

        // (C) FREE/GOD -> DTCG (機能制限・記録開始の警告)
        if (mode === 'dtcg') {
            return {
                title: '❗️ DTCGモードへの切り替え確認',
                message: (
                    <>
                        <Alert severity="info" sx={{ mb: 2 }}>
                            **DTCGモード**は、コインシステム、開封履歴などの**機能制限**と**記録機能**が有効になるモードです。
                            この操作は今後のアプリの動作と記録に影響します。
                        </Alert>
                        <Typography>
                            よろしいですか？（この確認で実行されます）
                        </Typography>
                    </>
                ),
                confirmText: '切り替える',
            };
        }
        
        // (D) GOD -> FREE (警告は出すが二重確認なし)
        if (transition === 'god -> free') {
            return {
                title: '⚠️ フリーモードへの切り替え確認',
                message: (
                    <>
                        <Alert severity="warning" sx={{ mb: 2 }}>
                            ゴッドモードの機能が停止し、フリーモードになります。
                            カードプールは削除されませんが、シミュレーション結果の自由な操作はできなくなります。
                        </Alert>
                        <Typography>
                            切り替えますか？
                        </Typography>
                    </>
                ),
                confirmText: '切り替える',
            };
        }

        return { title: 'モード切り替え確認', message: <Typography>本当に切り替えますか？</Typography>, confirmText: '切り替える' };
    };

    const warningContent = getWarningContent(targetMode);


    // 二重確認ダイアログのコンテンツ生成 (DTCGからの離脱時のみ)
    const getDoubleConfirmContent = (mode: CurrentDtcgMode | null) => {
        if (!mode || currentMode !== 'dtcg' || (mode !== 'free' && mode !== 'god')) {
            return { title: '', message: '', confirmText: '' };
        }
        
        const isToFree = mode === 'free';
        
        return {
            title: `🚨 最終確認：本当に${isToFree ? 'フリー' : 'ゴッド'}モードへ変更しますか？`,
            message: (
                <>
                    <Alert severity="error" sx={{ mb: 2 }}>
                        **最終確認**：DTCGルールが停止し、{isToFree ? '**カードプールが完全に削除されます**。' : '**チートモード（ゴッドモード）**が有効になります。'}
                        この操作は元に戻せません。
                    </Alert>
                    <Typography variant="body1" fontWeight="bold">
                        {isToFree
                            ? '最終確認として、続行ボタンを押すとカードプールが削除された後、フリーモードに切り替わります。'
                            : '最終確認として、続行ボタンを押すとチートカウンタが記録された後、ゴッドモードに切り替わります。'
                        }
                    </Typography>
                </>
            ),
            confirmText: isToFree ? 'カードプールを削除して変更する' : 'チート記録を承諾して変更する',
        };
    };

    const doubleConfirmContent = getDoubleConfirmContent(targetMode);


    // モバイルメニュー用の状態（デスクトップでは非表示）
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => { setAnchorEl(event.currentTarget); };
    const handleMenuClose = () => { setAnchorEl(null); };


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

                {/* 3. ナビゲーションボタン (デスクトップ向け) - 復活 */}
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
                        <MenuItem onClick={handleOpenImportExportDialog}>
                            <FileDownloadIcon sx={{ mr: 1 }} />
                            データのインポート/エクスポート
                        </MenuItem>
                    </Menu>
                </Box>
            </Toolbar>

            {/* --- モード選択ダイアログ (新規追加) --- */}
            <Dialog
                open={isModeSelectOpen}
                onClose={() => setIsModeSelectOpen(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>DTCGモードの変更</DialogTitle>
                <DialogContent dividers>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                        現在のモード: **{currentModeText}**
                    </Typography>
                    {MODE_OPTIONS.map(option => (
                        <Box key={option.value} sx={{ mb: 2, p: 1, border: currentMode === option.value ? '2px solid' : '1px solid', borderColor: currentMode === option.value ? 'primary.main' : 'divider', borderRadius: 1 }}>
                            <Button
                                fullWidth
                                variant={currentMode === option.value ? 'contained' : 'outlined'}
                                onClick={() => handleModeSelection(option.value)}
                                disabled={currentMode === option.value || (currentMode === 'free' && option.value === 'god')}
                                sx={{ justifyContent: 'flex-start', mb: 1 }}
                            >
                                {option.label} {currentMode === option.value && '(現在)'}
                            </Button>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', px: 1 }}>
                                {option.helperText}
                                {currentMode === 'free' && option.value === 'god' && ' (⚠️ この遷移は禁止されています)'}
                            </Typography>
                        </Box>
                    ))}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setIsModeSelectOpen(false)}>閉じる</Button>
                </DialogActions>
            </Dialog>

            {/* モード切り替え警告ダイアログ (最初の確認) */}
            <Dialog
                open={isWarningOpen}
                onClose={() => { setIsWarningOpen(false); setTargetMode(null); }}
            >
                <DialogTitle>{warningContent.title}</DialogTitle>
                <DialogContent>
                    {warningContent.message}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => { setIsWarningOpen(false); setTargetMode(null); }}>
                        キャンセル
                    </Button>
                    {/* 実行か、次の確認ステップに進むかを選択 */}
                    <Button
                        onClick={handleFirstConfirmation}
                        variant="contained"
                        color={targetMode === 'god' ? 'error' : (targetMode === 'free' ? 'warning' : 'primary')}
                        disabled={warningContent.disabled}
                    >
                        {warningContent.confirmText}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* モード切り替え二重確認ダイアログ (DTCGからの離脱時のみ) */}
            <Dialog
                open={isDoubleConfirmOpen}
                onClose={() => { setIsDoubleConfirmOpen(false); setTargetMode(null); }}
            >
                <DialogTitle color="error.main">{doubleConfirmContent.title}</DialogTitle>
                <DialogContent>
                    {doubleConfirmContent.message}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => { setIsDoubleConfirmOpen(false); setTargetMode(null); }}>
                        キャンセル
                    </Button>
                    {/* 最終実行 */}
                    <Button
                        onClick={() => handleModeChangeConfirmed(targetMode)}
                        variant="contained"
                        color="error"
                    >
                        {doubleConfirmContent.confirmText}
                    </Button>
                </DialogActions>
            </Dialog>

            <DataImportExportDialog
                open={isIoDialogOpen}
                onClose={() => setIsIoDialogOpen(false)}
            />
        </AppBar>
    );
};

export default Navbar;