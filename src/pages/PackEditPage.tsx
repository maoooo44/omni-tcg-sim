/**
 * src/pages/PackEditPage.tsx
 *
 * 【適用した修正】
 * 1. useBlocker の shouldBlockFn を修正: 
 * - isDirty が true の場合に window.confirm で確認ダイアログを表示し、
 * ユーザーが「キャンセル」を押した場合にナビゲーションをブロックする。
 * - enableBeforeUnload を isDirty に基づいて有効化。
 * 2. MaterialUIのGridのitemプロパティをsizeに修正 (ユーザーの記憶情報に基づく)。
 */
import React, { useEffect } from 'react'; 
import { 
    Button, Box, Typography, MenuItem,
    Alert, Paper, Divider, Grid, Dialog, DialogTitle, DialogContent, DialogActions,
    CircularProgress,
    Menu, IconButton, Tooltip, 
} from '@mui/material'; 
import SaveIcon from '@mui/icons-material/Save'; 
import EditIcon from '@mui/icons-material/Edit'; 
import VisibilityIcon from '@mui/icons-material/Visibility'; 
// useBlockerをインポート
import { useParams, useBlocker, /*type NavigateOptions*/ } from '@tanstack/react-router'; 

// 💡 追加されたアイコンのインポート
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DownloadFileIcon from '@mui/icons-material/DownloadForOffline';
import ImportExportIcon from '@mui/icons-material/ImportExport';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile'; 

import PackCardList from '../components/PackCardList';
import CardEditModal from '../components/CardEditModal';
import RarityEditModal from '../components/RarityEditModal';

import { usePackEdit } from '../features/pack-management/hooks/usePackEdit'; 
import type { Card as CardType } from '../models/card'; 

import { useUIStore, type UIStore } from '../stores/uiStore'; 

// ★ 追記: 新しいフォームコンポーネントのインポート
import PackInfoForm from '../features/pack-management/PackInfoForm';

