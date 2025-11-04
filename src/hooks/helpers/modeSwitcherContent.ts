/**
 * src/hooks/helpers/modeSwitcherContent.ts
 *
 * * useModeSwitcherで使用するダイアログコンテンツ生成ロジック
 * * 責務:
 * 1. モード遷移パターンごとの警告メッセージ生成
 * 2. 二重確認ダイアログのコンテンツ生成
 * 3. 遷移禁止パターンの判定と警告表示
 */

import type { CurrentGameMode } from '../../models/models';

// ダイアログのコンテンツの型定義

export interface DialogMessageData {
    mainText: string;
    alertText: string;
    alertSeverity: 'error' | 'warning' | 'info';
    secondaryAlert?: {
        text: string;
        severity: 'error' | 'warning' | 'info';
    } | null;
}

export interface DialogContentData {
    title: string;
    message: DialogMessageData;
    confirmText: string;
    disabled?: boolean;
}

// ----------------------------------------------------------------------
// 警告ダイアログのコンテンツ生成
// ----------------------------------------------------------------------

/**
 * モード遷移パターンに応じた警告ダイアログのコンテンツを生成
 * 
 * @param currentMode - 現在のゲームモード
 * @param targetMode - 切り替え先のゲームモード
 * @param cheatCount - 現在のチートカウント
 * @returns 警告ダイアログのコンテンツデータ
 */
export const getWarningContent = (
    currentMode: CurrentGameMode,
    targetMode: CurrentGameMode | null,
    cheatCount: number
): DialogContentData => {
    if (!targetMode) {
        return {
            title: 'エラー',
            message: {
                mainText: '',
                alertText: 'ターゲットモードが設定されていません。',
                alertSeverity: 'error'
            },
            confirmText: '続行'
        };
    }

    const transition = `${currentMode} -> ${targetMode}`;

    // DTCG -> FREE: カードプール削除警告
    if (transition === 'dtcg -> free') {
        return {
            title: '⚠️ フリーモードへの切り替え警告',
            message: {
                alertSeverity: 'error',
                alertText: '**フリーモード**へ切り替える際は、**所有カード情報がすべて削除されます**。この操作は元に戻せません。',
                mainText: 'よろしいですか？（**次のステップで最終確認を行います**）'
            },
            confirmText: '次の確認に進む',
        };
    }

    // DTCG/FREE -> GOD: チートモード警告
    if (transition === 'dtcg -> god' || transition === 'free -> god') {
        const isDisabled = transition === 'free -> god'; // FREE -> GOD は禁止
        return {
            title: '🚨 ゴッドモードへの切り替え警告',
            message: {
                alertSeverity: 'warning',
                alertText: `**ゴッドモード**は、デバッグ・検証用のチート機能です。このモードに切り替えると、**チートカウンタが1増加**し、あなたの活動履歴として記録されます。（現在のカウント: **${cheatCount}**）`,
                mainText: '開封結果などのシミュレーション結果を自由に操作できるようになります。よろしいですか？',
                secondaryAlert: isDisabled
                    ? { text: '⚠️ **この遷移は禁止されています。キャンセルしてください。**', severity: 'error' }
                    : null,
            },
            confirmText: isDisabled ? '続行 (禁止)' : '記録して続行',
            disabled: isDisabled,
        };
    }

    // FREE/GOD -> DTCG: DTCGモード有効化
    if (targetMode === 'dtcg') {
        return {
            title: '❗️ DTCGモードへの切り替え確認',
            message: {
                alertSeverity: 'info',
                alertText: '**DTCGモード**は、コインシステム、開封履歴などの**機能制限**と**記録機能**が有効になるモードです。この操作は今後のアプリの動作と記録に影響します。',
                mainText: 'よろしいですか？（この確認で実行されます）'
            },
            confirmText: '切り替える',
        };
    }

    // GOD -> FREE: ゴッドモード解除
    if (transition === 'god -> free') {
        return {
            title: '⚠️ フリーモードへの切り替え確認',
            message: {
                alertSeverity: 'warning',
                alertText: 'ゴッドモードの機能が停止し、フリーモードになります。カードプールは削除されませんが、シミュレーション結果の自由な操作はできなくなります。',
                mainText: '切り替えますか？'
            },
            confirmText: '切り替える',
        };
    }

    // デフォルト（その他の遷移）
    return {
        title: 'モード切り替え確認',
        message: {
            mainText: '本当に切り替えますか？',
            alertText: '',
            alertSeverity: 'info'
        },
        confirmText: '切り替える'
    };
};

// ----------------------------------------------------------------------
// 二重確認ダイアログのコンテンツ生成
// ----------------------------------------------------------------------

/**
 * DTCGモードからの離脱時の二重確認ダイアログコンテンツを生成
 * 
 * @param currentMode - 現在のゲームモード
 * @param targetMode - 切り替え先のゲームモード
 * @returns 二重確認ダイアログのコンテンツデータ
 */
export const getDoubleConfirmContent = (
    currentMode: CurrentGameMode,
    targetMode: CurrentGameMode | null
): DialogContentData => {
    // DTCGからの離脱（FREE/GOD）のみ二重確認が必要
    if (!targetMode || currentMode !== 'dtcg' || (targetMode !== 'free' && targetMode !== 'god')) {
        return {
            title: '',
            message: { mainText: '', alertText: '', alertSeverity: 'info' },
            confirmText: ''
        };
    }

    const isToFree = targetMode === 'free';

    return {
        title: `🚨 最終確認：本当に${isToFree ? 'フリー' : 'ゴッド'}モードへ変更しますか？`,
        message: {
            alertSeverity: 'error',
            alertText: `**最終確認**：DTCGルールが停止し、${isToFree ? '**カードプールが完全に削除されます**。' : '**チートモード（ゴッドモード）**が有効になります。'}この操作は元に戻せません。`,
            mainText: isToFree
                ? '最終確認として、続行ボタンを押すとカードプールが削除された後、フリーモードに切り替わります。'
                : '最終確認として、続行ボタンを押すとチートカウンタが記録された後、ゴッドモードに切り替わります。',
        },
        confirmText: isToFree ? 'カードプールを削除して変更する' : 'チート記録を承諾して変更する',
    };
};

// ----------------------------------------------------------------------
// 遷移禁止パターンの判定
// ----------------------------------------------------------------------

/**
 * 指定されたモード遷移が禁止されているかを判定
 * 
 * @param currentMode - 現在のゲームモード
 * @param targetMode - 切り替え先のゲームモード
 * @returns 禁止されている場合は警告メッセージ、許可されている場合はnull
 */
export const getForbiddenTransitionMessage = (
    currentMode: CurrentGameMode,
    targetMode: CurrentGameMode
): string | null => {
    // FREE -> GOD: 禁止
    if (currentMode === 'free' && targetMode === 'god') {
        return 'フリーモードからゴッドモードへの切り替えは禁止されています。';
    }

    // GOD -> FREE: 禁止（直接遷移）
    if (currentMode === 'god' && targetMode === 'free') {
        return 'ゴッドモードからフリーモードへの直接切り替えは禁止されています。';
    }

    return null;
};
