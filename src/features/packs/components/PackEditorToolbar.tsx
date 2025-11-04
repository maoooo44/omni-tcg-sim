import React from 'react';
import ButtonBar from '../../../components/common/ButtonBar';
import type { Pack } from '../../../models/models';


interface PackEditorToolbarProps {
    packData: Pack;
    isExistingPack: boolean;
    isEditorMode: boolean;
    isDirty: boolean;
    csvIOLoading: boolean;
    jsonIOLoading: boolean;

    toggleEditorMode: () => void;
    handleSave: () => Promise<void>;
    handleCancelEdit: () => void;
    handleRemovePack: () => Promise<void>;

    handleImportClick: (type: 'csv' | 'json') => void;
    handleExportClick: (type: 'csv' | 'json', data: Pack) => void;
    
    isFavorite: boolean;
    handleToggleFavorite: (newState: boolean) => Promise<void>;
}

const PackEditorToolbar: React.FC<PackEditorToolbarProps> = ({
    packData,
    isExistingPack,
    isEditorMode,
    isDirty,
    csvIOLoading,
    jsonIOLoading,

    toggleEditorMode,
    handleSave,
    handleCancelEdit,
    handleRemovePack,

    handleImportClick,
    handleExportClick,

    isFavorite,
    handleToggleFavorite,
}) => {
    const isIoDisabled = isDirty || csvIOLoading || jsonIOLoading;

    return (
        
        <ButtonBar
            item="パック"
            viewEditMode={
                isExistingPack
                    ? {
                          isEditMode: isEditorMode,
                          onToggle: toggleEditorMode,
                          disabled: csvIOLoading || jsonIOLoading,
                      }
                    : undefined
            }
            discardChanges={
                isExistingPack
                    ? {
                          isDirty,
                          onDiscard: handleCancelEdit,
                      }
                    : undefined
            }
            save={{
                onSave: handleSave,
                disabled: !isEditorMode || !isDirty || csvIOLoading || jsonIOLoading,
            }}
            csvIO={
                isExistingPack
                    ? {
                          onImport: () => handleImportClick('csv'),
                          onExport: () => handleExportClick('csv', packData),
                          disabled: (!isEditorMode && handleImportClick !== undefined) || isIoDisabled,
                          label: '収録カードのみ',
                      }
                    : undefined
            }
            jsonIO={
                isExistingPack
                    ? {
                          onImport: () => handleImportClick('json'),
                          onExport: () => handleExportClick('json', packData),
                          disabled: csvIOLoading || jsonIOLoading,
                          label: 'パック全体',
                      }
                    : undefined
            }
            favorite={
                isExistingPack
                    ? {
                          itemId: packData.packId,
                          isFavorite,
                          onToggle: async (_itemId: string, newState: boolean) => {
                              await handleToggleFavorite(newState);
                          },
                          disabled: isEditorMode || csvIOLoading || jsonIOLoading,
                      }
                    : undefined
            }
            delete={
                isExistingPack
                    ? {
                          onDelete: handleRemovePack,
                          disabled: !isEditorMode || csvIOLoading || jsonIOLoading,
                      }
                    : undefined
            }
        />
    );
};

export default PackEditorToolbar;