/**
 * src/components/modals/GameModeSwitchModal.tsx
 *
 * useGameModeSwitcher フックで管理されるGameモード切り替えのための
 * 全てのダイアログ（モード選択、警告、二重確認）をレンダリングするコンポーネント。
 * 純粋にUI表示の責務のみを持ち、ロジックはフックから提供されるプロパティに依存する。
 */
import React from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, Box, Typography, /*Alert*/
} from '@mui/material';
// ★ 修正箇所1: フックの呼び出しを削除し、型定義のみインポート
import type { CurrentGameMode } from '../../models/userData'; 

// モードオプションの定義はフック側ではなく、UIコンポーネント側に残す
const MODE_OPTIONS: { label: string; value: CurrentGameMode; helperText: string }[] = [
    { label: 'DTCG モード', value: 'dtcg', helperText: '通常のTCGシミュレーションモード。コイン、パック開封履歴が有効。' },
    { label: 'フリーモード', value: 'free', helperText: '全ての制限を解除し、パック編集・カード編集などが自由になります。' },
    { label: 'ゴッドモード', value: 'god', helperText: '全てを自由にしつつ、シミュレーション結果も編集可能になります。' },
];

// useGameModeSwitcher の戻り値の型 (Navbarから渡されるPropsの型)
interface DialogContentData {
    title: string;
    message: React.ReactNode;
    confirmText: string;
    disabled?: boolean;
}

// ★ 修正箇所2: Navbarから渡される全Propsの型を定義
interface GameModeSwitcherPropsFromParent {
    currentMode: CurrentGameMode;
    currentModeText: string;
    currentModeColor: string;
    cheatCount: number;
    // モーダルの開閉状態
    isModeSelectOpen: boolean;
    isWarningOpen: boolean;
    isDoubleConfirmOpen: boolean;
    targetMode: CurrentGameMode | null;
    // ダイアログの内容
    warningContent: DialogContentData;
    doubleConfirmContent: DialogContentData;
    // ハンドラ (セッター含む)
    setIsModeSelectOpen: (open: boolean) => void;
    handleModeSelection: (newMode: CurrentGameMode) => void;
    handleFirstConfirmation: () => void;
    handleCancel: () => void;
    handleModeChangeConfirmed: () => Promise<void>;
    // coins も Navbar から渡されるため含める
    coins: number; 
}


// ★ 修正箇所3: Propsとしてすべての状態とハンドラを受け取る
const GameModeSwitchModal: React.FC<GameModeSwitcherPropsFromParent> = (props) => {
    
    // ロジックと状態は全てPropsから分割代入
    const {
        currentMode,
        currentModeText,
        isModeSelectOpen,
        isWarningOpen,
        isDoubleConfirmOpen,
        targetMode,
        warningContent,
        doubleConfirmContent,
        setIsModeSelectOpen,
        handleModeSelection,
        handleFirstConfirmation,
        handleCancel,
        handleModeChangeConfirmed,
    } = props; 

    // --- モード選択ダイアログ ---
    const ModeSelectDialog = (
        <Dialog
            open={isModeSelectOpen} // ★ Propsから受け取った状態を参照
            onClose={() => setIsModeSelectOpen(false)}
            maxWidth="sm"
            fullWidth
        >
            <DialogTitle>Gameモードの変更</DialogTitle>
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
    );

    // --- 警告ダイアログ (最初の確認) ---
    const WarningDialog = (
        <Dialog
            open={isWarningOpen}
            onClose={handleCancel}
        >
            <DialogTitle>{warningContent.title}</DialogTitle>
            <DialogContent>
                {warningContent.message}
            </DialogContent>
            <DialogActions>
                <Button onClick={handleCancel}>
                    キャンセル
                </Button>
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
    );

    // --- 二重確認ダイアログ (DTCGからの離脱時のみ) ---
    const DoubleConfirmDialog = (
        <Dialog
            open={isDoubleConfirmOpen}
            onClose={handleCancel}
        >
            <DialogTitle color="error.main">{doubleConfirmContent.title}</DialogTitle>
            <DialogContent>
                {doubleConfirmContent.message}
            </DialogContent>
            <DialogActions>
                <Button onClick={handleCancel}>
                    キャンセル
                </Button>
                <Button
                    onClick={handleModeChangeConfirmed}
                    variant="contained"
                    color="error"
                >
                    {doubleConfirmContent.confirmText}
                </Button>
            </DialogActions>
        </Dialog>
    );

    return (
        <>
            {ModeSelectDialog}
            {isWarningOpen && WarningDialog}
            {isDoubleConfirmOpen && DoubleConfirmDialog}
        </>
    );
};

export default GameModeSwitchModal;