const PackEditPage: React.FC = () => {
    
    // useParamsでpackIdを取得
    const { packId } = useParams({ strict: false }) as { packId: string };
    
    // usePackEditからすべての状態とハンドラを取得
    const { 
        packData, 
        isNewPack, 
        isExistingPack,
        isEditMode, 
        isDirty, // 💡 isDirty を取得
        removePackFromStore, // 💡 追記: 遷移許可時に状態をクリーンアップするための関数を取得
        toggleEditMode, 
        csvIO,
        isDisabled,
        saveAlert,
        setSaveAlert,
        handleInputChange,
        handleSelectChange,
        handleSave,
        handleRemovePack,
        
        cards,
        handleCardSave,
        handleRemoveCard,

        // カード編集モーダル
        isCardModalOpen,
        editingCard,
        handleOpenCardEditModal,
        handleCloseCardEditModal,
        // レアリティ編集モーダル
        isRarityModalOpen,
        handleOpenRarityEditModal,
        handleCloseRarityEditModal,
        handleRarityEditSave, 
        
        // CSV I/O モーダル
        isImportModalOpen,
        setIsImportModalOpen,
        fileToImport,
        handleFileChange,
        handleConfirmImport,
        
        // 💡 追記: JSON I/O モーダル
        isJsonImportModalOpen,
        setIsJsonImportModalOpen,
        jsonFileToImport,
        jsonIOStatusMessage,
        isJsonIOLoading,
        handleJsonFileChange,
        handleConfirmJsonImport,

        // 💡 追記: メニューの状態管理
        anchorEl,
        handleMenuOpen,
        handleMenuClose,
        handleImportClick,
        handleExportClick,
        
    } = usePackEdit(packId);

    // ★ 修正 1 & 2: useBlocker の実装を shouldBlockFn に修正
    useBlocker({
        shouldBlockFn: ({ next: _next }) => {
            
            if (!isDirty) {
                // 変更がない場合は、ナビゲーションを許可 (ブロックしない)
                return false;
            }

            // isDirty が true の場合、確認ダイアログを表示
            const confirmed = window.confirm(
                '変更が保存されていません。このまま移動すると、未保存の変更は破棄されます。続行しますか？'
            );
            
            // ユーザーが「キャンセル」を押すと confirmed が false -> !confirmed が true (ブロック)
            // ユーザーが「OK」を押すと confirmed が true -> !confirmed が false (続行)
            return !confirmed;
        },
        
        // F5/タブを閉じるなどのブラウザ離脱警告を isDirty に基づいて有効化
        enableBeforeUnload: isDirty, 

    });
    
    // useBlockerとは別に、新規パックのアンマウント時のクリーンアップ処理を維持
    useEffect(() => {
        return () => {
            // 新規パックの場合、アンマウント時にメモリ上の状態をクリーンアップ
            if (isNewPack && isDirty) {
                // cleanPack を依存配列に追加したので、警告を回避しつつ使用可能
                removePackFromStore(packId); 
            }
        };
    }, [isDirty, isNewPack, packId, removePackFromStore]); 
    
    // 💡 修正: グローバルストアからモーダルを開く関数を取得。型を UIStore に修正
    const openGlobalCardViewModal = useUIStore((state: UIStore) => state.openCardViewModal);

    // 💡 修正: グローバルストアの関数を呼び出すハンドラに置き換え
    const handleOpenCardViewModal = (card: CardType) => {
        console.log('✅ handleOpenCardViewModal called for card:', card.cardId); 

        openGlobalCardViewModal(card.cardId); // カードのIDを渡してグローバルモーダルを開く
    };

    // ロード中またはデータがない場合
    if (!packData) {
        return (
            <Box sx={{ p: 3, textAlign: 'center' }}>
                <CircularProgress />
                <Typography sx={{ mt: 2 }}>データをロード中...</Typography>
            </Box>
        );
    }
    
    // フォームが編集可能かどうか（UIの表示/非表示に使う。usePackEditのisDisabledは要素の無効化に使う）
    // 💡 修正: isEditModeを直接使用することで、新規パック作成時(isEditMode=true)も既存パック編集時も対応
    const isEditable = isEditMode;

    return (
        <Box sx={{ p: 3 }}>
            {/* ページヘッダー */}
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h4" component="h1">
                    {isNewPack ? '新規パック作成' : `パック編集: ${packData.name}`}
                </Typography>
                
                {/* 💡 ツールバーの変更: プリセット操作を削除し、データ入出力ボタンを追加 */}
                <Box sx={{ display: 'flex', gap: 1 }}>
                    {/* 編集/閲覧モード切り替えボタン */}
                    {isExistingPack && (
                        <Button 
                            variant="outlined" 
                            onClick={toggleEditMode}
                            startIcon={isEditMode ? <VisibilityIcon /> : <EditIcon />}
                        >
                            {isEditMode ? '閲覧モードへ' : '編集モードへ'}
                        </Button>
                    )}
                    
                    {/* 保存ボタン */}
                    <Button 
                        variant="contained" 
                        startIcon={<SaveIcon />} 
                        onClick={handleSave} 
                        disabled={isDisabled || !isDirty} 
                    >
                        保存
                    </Button>

                    {/* 💡 データ入出力ボタン (ImportExportIconを使用) */}
                    {isExistingPack && (
                        <Tooltip title="データ入出力 (CSV/JSON)">
                            <IconButton
                                onClick={handleMenuOpen}
                                disabled={csvIO.isLoading || isJsonIOLoading}
                                color="primary"
                            >
                                <ImportExportIcon />
                            </IconButton>
                        </Tooltip>
                    )}
                    
                    {/* 💡 データ入出力メニュー */}
                    <Menu
                        anchorEl={anchorEl}
                        open={Boolean(anchorEl)}
                        onClose={handleMenuClose}
                        sx={{
                            // メニュー間の隙間を調整 (既存のプリセットメニューのレイアウトを流用)
                            '& .MuiList-padding': { py: 0 }, 
                        }}
                    >
                        {/* CSVセクション */}
                        <Box sx={{ p: 1, borderBottom: '1px solid #eee' }}>
                            <Typography variant="caption" color="textSecondary">収録カードのみ (CSV)</Typography>
                        </Box>
                        <MenuItem onClick={() => handleImportClick('csv')} disabled={!isEditMode || csvIO.isLoading}>
                            <UploadFileIcon sx={{ mr: 1 }} />
                            CSVインポート
                        </MenuItem>
                        <MenuItem onClick={() => handleExportClick('csv')} disabled={csvIO.isLoading}>
                            <DownloadFileIcon sx={{ mr: 1 }} />
                            CSVエクスポート
                        </MenuItem>

                        <Divider />
                        
                        {/* JSONセクション */}
                        <Box sx={{ p: 1, borderBottom: '1px solid #eee' }}>
                            <Typography variant="caption" color="textSecondary">パック全体 (JSON)</Typography>
                        </Box>
                        <MenuItem onClick={() => handleImportClick('json')} disabled={isJsonIOLoading}>
                            <InsertDriveFileIcon sx={{ mr: 1 }} />
                            JSONインポート
                        </MenuItem>
                        <MenuItem onClick={() => handleExportClick('json')} disabled={isJsonIOLoading}>
                            <DownloadFileIcon sx={{ mr: 1 }} />
                            JSONエクスポート
                        </MenuItem>

                    </Menu>
                    
                    {/* 削除ボタン */}
                    {isExistingPack && (
                        <Button 
                            variant="outlined" 
                            color="error" 
                            onClick={handleRemovePack} 
                            disabled={!isEditable} 
                        >
                            削除
                        </Button>
                    )}
                </Box>
            </Box>

            {/* アラートメッセージ表示エリア */}
            {saveAlert && (
                <Alert 
                    severity={saveAlert.startsWith('❌') ? "error" : "success"} 
                    onClose={() => setSaveAlert(null)} 
                    sx={{ mb: 3 }}
                >
                    {saveAlert}
                </Alert>
            )}

            {/* メイングッリドコンテナ */}
            <Grid container spacing={4}>
                {/* A. 左側: パック情報編集エリア (PackInfoFormに置き換え) */}
                <Grid size={{ xs: 12, md: 4 }}> {/* 💡 itemをsizeに修正 */}
                    <Paper elevation={3} sx={{ p: 4, height: '100%' }}>
                        {/* ★ 修正: PackInfoFormコンポーネントをレンダリング */}
                        <PackInfoForm 
                            packData={packData}
                            isEditable={isEditable}
                            isDisabled={isDisabled}
                            handleInputChange={handleInputChange}
                            handleSelectChange={handleSelectChange}
                            handleOpenRarityEditModal={handleOpenRarityEditModal}
                            handleSave={handleSave}
                        />
                    </Paper>
                </Grid>

                {/* B. 右側: カード登録枠エリア (メイン) */}
                <Grid size={{ xs: 12, md: 8 }}> {/* 💡 itemをsizeに修正 */}
                    <Paper elevation={3} sx={{ p: 4, height: '100%' }}>
                        {/* 収録カードリストコンポーネントを配置 */}
                        <PackCardList 
                            packId={packId}
                            isEditable={isEditable} 
                            onOpenEditModal={handleOpenCardEditModal} 
                            onOpenViewModal={handleOpenCardViewModal} 
                            cards={cards} 
                        />
                        <Divider sx={{ my: 3 }} />
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            {csvIO.statusMessage}
                        </Typography>
                    </Paper>
                </Grid>
            </Grid>
            
            {/* モーダル群 (CardEditModal) */}
            <CardEditModal 
                open={isCardModalOpen}
                onClose={handleCloseCardEditModal}
                card={editingCard}
                packRaritySettings={packData.rarityConfig} 
                onSave={handleCardSave}
                onDelete={handleRemoveCard}
                currentPackName={packData.name}
                currentPackId={packId}
            />

            <RarityEditModal
                open={isRarityModalOpen}
                onClose={handleCloseRarityEditModal}
                packId={packId}
                packData={packData} 
                onSave={handleRarityEditSave}
            />

            {/* CSVインポート確認モーダル (既存: 変更なし) */}
            <Dialog 
                open={isImportModalOpen} 
                onClose={() => setIsImportModalOpen(false)}
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
                        onChange={handleFileChange}
                        disabled={!isEditMode || csvIO.isLoading} 
                    />
                    {fileToImport && (
                        <Typography variant="body2" sx={{ mt: 1 }}>
                            選択中のファイル: **{fileToImport.name}**
                        </Typography>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setIsImportModalOpen(false)} disabled={!isEditMode}>キャンセル</Button>
                    <Button 
                        onClick={handleConfirmImport} 
                        variant="contained" 
                        disabled={!fileToImport || !isEditMode || csvIO.isLoading} 
                    >
                        インポート実行
                        {csvIO.isLoading && <CircularProgress size={16} sx={{ ml: 1 }} />} 
                    </Button>
                </DialogActions>
            </Dialog>

            {/* 💡 JSONインポートダイアログ (新規追加) */}
            <Dialog
                open={isJsonImportModalOpen}
                onClose={() => setIsJsonImportModalOpen(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>JSONファイルからパック全体をインポート</DialogTitle>
                <DialogContent dividers>
                    {jsonIOStatusMessage && (
                        <Alert 
                            severity={jsonIOStatusMessage.startsWith('❌') ? 'error' : (jsonIOStatusMessage.startsWith('⚠️') ? 'warning' : 'info')} 
                            sx={{ mb: 2 }}
                        >
                            {jsonIOStatusMessage}
                        </Alert>
                    )}
                    <Alert severity="warning" sx={{ mb: 2 }}>
                        この機能は、パック全体（基本情報、レアリティ設定、収録カード）を**新規パック**としてデータベースに登録します。<br />
                        **既存のパックへの上書きは行いません**。JSON内のパックIDは新しいIDに自動で置き換えられます。
                    </Alert>
                    <input
                        type="file"
                        accept=".json"
                        onChange={handleJsonFileChange}
                    />
                    {jsonFileToImport && (
                        <Typography variant="body2" sx={{ mt: 1 }}>
                            選択中のファイル: **{jsonFileToImport.name}**
                        </Typography>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setIsJsonImportModalOpen(false)} disabled={isJsonIOLoading}>キャンセル</Button>
                    <Button
                        onClick={handleConfirmJsonImport}
                        variant="contained"
                        disabled={!jsonFileToImport || isJsonIOLoading}
                    >
                        インポート実行
                        {(isJsonIOLoading) && <CircularProgress size={16} sx={{ ml: 1 }} />}
                    </Button>
                </DialogActions>
            </Dialog>

        </Box>
    );
};

export default PackEditPage;