/**
 * src/hooks/useGridDisplay.ts
 *
 * グリッド表示の列数設定、ユーザー選択、レスポンシブなサイズ計算を管理するカスタムフック
 * 💡 修正: settingsから取得したspacingを考慮し、正確な幅計算を sxOverride で行う
 */
import { useState, useMemo, useEffect } from 'react';
import { useMediaQuery, useTheme } from '@mui/material';
import type { GridSettings, GridBreakpoints } from '../models/grid';
import type { GridDisplayDefault } from '../models/userData'; 
import type { SxProps, Theme } from '@mui/material';

// ユーザー設定の保存先キー
type StorageKey = string;

// フックの引数インターフェースを定義
interface UseGridDisplayProps {
    settings: GridSettings;
    storageKey: StorageKey;
    /** DBから取得したユーザーの永続設定。UserDataStateから必要な部分を抽出して渡すことを想定 */
    userGlobalDefault: GridDisplayDefault; 
}

/**
 * グリッド表示の列数設定、ユーザー選択、レスポンシブなサイズ計算を管理するカスタムフック
 */
export const useGridDisplay = ({ settings, storageKey, userGlobalDefault }: UseGridDisplayProps) => {
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


    // 3. ユーザーがライブ選択した列数 (State) の管理
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


    // 現在の列数は selectedColumns
    const columns = selectedColumns;
    
    // 💡 修正: px単位のgapを列数に応じて動的に計算（小数点対応）
    // 基準: baseColumns列のときにdefaultSpacing(px)を使用、列数が増えると比例的に減少
    const gapValue = useMemo(() => {
        const { defaultSpacing, baseColumns } = settings;
        
        // 基準列数に対する現在の列数の比率の逆数でgapを調整
        // 例: baseColumns=5, defaultSpacing=16px
        //   - 2列 → gap = 16 * (5/2) = 40px
        //   - 5列 → gap = 16 * (5/5) = 16px（基準）
        //   - 10列 → gap = 16 * (5/10) = 8px
        //   - 20列 → gap = 16 * (5/20) = 4px（小数点も可能: 3.2pxなど）
        return defaultSpacing * (baseColumns / columns);
    }, [columns, settings]);
    
    // 4. flexBasis/maxWidth スタイル (ReusableItemGridで使用)
    // 💡 修正: gapを考慮した幅を計算（MUIのspacingではなくCSSのgapを使用）
    const sxOverride: SxProps<Theme> = useMemo(() => {
        // 全体の幅を列数で割ったもの (例: 5列なら 20%)
        const baseWidth = `${100 / columns}%`;
        
        // 最終的な幅: (100% / columns) から左右のgapを引く
        const finalWidthCalc = `calc(${baseWidth} - ${gapValue}px)`; 

        return {
            flexGrow: 0,
            maxWidth: finalWidthCalc,
            flexBasis: finalWidthCalc,
            aspectRatio: settings.aspectRatio, 
            boxSizing: 'border-box',
        };
    }, [columns, settings.aspectRatio, gapValue]);

    // 返り値
    return {
        columns, // 現在の列数
        setColumns: setSelectedColumns, // 列数（数値）を変更するハンドラ (UIボタン用)
        minColumns: settings.minColumns,
        maxColumns: settings.maxColumns,
        sxOverride, // Grid Item に適用する sx スタイル (カスタム幅を制御)
        aspectRatio: settings.aspectRatio, // アスペクト比
        gap: gapValue, // 💡 変更: px単位のgap値を返す（小数点対応）
    };
};