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

import type { Card as CardType } from '../../models/card'; 
import { usePackEditor } from './hooks/usePackEditor'; 

// 💡 CustomFieldCategory のインポート元
// 型抽象は廃止
import type { DisplaySetting } from '../../models/pack';

// ----------------------------------------------------------------------
interface PackEditorProps extends ReturnType<typeof usePackEditor> {
    packId: string;
    handleOpenCardViewModal: (card: CardType) => void;
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

    customFieldSettings, 
    handleCustomFieldSettingChange, 
    // 💡 修正1: usePackEditorの戻り値に含まれる 'handlePackCustomFieldChange' を追加
    handlePackCustomFieldChange, 
    
    handleOpenCardViewModal,
}) => {
    
    if (!packData) return null; 

    const isEditable = isEditorMode;
    const isCardModalReadOnly = !isEditable;

    // PackInfoForm に渡すカスタムフィールド設定変更ハンドラのラッパー
    const handlePackFieldSettingChange = React.useCallback((
        _itemType: 'Card' | 'Deck' | 'Pack',
        _type: 'num' | 'str',
        _index: number,
        _settingUpdates: Partial<DisplaySetting>
    ) => {
        // Pack のカスタムフィールド設定変更ロジックが必要な場合はここに実装する
        console.warn(`[PackEditor] ⚠️ Pack Field Setting Change captured.`);
    }, []);


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
                        {/* --------------------------------------------------- */}
                        <PackInfoForm 
                            packData={packData}
                            isEditable={isEditable}
                            handleInputChange={handleInputChange} 
                            handleSelectChange={handleSelectChange}
                            handleOpenRarityEditorModal={handleOpenRarityEditorModal}
                            handleSave={handleSave}
                            // 💡 修正2: 必須プロパティ 'onPackCustomFieldChange' に 'handlePackCustomFieldChange' を渡す
                            onPackCustomFieldChange={handlePackCustomFieldChange} 
                            // packFieldSettings は Pack モデルで直接定義されていると仮定
                            customFieldSettings={packData.packFieldSettings ? (packData.packFieldSettings as unknown as Record<string, DisplaySetting>) : {}}
                            onCustomFieldSettingChange={handlePackFieldSettingChange} 
                        />
                        {/* --------------------------------------------------- */}
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
                onClose={handleCloseCardEditorModal}
                card={editingCard}
                packRaritySettings={packData.rarityConfig} 
                onSave={handleCardSave}
                onRemove={handleRemoveCard}
                currentPackName={packData.name}
                currentPackId={packId}
                
                customFieldSettings={customFieldSettings || {}} 
                isReadOnly={isCardModalReadOnly} 
                // CardModal に渡す onCustomFieldSettingChange は usePackEditor のハンドラを利用
                onCustomFieldSettingChange={React.useCallback((
                    _itemType: "Card" | "Deck" | "Pack", 
                    type: 'num' | 'str', 
                    index: number, 
                    settingUpdates: Partial<DisplaySetting>
                ) => {
                    if (Object.keys(settingUpdates).length === 1) {
                        const field = Object.keys(settingUpdates)[0] as keyof DisplaySetting;
                        const value = settingUpdates[field];
                        // handleCustomFieldSettingChange のシグネチャに合わせる
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