/**
 * src/hooks/useModeSwitcher.ts
 *
 * * アプリケーションのGameモード（DTCG/FREE/GOD）の切り替えに関する状態管理とビジネスロジックをカプセル化するカスタムフック。
 * ユーザーのモード選択から、警告、二重確認、そして最終的なストア操作（モード変更、カードプール削除など）に至るまでの多段階のフローを制御します。
 *
 * * 責務:
 * 1. 現在のゲームモード、コイン残高、チートカウントなどのストア状態を取得する。
 * 2. モード切り替えのための多段階ダイアログ（選択、警告、二重確認）の開閉状態とターゲットモードを管理する。
 * 3. 遷移パターン（例: FREE -> GOD の禁止）に基づくロジックを実行し、UIに表示するコンテンツデータを生成する。
 * 4. 最終確認後、Zustandストアのアクションを呼び出し、モード変更と付随する破壊的操作（カードプール削除）を実行する。
 * 5. UIコンポーネントがモード切り替えフローを簡潔に利用できるインターフェースを提供する。
 */
import { useState, useCallback } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useUserDataStore } from '../stores/userDataStore';
import { type CurrentGameMode } from '../models/models';
import { useCardPoolStore } from '../stores/cardPoolStore';

// コンテンツ生成ロジックをインポート
import {
    getWarningContent,
    getDoubleConfirmContent,
    getForbiddenTransitionMessage,
    type DialogContentData,
    type DialogMessageData,
} from './helpers/modeSwitcherContent';

// 型定義の再エクスポート
export type { DialogContentData, DialogMessageData };

export interface ModeSwitcher { // 外部コンポーネントで利用するため export
    currentMode: CurrentGameMode;
    currentModeText: string;
    currentModeColor: string;
    cheatCount: number;
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
    } = useUserDataStore(useShallow(state => ({
        getCurrentMode: state.getCurrentMode,
        cheatCount: state.cheatCount,
        setDTCGMode: state.setDTCGMode,
        setGodMode: state.setGodMode,
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

        // 破壊的な変更の実行 (FREE -> DTCG)
        if (currentMode === 'free' && mode === 'dtcg') {
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

        // 禁止された遷移をチェック
        const forbiddenMessage = getForbiddenTransitionMessage(currentMode, newMode);
        if (forbiddenMessage) {
            alert(forbiddenMessage);
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


    return {
        currentMode,
        currentModeText,
        currentModeColor,
        cheatCount,
        isModeSelectOpen,
        isWarningOpen,
        isDoubleConfirmOpen,
        targetMode,
        warningContent: getWarningContent(currentMode, targetMode, cheatCount),
        doubleConfirmContent: getDoubleConfirmContent(currentMode, targetMode),
        setIsModeSelectOpen,
        handleModeSelection,
        handleFirstConfirmation,
        handleCancel,
        handleModeChangeConfirmed,
    };
};