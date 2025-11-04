/**
 * src/components/modals/GameModeSwitchModal.tsx
 *
 * useModeSwitcherフックで管理されるGameモード切り替えのための
 * 全てのダイアログ（モード選択、警告、二重確認）をレンダリングするコンポーネント。
 * 純粋にUI表示の責務のみを持ち、ロジックはフックから提供されるプロパティに依存する。
 *
 * * 責務:
 * 1. Mode切り替えに必要な3種類のダイアログ（選択、警告、二重確認）のJSX構造を定義し、フックからのProps（開閉状態、コンテンツ、ハンドラ）に基づいてレンダリングする。
 * 2. モード選択ダイアログにおいて、利用可能なモードの表示（`MODE_OPTIONS`）と、現在のモードの強調表示、遷移禁止のUI表現を行う。
 * 3. ダイアログコンテンツ（警告、二重確認）のメッセージ内のマークダウン類似の強調表示（`**text**`）をHTMLに変換して表示する。
 */
import React from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, Box, Typography, Alert,
} from '@mui/material';
import type { CurrentGameMode } from '../../models/models';
import type { DialogContentData, ModeSwitcher } from '../../hooks/useModeSwitcher';


// モードオプションの定義はフック側ではなく、UIコンポーネント側に残す
const MODE_OPTIONS: { label: string; value: CurrentGameMode; helperText: string }[] = [
    { label: 'DTCG モード', value: 'dtcg', helperText: '通常のTCGシミュレーションモード。コイン、パック開封履歴が有効。' },
    { label: 'フリーモード', value: 'free', helperText: '全ての制限を解除し、パック編集・カード編集などが自由になります。' },
    { label: 'ゴッドモード', value: 'god', helperText: '全てを自由にしつつ、シミュレーション結果も編集可能になります。' },
];

// ★ 修正箇所: Propsの型を ModeSwitcher をベースに定義する
interface GameModeSwitcherPropsFromParent extends ModeSwitcher {
    // ModeSwitcherの戻り値には含まれないが、親コンポーネントから渡されるプロパティを追加
    coins: number;
}


/**
 * 汎用的なダイアログコンテンツをレンダリングするヘルパーコンポーネント
 */
const DialogContentRenderer: React.FC<{ content: DialogContentData }> = ({ content }) => {

    const { message } = content;
    // **テキスト**を<strong>タグに置換する簡易ヘルパー
    const replaceBold = (text: string) => text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    return (
        <DialogContent dividers>
            {/* メインアラート */}
            {message.alertText && (
                <Alert severity={message.alertSeverity} sx={{ mb: 2 }}>
                    {/* titleはダイアログタイトルと重複するため AlertTitle は不要 */}
                    {/* <AlertTitle>{content.title}</AlertTitle> */}
                    <span dangerouslySetInnerHTML={{ __html: replaceBold(message.alertText) }} />
                </Alert>
            )}

            {/* メインテキスト */}
            {message.mainText && <Box component="p"><span dangerouslySetInnerHTML={{ __html: replaceBold(message.mainText) }} /></Box>}

            {/* セカンダリアラート (禁止ロジック用など) */}
            {message.secondaryAlert && (
                <Alert severity={message.secondaryAlert.severity} sx={{ mt: 1 }}>
                    <span dangerouslySetInnerHTML={{ __html: replaceBold(message.secondaryAlert.text) }} />
                </Alert>
            )}
        </DialogContent>
    );
};


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
            open={isModeSelectOpen}
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
            <DialogContentRenderer content={warningContent} />
            <DialogActions>
                <Button onClick={handleCancel}>
                    キャンセル
                </Button>
                <Button
                    onClick={handleFirstConfirmation}
                    variant="contained"
                    // targetModeに基づいて色を決定
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
            <DialogContentRenderer content={doubleConfirmContent} />
            <DialogActions>
                <Button onClick={handleCancel}>
                    キャンセル
                </Button>
                <Button
                    onClick={handleModeChangeConfirmed}
                    variant="contained"
                    color="error" // 最終確認はエラーカラー
                    disabled={doubleConfirmContent.disabled}
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