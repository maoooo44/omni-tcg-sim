/**
 * src/hooks/useDataFileIO.ts
 *
 * * CSV/JSON/ZIPなどのデータI/O操作に必要な、汎用的なUI状態とメニュー操作を管理するカスタムフック。
 * 特定のフィーチャー（Pack編集, 設定画面など）で共通して利用されるI/O UIのラッパーとして機能します。
 *
 * * 責務:
 * 1. I/Oメニューの開閉状態 (`anchorEl`) を管理するハンドラを提供し、メニュー操作を抽象化する。
 * 2. 各ファイルタイプ（CSV/JSON）ごとのインポート用モーダル開閉状態を管理する。
 * 3. 選択されたインポートファイル (`fileToImport`, `jsonFileToImport`) の状態を保持する。
 * 4. ファイル変更ハンドラ、インポート確定ハンドラなど、UIからI/Oロジック層への橋渡しを行う。
 * 5. 実際のファイル処理ロジック（例: CSV処理）は、下位の専用フック (`useCardCsvIO`) に委譲する。
 */

import { useState, useMemo, useCallback } from 'react';
import { useCardCsvIO } from '../features/packs/hooks/useCardCsvIO';
import type { Pack } from '../models/pack'; // 型情報が必要なためインポート

// CSV/JSON I/O の共通プロパティを Pack 固有のものと分離し、汎用的にする
export type PackFileIO = {
    // I/O メニュー
    anchorEl: null | HTMLElement;
    handleMenuOpen: (event: React.MouseEvent<HTMLElement>) => void;
    handleMenuClose: () => void;
    handleImportClick: (type: 'csv' | 'json' | 'zip') => void;
    handleExportClick: (type: 'csv' | 'json' | 'zip', packData: Pack | null) => void;

    // CSV/Pack-JSON インポート用モーダル
    isImportModalOpen: boolean;
    setIsImportModalOpen: (open: boolean) => void;
    isJsonImportModalOpen: boolean;
    setIsJsonImportModalOpen: (open: boolean) => void;
    fileToImport: File | null;
    jsonFileToImport: File | null;
    handleFileChange: (e: React.ChangeEvent<HTMLInputElement>, type: 'csv' | 'json') => void;
    handleConfirmImport: () => Promise<void>;
    handleConfirmJsonImport: () => void;

    // ステータス表示
    csvIO: { isLoading: boolean, statusMessage: string | null };
    jsonIOStatusMessage: string;
    isJsonIOLoading: boolean;
};


export const useDataFileIO = (
    packId: string,
    _packData: Pack | null,
    // CSVインポート完了後に実行するカードリスト更新用コールバック
    onCardListUpdated: () => Promise<void>
): PackFileIO => {

    // --- 既存の CSV 関連フックの利用 ---
    const {
        isLoading: isCsvIOLoading,
        statusMessage: csvIOStatusMessage,
        // CSVインポート確定ハンドラを useCardCsvIO から取得
        handleConfirmImport: handleConfirmImportCsvIO,
        // onCardListUpdated を useCardCsvIO に渡す
    } = useCardCsvIO(packId, onCardListUpdated);

    // --- UI/I/O 関連の状態（切り出し元） ---
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [fileToImport, setFileToImport] = useState<File | null>(null);
    const [isJsonImportModalOpen, setIsJsonImportModalOpen] = useState(false);
    const [jsonFileToImport, setJsonFileToImport] = useState<File | null>(null);
    const [jsonIOStatusMessage, /*setJsonIOStatusMessage*/] = useState<string>('');
    const [isJsonIOLoading, /*setIsJsonIOLoading*/] = useState(false);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

    const csvIO = useMemo(() => ({ isLoading: isCsvIOLoading, statusMessage: csvIOStatusMessage }), [isCsvIOLoading, csvIOStatusMessage]);

    // --- I/O メニューハンドラ（切り出し元） ---
    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => { setAnchorEl(event.currentTarget); };
    const handleMenuClose = () => { setAnchorEl(null); };

    const handleImportClick = (type: 'csv' | 'json' | 'zip') => {
        handleMenuClose();
        if (type === 'csv') setIsImportModalOpen(true);
        if (type === 'json') setIsJsonImportModalOpen(true);
        // ZIP I/O は設定画面で処理されるため、このフックはモーダル開閉の機能のみ提供
    };

    const handleExportClick = (type: 'csv' | 'json' | 'zip', currentPackData: Pack | null) => {
        handleMenuClose();
        if (type !== 'zip' && !currentPackData) {
            console.error('Pack data not loaded for export.');
            return;
        }
        // ZIPは設定画面で処理
        if (type !== 'zip') {
            console.log(`Exporting pack ${currentPackData?.name} as ${type}...`);
        } else {
            console.log(`Exporting all data as ZIP...`);
        }
    };

    // --- ファイル変更ハンドラ（切り出し元） ---
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'csv' | 'json') => {
        const file = e.target.files ? e.target.files[0] : null;
        if (type === 'csv') setFileToImport(file);
        if (type === 'json') setJsonFileToImport(file);
    };

    // --- インポート確定ハンドラ（CSVのみ、切り出し元） ---
    const handleConfirmImport = useCallback(async () => {
        if (!fileToImport || isCsvIOLoading) {
            console.warn('No CSV file selected or already loading.');
            return;
        }

        // 実際のファイル処理とStore更新は useCardCsvIO に委譲
        await handleConfirmImportCsvIO(fileToImport);

        // UI状態のリセットはここで実行
        setIsImportModalOpen(false);
        setFileToImport(null);

    }, [fileToImport, isCsvIOLoading, handleConfirmImportCsvIO]);

    // --- JSON インポート確定ハンドラ（切り出し元） ---
    const handleConfirmJsonImport = () => {
        // ここにJSONインポートのロジック（サービス呼び出し）が入る
        console.log('JSON Import confirmed - Service call to process jsonFileToImport goes here.');
        setIsJsonImportModalOpen(false);
        setJsonFileToImport(null);
    };

    return {
        anchorEl,
        handleMenuOpen,
        handleMenuClose,
        handleImportClick,
        handleExportClick,
        isImportModalOpen,
        setIsImportModalOpen,
        isJsonImportModalOpen,
        setIsJsonImportModalOpen,
        fileToImport,
        jsonFileToImport,
        handleFileChange,
        handleConfirmImport,
        handleConfirmJsonImport,
        csvIO,
        jsonIOStatusMessage,
        isJsonIOLoading,
    };
};