/**
 * src/features/packs/components/PackEditorToolbar.tsx
 *
 * PackEditor画面のヘッダーに位置するツールバーコンポーネント。
 * 主にパックのメタ情報（Packデータ）と、各種アクションハンドラ（保存、削除、モード切替、インポート/エクスポート）を受け取り、
 * 編集状態やデータ状態に応じて、ボタンの有効/無効を制御し、適切なUIを提供します。
 * 責務：ページタイトル表示、主要な操作ボタンのレンダリング、データ入出力メニューの表示。
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
// 💡 追加: 復元、物理削除用のアイコン
import RestoreIcon from '@mui/icons-material/Restore';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';

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
    // ✅ 修正: isAllViewModeをPropsとして追加
    isAllViewMode: boolean; 
    
    toggleEditorMode: () => void; 
    handleSave: () => void;
    // 既存の論理削除
    handleRemovePack: () => void;
    // 💡 追加: 物理削除と復元
    handlePhysicalDeletePack: () => void;
    handleRestorePack: () => void;
    
    anchorEl: null | HTMLElement;
    handleMenuOpen: (event: React.MouseEvent<HTMLElement>) => void;
    handleMenuClose: () => void;
    handleImportClick: (type: 'csv' | 'json') => void;
    // packDataを渡すことで、useDataFileIOフック側がパックデータにアクセスできるようにする
    handleExportClick: (type: 'csv' | 'json', data: Pack) => void;
}

const PackEditorToolbar: React.FC<PackEditorToolbarProps> = ({
    packData,
    isNewPack,
    isExistingPack,
    isEditorMode,
    isDirty,
    isDisabled,
    csvIOLoading,
    jsonIOLoading,
    // ✅ 修正: isAllViewModeを取得
    isAllViewMode, 
    
    toggleEditorMode,
    handleSave,
    handleRemovePack,
    // 💡 物理削除と復元ハンドラ
    handlePhysicalDeletePack,
    handleRestorePack,
    
    anchorEl,
    handleMenuOpen,
    handleMenuClose,
    handleImportClick,
    handleExportClick,
}) => {
    
    // 論理削除されているかどうかを packData.isInStore のみで判定
    const isDeleted = packData.isInStore === false;
    
    // 論理削除されている場合、編集モードは強制的にON
    const isCurrentEditorMode = isDeleted ? true : isEditorMode;
    // 論理削除パックは復元されるまで保存できない
    const isSaveDisabled = isDeleted || isDisabled || !isDirty;

    return (
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h4" component="h1">
                {isNewPack 
                    ? '新規パック作成' 
                    : isDeleted
                        ? `パック復元・削除: ${packData.name}`
                        : `パック編集: ${packData.name}`
                }
            </Typography>
            
            {/* ツールバーアクションボタン群 */}
            <Box sx={{ display: 'flex', gap: 1 }}>
                
                {/* 復元/削除ボタン群 (packData.isInStore が false かつ isAllViewMode が true のみ) */}
                {/* ✅ 修正: isDeleted (packData.isInStore === false) と isAllViewMode の両方をチェック */}
                {isDeleted && isAllViewMode && ( 
                    <>
                        <Button
                            variant="contained"
                            color="success"
                            onClick={handleRestorePack}
                            startIcon={<RestoreIcon />}
                        >
                            パックを復元
                        </Button>
                        <Button
                            variant="outlined"
                            color="error"
                            onClick={handlePhysicalDeletePack}
                            startIcon={<DeleteForeverIcon />}
                        >
                            完全削除
                        </Button>
                        <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
                    </>
                )}

                {/* 編集/閲覧モード切り替えボタン (論理削除されていないパックのみ) */}
                {/* isExistingPack のチェックは、論理削除されていない既存パックを指すため残す */}
                {isExistingPack && !isDeleted && (
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
                    // 編集モードかつ変更があり、論理削除されていない場合のみ有効
                    disabled={isSaveDisabled} 
                >
                    保存
                </Button>

                {/* データ入出力ボタン (既存パックかつ論理削除されていないパックのみ) */}
                {isExistingPack && !isDeleted && (
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
                
                {/* 論理削除ボタン (既存パックかつ編集モードかつ論理削除されていない場合のみ) */}
                {isExistingPack && !isDeleted && (
                    <Button 
                        variant="outlined" 
                        color="error" 
                        onClick={handleRemovePack} 
                        disabled={!isCurrentEditorMode} 
                    >
                        ストアから除外
                    </Button>
                )}
            </Box>
        </Box>
    );
};

export default PackEditorToolbar;