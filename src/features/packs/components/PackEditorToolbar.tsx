/**
 * src/features/packs/components/PackEditorToolbar.tsx
 *
 * PackEditor画面のヘッダーに位置するツールバーコンポーネント。
 * * 責務:
 * 1. ページのタイトル（新規作成またはパック名）を表示する。
 * 2. 編集/閲覧モードの切り替えボタン、保存ボタン、論理削除ボタンなどの主要な操作ボタンをレンダリングする。
 * 3. CSV/JSONのインポート/エクスポートを行うためのメニュー（ImportExportIcon）を表示する。
 * 4. 渡された状態（isNewPack, isExistingPack, isEditorMode, isDirty, isDisabled, IO Loading）に基づいて、各ボタンの有効/無効状態を制御する。
 * 5. 論理削除されたパックの復元や完全削除の機能は持たず、 PackEditor（メイン画面）の責務に限定した機能のみを提供する。
 */
import React from 'react';
import {
    Button, Box, Typography, MenuItem, Menu, IconButton, Tooltip, Divider,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import EditorIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ImportExportIcon from '@mui/icons-material/ImportExport';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DownloadFileIcon from '@mui/icons-material/DownloadForOffline';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import type { Pack } from '../../../models/pack';

interface PackEditorToolbarProps {
    packData: Pack;
    isNewPack: boolean;
    isExistingPack: boolean;
    isEditorMode: boolean;
    isDirty: boolean;
    isDisabled: boolean;
    csvIOLoading: boolean;
    jsonIOLoading: boolean;

    toggleEditorMode: () => void;
    handleSave: () => void;
    // 既存の論理削除 (論理削除機能自体は残す)
    handleRemovePack: () => void;

    anchorEl: null | HTMLElement;
    handleMenuOpen: (event: React.MouseEvent<HTMLElement>) => void;
    handleMenuClose: () => void;
    handleImportClick: (type: 'csv' | 'json') => void;
    // packDataを渡すことで、useDataFileIOフック側がパックデータにアクセスできるようにする
    handleExportClick: (type: 'csv' | 'json', data: Pack) => void;
}

const PackEditorToolbar: React.FC<PackEditorToolbarProps> = ({
    packData,
    //isNewPack,
    isExistingPack,
    isEditorMode,
    isDirty,
    isDisabled,
    csvIOLoading,
    jsonIOLoading,

    toggleEditorMode,
    handleSave,
    handleRemovePack,

    anchorEl,
    handleMenuOpen,
    handleMenuClose,
    handleImportClick,
    handleExportClick,
}) => {

    const isCurrentEditorMode = isEditorMode;
    const isSaveDisabled = isDisabled || !isDirty;

    // 論理削除パックの表示はパック一覧画面に任せ、PackEditorは既存パックと新規パックのみを扱う
    const pageTitle = `パック${isEditorMode ? '編集' : '閲覧'}`; //: `パック編集: ${packData.name}`

    return (
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h4" component="h1">
                {pageTitle}
            </Typography>

            {/* ツールバーアクションボタン群 */}
            <Box sx={{ display: 'flex', gap: 1 }}>

                {/* 編集/閲覧モード切り替えボタン (既存パックの場合のみ) */}
                {isExistingPack && (
                    <Button
                        variant="outlined"
                        onClick={toggleEditorMode}
                        startIcon={isCurrentEditorMode ? <VisibilityIcon /> : <EditorIcon />}
                    >
                        {isCurrentEditorMode ? '閲覧モードへ' : '編集モードへ'}
                    </Button>
                )}

                {/* 保存ボタン */}
                <Button
                    variant="contained"
                    startIcon={<SaveIcon />}
                    onClick={handleSave}
                    disabled={isSaveDisabled}
                >
                    保存
                </Button>

                {/* データ入出力ボタン (既存パックの場合のみ) */}
                {isExistingPack && (
                    <Tooltip title="データ入出力 (CSV/JSON)">
                        <IconButton
                            onClick={handleMenuOpen}
                            disabled={csvIOLoading || jsonIOLoading}
                            color="primary"
                        >
                            <ImportExportIcon />
                        </IconButton>
                    </Tooltip>
                )}

                {/* データ入出力メニュー */}
                <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={handleMenuClose}
                    sx={{
                        '& .MuiList-padding': { py: 0 },
                    }}
                >
                    {/* CSVセクション */}
                    <Box sx={{ p: 1, borderBottom: '1px solid #eee' }}>
                        <Typography variant="caption" color="textSecondary">収録カードのみ (CSV)</Typography>
                    </Box>
                    {/* CSVインポート: 編集モードでのみ実行可能 */}
                    <MenuItem onClick={() => handleImportClick('csv')} disabled={!isCurrentEditorMode || csvIOLoading}>
                        <UploadFileIcon sx={{ mr: 1 }} />
                        CSVインポート
                    </MenuItem>
                    {/* CSVエクスポート: 常に可能 */}
                    <MenuItem onClick={() => handleExportClick('csv', packData)} disabled={csvIOLoading}>
                        <DownloadFileIcon sx={{ mr: 1 }} />
                        CSVエクスポート
                    </MenuItem>

                    <Divider />

                    {/* JSONセクション */}
                    <Box sx={{ p: 1, borderBottom: '1px solid #eee' }}>
                        <Typography variant="caption" color="textSecondary">パック全体 (JSON)</Typography>
                    </Box>
                    {/* JSONインポート: 常に新規パックとして登録するため、モード依存なし */}
                    <MenuItem onClick={() => handleImportClick('json')} disabled={jsonIOLoading}>
                        <InsertDriveFileIcon sx={{ mr: 1 }} />
                        JSONインポート
                    </MenuItem>
                    {/* JSONエクスポート: 常に可能 */}
                    <MenuItem onClick={() => handleExportClick('json', packData)} disabled={jsonIOLoading}>
                        <DownloadFileIcon sx={{ mr: 1 }} />
                        JSONエクスポート
                    </MenuItem>

                </Menu>

                {/* 論理削除ボタン (既存パックかつ編集モードの場合のみ) */}
                {isExistingPack && isCurrentEditorMode && (
                    <Button
                        variant="outlined"
                        color="error"
                        onClick={handleRemovePack}
                        disabled={!isCurrentEditorMode}
                    >
                        ゴミ箱に入れる
                    </Button>
                )}
            </Box>
        </Box>
    );
};

export default PackEditorToolbar;