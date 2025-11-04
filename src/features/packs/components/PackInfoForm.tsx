/**
 * src/features/packs/components/PackInfoForm.tsx (PackPreviewCard 削除/ImagePreview 直接埋め込み版)
 */
import React from 'react';
import {
    TextField, Box, Typography, Select, MenuItem, InputLabel, FormControl,
    Button, Divider, Grid, Collapse
} from '@mui/material';
// ⭐ アイコンをインポート
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';


import type { Pack, Card, FieldSetting } from '../../../models/models';
import { PACK_TYPE_OPTIONS } from '../../../models/models';
// 💡 PackPreviewCard は削除し、ImagePreview をインポート
import ImagePreview from '../../../components/common/ImagePreview'; 

import CustomFieldManager from '../../../components/controls/CustomFieldManager';

// ColorSelectorをインポート（ファイルパスは仮定）
import ColorSelector from '../../../components/controls/ColorSelector';

// ⭐ 【追加】TagManagerをインポート (パスは仮定)
import TagManager from '../../../components/controls/TagManager';
import SettingsIcon from '@mui/icons-material/Settings';

// 💡 【追加】ユーティリティ関数をインポート（パスは仮定）
import { formatShortDateTime } from '../../../utils/dateUtils';

import EnhancedIconButton from '../../../components/common/EnhancedIconButton';
import { DEFAULT_PACK_DECK_WIDTH as PREVIEW_W, DEFAULT_PACK_DECK_HEIGHT as PREVIEW_H } from '../../../utils/imageUtils';


// PackEditorPageから渡されるPropsの型定義
interface PackInfoFormProps {
    // データ
    packData: Pack;
    
    // 編集可否
    isEditable: boolean;
    
    // 基本ハンドラ
    handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    handleSelectChange: (e: { target: { name: string; value: unknown } }) => void;
    handleSave: (e: React.FormEvent<HTMLFormElement>) => void;
    
    // 特殊ハンドラ
    handleOpenRarityEditorModal: () => void;
    onPackCustomFieldChange: (field: string, value: any) => void;
    
    // カスタムフィールド設定
    customFieldSettings: Record<string, FieldSetting>;
    onCustomFieldSettingChange: (
        itemType: 'Card' | 'Deck' | 'Pack',
        type: 'num' | 'str',
        index: number,
        settingUpdates: Partial<FieldSetting>
    ) => void;
    
    // UI状態制御（オプショナル）
    isCollapsed?: boolean;
    onToggleCollapse?: () => void;
    showCollapseButton?: boolean;
    showMetadata?: boolean;
    forceShowAllFields?: boolean;
}


