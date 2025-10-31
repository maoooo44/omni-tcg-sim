/**
 * src/features/packs/PackEditor.tsx
 *
 * パック編集フィーチャーのメインビューコンポーネント。
 * * 責務:
 * 1. usePackEditorカスタムフックから編集に必要な全てのデータ、状態、および操作ロジックを取得する。
 * 2. 取得したロジックと状態を PackEditorToolbar, PackInfoForm, PackCardList, モーダルなどのサブコンポーネントに伝達し、UIのコンポジションを行う。
 * 3. Pack情報（PackInfoForm）とカード一覧（PackCardList）のレイアウトを定義する（Gridレイアウト）。
 * 4. データ保存のアラートメッセージ（saveAlert）を表示する。
 * 5. 編集モードやカードモーダルの読み取り専用状態など、ビュー層の状態を管理・決定する。
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
import CardModal from '../../components/modals/CardModal';
import RarityEditorModal from '../../components/modals/RarityEditorModal';
import PackInfoForm from './components/PackInfoForm';

import { usePackEditor } from './hooks/usePackEditor';

import type { FieldSetting } from '../../models/customField';

// ----------------------------------------------------------------------
interface PackEditorProps extends ReturnType<typeof usePackEditor> {
    packId: string;
}
// ----------------------------------------------------------------------


const PackEditor: React.FC<PackEditorProps> = ({
    packId,
    packData,
    isNewPack,
    isExistingPack,
    isEditorMode,
    isDirty: _isDirty,
    toggleEditorMode,
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

    isCardModalOpen,
    editingCard,
    handleOpenCardEditorModal,
    handleOpenCardViewModal,
    handleCloseCardModal,

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

    customFieldSettings,
    handleCustomFieldSettingChange,
    handlePackCustomFieldChange,

    handlePackFieldSettingChange, // usePackEditorから取得した生のハンドラ

}) => {

    if (!packData) return null;

    const isEditable = isEditorMode;
    const isCardModalReadOnly = !isEditable;

    // 💡 【修正】PackInfoForm / CustomFieldManager が期待するシグネチャに合わせたラッパー
    const handlePackFieldSettingWrapper = React.useCallback((
        _itemType: 'Card' | 'Deck' | 'Pack', // Packであることを確認できるが、ここでは無視
        type: 'num' | 'str',
        index: number,
        settingUpdates: Partial<FieldSetting>
    ) => {
        // settingUpdatesは常に単一の変更を含むと仮定（CustomFieldManagerの設計による）
        if (Object.keys(settingUpdates).length === 1) {
            const field = Object.keys(settingUpdates)[0] as keyof FieldSetting;
            const value = settingUpdates[field];
            
            // usePackEditor.ts の関数に引数を変換して渡す
            handlePackFieldSettingChange(type, index, field, value);
        }
    }, [handlePackFieldSettingChange]);


    return (
        <Box sx={{ p: 3 }}>

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
                anchorEl={anchorEl}
                handleMenuOpen={handleMenuOpen}
                handleMenuClose={handleMenuClose}
                handleImportClick={handleImportClick}
                handleExportClick={handleExportClick}
            />

            {saveAlert && (
                <Alert
                    severity={saveAlert.startsWith('❌') ? "error" : "success"}
                    onClose={() => setSaveAlert(null)}
                    sx={{ mb: 3 }}
                >
                    {saveAlert}
                </Alert>
            )}

            <Grid container spacing={4}>
                {/* Grid の item は v7 で廃止。size を使用。 */}
                <Grid size={{ xs: 12, md: 4 }}>
                    <Paper elevation={3} sx={{ p: 4, height: '100%' }}>
                        <PackInfoForm
                            packData={packData}
                            isEditable={isEditable}
                            handleInputChange={handleInputChange}
                            handleSelectChange={handleSelectChange}
                            handleOpenRarityEditorModal={handleOpenRarityEditorModal}
                            handleSave={handleSave}
                            onPackCustomFieldChange={handlePackCustomFieldChange}
                            customFieldSettings={packData.packFieldSettings ? (packData.packFieldSettings as unknown as Record<string, FieldSetting>) : {}}
                            // 💡 【修正】ラッパー関数を渡す
                            onCustomFieldSettingChange={handlePackFieldSettingWrapper}
                        />
                    </Paper>
                </Grid>

                {/* Grid の item は v7 で廃止。size を使用。 */}
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

            <CardModal
                open={isCardModalOpen}
                onClose={handleCloseCardModal}
                card={editingCard}
                packRaritySettings={packData.rarityConfig}
                onSave={handleCardSave}
                onRemove={handleRemoveCard}
                currentPackName={packData.name}
                currentPackId={packId}

                customFieldSettings={customFieldSettings || {}}
                isReadOnly={isCardModalReadOnly}
                onCustomFieldSettingChange={React.useCallback((
                    _itemType: "Card" | "Deck" | "Pack",
                    type: 'num' | 'str',
                    index: number,
                    settingUpdates: Partial<FieldSetting>
                ) => {
                    if (Object.keys(settingUpdates).length === 1) {
                        const field = Object.keys(settingUpdates)[0] as keyof FieldSetting;
                        const value = settingUpdates[field];
                        // Cardの設定変更ハンドラ (usePackEditorで定義されたシグネチャに合わせたもの)
                        handleCustomFieldSettingChange(type, index, field, value);
                    }
                }, [handleCustomFieldSettingChange])}
            />


            <RarityEditorModal
                open={isRarityModalOpen}
                onClose={handleCloseRarityEditorModal}
                packData={packData}
                onSave={handleRarityEditorSave}
            />

            <CsvImportModal
                open={isImportModalOpen}
                isEditorMode={isEditorMode}
                isLoading={csvIO.isLoading}
                fileToImport={fileToImport}
                onClose={() => setIsImportModalOpen(false)}
                handleFileChange={handleFileChange}
                handleConfirmImport={handleConfirmImport}
            />

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