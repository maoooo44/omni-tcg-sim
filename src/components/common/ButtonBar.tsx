/**
 * src/components/common/ButtonBar.tsx
 *
 * エディターツールバー用の統合ボタンバー。
 * カスタムボタン、閲覧/編集切替、保存、データ入出力、お気に入り、削除などの
 * 一般的なアクションボタンを統一されたUIで提供する。
 *
 * 表示ロジック:
 * - show が undefined の場合: アクションが渡されていれば表示、なければ非表示
 * - show が明示的に指定されている場合: その値に従う
 */
import React from 'react';
import { Box, Alert, Menu, MenuItem, Divider } from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ImportExportIcon from '@mui/icons-material/ImportExport';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DownloadFileIcon from '@mui/icons-material/DownloadForOffline';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import EnhancedIconButton from './EnhancedIconButton';
import FavoriteToggleButton from './FavoriteToggleButton';

// カスタムボタンの設定
export interface CustomButtonConfig {
    icon: React.ReactNode;
    tooltipText: string;
    onClick: () => void;
    disabled?: boolean;
    color?: 'inherit' | 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';
    sx?: React.ComponentProps<typeof EnhancedIconButton>['sx'];
}

// CSV入出力設定
export interface CsvIOConfig {
    onImport: () => void;
    onExport: () => void;
    disabled?: boolean;
    label?: string; // 例: "収録カードのみ"
}

// JSON入出力設定
export interface JsonIOConfig {
    onImport: () => void;
    onExport: () => void;
    disabled?: boolean;
    label?: string; // 例: "パック全体"
}

// ButtonBar のプロパティ
export interface ButtonBarProps {
    // アイテム名（ツールチップ生成に使用）
    item?: string; // 例: "デッキ", "パック"

    // 保存メッセージ
    saveMessage?: string | null;

    // カスタムボタン（左端に配置）
    customButtons?: CustomButtonConfig[];

    // 閲覧/編集モード切り替え
    viewEditMode?: {
        show?: boolean;
        isEditMode: boolean;
        onToggle?: () => void;
        editIcon?: React.ReactNode;
        viewIcon?: React.ReactNode;
        editTooltip?: string;
        viewTooltip?: string;
        disabled?: boolean;
    };

    // 変更破棄ボタン（ダーティ時に viewEditMode の代わりに表示）
    discardChanges?: {
        show?: boolean;
        isDirty: boolean;
        onDiscard?: () => void;
        icon?: React.ReactNode;
        tooltip?: string;
    };

    // 保存ボタン
    save?: {
        show?: boolean;
        onSave?: () => Promise<void>;
        disabled?: boolean;
        icon?: React.ReactNode;
        tooltip?: string;
    };

    // CSV入出力
    csvIO?: CsvIOConfig;

    // JSON入出力
    jsonIO?: JsonIOConfig;

    // お気に入りトグルボタン
    favorite?: {
        show?: boolean;
        itemId: string;
        isFavorite: boolean;
        onToggle?: (itemId: string, newState: boolean) => Promise<void>;
        disabled?: boolean;
    };

    // 削除ボタン
    delete?: {
        show?: boolean;
        onDelete?: () => Promise<void>;
        disabled?: boolean;
        icon?: React.ReactNode;
        tooltip?: string;
    };
}

