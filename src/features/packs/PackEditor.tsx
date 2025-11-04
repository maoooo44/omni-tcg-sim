import React from 'react';
import {
    Box, Typography,
    Alert, Paper, Divider
} from '@mui/material';

// ツールバーとIOモーダルのインポート
import PackEditorToolbar from './components/PackEditorToolbar';
import CsvImportModal from './components/CsvIOModal';
import JsonImportModal from './components/JsonIOModal';

// サブUIコンポーネントのインポート
import PackCardList from './components/PackCardList';
import CardModal from '../cards/components/CardModal';
import RarityEditorModal from '../../components/modals/RarityEditorModal';
import PackInfoForm from './components/PackInfoForm';

import { usePackEditor } from './hooks/usePackEditor';
// ⭐ 【追加】usePackStoreをインポート
import { usePackStore } from '../../stores/packStore';

import type { FieldSetting } from '../../models/models';
import { PAGE_PADDING, PAGE_FLEX_GROW, PAGE_TITLE_VARIANT } from '../../configs/configs';

// ----------------------------------------------------------------------
interface PackEditorProps extends ReturnType<typeof usePackEditor> {
    packId: string;
    // 💡 【追加】折り畳み状態の管理（usePackEditorで定義されていると仮定）
    isPackInfoFormCollapsed: boolean;
    togglePackInfoFormCollapse: () => void;
    handleCancelEdit: () => void;
    // ⭐ 【削除/コメントアウト】PackEditor内部で取得・定義するため
    // isFavorite: boolean; 
    // handleToggleFavorite: (newState: boolean) => Promise<void>;
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

    handleImportClick,
    handleExportClick,

    customFieldSettings: _customFieldSettings, // 将来の機能用に保持
    handleCustomFieldSettingChange,
    handlePackCustomFieldChange,

    handlePackFieldSettingChange, // usePackEditorから取得した生のハンドラ

    // 💡 【追加】折り畳み状態のprops
    isPackInfoFormCollapsed,
    togglePackInfoFormCollapse,

    // isFavorite, // 削除
    // handleToggleFavorite, // 削除

