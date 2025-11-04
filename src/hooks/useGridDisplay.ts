/**
 * src/hooks/useGridDisplay.ts
 *
 * * グリッド表示の列数設定、ユーザーによるライブ選択、およびレスポンシブなサイズ計算を一元管理するカスタムフック。
 * ... (中略)
 * 5. ユーザーが列数/行数を変更するための状態更新関数 (`setColumns`) を提供し、変更を localStorage に永続化する。
 */
import { useState, useMemo, useEffect } from 'react';
import { useMediaQuery, useTheme } from '@mui/material';
import type { GridSettings, GridBreakpoints, GridDisplayDefault } from '../models/models';
import type { SxProps, Theme } from '@mui/material';

// ★ [変更なし]: GridRenderUnit の定義（インポートされることを想定）
export interface GridRenderUnit {
    sxOverride: SxProps<Theme>;
    aspectRatio: number;
    gap: number;
}
// ↑ 実際にインポートする場合はこの定義は不要

// ユーザー設定の保存先キー
type StorageKey = string;

// フックの引数インターフェースを定義
interface UseGridDisplayProps {
    settings: GridSettings;
    storageKey: StorageKey;
    /** DBから取得したユーザーの永続設定。UserDataStateから必要な部分を抽出して渡すことを想定 */
    userGlobalDefault: GridDisplayDefault;
    /** ★ 修正: 列ではなく行を制御するモードで動作させるか (プロパティはそのまま) */
    isRowMode?: boolean;
}

/**
 * グリッド表示の列数/行数設定、ユーザー選択、レスポンシブなサイズ計算を管理するカスタムフック
 */
export const useGridDisplay = ({ settings, storageKey, userGlobalDefault, isRowMode = false }: UseGridDisplayProps) => {
    const theme = useTheme();
    // 画面サイズの判定
    const isLgUp = useMediaQuery(theme.breakpoints.up('lg'));
    const isMdUp = useMediaQuery(theme.breakpoints.up('md'));
    const isSmUp = useMediaQuery(theme.breakpoints.up('sm'));

    // 1. 現在のブレイクポイントを判定
    const currentBreakpoint: GridBreakpoints = useMemo(() => {
        return (
            isLgUp ? 'lg' :
                isMdUp ? 'md' :
                    isSmUp ? 'sm' :
                        'xs'
        );
    }, [isLgUp, isMdUp, isSmUp]);

    // 2. 最終的なデフォルト列数（数値）を決定 (DB設定とアプリデフォルトを考慮)
    const finalDefaultColumns: number = useMemo(() => {
        const { isUserDefaultEnabled, globalColumns, advancedResponsive } = userGlobalDefault;

        // 優先度 1: DB 高度なレスポンシブ設定
        if (isUserDefaultEnabled && advancedResponsive.isEnabled) {
            const dbCols = advancedResponsive.columns[currentBreakpoint];
            if (dbCols !== undefined && dbCols !== null) {
                // min/maxの範囲に収める
                return Math.max(settings.minColumns, Math.min(settings.maxColumns, dbCols));
            }
        }

        // 優先度 2: DB シンプルなグローバル設定
        if (isUserDefaultEnabled && globalColumns !== undefined && globalColumns !== null) {
            // min/maxの範囲に収める
            return Math.max(settings.minColumns, Math.min(settings.maxColumns, globalColumns));
        }

        // 優先度 3: アプリケーションのレスポンシブデフォルト
        const appCols = settings.defaultColumns[currentBreakpoint];
        if (appCols !== undefined && appCols !== null) {
            return appCols;
        }

        // 最終Fallback
        return settings.minColumns;
    }, [userGlobalDefault, settings, currentBreakpoint]);


    // 3. ユーザーがライブ選択した列数 (State) の管理 (名称維持)
    const [selectedColumns, setSelectedColumns] = useState<number>(() => {
        // localStorageから保存されたユーザー設定（列数）を読み込む
        const savedCols = localStorage.getItem(storageKey);
        const savedNum = savedCols ? parseInt(savedCols, 10) : NaN;

        // 保存された値が有効な範囲であれば使用
        if (!isNaN(savedNum) && savedNum >= settings.minColumns && savedNum <= settings.maxColumns) {
            return savedNum;
        }

        // なければ決定されたデフォルトを使用
        return finalDefaultColumns;
    });

    // finalDefaultColumnsが変更された場合（DBや画面サイズの変化）に、
    // ライブ選択が未設定ならデフォルトを更新する
    useEffect(() => {
        const savedCols = localStorage.getItem(storageKey);
        if (!savedCols) {
            // ライブ選択が未設定の場合のみ、デフォルトの変更を反映
            setSelectedColumns(finalDefaultColumns);
        }
    }, [finalDefaultColumns, storageKey]);

    // ユーザーがselectedColumnsを変更した際、localStorageに保存
    useEffect(() => {
        localStorage.setItem(storageKey, String(selectedColumns));
    }, [selectedColumns, storageKey]);


    // 現在の次元数（列数または行数）を、既存の変数名で参照
    const columns = selectedColumns;

    // px単位のgapを列数/行数に応じて動的に計算（小数点対応）
    // 基準: baseColumns列のときにdefaultSpacing(px)を使用、次元数が増えると比例的に減少
    const gapValue = useMemo(() => {
        const { defaultSpacing, baseColumns } = settings;

        // 基準列数に対する現在の次元数の比率の逆数でgapを調整
        // columnsがRowModeの「行数」として使われる
        return defaultSpacing * (baseColumns / columns);
    }, [columns, settings]);

    // 4. flexBasis/maxWidth/height スタイル (Grid Itemで使用)
    // gapを考慮した幅または高さを計算
    const sxOverride: SxProps<Theme> = useMemo(() => {
        // 全体の幅/高さを次元数で割ったもの (例: 5列/行なら 20%)
        const baseDim = `${100 / columns}%`;

        // 最終的な幅/高さ: (100% / columns) から左右/上下のgapを引く
        const finalDimCalc = `calc(${baseDim} - ${gapValue}px)`;

        if (isRowMode) {
            // ★ [修正] 行モードの場合: height, minHeight の設定を完全に削除
            return {
                // height: finalDimCalc, // 削除
                // minHeight: finalDimCalc, // 削除
                boxSizing: 'border-box',
                flexGrow: 0, 
                maxWidth: '100%',
                flexBasis: 'auto', 
                aspectRatio: settings.aspectRatio, 
            };
        } else {
            // 列モードの場合 (既存のロジック): 幅を指定する
            return {
                flexGrow: 0,
                maxWidth: finalDimCalc,
                flexBasis: finalDimCalc,
                aspectRatio: settings.aspectRatio,
                boxSizing: 'border-box',
            };
        }
    }, [columns, settings.aspectRatio, gapValue, isRowMode]);

    // 返り値
    // ★ [修正] GridRenderUnit に含まれるプロパティをまとめる
    const renderUnit: GridRenderUnit = {
        sxOverride,
        aspectRatio: settings.aspectRatio,
        gap: gapValue,
    };
    
    return {
        columns, // 現在の列数または行数 (名称維持)
        setColumns: setSelectedColumns, // 列数/行数（数値）を変更するハンドラ (名称維持)
        minColumns: settings.minColumns, // 名称維持
        maxColumns: settings.maxColumns, // 名称維持
        gridRenderUnit: renderUnit, // ★ [修正] GridRenderUnit をプロパティとして組み込む
        isRowMode, // 現在のモード
    };
};
