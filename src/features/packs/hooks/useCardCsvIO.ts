/**
 * src/features/packs/hooks/useCardCsvIO.ts
 *
 * カードデータの一括インポート・エクスポート (CSV形式) を管理するカスタムフック。
 * * 責務: ファイル操作、UI状態管理、カスタムフィールド設定の取得、
 * そして Store のインポート/エクスポートアクションのトリガーに限定される。
 * CSVパース/マッピングロジックは CardCsvIO サービスに委譲する。
 */

import { useState, useCallback } from 'react';
import { useCardStore } from '../../../stores/cardStore';
import { usePackStore } from '../../../stores/packStore';
import { useUserDataStore } from '../../../stores/userDataStore'; 
import { useShallow } from 'zustand/react/shallow';

import { createCardCustomFieldDefinitions } from '../../../services/data-io/dataIOUtils'; 
import type { ImportResult } from '../../../stores/cardStore'; 


// =========================================================================
// カスタムフック
// =========================================================================

/**
 * カードデータの一括インポート・エクスポート（CSV形式）を管理するカスタムフック
 * @param packId - 対象のパックID
 * @param onCardListUpdated - インポート成功時に実行するカードリスト更新コールバック
 */
export const useCardCsvIO = (packId: string, onCardListUpdated: () => Promise<void>) => { 
    
    // 💡 修正: Storeアクションを新しい importCardsFromCsv に変更
    const { importCardsFromCsv, exportCardsToCsv } = useCardStore(useShallow(state => ({
        importCardsFromCsv: state.importCardsFromCsv, 
        exportCardsToCsv: state.exportCardsToCsv,
    })));
    
    // 💡 追加: ユーザー設定からカスタムフィールド設定を取得
    const customFieldConfig = useUserDataStore(state => state.customFieldConfig);

    // 💡 修正: editingPackの廃止に伴い、packsリストからpackIdに一致するものを探すロジックのみ残す
    const currentPack = usePackStore(state => 
        state.packs.find(p => p.packId === packId)
    );
    const [isLoading, setIsLoading] = useState(false);
    const [statusMessage, setStatusMessage] = useState<string | null>(null);


    /**
     * CSVファイルを読み込み、Storeアクション経由でService層にインポートを依頼します。
     * @param file - ユーザーがアップロードした File オブジェクト
     */
    const handleConfirmImport = useCallback(async (file: File) => { 
        
        // currentPackが取得できない場合はエラーとする
        if (!file || !currentPack) { 
            setStatusMessage("❌ エラー: ファイルまたはパック情報が無効です。");
            return;
        }

        setIsLoading(true);
        setStatusMessage("インポート処理を開始しています...");
        
        const reader = new FileReader();
        reader.onload = async (e) => {
            let result: ImportResult | undefined = undefined;
            try {
                const fileText = e.target?.result as string;
                
                if (!fileText.trim()) {
                    setStatusMessage("⚠️ 警告: CSVファイルにデータが含まれていません。");
                    return;
                }

                // 1. UI/UX層でカスタムフィールド定義を生成 (CSVヘッダー照合用)
                const customFieldDefs = createCardCustomFieldDefinitions(customFieldConfig);

                // 2. Store のアクション経由で Service 層にCSVテキストと定義を渡して処理を委譲
                result = await importCardsFromCsv(
                    packId, 
                    fileText, 
                    customFieldDefs
                ); 

                // 3. 結果メッセージの生成
                const importedCount = result.importedCount;
                const updatedCount = result.updatedCount;
                let successMessage = `✅ ${importedCount}枚の新規カードをインポートし、${updatedCount}枚の既存カードを更新しました。`;
                
                const exceptionMessages: string[] = [];
                // 💡 Service層が例外情報を返せるようになれば、ここに表示ロジックを追加
                // 例: if (result.pipeSplitCardCount > 0) { ... }

                if (exceptionMessages.length > 0) {
                    successMessage += `\n\n**⚠️ 例外処理 ${exceptionMessages.length}件**`;
                    setStatusMessage(successMessage + '\n- ' + exceptionMessages.join('\n- '));
                } else {
                    setStatusMessage(successMessage);
                }
                
                // 【最重要】Store更新完了後、親コンポーネントのローカル状態を更新するコールバックを実行
                await onCardListUpdated(); 
                
            } catch (error) {
                // Service/Store層からスローされたエラーをキャッチ
                const message = error instanceof Error ? error.message : '不明なエラー';
                setStatusMessage(`❌ インポート中に致命的なエラーが発生しました: ${message}`);
            } finally {
                setIsLoading(false);
            }
        };

        reader.onerror = () => {
            setIsLoading(false);
            setStatusMessage('❌ ファイルの読み込み中にエラーが発生しました。');
        };

        reader.readAsText(file);
    }, [packId, customFieldConfig, importCardsFromCsv, onCardListUpdated]); // 💡 修正: currentPack を依存配列から削除
    
    
    // --- handleExportCards の定義 (変更なし) ---
    const handleExportCards = useCallback(async () => {
        setIsLoading(true);
        setStatusMessage(null);

        try {
            // Service層経由でデータを取得
            const csvData = await exportCardsToCsv(packId);
            
            if (!csvData || csvData.length < 100) { // ヘッダーのみの場合を考慮し、適当なサイズでチェック
                setStatusMessage('⚠️ エクスポート対象のカードがありません。');
                setIsLoading(false);
                return;
            }

            // ダウンロード処理 
            const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.setAttribute('href', url);
            link.setAttribute('download', `${packId}_cards_export.csv`); 
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            setStatusMessage('✅ カードデータのエクスポートが完了しました。');
            
        } catch (error) {
            const message = error instanceof Error ? error.message : "未知のエラー";
            setStatusMessage(`❌ エクスポート失敗: ${message}`);
        } finally {
            setIsLoading(false);
        }
    }, [packId, exportCardsToCsv]);

    return {
        isLoading,
        statusMessage,
        handleConfirmImport, 
        handleExportCards,
        setStatusMessage,
    };
};