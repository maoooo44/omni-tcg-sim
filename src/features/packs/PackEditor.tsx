/**
 * src/features/packs/PackEditor.tsx
 * * パック編集画面のメインUIコンポーネント。
 * このコンポーネントは、usePackEditorカスタムフック（ロジック）から提供される全てのデータとハンドラを受け取り、
 * 編集画面の全体的なレイアウト構築と、各サブコンポーネントへのプロパティ分配を行う純粋なビューコンポーネントとしての責務を担う。
 * 主な要素として、ツールバー、パック基本情報フォーム、収録カードリスト、および各種モーダルが含まれる。
 */
import React from 'react';
import { 
    Box, Typography,
    Alert, Paper, Divider, Grid, 
} from '@mui/material'; 

// ツールバーとIOモーダルのインポート
import PackEditorToolbar from './components/PackEditorToolbar'; 
import CsvImportModal from './components/CsvIOModal';
import JsonImportModal from './components/JsonIOModal';

// サブUIコンポーネントのインポート
import PackCardList from './components/PackCardList';
import CardEditorModal from '../../components/modals/CardEditorModal';
import RarityEditorModal from '../../components/modals/RarityEditorModal';
import PackInfoForm from './components/PackInfoForm';

import type { Card as CardType } from '../../models/card'; 
import { usePackEditor } from './hooks/usePackEditor'; 

// usePackEditorフックの戻り値の型と、ページから追加されるpropsを結合
interface PackEditorProps extends ReturnType<typeof usePackEditor> {
    packId: string;
    handleOpenCardViewModal: (card: CardType) => void;
    // ★ 修正: isAllViewModeをPackEditorPropsに追加
    isAllViewMode: boolean; 
}

const PackEditor: React.FC<PackEditorProps> = ({
    packId,
    packData, 
    isNewPack, 
    isExistingPack,
    isEditorMode, 
    isDirty: _isDirty, // isDirtyは_isDirtyとして受け取り、Toolbarへ渡す
    toggleEditorMode, 
    csvIO,
    isDisabled,
    saveAlert,
    setSaveAlert,
    handleInputChange,
    handleSelectChange,
    handleSave,
    handleRemovePack,
    // 💡 物理削除と復元ハンドラを受け取る
    handlePhysicalDeletePack, 
    handleRestorePack,
    onPhysicalDelete, 
    onRestore, 
    
    // ★ 修正: isAllViewModeを引数で受け取る
    isAllViewMode,

    cards,
    handleCardSave,
    handleRemoveCard, // 論理削除

    isCardModalOpen,
    editingCard,
    handleOpenCardEditorModal,
    handleCloseCardEditorModal,

    isRarityModalOpen,
    handleOpenRarityEditorModal,
    handleCloseRarityEditorModal,
    handleRarityEditorSave, 
    
    isImportModalOpen,
    setIsImportModalOpen,
    fileToImport,
    handleFileChange,
    handleConfirmImport,
    
    isJsonImportModalOpen,
    setIsJsonImportModalOpen,
    jsonFileToImport,
    jsonIOStatusMessage,
    isJsonIOLoading,
    handleConfirmJsonImport,

    anchorEl,
    handleMenuOpen,
    handleMenuClose,
    handleImportClick,
    handleExportClick,
    
    handleOpenCardViewModal,
}) => {
    
    // データがない場合は何もしない
    if (!packData) return null; 

    // フォームの編集可能状態を制御
    const isEditable = isEditorMode;

    return (
        <Box sx={{ p: 3 }}>
            
            {/* ページヘッダー (PackEditorToolbarを配置) */}
            <PackEditorToolbar 
                packData={packData}
                isNewPack={isNewPack}
                isExistingPack={isExistingPack}
                isEditorMode={isEditorMode}
                isDirty={_isDirty}
                isDisabled={isDisabled}
                csvIOLoading={csvIO.isLoading}
                jsonIOLoading={isJsonIOLoading}
                toggleEditorMode={toggleEditorMode}
                handleSave={handleSave}
                handleRemovePack={handleRemovePack}
                /* 💡 修正: 物理削除と復元ハンドラを PackEditorToolbar に渡す */
                handlePhysicalDeletePack={handlePhysicalDeletePack}
                handleRestorePack={handleRestorePack}
                anchorEl={anchorEl}
                handleMenuOpen={handleMenuOpen}
                handleMenuClose={handleMenuClose}
                handleImportClick={handleImportClick}
                handleExportClick={handleExportClick}
                // ★ 修正: isAllViewModeをPackEditorToolbarに渡す
                isAllViewMode={isAllViewMode}
            />

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
                {/* A. 左側: パック情報編集エリア */}
                {/* 💡 ユーザー設定を考慮し、MaterialUI Gridのv7形式(size)を使用 */}
                <Grid size={{ xs: 12, md: 4 }}> 
                    <Paper elevation={3} sx={{ p: 4, height: '100%' }}>
                        <PackInfoForm 
                            packData={packData}
                            isEditable={isEditable}
                            handleInputChange={handleInputChange}
                            handleSelectChange={handleSelectChange}
                            handleOpenRarityEditorModal={handleOpenRarityEditorModal}
                            handleSave={handleSave}
                        />
                    </Paper>
                </Grid>

                {/* B. 右側: カード登録枠エリア (メイン) */}
                {/* 💡 ユーザー設定を考慮し、MaterialUI Gridのv7形式(size)を使用 */}
                <Grid size={{ xs: 12, md: 8 }}> 
                    <Paper elevation={3} sx={{ p: 4, height: '100%' }}>
                        <PackCardList 
                            packId={packId}
                            isEditable={isEditable} 
                            onOpenEditorModal={handleOpenCardEditorModal} 
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
            
            {/* モーダル群 (CardEditorModal, RarityEditorModal) */}
            <CardEditorModal 
                open={isCardModalOpen}
                onClose={handleCloseCardEditorModal}
                card={editingCard}
                packRaritySettings={packData.rarityConfig} 
                onSave={handleCardSave}
                // ★ 修正: onDelete を削除し、新しい3つのハンドラを追加 (これが正しいコード)
                onRemove={handleRemoveCard} // 論理削除
                onPhysicalDelete={onPhysicalDelete} // 物理削除 (usePackEditorから取得)
                onRestore={onRestore} // 復元 (usePackEditorから取得)
                // ★ 修正: isAllViewMode を渡す
                isAllViewMode={isAllViewMode}


                currentPackName={packData.name}
                currentPackId={packId}
            />


            <RarityEditorModal
                open={isRarityModalOpen}
                onClose={handleCloseRarityEditorModal}
                packData={packData} 
                onSave={handleRarityEditorSave}
            />

            {/* CSVインポート確認モーダル */}
            <CsvImportModal
                open={isImportModalOpen}
                isEditorMode={isEditorMode}
                isLoading={csvIO.isLoading}
                fileToImport={fileToImport}
                onClose={() => setIsImportModalOpen(false)}
                handleFileChange={handleFileChange}
                handleConfirmImport={handleConfirmImport}
            />

            {/* JSONインポートダイアログ */}
            <JsonImportModal
                open={isJsonImportModalOpen}
                isLoading={isJsonIOLoading}
                fileToImport={jsonFileToImport}
                statusMessage={jsonIOStatusMessage}
                onClose={() => setIsJsonImportModalOpen(false)}
                handleFileChange={handleFileChange}
                handleConfirmImport={handleConfirmJsonImport}
            />

        </Box>
    );
};

export default PackEditor;