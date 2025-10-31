/**
 * src/features/packs/hooks/useCardCsvIO.ts
 *
 * カードデータの一括インポート・エクスポート (CSV形式) のためのカスタムフック。
 * * 責務:
 * 1. UIの状態（ローディング、ステータスメッセージ）を管理する。
 * 2. `CardStore` および `PackStore` から必要なデータとアクション（インポート/エクスポート）を取得する。
 * 3. ユーザーがアップロードしたCSVファイルの内容を読み込む（`FileReader`）。
 * 4. CSVインポート/エクスポート処理をStore/Service層に委譲し、その結果に基づきUIの状態を更新する。
 * 5. CSVファイルのエクスポート時、ブラウザのダウンロード処理（Blob生成とファイルリンクのクリック）を実行する。
 * 6. Packの設定情報に基づきカスタムフィールド定義を生成する。
 */

import { useState, useCallback } from 'react';
import { useCardStore } from '../../../stores/cardStore';
import { usePackStore } from '../../../stores/packStore';
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

    const { importCardsFromCsv, exportCardsToCsv } = useCardStore(useShallow(state => ({
        importCardsFromCsv: state.importCardsFromCsv,
        exportCardsToCsv: state.exportCardsToCsv,
    })));

    // カスタムフィールド設定はパックごとの cardFieldSettings を利用
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

                // 1. 現在のパック設定からカスタムフィールド定義を生成 (CSVヘッダー照合用)
                const customFieldDefs = createCardCustomFieldDefinitions(currentPack?.cardFieldSettings);

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
    }, [packId, currentPack, importCardsFromCsv, onCardListUpdated]);


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