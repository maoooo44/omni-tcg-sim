/**
 * src/features/packs/components/CsvIOModal.tsx
 *
 * 個々のカードデータ（CardType）のCSVインポート機能に対応するモーダルUIコンポーネント。
 * * 責務:
 * 1. CSVファイルの選択用UI（<input type="file">）をユーザーに提供する。
 * 2. インポート処理のロジック、予約済みフィールド、新規カード追加のロジックに関する**重要なルール**をユーザーに提示する（Alert）。
 * 3. 編集モード（isEditorMode）とローディング状態（isLoading）に基づき、UI要素の有効/無効を適切に制御する。
 * 4. 親コンポーネントから渡されるファイル選択、インポート実行、モーダル閉鎖のコールバックを実行する。
 */
import React from 'react';
import {
    Button, Dialog, DialogTitle, DialogContent, DialogActions,
    Alert, Typography, CircularProgress
} from '@mui/material';

interface CsvIOModalProps {
    open: boolean;
    isEditorMode: boolean; // 編集モードでのみ操作可能とするためのフラグ
    isLoading: boolean;
    fileToImport: File | null;
    onClose: () => void;
    // ファイル変更ハンドラ: 'csv'タイプであることを明示的に渡す
    handleFileChange: (e: React.ChangeEvent<HTMLInputElement>, type: 'csv') => void;
    handleConfirmImport: () => void;
}

const CsvIOModal: React.FC<CsvIOModalProps> = ({
    open,
    isEditorMode,
    isLoading,
    fileToImport,
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
            <DialogTitle>CSVファイルからカードをインポート</DialogTitle>
            <DialogContent dividers>
                <Alert severity="info" sx={{ mb: 2 }}>
                    CSVファイルの1行目はヘッダー行として扱われます。<br />
                    以下の**予約済みフィールド**以外の列は、すべて**カスタムプロパティ**として自動登録されます。<br />
                    **予約済みフィールド (任意)**: `name`, `rarity`, `imageUrl`, `number`<br />
                    **ロジック**: `name`が空欄の場合「新しいカード」と連番が自動付与されます。`rarity`が空欄の場合、パックの最初のレアリティが割り当てられます。**すべての行は新規カードとして追加されます**。
                </Alert>
                <input
                    type="file"
                    accept=".csv"
                    onChange={(e) => handleFileChange(e, 'csv')}
                    disabled={!isEditorMode || isLoading}
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
                    disabled={!fileToImport || !isEditorMode || isLoading}
                >
                    インポート実行
                    {isLoading && <CircularProgress size={16} sx={{ ml: 1 }} />}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default CsvIOModal;