/**
 * src/components/common/BulkActionConfirmDialog.tsx
 *
 * 一括操作確認ダイアログの汎用コンポーネント。
 * Pack、Deck、Card など任意のアイテムの一括操作確認に使用可能。
 * 削除だけでなく、エクスポート、アーカイブなど様々な一括操作に対応。
 *
 * 責務:
 * 1. 一括操作確認ダイアログのUI表示
 * 2. 操作対象アイテム数と種類の表示
 * 3. キャンセルと確認ボタンの提供
 */

import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
} from '@mui/material';

interface BulkActionConfirmDialogProps {
    /** ダイアログの開閉状態 */
    open: boolean;
    /** ダイアログを閉じる際のハンドラ */
    onClose: () => void;
    /** 操作確認時のハンドラ */
    onConfirm: () => void | Promise<void>;
    /** 操作対象アイテムの件数 */
    itemCount: number;
    /** アイテムの種類（例: "パック", "デッキ", "カード"） */
    itemLabel: string;
    /** 操作のラベル（例: "ゴミ箱に移動", "削除", "エクスポート"） */
    actionLabel?: string;
    /** 確認ボタンの色（デフォルト: "error"） */
    actionColor?: 'inherit' | 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning';
}

/**
 * 一括操作確認ダイアログ
 */
const BulkActionConfirmDialog: React.FC<BulkActionConfirmDialogProps> = ({
    open,
    onClose,
    onConfirm,
    itemCount,
    itemLabel,
    actionLabel = 'ゴミ箱に移動',
    actionColor = 'error',
}) => {
    const handleConfirm = async () => {
        await onConfirm();
        onClose();
    };

    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>確認</DialogTitle>
            <DialogContent>
                <Typography>
                    選択した{itemCount}件の{itemLabel}を{actionLabel}しますか？
                </Typography>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>キャンセル</Button>
                <Button onClick={handleConfirm} color={actionColor} variant="contained">
                    {actionLabel}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default BulkActionConfirmDialog;