const PackInfoForm: React.FC<PackInfoFormProps> = ({
    // データ
    packData,
    
    // 編集可否
    isEditable,
    
    // 基本ハンドラ
    handleInputChange,
    handleSelectChange,
    handleSave,
    
    // 特殊ハンドラ
    handleOpenRarityEditorModal,
    onPackCustomFieldChange,
    
    // カスタムフィールド設定
    customFieldSettings,
    onCustomFieldSettingChange,
    
    // UI状態制御（デフォルト値設定）
    isCollapsed = false,
    onToggleCollapse = () => {},
    showCollapseButton = true,
    showMetadata = true,
    
    forceShowAllFields = false,
}) => {

    // isEditableを使って、disabled状態を統一的に管理
    const isDisabled = !isEditable;

    const currentImageColorKey = packData.imageColor || 'default';
    const currentCardBackImageColorKey = packData.cardBackImageColor || 'default';

    // ⭐ アイコンの選択ロジック
    const CollapseIcon = isCollapsed ? KeyboardArrowRightIcon : KeyboardArrowDownIcon;


    return (
        <>
            {/* タイトル部分にトグルボタンとアイコンを追加 */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>

                {/* 💡 【修正】タイトルのみ残す（作成/更新日の表示を削除） */}
                <Typography variant="h6" component="h2">基本情報</Typography>

                {/* 折り畳みボタン（条件付きで表示） */}
                {showCollapseButton && (
                    <Button
                        variant="text"
                        onClick={onToggleCollapse}
                        size="small"
                        // ⭐ 変更点: disabled={isDisabled} を削除
                        sx={{ p: 0 }} // パディングを調整
                    >
                        {/* ⭐ アイコンを配置 */}
                        <CollapseIcon sx={{ mr: 0.5 }} />
                        {isCollapsed ? '展開' : '折り畳む'}
                    </Button>
                )}
            </Box>

            {/* ⭐ Collapseコンポーネントでフォーム全体を囲み、isCollapsedで開閉を制御 */}
            <Collapse in={!isCollapsed}>
                <form onSubmit={handleSave}>

                    {/* ⭐ 【修正】新しい4列レイアウトのGridコンテナ */}
                    <Grid container spacing={2} sx={{ mt: 1 }}>

                        {/* ------------------------------------------- */}
                        {/* 1列目: パック画像と2つのURLフォーム (xs:12, md:3) */}
                        {/* ------------------------------------------- */}
                        <Grid size={{ xs: 6, md: 3 }}>
                            {/* 💡 【修正】PackPreviewCard を削除し、ImagePreview を直接埋め込み */}
                            <Box sx={{ 
                                mb: 2, 
                                textAlign: 'center',
                                mx: 'auto', 
                                //width: PREVIEW_W,
                                height: PREVIEW_H,
                                margin: '0 auto',
                                overflow: 'hidden'
                            }}>
                                <ImagePreview 
                                    item={packData} // Pack データを渡す
                                    showCardBack={true} // カード裏面画像（Pack Back）の表示を有効にする
                                />
                            </Box>

                            {/* パック画像URLとカラーセレクタ */}
                            <Grid container spacing={1} alignItems="center">
                                <Grid size={{ xs: 2 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'center', height: '100%' }}>
                                        <ColorSelector
                                            currentKey={currentImageColorKey}
                                            onColorSelect={(key) => onPackCustomFieldChange('imageColor', key)}
                                            disabled={isDisabled}
                                            label=""
                                        />
                                    </Box>
                                </Grid>
                                <Grid size={{ xs: 10 }}>
                                    <TextField
                                        label="パック画像URL"
                                        name="imageUrl"
                                        value={packData.imageUrl || ''}
                                        onChange={handleInputChange}
                                        fullWidth
                                        size="small"
                                        margin="dense"
                                        disabled={isDisabled}
                                    />
                                </Grid>
                            </Grid>

                            {/* カード裏面画像URLとカラーセレクタ */}
                            <Grid container spacing={1} alignItems="center" sx={{ mt: 1 }}>
                                <Grid size={{ xs: 2 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'center', height: '100%' }}>
                                        <ColorSelector
                                            currentKey={currentCardBackImageColorKey}
                                            onColorSelect={(key) => onPackCustomFieldChange('cardBackImageColor', key)}
                                            disabled={isDisabled}
                                            label=""
                                        />
                                    </Box>
                                </Grid>
                                <Grid size={{ xs: 10 }}>
                                    <TextField
                                        label="カード裏面画像URL"
                                        name="cardBackImageUrl"
                                        value={packData.cardBackImageUrl || ''}
                                        onChange={handleInputChange}
                                        fullWidth
                                        size="small"
                                        margin="dense"
                                        disabled={isDisabled}
                                    />
                                </Grid>
                            </Grid>

                        </Grid>

                        {/* ------------------------------------------- */}
                        {/* 2列目と3列目をまとめるGrid (xs:12, md:6) - これが1つのまとまりになる */}
                        {/* ------------------------------------------- */}
                        <Grid size={{ xs: 6, md: 6 }}>
                            <Grid container spacing={2}>
                                {/* 2列目: 基本情報（パック名, シリーズ名, ナンバー）(md:3 のうち 6/12) */}
                                <Grid size={{ xs: 12, md: 6 }} sx={{mb:-2}}>
                                    <TextField
                                        label="パック名"
                                        name="name"
                                        value={packData.name}
                                        onChange={handleInputChange}
                                        fullWidth
                                        margin="dense"
                                        size="small"
                                        required
                                        disabled={isDisabled}
                                    />
                                    <TextField
                                        label="シリーズ/バージョン"
                                        name="series"
                                        value={packData.series}
                                        onChange={handleInputChange}
                                        fullWidth
                                        margin="dense"
                                        size="small"
                                        disabled={isDisabled}
                                    />
                                    <TextField
                                        label="図鑑 No. (ソート順)"
                                        name="number"
                                        type="number"
                                        value={packData.number ?? ''}
                                        onChange={handleInputChange}
                                        fullWidth
                                        margin="dense"
                                        size="small"
                                        inputProps={{ min: 0 }}
                                        disabled={isDisabled}
                                    />
                                </Grid>

                                {/* 3列目: 基本情報（種別, 封入枚数, 値段）(md:3 のうち 6/12) */}
                                <Grid size={{ xs: 12, md: 6 }} sx={{mb:-2}}>
                                    <FormControl fullWidth margin="dense" required disabled={isDisabled}>
                                        <InputLabel size="small">パック種別</InputLabel>
                                        <Select
                                            label="パック種別"
                                            name="packType"
                                            value={packData.packType || ''}
                                            onChange={handleSelectChange}
                                            size="small"
                                        >
                                            {PACK_TYPE_OPTIONS.map(type => (
                                                <MenuItem key={type} value={type}>{type}</MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>

                                    <TextField
                                        label="1パックの封入枚数"
                                        name="cardsPerPack"
                                        type="number"
                                        value={packData.cardsPerPack}
                                        onChange={handleInputChange}
                                        fullWidth
                                        margin="dense"
                                        size="small"
                                        required
                                        inputProps={{ min: 1 }}
                                        disabled={isDisabled}
                                    />

                                    <TextField
                                        label="値段"
                                        name="price"
                                        type="number"
                                        value={packData.price ?? ''}
                                        onChange={handleInputChange}
                                        fullWidth
                                        margin="dense"
                                        size="small"
                                        required
                                        inputProps={{ min: 0 }}
                                        disabled={isDisabled}
                                    />
                                </Grid>

                                {/* 説明文を2列目と3列目を囲むGridの直下に配置 (xs:12, md:12) */}
                                <Grid size={{ xs: 12, md: 12 }}>
                                    <TextField
                                        label="説明"
                                        name="description"
                                        value={packData.description}
                                        onChange={handleInputChange}
                                        fullWidth
                                        margin="dense"
                                        size="small"
                                        multiline
                                        rows={3}
                                        disabled={isDisabled}
                                        sx={{ mb: 2 }}
                                    />

                                    {/* ⭐ 【追加】TagManagerを説明文の下に埋め込む */}
                                    {/* TagManagerは Pack の tag: string[] フィールドを操作する */}
                                    <TagManager
                                        itemData={packData}
                                        onFieldChange={onPackCustomFieldChange}
                                        isReadOnly={isDisabled}
                                    />

                                </Grid>
                            </Grid>
                        </Grid>
                        {/* ------------------------------------------- */}
                        {/* 2列目と3列目をまとめるGrid 終了 */}
                        {/* ------------------------------------------- */}


                        {/* ------------------------------------------- */}
                        {/* 4列目: レアリティ設定ボタン と カスタムフィールド (xs:12, md:3) */}
                        {/* ------------------------------------------- */}
                        <Grid size={{ xs: 12, md: 3 }} my={1}>
                            {/* レアリティ設定ボタン */}
                            {/*<Button
                                variant="outlined"
                                size="large"
                                onClick={handleOpenRarityEditorModal}
                                disabled={isDisabled}
                                fullWidth
                                sx={{ mb: 2 }} // マージンを追加
                                startIcon={<SettingsIcon />}
                            >
                                レアリティ設定
                            </Button>*/}
                            <Box
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between', // 右端にボタンを配置
                                    mb: 1, // Paperとの間に少しスペース
                                }}>
                                <Typography variant="subtitle2" gutterBottom sx={{ mb: 0 }}>
                                    レアリティ
                                </Typography>

                                <EnhancedIconButton
                                    icon={<SettingsIcon />}
                                    tooltipText="レアリティ設定"
                                    onClick={handleOpenRarityEditorModal}
                                    disabled={isDisabled}
                                    size="small"
                                    color="primary"
                                />
                            </Box>
                            <Divider sx={{ my: 3.5 }} />

                            {/* カスタムフィールド */}
                            <CustomFieldManager
                                itemData={packData as unknown as Card}
                                customFieldSettings={customFieldSettings}
                                itemType="Pack"
                                onFieldChange={onPackCustomFieldChange}
                                onSettingChange={onCustomFieldSettingChange}
                                isReadOnly={isDisabled}
                                forceShowAllFields={forceShowAllFields}
                                
                            />
                        </Grid>


                    </Grid>
                    
                    {/* メタデータ表示（条件付き） */}
                    {showMetadata && (
                        <Box
                            sx={{
                                mt: 2,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'flex-start' // 左寄せ
                            }}
                        >
                            <Typography variant="caption" color="text.secondary" noWrap>
                                作成日: {formatShortDateTime(packData.createdAt)}, 更新日: {formatShortDateTime(packData.updatedAt)}, 状態: {packData.isOpened ? '開封済み' : '未開封'}
                            </Typography>
                        </Box>
                    )}
                </form>
            </Collapse>
            {/* ⭐️ 【修正】Collapseの外（フォーム全体の下）の左下端に配置 ⭐️ */}

        </>
    );
};

export default PackInfoForm;