const ButtonBar: React.FC<ButtonBarProps> = ({
    item = 'アイテム',
    saveMessage,
    customButtons,
    viewEditMode,
    discardChanges,
    save,
    csvIO,
    jsonIO,
    favorite,
    delete: deleteConfig,
}) => {
    // 各ボタンの表示判定
    const shouldShowViewEditMode = viewEditMode?.show ?? (viewEditMode?.onToggle !== undefined);
    const shouldShowDiscardChanges = discardChanges?.show ?? (discardChanges?.onDiscard !== undefined);
    const shouldShowSave = save?.show ?? (save?.onSave !== undefined);
    const shouldShowCsvIO = csvIO !== undefined;
    const shouldShowJsonIO = jsonIO !== undefined;
    const shouldShowDataIO = shouldShowCsvIO || shouldShowJsonIO;
    const shouldShowFavorite = favorite?.show ?? (favorite?.onToggle !== undefined);
    const shouldShowDelete = deleteConfig?.show ?? (deleteConfig?.onDelete !== undefined);

    // discardChanges が表示される条件: ダーティかつ表示可能
    const showDiscardInsteadOfViewEdit = shouldShowDiscardChanges && discardChanges?.isDirty;

    // データ入出力メニュー状態
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };
    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    // ローディング状態
    const isDataIOLoading = (csvIO?.disabled || jsonIO?.disabled) ?? false;

    return (
        <Box sx={{ mb: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', mb: 1 }}>
                {/* アクションボタン群 */}
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    {/* 1. カスタムボタン */}
                    {customButtons?.map((button, index) => (
                        <EnhancedIconButton
                            key={index}
                            icon={button.icon}
                            tooltipText={button.tooltipText}
                            onClick={button.onClick}
                            disabled={button.disabled}
                            color={button.color}
                            sx={button.sx}
                        />
                    ))}

                    {/* 2. 閲覧/編集モード切り替え または 変更破棄ボタン */}
                    {showDiscardInsteadOfViewEdit && discardChanges ? (
                        // 変更破棄ボタン（ダーティ時）
                        <EnhancedIconButton
                            onClick={discardChanges.onDiscard}
                            icon={discardChanges.icon || <RestartAltIcon color="warning" />}
                            tooltipText={discardChanges.tooltip || '変更を破棄'}
                            color="warning"
                        />
                    ) : shouldShowViewEditMode && viewEditMode ? (
                        // 閲覧/編集モード切り替え
                        <EnhancedIconButton
                            onClick={viewEditMode.onToggle}
                            icon={
                                viewEditMode.isEditMode
                                    ? (viewEditMode.viewIcon || <VisibilityIcon />)
                                    : (viewEditMode.editIcon || <EditIcon />)
                            }
                            tooltipText={
                                viewEditMode.isEditMode
                                    ? (viewEditMode.viewTooltip || '閲覧モードへ切り替える')
                                    : (viewEditMode.editTooltip || '編集モードへ切り替える')
                            }
                            color="primary"
                            disabled={viewEditMode.disabled}
                        />
                    ) : null}

                    {/* 3. 保存ボタン */}
                    {shouldShowSave && save && (
                        <EnhancedIconButton
                            icon={save.icon || <SaveIcon />}
                            tooltipText={save.tooltip || `${item}を保存`}
                            onClick={save.onSave}
                            disabled={save.disabled}
                            color="primary"
                        />
                    )}

                    {/* 4. データ入出力ボタン */}
                    {shouldShowDataIO && (
                        <>
                            <EnhancedIconButton
                                icon={<ImportExportIcon />}
                                tooltipText="データ入出力"
                                onClick={handleMenuOpen}
                                disabled={isDataIOLoading}
                                color="primary"
                                sx={{
                                    p: 1,
                                    minWidth: 40,
                                    height: 40,
                                    borderRadius: 1,
                                }}
                            />
                            <Menu
                                anchorEl={anchorEl}
                                open={Boolean(anchorEl)}
                                onClose={handleMenuClose}
                                sx={{
                                    '& .MuiList-padding': { py: 0 },
                                }}
                            >
                                {/* CSV入出力 */}
                                {shouldShowCsvIO && csvIO && (
                                    <>
                                        <Box sx={{ p: 1, borderBottom: '1px solid #eee' }}>
                                            <Box component="span" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                                                {csvIO.label || 'CSV'}
                                            </Box>
                                        </Box>
                                        <MenuItem onClick={() => { csvIO.onImport(); handleMenuClose(); }} disabled={csvIO.disabled}>
                                            <UploadFileIcon sx={{ mr: 1 }} />
                                            CSVインポート
                                        </MenuItem>
                                        <MenuItem onClick={() => { csvIO.onExport(); handleMenuClose(); }} disabled={csvIO.disabled}>
                                            <DownloadFileIcon sx={{ mr: 1 }} />
                                            CSVエクスポート
                                        </MenuItem>
                                        {shouldShowJsonIO && <Divider />}
                                    </>
                                )}

                                {/* JSON入出力 */}
                                {shouldShowJsonIO && jsonIO && (
                                    <>
                                        <Box sx={{ p: 1, borderBottom: '1px solid #eee' }}>
                                            <Box component="span" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                                                {jsonIO.label || 'JSON'}
                                            </Box>
                                        </Box>
                                        <MenuItem onClick={() => { jsonIO.onImport(); handleMenuClose(); }} disabled={jsonIO.disabled}>
                                            <InsertDriveFileIcon sx={{ mr: 1 }} />
                                            JSONインポート
                                        </MenuItem>
                                        <MenuItem onClick={() => { jsonIO.onExport(); handleMenuClose(); }} disabled={jsonIO.disabled}>
                                            <DownloadFileIcon sx={{ mr: 1 }} />
                                            JSONエクスポート
                                        </MenuItem>
                                    </>
                                )}
                            </Menu>
                        </>
                    )}

                    {/* 5. お気に入りトグルボタン */}
                    {shouldShowFavorite && favorite && favorite.onToggle && (
                        <FavoriteToggleButton
                            itemId={favorite.itemId}
                            isFavorite={favorite.isFavorite}
                            onToggle={favorite.onToggle}
                            disabled={favorite.disabled}
                            size="medium"
                        />
                    )}

                    {/* 6. 削除ボタン */}
                    {shouldShowDelete && deleteConfig && (
                        <EnhancedIconButton
                            icon={deleteConfig.icon || <DeleteIcon />}
                            tooltipText={deleteConfig.tooltip || `${item}をゴミ箱へ移動`}
                            onClick={deleteConfig.onDelete}
                            disabled={deleteConfig.disabled}
                            color="error"
                        />
                    )}
                </Box>
            </Box>

            {/* 保存結果メッセージ */}
            {saveMessage && (
                <Alert severity={saveMessage.includes('失敗') ? 'error' : 'success'} sx={{ mb: 1 }}>
                    {saveMessage}
                </Alert>
            )}
        </Box>
    );
};

export default ButtonBar;
