/**
 * src/features/packs/hooks/usePackFileIO.ts
 *
 * * Pack専用のデータI/O（CSV・JSON）を統合管理するカスタムフック。
 * * 責務:
 * 1. CSV処理（useCardCsvIO）とJSON処理（packJsonIO）を統合する。
 * 2. 汎用UIフック（useDataFileIO）を利用してメニュー・モーダルを制御する。
 * 3. CSVインポート/エクスポート、JSONインポート/エクスポートの実行ハンドラを提供する。
 * 4. ローディング状態とステータスメッセージを統合して管理する。
 */

import { useState, useCallback } from 'react';
import { useDataFileIO } from '../../../hooks/useDataFileIO';
import { useCardCsvIO } from '../../cards/hooks/useCardCsvIO';
import { exportPackToJson, importPacksFromJson, type PackIdConflictStrategy } from '../../../services/data-io/packJsonIO';
import type { Pack } from '../../../models/models';

/**
 * usePackFileIO のプロパティ
 */
export interface UsePackFileIOProps {
    packId: string;
    packData: Pack | null;
    onCardListUpdated: () => Promise<void>;
}

/**
 * Pack専用のファイルI/Oフック
 * 
 * CSV（カードデータ）とJSON（Pack全体）の両方をサポートし、
 * 汎用UIフック（useDataFileIO）を活用してメニュー・モーダルを制御します。
 * 
 * @param props - packId, packData, onCardListUpdated
 * @returns CSV/JSONそれぞれのUI制御とハンドラ
 */
export const usePackFileIO = ({ 
    packId, 
    packData, 
    onCardListUpdated 
}: UsePackFileIOProps) => {
    
    // --- 汎用UIフック（CSV用とJSON用で2つ作成） ---
    const csvUI = useDataFileIO();
    const jsonUI = useDataFileIO();
    
    // --- CSV処理（Pack専用） ---
    const {
        isLoading: csvLoading,
        statusMessage: csvStatus,
        handleConfirmImport: handleCsvImportInternal,
        handleExportCards: handleCsvExportInternal,
    } = useCardCsvIO(packId, onCardListUpdated);
    
    // --- JSON処理状態 ---
    const [jsonLoading, setJsonLoading] = useState(false);
    const [jsonStatus, setJsonStatus] = useState<string | null>(null);
    
    // --- CSVインポートハンドラ ---
    const handleCsvImport = useCallback(async () => {
        if (!csvUI.modal.file) {
            setJsonStatus('⚠️ ファイルが選択されていません。');
            return;
        }
        
        await handleCsvImportInternal(csvUI.modal.file);
        csvUI.modal.close();
    }, [csvUI.modal, handleCsvImportInternal]);
    
    // --- CSVエクスポートハンドラ ---
    const handleCsvExport = useCallback(async () => {
        await handleCsvExportInternal();
    }, [handleCsvExportInternal]);
    
    // --- JSONインポートハンドラ ---
    const handleJsonImport = useCallback(async (strategy: PackIdConflictStrategy = 'RENAME') => {
        if (!jsonUI.modal.file) {
            setJsonStatus('⚠️ ファイルが選択されていません。');
            return;
        }
        
        setJsonLoading(true);
        setJsonStatus('JSONインポート処理中...');
        
        try {
            const reader = new FileReader();
            
            reader.onload = async (e) => {
                try {
                    const jsonText = e.target?.result as string;
                    
                    if (!jsonText || jsonText.trim() === '') {
                        setJsonStatus('⚠️ ファイルが空です。');
                        return;
                    }
                    
                    // packJsonIOサービスを呼び出し
                    await importPacksFromJson(jsonText, { 
                        packIdConflictStrategy: strategy 
                    });
                    
                    setJsonStatus('✅ JSONインポート成功');
                    
                    // カードリスト更新
                    await onCardListUpdated();
                    
                } catch (error) {
                    console.error('JSON import error:', error);
                    setJsonStatus(`❌ エラー: ${error instanceof Error ? error.message : String(error)}`);
                } finally {
                    setJsonLoading(false);
                    jsonUI.modal.close();
                }
            };
            
            reader.onerror = () => {
                setJsonStatus('❌ ファイルの読み込みに失敗しました。');
                setJsonLoading(false);
                jsonUI.modal.close();
            };
            
            reader.readAsText(jsonUI.modal.file);
            
        } catch (error) {
            console.error('JSON import setup error:', error);
            setJsonStatus(`❌ エラー: ${error instanceof Error ? error.message : String(error)}`);
            setJsonLoading(false);
            jsonUI.modal.close();
        }
    }, [jsonUI.modal, onCardListUpdated]);
    
    // --- JSONエクスポートハンドラ ---
    const handleJsonExport = useCallback(async () => {
        if (!packData) {
            console.error('Pack data not loaded for export.');
            setJsonStatus('❌ エラー: Packデータが読み込まれていません。');
            return;
        }
        
        setJsonLoading(true);
        setJsonStatus('JSONエクスポート処理中...');
        
        try {
            const jsonText = await exportPackToJson(packId);
            
            // Blobを作成してダウンロード
            const blob = new Blob([jsonText], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${packData.name}_pack.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            setJsonStatus('✅ JSONエクスポート成功');
            
        } catch (error) {
            console.error('JSON export error:', error);
            setJsonStatus(`❌ エラー: ${error instanceof Error ? error.message : String(error)}`);
        } finally {
            setJsonLoading(false);
        }
    }, [packId, packData]);
    
    return {
        // CSV関連
        csv: {
            ui: csvUI,
            isLoading: csvLoading,
            statusMessage: csvStatus,
            handleImport: handleCsvImport,
            handleExport: handleCsvExport,
        },
        // JSON関連
        json: {
            ui: jsonUI,
            isLoading: jsonLoading,
            statusMessage: jsonStatus,
            handleImport: handleJsonImport,
            handleExport: handleJsonExport,
        },
    };
};
