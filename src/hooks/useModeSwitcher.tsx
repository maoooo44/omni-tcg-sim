/**
 * src/hooks/useModeSwitcher.ts
 *
 * アプリケーションのGameモード（DTCG/FREE/GOD）の切り替えに関する
 * 全ての状態管理、ビジネスロジック、およびストア操作をカプセル化するカスタムフック。
 * 複雑な多段階の確認ダイアログ（警告、二重確認）の制御ロジックを内包し、
 * UIコンポーネント（NavbarやGameModeSwitchDialogs）にシンプルなインターフェースを提供する。
 */
import { useState, useCallback } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useUserDataStore} from '../stores/userDataStore';
import {  type CurrentGameMode } from '../models/userData'; // 💡 修正: userData.tsにパス修正
import { useCardPoolStore } from '../stores/cardPoolStore';
import { Alert} from '@mui/material';


// ダイアログのコンテンツの型定義（ロジックの戻り値）
interface DialogContentData {
    title: string;
    message: React.ReactNode;
    confirmText: string;
    disabled?: boolean;
}

interface ModeSwitcher {
    currentMode: CurrentGameMode;
    currentModeText: string;
    currentModeColor: string;
    cheatCount: number;
    isAllViewMode: boolean; // 💡 追加: 全表示モードの状態
    // ダイアログの状態
    isModeSelectOpen: boolean;
    isWarningOpen: boolean;
    isDoubleConfirmOpen: boolean;
    // ターゲットモード
    targetMode: CurrentGameMode | null;
    // コンテンツ
    warningContent: DialogContentData;
    doubleConfirmContent: DialogContentData;
    // ハンドラ
    setIsModeSelectOpen: (open: boolean) => void;
    setAllViewMode: (isMode: boolean) => Promise<void>; // 💡 追加: 全表示モードのセッター
    handleModeSelection: (newMode: CurrentGameMode) => void;
    handleFirstConfirmation: () => void;
    handleCancel: () => void;
    handleModeChangeConfirmed: () => Promise<void>;
}

