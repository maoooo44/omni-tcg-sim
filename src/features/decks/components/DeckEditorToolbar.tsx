/**
 * src/features/decks/components/DeckEditorToolbar.tsx
 *
 * デッキ編集画面のツールバー。
 * ButtonBarコンポーネントを使用して統一されたUIを提供。
 */
import React from 'react';
import ViewListIcon from '@mui/icons-material/ViewList';
import StyleIcon from '@mui/icons-material/Style';

import ButtonBar from '../../../components/common/ButtonBar';
import type { Deck } from '../../../models/models';

interface DeckEditorToolbarProps {
    deck: Deck;
    isNewDeck: boolean;
    isDirty: boolean;
    onSave: () => Promise<void>;
    onDelete: () => Promise<void>;
    saveMessage: string | null;

    isEditorMode: boolean;
    toggleEditorMode: () => void;
    onCancelEdit: () => void;

    isDeckBuildingMode: boolean;
    handleToggleDeckBuildingMode: () => void;

    handleImportJson: () => void;
    handleExportJson: () => void;
    jsonIOLoading: boolean;

    isFavorite: boolean;
    handleToggleFavorite: (newState: boolean) => Promise<void>;
}

const DeckEditorToolbar: React.FC<DeckEditorToolbarProps> = ({
    deck,
    isNewDeck,
    isDirty,
    onSave,
    onDelete,
    saveMessage,
    isEditorMode,
    toggleEditorMode,
    onCancelEdit,
    isDeckBuildingMode,
    handleToggleDeckBuildingMode,
    handleImportJson,
    handleExportJson,
    jsonIOLoading,
    isFavorite,
    handleToggleFavorite,
}) => {
    return (
        <ButtonBar
            item="デッキ"
            saveMessage={saveMessage}
            customButtons={[
                {
                    icon: isDeckBuildingMode ? <StyleIcon /> : <ViewListIcon />,
                    tooltipText: isDeckBuildingMode ? 'リスト表示に切り替える' : '構築モードに切り替える',
                    onClick: handleToggleDeckBuildingMode,
                    disabled: !isEditorMode,
                    color: 'primary',
                    sx: { border: isDeckBuildingMode ? '1px solid currentColor' : 'none' },
                },
            ]}
            viewEditMode={{
                isEditMode: isEditorMode,
                onToggle: toggleEditorMode,
            }}
            discardChanges={{
                isDirty,
                onDiscard: onCancelEdit,
            }}
            save={{
                onSave,
                disabled: !isEditorMode || !isDirty,
            }}
            jsonIO={
                !isNewDeck
                    ? {
                          onImport: handleImportJson,
                          onExport: handleExportJson,
                          disabled: (!isEditorMode && handleImportJson !== undefined) || jsonIOLoading,
                          label: 'デッキ全体',
                      }
                    : undefined
            }
            favorite={
                !isNewDeck
                    ? {
                          itemId: deck.deckId,
                          isFavorite,
                          onToggle: async (_itemId: string, newState: boolean) => {
                              await handleToggleFavorite(newState);
                          },
                          disabled: isEditorMode || jsonIOLoading,
                      }
                    : undefined
            }
            delete={
                !isNewDeck
                    ? {
                          onDelete,
                          disabled: !isEditorMode,
                      }
                    : undefined
            }
        />
    );
};

export default DeckEditorToolbar;