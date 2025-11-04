/**
 * src/features/decks/hooks/useDeckFileIO.ts
 *
 * * Deck専用のデータI/O（JSON）を管理するカスタムフック。
 * * 責務:
 * 1. JSON処理（deckJsonIO）を統合する。
 * 2. 汎用UIフック（useDataFileIO）を利用してメニュー・モーダルを制御する。
 * 3. JSONインポート/エクスポートの実行ハンドラを提供する。
 * 4. ローディング状態とステータスメッセージを管理する。
 */

import { useState, useCallback } from 'react';
import { useDataFileIO } from '../../../hooks/useDataFileIO';
import { exportDecksToJson, importDecksFromJson, type DeckIdConflictStrategy } from '../../../services/data-io/deckJsonIO';
import type { Deck } from '../../../models/models';

/**
 * useDeckFileIO のプロパティ
 */
export interface UseDeckFileIOProps {
    deckId: string;
    deckData: Deck | null;
}

/**
 * Deck専用のファイルI/Oフック
 * 
 * JSON形式のインポート/エクスポートをサポートし、
 * 汎用UIフック（useDataFileIO）を活用してメニュー・モーダルを制御します。
 * 
 * @param props - deckId, deckData
 * @returns JSONのUI制御とハンドラ
 */
export const useDeckFileIO = ({ 
    deckId, 
    deckData, 
}: UseDeckFileIOProps) => {
    
    // --- 汎用UIフック（JSON用） ---
    const jsonUI = useDataFileIO();
    
    // --- JSON処理状態 ---
    const [jsonLoading, setJsonLoading] = useState(false);
    const [jsonStatus, setJsonStatus] = useState<string | null>(null);
    
    // --- JSONインポートハンドラ ---
    const handleJsonImport = useCallback(async (strategy: DeckIdConflictStrategy = 'RENAME') => {
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
                    
                    // deckJsonIOサービスを呼び出し
                    await importDecksFromJson(jsonText, { 
                        deckIdConflictStrategy: strategy 
                    });
                    
                    setJsonStatus('✅ JSONインポート成功');
                    
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
    }, [jsonUI.modal]);
    
    // --- JSONエクスポートハンドラ ---
    const handleJsonExport = useCallback(async () => {
        if (!deckData) {
            console.error('Deck data not loaded for export.');
            setJsonStatus('❌ エラー: Deckデータが読み込まれていません。');
            return;
        }
        
        setJsonLoading(true);
        setJsonStatus('JSONエクスポート処理中...');
        
        try {
            const jsonText = await exportDecksToJson([deckId]);
            
            // Blobを作成してダウンロード
            const blob = new Blob([jsonText], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${deckData.name}_deck.json`;
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
    }, [deckId, deckData]);
    
    return {
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