export const useModeSwitcher = (coins: number): ModeSwitcher => {
    
    // ストアの取得
    const { 
        getCurrentMode, 
        cheatCount, 
        setDTCGMode, 
        setGodMode,
        isAllViewMode, // ✅ 取得済み
        setAllViewMode, // ✅ 取得済み
    } = useUserDataStore(useShallow(state => ({
        getCurrentMode: state.getCurrentMode,
        cheatCount: state.cheatCount,
        setDTCGMode: state.setDTCGMode,
        setGodMode: state.setGodMode,
        isAllViewMode: state.isAllViewMode, 
        setAllViewMode: state.setAllViewMode, 
    })));
    // カードプール削除アクションを直接取得
    const clearCardPool = useCardPoolStore.getState().deleteCardPool;
    
    // UIの状態
    const [isModeSelectOpen, setIsModeSelectOpen] = useState(false);
    const [isWarningOpen, setIsWarningOpen] = useState(false);
    const [isDoubleConfirmOpen, setIsDoubleConfirmOpen] = useState(false);
    const [targetMode, setTargetMode] = useState<CurrentGameMode | null>(null);

    const currentMode = getCurrentMode();
    const safeCoins = coins || 0;

    // 現在のモード表示テキスト
    const currentModeText = currentMode === 'god'
        ? 'GOD MODE'
        : currentMode === 'dtcg'
            ? `DTCG (¥${safeCoins.toLocaleString()})`
            : 'FREE PLAY';
    const currentModeColor = currentMode === 'god' ? 'error.main' : currentMode === 'dtcg' ? 'success.main' : 'text.secondary';

    // UIの状態をリセット
    const handleCancel = useCallback(() => {
        setIsModeSelectOpen(false);
        setIsWarningOpen(false);
        setIsDoubleConfirmOpen(false);
        setTargetMode(null);
    }, []);

    // 最終実行ロジック
    const handleModeChangeConfirmed = useCallback(async () => {
        if (!targetMode) return;
        const mode = targetMode;

        // 破壊的な変更の実行 (DTCG -> FREE)
        if (currentMode === 'dtcg' && mode === 'free') {
            await clearCardPool();
            console.log('カードプール内の所有カード情報を全て削除しました。');
        }
        
        // モードの切り替え実行
        if (mode === 'dtcg') {
            await setDTCGMode(true);
            await setGodMode(false);
        } else if (mode === 'free') {
            await setDTCGMode(false);
            await setGodMode(false);
        } else if (mode === 'god') {
            await setGodMode(true); 
        }

        // UIの状態をリセット
        handleCancel();
    }, [targetMode, currentMode, clearCardPool, setGodMode, setDTCGMode, handleCancel]);


    // 1. モード選択時の処理 (警告/二重確認の開始)
    const handleModeSelection = useCallback((newMode: CurrentGameMode) => {
        setIsModeSelectOpen(false); // モード選択ダイアログを閉じる

        if (newMode === currentMode) return;

        // FREE -> GOD の禁止ロジック
        if (currentMode === 'free' && newMode === 'god') {
            alert('フリーモードからゴッドモードへの切り替えは禁止されています。');
            return;
        }

        setTargetMode(newMode);
        setIsWarningOpen(true); // すべての遷移で警告画面を開く
    }, [currentMode]);

    // 2. 最初の確認後の処理 (二重確認に進むか実行するか)
    const handleFirstConfirmation = useCallback(() => {
        if (!targetMode) return;

        // 厳格な二重確認が必要な遷移: DTCG -> FREE または DTCG -> GOD
        if (currentMode === 'dtcg' && (targetMode === 'free' || targetMode === 'god')) {
            setIsWarningOpen(false); // 最初の警告を閉じる
            setIsDoubleConfirmOpen(true); // 二重確認ダイアログを開く
        } else {
            // それ以外の遷移 (FREE/GOD -> DTCG, GOD -> FREE) は一発実行
            setIsWarningOpen(false); 
            handleModeChangeConfirmed();
        }
    }, [targetMode, currentMode, handleModeChangeConfirmed]);
    
    // ダイアログのコンテンツ生成ロジックはフック内に保持
    const getWarningContent = (mode: CurrentGameMode | null): DialogContentData => {
    // ... (getWarningContent の中身は省略。変更なし)
        if (!mode) return { title: 'エラー', message: '', confirmText: '続行' };
        
        const transition = `${currentMode} -> ${mode}`;

        if (transition === 'dtcg -> free') {
            return {
                title: '⚠️ フリーモードへの切り替え警告',
                message: (
                    <>
                        <Alert severity="error" sx={{ mb: 2 }}>
                            **フリーモード**へ切り替える際は、**所有カード情報がすべて削除されます**。
                            この操作は元に戻せません。
                        </Alert>
                        <p>よろしいですか？（**次のステップで最終確認を行います**）</p>
                    </>
                ),
                confirmText: '次の確認に進む',
            };
        }

        if (transition === 'dtcg -> god' || transition === 'free -> god') {
            const isDisabled = transition === 'free -> god';
            return {
                title: '🚨 ゴッドモードへの切り替え警告',
                message: (
                    <>
                        <Alert severity="warning" sx={{ mb: 2 }}>
                            **ゴッドモード**は、デバッグ・検証用のチート機能です。
                            このモードに切り替えると、**チートカウンタが1増加**し、あなたの活動履歴として記録されます。（現在のカウント: **{cheatCount}**）
                        </Alert>
                        <p>
                            開封結果などのシミュレーション結果を自由に操作できるようになります。よろしいですか？
                            {isDisabled && <Alert severity='error' sx={{ mt: 1 }}>⚠️ **この遷移は禁止されています。キャンセルしてください。**</Alert>}
                        </p>
                    </>
                ),
                confirmText: isDisabled ? '続行 (禁止)' : '記録して続行',
                disabled: isDisabled,
            };
        }

        if (mode === 'dtcg') { // FREE/GOD -> DTCG
            return {
                title: '❗️ DTCGモードへの切り替え確認',
                message: (
                    <>
                        <Alert severity="info" sx={{ mb: 2 }}>
                            **DTCGモード**は、コインシステム、開封履歴などの**機能制限**と**記録機能**が有効になるモードです。
                            この操作は今後のアプリの動作と記録に影響します。
                        </Alert>
                        <p>よろしいですか？（この確認で実行されます）</p>
                    </>
                ),
                confirmText: '切り替える',
            };
        }
        
        if (transition === 'god -> free') {
            return {
                title: '⚠️ フリーモードへの切り替え確認',
                message: (
                    <>
                        <Alert severity="warning" sx={{ mb: 2 }}>
                            ゴッドモードの機能が停止し、フリーモードになります。
                            カードプールは削除されませんが、シミュレーション結果の自由な操作はできなくなります。
                        </Alert>
                        <p>切り替えますか？</p>
                    </>
                ),
                confirmText: '切り替える',
            };
        }

        return { title: 'モード切り替え確認', message: <p>本当に切り替えますか？</p>, confirmText: '切り替える' };
    };
    
    // 二重確認ダイアログのコンテンツ生成 (DTCGからの離脱時のみ)
    const getDoubleConfirmContent = (mode: CurrentGameMode | null): DialogContentData => {
    // ... (getDoubleConfirmContent の中身は省略。変更なし)
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
                    <p>
                        {isToFree
                            ? '最終確認として、続行ボタンを押すとカードプールが削除された後、フリーモードに切り替わります。'
                            : '最終確認として、続行ボタンを押すとチートカウンタが記録された後、ゴッドモードに切り替わります。'
                        }
                    </p>
                </>
            ),
            confirmText: isToFree ? 'カードプールを削除して変更する' : 'チート記録を承諾して変更する',
        };
    };


    return {
        currentMode,
        currentModeText,
        currentModeColor,
        cheatCount,
        isAllViewMode, // ✅ 公開
        isModeSelectOpen,
        isWarningOpen,
        isDoubleConfirmOpen,
        targetMode,
        warningContent: getWarningContent(targetMode),
        doubleConfirmContent: getDoubleConfirmContent(targetMode),
        setIsModeSelectOpen,
        setAllViewMode, // ✅ 公開
        handleModeSelection,
        handleFirstConfirmation,
        handleCancel,
        handleModeChangeConfirmed,
    };
};