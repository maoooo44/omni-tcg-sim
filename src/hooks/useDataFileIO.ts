/**
 * src/hooks/useDataFileIO.ts
 *
 * * データI/O操作のための汎用的なUI状態管理フック。
 * Pack/Deck/CardPool/UserDataなど、あらゆるフィーチャーで再利用可能な
 * メニュー制御・モーダル制御・ファイル選択の状態管理を提供します。
 *
 * * 責務:
 * 1. I/Oメニューの開閉状態を管理する。
 * 2. インポート用モーダルの開閉状態を管理する。
 * 3. 選択されたファイルの状態を保持する。
 * 4. 実際のファイル処理ロジックは各フィーチャー専用フック（usePackFileIO等）に委譲する。
 *
 * * 使用例:
 * - usePackFileIO: Pack専用（CSV + JSON）
 * - useDeckFileIO: Deck専用（JSON）
 * - useCardPoolFileIO: CardPool専用（JSON）
 * - useUserDataFileIO: UserData専用（JSON）
 */

import { useState, useCallback } from 'react';

/**
 * 汎用的なデータI/O UIの戻り値型
 */
export interface DataFileIOReturn {
    // メニュー制御
    menu: {
        anchorEl: HTMLElement | null;
        open: (event: React.MouseEvent<HTMLElement>) => void;
        close: () => void;
    };
    
    // モーダル制御
    modal: {
        isOpen: boolean;
        open: () => void;
        close: () => void;
        file: File | null;
        setFile: (file: File | null) => void;
    };
    
    // ファイル選択ハンドラ
    handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

/**
 * 汎用的なデータI/O UIラッパーフック
 * 
 * メニュー開閉、モーダル開閉、ファイル選択のUI状態のみを管理し、
 * 実際のインポート/エクスポート処理は各フィーチャー専用フックに委譲します。
 * 
 * @returns メニュー・モーダル・ファイル選択の状態と制御関数
 */
export const useDataFileIO = (): DataFileIOReturn => {
    // メニュー状態
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
    
    // モーダル状態
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    
    // メニューハンドラ
    const handleMenuOpen = useCallback((event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    }, []);
    
    const handleMenuClose = useCallback(() => {
        setAnchorEl(null);
    }, []);
    
    // モーダルハンドラ
    const handleModalOpen = useCallback(() => {
        setIsModalOpen(true);
        handleMenuClose();
    }, [handleMenuClose]);
    
    const handleModalClose = useCallback(() => {
        setIsModalOpen(false);
        setSelectedFile(null);
    }, []);
    
    // ファイル選択ハンドラ
    const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        setSelectedFile(file);
    }, []);
    
    return {
        menu: {
            anchorEl,
            open: handleMenuOpen,
            close: handleMenuClose,
        },
        modal: {
            isOpen: isModalOpen,
            open: handleModalOpen,
            close: handleModalClose,
            file: selectedFile,
            setFile: setSelectedFile,
        },
        handleFileChange,
    };
};