    handleCancelEdit,

}) => {

    if (!packData) return null;

    // ⭐ 【追加】usePackStoreからアクションとストアのパックデータを取得
    const updatePackIsFavorite = usePackStore(state => state.updatePackIsFavorite);
    const storePacks = usePackStore(state => state.packs);

    // 🟢 修正: 閲覧モード時はストアから最新のパックデータを取得
    const displayPack = React.useMemo(() => {
        if (!isEditorMode) {
            // 閲覧モードの場合、ストアから最新のパックを取得
            const latestPack = storePacks.find(p => p.packId === packData.packId);
            if (latestPack) {
                console.log('🔍 PackEditor - 閲覧モード: ストアから最新パックを取得', latestPack.packId, 'isFavorite:', latestPack.isFavorite);
                return latestPack;
            }
        }
        // 編集モードまたはストアに見つからない場合はpackDataを使用
        return packData;
    }, [isEditorMode, storePacks, packData]);

    // ⭐ 【追加】isFavoriteの状態をdisplayPackから取得
    const isFavorite = displayPack.isFavorite || false;

    // ⭐ 【追加】handleToggleFavoriteの定義
    const handleToggleFavorite = React.useCallback(async (newState: boolean) => {
        // 新規パック (DB未保存) では不可
        if (isNewPack) return;

        try {
            // ストアアクションを呼び出し、DBを直接更新する
            const updatedPack = await updatePackIsFavorite(packId, newState);

            if (updatedPack) {
                console.log(`[PackEditor] Favorite state toggled for Pack ID: ${packId}`);
            }
        } catch (error) {
            console.error('Failed to toggle pack favorite state:', error);
        }
    }, [isNewPack, packId, updatePackIsFavorite]);


    const isEditable = isEditorMode;
    const isCardModalReadOnly = !isEditable;

    // PackInfoForm / CustomFieldManager が期待するシグネチャに合わせたラッパー
    // PackEditor.tsx 内の修正
    const handlePackFieldSettingWrapper = React.useCallback((
        _itemType: 'Card' | 'Deck' | 'Pack',
        type: 'num' | 'str',
        index: number,
        settingUpdates: Partial<FieldSetting> // 例: { isVisible: true, displayName: 'New Name' }
    ) => {
        // settingUpdatesのキーを全てループする
        Object.entries(settingUpdates).forEach(([field, value]) => {

            // fieldは keyof FieldSetting, valueはその値
            const settingKey = field as keyof FieldSetting;

            // usePackEditor.ts の関数に引数を変換して渡す
            // isVisible: true, displayName: 'New Name' の両方について、それぞれ handlePackFieldSettingChange が呼ばれる
            handlePackFieldSettingChange(type, index, settingKey, value);
        });

    }, [handlePackFieldSettingChange]);


    // 🚨 修正: CardModalに渡す onCustomFieldSettingChange のラッパー
    const handleCardFieldSettingWrapper = React.useCallback((
        _itemType: "Card" | "Deck" | "Pack",
        type: 'num' | 'str',
        index: number,
        settingUpdates: Partial<FieldSetting>
    ) => {
        // PackFieldSettingWrapper と同様に、settingUpdatesをループし、
        // 5引数 (type, index, field, value) の生のハンドラ (handleCustomFieldSettingChange) を呼び出す
        Object.entries(settingUpdates).forEach(([field, value]) => {
            const settingKey = field as keyof FieldSetting;

            // handleCustomFieldSettingChange は 5つの引数 (type, index, field, value) を期待
            handleCustomFieldSettingChange(type, index, settingKey, value);
        });
    }, [handleCustomFieldSettingChange]);


    return (
        <Box sx={{ p: PAGE_PADDING, flexGrow: PAGE_FLEX_GROW }}>
             <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between'}}>
            <Typography variant={PAGE_TITLE_VARIANT} component="h1">パック編集</Typography>


            <PackEditorToolbar
                packData={packData}
                isExistingPack={isExistingPack}
                isEditorMode={isEditorMode}
                isDirty={_isDirty}
                csvIOLoading={csvIO.isLoading}
                jsonIOLoading={isJsonIOLoading}
                toggleEditorMode={toggleEditorMode}
                handleSave={handleSave}
                handleCancelEdit={handleCancelEdit}
                handleRemovePack={handleRemovePack}
                handleImportClick={handleImportClick}
                handleExportClick={handleExportClick}
                isFavorite={isFavorite}
                handleToggleFavorite={handleToggleFavorite}
            />
            </Box>

            <Box sx={{ flexGrow: 1, p: 2 }}>

                {saveAlert && (
                    <Alert
                        severity={saveAlert.startsWith('❌') ? "error" : "success"}
                        onClose={() => setSaveAlert(null)}
                        sx={{ mb: 3 }}
                    >
                        {saveAlert}
                    </Alert>
                )}

                {/* 上部: PackInfoForm（折り畳み可能） */}
                <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
                    <PackInfoForm
                        packData={displayPack}
                        isEditable={isEditable}
                        handleInputChange={handleInputChange}
                        handleSelectChange={handleSelectChange}
                        handleOpenRarityEditorModal={handleOpenRarityEditorModal}
                        handleSave={handleSave}
                        onPackCustomFieldChange={handlePackCustomFieldChange}
                        customFieldSettings={displayPack.packFieldSettings ? (displayPack.packFieldSettings as unknown as Record<string, FieldSetting>) : {}}
                        onCustomFieldSettingChange={handlePackFieldSettingWrapper}
                        // 💡 【追加】折り畳み制御用のprops
                        isCollapsed={isPackInfoFormCollapsed}
                        onToggleCollapse={togglePackInfoFormCollapse}
                    />
                </Paper>

                {/* 下部: PackCardList */}
                <Paper elevation={3} sx={{ p: 4 }}>
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

                <CardModal
                    open={isCardModalOpen}
                    onClose={handleCloseCardModal}
                    card={editingCard}
                    currentPack={packData}
                    onSave={handleCardSave}
                    onRemove={handleRemoveCard}
                    isReadOnly={isCardModalReadOnly}
                    onCustomFieldSettingChange={handleCardFieldSettingWrapper}
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
        </Box>

    );
};

export default PackEditor;