/**
 * src/features/data-io/components/DataIOModal.tsx
 *
 * * アプリケーションの全データ (パック、デッキ、カードプール、ユーザー設定など) を
 * * ZIPファイル形式でインポートおよびエクスポートするためのダイアログコンポーネント。
 * * 責務:
 * 1. モーダル（Dialog）の表示と、インポート/エクスポート機能のUIを提供する。
 * 2. 処理状態（loading/idle）と結果メッセージを管理し、UIに反映する。
 * 3. サービス層（zipIO）のメソッド（exportData, importData）を呼び出し、データI/O操作をトリガーする。
 * 4. エクスポート成功時、ブラウザのダウンロード機能を介してファイルを保存する。
 * 5. インポート成功時、関連ストア（例: useCardPoolStore）のアクションを呼び出し、アプリケーションの状態を最新にリロードする。
 */
import React, { useState, useRef } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, Typography, Box, Alert, CircularProgress,
    Divider
} from '@mui/material';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import FileDownloadIcon from '@mui/icons-material/FileDownload';

import { zipIO } from '../../../services/data-io/zipIO';
import { useCardPoolStore } from '../../../stores/cardPoolStore';

interface DataIOModalProps {
    open: boolean;
    onClose: () => void;
}

const DataIOModal: React.FC<DataIOModalProps> = ({ open, onClose }) => {
    const [status, setStatus] = useState<'idle' | 'loading'>('idle');
    const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info', text: string } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const fetchCardPools = useCardPoolStore(state => state.fetchCardPool);

    // --------------------------------------------------
    // エクスポート処理
    // --------------------------------------------------
    const handleExport = async () => {
        setStatus('loading');
        setMessage(null);
        try {
            const blob = await zipIO.exportData();

            // Blobをダウンロードするためのリンクを作成
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `tcg-builder-data-${new Date().toISOString().substring(0, 10)}.zip`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url); // メモリ解放

            setMessage({ type: 'success', text: '全データのZIPエクスポートに成功しました。ダウンロードをご確認ください。' });
        } catch (error) {
            console.error('Export failed:', error);
            setMessage({ type: 'error', text: `エクスポート中にエラーが発生しました: ${error instanceof Error ? error.message : '不明なエラー'}` });
        } finally {
            setStatus('idle');
        }
    };

    // --------------------------------------------------
    // インポート処理 (ファイルの読み込みとデータ統合)
    // --------------------------------------------------
    const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !file.name.endsWith('.zip')) {
            setMessage({ type: 'error', text: '有効な.zipファイルを選択してください。' });
            return;
        }

        setStatus('loading');
        setMessage(null);

        try {
            // サービスを呼び出し、データ統合を実行
            const resultSummary = await zipIO.importData(file);

            // カードプールを最新の状態に強制更新 (Zustandストア経由で)
            await fetchCardPools();

            setMessage({
                type: 'success',
                text: `データのインポートと統合が完了しました。\n\n${resultSummary}`
            });

        } catch (error) {
            console.error('Import failed:', error);
            setMessage({ type: 'error', text: `インポート中にエラーが発生しました: ${error instanceof Error ? error.message : '不明なエラー'}` });
        } finally {
            setStatus('idle');
            // ファイル入力欄をリセットして、同じファイルを再度選べるようにする
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    // --------------------------------------------------
    // UIレンダリング
    // --------------------------------------------------
    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>データ インポート / エクスポート</DialogTitle>
            <DialogContent dividers>
                {/* 1. 説明 */}
                <Typography variant="body2" color="text.secondary" gutterBottom>
                    この機能は、パック、デッキ、カードプール、ユーザー設定など、アプリの全データを単一のZIPファイルとして入出力します。
                </Typography>

                {/* 2. ステータス表示 */}
                {message && (
                    <Alert
                        severity={message.type}
                        sx={{ mt: 2, whiteSpace: 'pre-wrap' }}
                        onClose={() => setMessage(null)}
                    >
                        {message.text}
                    </Alert>
                )}

                {/* 3. エクスポートセクション */}
                <Box sx={{ mt: 3, mb: 2 }}>
                    <Typography variant="h6" gutterBottom>
                        <FileDownloadIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                        データのエクスポート
                    </Typography>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={handleExport}
                        disabled={status === 'loading'}
                        startIcon={status === 'loading' ? <CircularProgress size={20} color="inherit" /> : <FileDownloadIcon />}
                        sx={{ mt: 1 }}
                    >
                        全データをZIPファイルでエクスポート
                    </Button>
                </Box>

                <Divider sx={{ my: 2 }} />

                {/* 4. インポートセクション */}
                <Box>
                    <Typography variant="h6" gutterBottom>
                        <FileUploadIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                        データのインポート (上書き注意)
                    </Typography>
                    <Typography variant="body2" color="error" sx={{ mb: 1 }}>
                        【重要】インポートされたカードプールとユーザー設定は、既存のデータを**完全に上書き**します。
                    </Typography>

                    <input
                        type="file"
                        accept=".zip"
                        ref={fileInputRef}
                        onChange={handleImport}
                        style={{ display: 'none' }}
                        id="zip-import-file"
                        disabled={status === 'loading'}
                    />
                    <Button
                        variant="outlined"
                        component="label"
                        htmlFor="zip-import-file"
                        disabled={status === 'loading'}
                        startIcon={status === 'loading' ? <CircularProgress size={20} color="inherit" /> : <FileUploadIcon />}
                        sx={{ mt: 1 }}
                    >
                        ZIPファイルを選択してインポート
                    </Button>
                </Box>

            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} color="primary" disabled={status === 'loading'}>
                    閉じる
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default DataIOModal;