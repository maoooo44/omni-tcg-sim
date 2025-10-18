/**
 * src/features/packs/components/JsonIOModal.tsx
 *
 * パック全体（Packデータと収録カードデータ）のJSONインポート機能に対応するモーダルUIコンポーネント。
 * このコンポーネントは、JSONファイルの選択と、インポート実行の確認画面、および処理中のステータスメッセージ表示を提供します。
 * 責務：ファイル選択UI、インポートルールのユーザーへの提示、アクションボタンのレンダリング、ステータスの表示。
 */
import React from 'react';
import { 
    Button, Dialog, DialogTitle, DialogContent, DialogActions, 
    Alert, Typography, CircularProgress 
} from '@mui/material';

interface JsonIOModalProps {
    open: boolean;
    isLoading: boolean;
    fileToImport: File | null;
    statusMessage: string | null;
    onClose: () => void;
    // ファイル変更ハンドラ: 'json'タイプであることを明示的に渡す
    handleFileChange: (e: React.ChangeEvent<HTMLInputElement>, type: 'json') => void;
    handleConfirmImport: () => void;
}

const JsonIOModal: React.FC<JsonIOModalProps> = ({
    open,
    isLoading,
    fileToImport,
    statusMessage,
    onClose,
    handleFileChange,
    handleConfirmImport,
}) => {
    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="sm"
            fullWidth
        >
            <DialogTitle>JSONファイルからパック全体をインポート</DialogTitle>
            <DialogContent dividers>
                <Alert severity="warning" sx={{ mb: 2 }}>
                    この機能は、パック全体（基本情報、レアリティ設定、収録カード）を**新規パック**としてデータベースに登録します。<br />
                    **既存のパックへの上書きは行いません**。JSON内のパックIDは新しいIDに自動で置き換えられます。
                </Alert>
                {statusMessage && (
                    <Alert 
                        severity={statusMessage.startsWith('❌') ? 'error' : (statusMessage.startsWith('⚠️') ? 'warning' : 'success')} 
                        sx={{ mb: 2 }}
                    >
                        {statusMessage}
                    </Alert>
                )}
                <input
                    type="file"
                    accept=".json"
                    onChange={(e) => handleFileChange(e, 'json')}
                    disabled={isLoading} 
                />
                {fileToImport && (
                    <Typography variant="body2" sx={{ mt: 1 }}>
                        選択中のファイル: **{fileToImport.name}**
                    </Typography>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} disabled={isLoading}>キャンセル</Button>
                <Button
                    onClick={handleConfirmImport}
                    variant="contained"
                    disabled={!fileToImport || isLoading}
                >
                    インポート実行
                    {(isLoading) && <CircularProgress size={16} sx={{ ml: 1 }} />}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default JsonIOModal;