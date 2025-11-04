/**
 * src/features/decks/components/DeckInfoForm.tsx (ImagePreview 利用版に修正)
 * * * 💡 修正: DeckPreviewCard の埋め込みロジックを ImagePreview コンポーネントに置き換え
 */
import React, { useState } from 'react'; // useEffect は削除
import {
    TextField, Box, Typography,
    Button, Collapse,
    Grid, Divider, Select, MenuItem, InputLabel, FormControl,
    // IconButton, NavigateBeforeIcon, NavigateNextIcon は不要
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import SettingsIcon from '@mui/icons-material/Settings';


import type { Deck, Card, FieldSetting } from '../../../models/models';
import { DECK_TYPE_OPTIONS } from '../../../models/models';

import ColorSelector from '../../../components/controls/ColorSelector';
import CustomFieldManager from '../../../components/controls/CustomFieldManager';
import TagManager from '../../../components/controls/TagManager';
import { formatShortDateTime } from '../../../utils/dateUtils';
import EnhancedIconButton from '../../../components/common/EnhancedIconButton';
import KeyCardSelectModal from './KeyCardSelectModal';
// ⭐ 【追加】ImagePreview をインポート
import ImagePreview from '../../../components/common/ImagePreview';
import { DEFAULT_PACK_DECK_WIDTH as PREVIEW_W, DEFAULT_PACK_DECK_HEIGHT as PREVIEW_H } from '../../../utils/imageUtils';

// 💡 画像の定数や合成ロジックは ImagePreview に移譲されたため削除


// DeckInfoFormPropsの型定義
interface DeckInfoFormProps {
    // データ
    deckData: Deck;
    // 編集可否
    isEditable: boolean;
    // 基本ハンドラ
    handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    handleSelectChange: (e: { target: { name: string; value: unknown } }) => void;
    handleSave: (e: React.FormEvent<HTMLFormElement>) => void;
    // 特殊ハンドラ
    onDeckCustomFieldChange: (field: string, value: any) => void;
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
    // Deck固有（キーカード選択）
    onSaveKeyCards?: (keyCardIds: (string | undefined)[]) => void;
    allCards?: Card[];
    ownedCards?: Map<string, number>;
}

const DeckInfoForm: React.FC<DeckInfoFormProps> = ({
    // データ
    deckData,

    // 編集可否
    isEditable,

    // 基本ハンドラ
    handleInputChange,
    handleSelectChange,
    handleSave,

    // 特殊ハンドラ
    onDeckCustomFieldChange,

    // カスタムフィールド設定
    customFieldSettings,
    onCustomFieldSettingChange,

    // UI状態制御（デフォルト値設定）
    isCollapsed = false,
    onToggleCollapse = () => { },
    showCollapseButton = true,
    showMetadata = true,

    forceShowAllFields = false,

    // Deck固有（キーカード選択）
    onSaveKeyCards,
    allCards,
    ownedCards,
}) => {
    // 🟢 新規: キーカードモーダルの開閉状態を管理
    const [isKeyCardModalOpen, setIsKeyCardModalOpen] = useState(false);

    // 💡 カルーセル関連の State (currentIndex, keyCardCompositeUrl) は ImagePreview に移譲されたため削除

    const isDisabled = !isEditable;
    const currentImageColorKey = deckData.imageColor || 'default';
    const CollapseIcon = isCollapsed ? KeyboardArrowRightIcon : KeyboardArrowDownIcon;

    // --- プレビューロジック (ImagePreview に移譲) ---

    // キーカード機能が有効かどうかを判定するフラグ（モーダル表示用とImagePreviewのプロパティ用）
    const isKeyCardFeatureEnabled = !!allCards && !!ownedCards && !!onSaveKeyCards;

    // キーカード合成を実行するかどうかのフラグ
    const isKeyCardGenerationEnabled = !!allCards && (!!deckData.keycard_1 || !!deckData.keycard_2 || !!deckData.keycard_3);

    // 💡 画像URLの決定、キーカード合成の useEffect、画像リストの作成、カルーセルハンドラは全て削除


    // --- モーダルハンドラ ---
    const handleKeyCardModalOpen = () => {
        if (!isKeyCardFeatureEnabled) return;
        setIsKeyCardModalOpen(true);
    };
    const handleKeyCardModalClose = () => setIsKeyCardModalOpen(false);


    // --- レンダリング (ImagePreview の使用に置き換え) ---
    return (
        <>
            {/* タイトル部分 */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" component="h2">基本情報</Typography>
                {showCollapseButton && (
                    <Button
                        variant="text"
                        onClick={onToggleCollapse}
                        size="small"
                        sx={{ p: 0 }}
                    >
                        <CollapseIcon sx={{ mr: 0.5 }} />
                        {isCollapsed ? '展開' : '折り畳む'}
                    </Button>
                )}
            </Box>

            {/* Collapseコンポーネントでフォーム全体を囲み、isCollapsedで開閉を制御 */}
            <Collapse in={!isCollapsed}>
                <form onSubmit={handleSave}>
                    <Grid container spacing={2} sx={{ mt: 1 }}>

                        {/* ------------------------------------------- */}
                        {/* 1列目: デッキ画像とURLフォーム (xs:12, md:3) */}
                        {/* ------------------------------------------- */}
                        <Grid size={{ xs: 6, md: 3 }}>

                            {/* ⭐ 【置き換え】ImagePreview コンポーネントを使用 */}
                            <Box sx={{
                                mb: 2,
                                textAlign: 'center',
                                mx: 'auto', // 中央寄せ
                                //width: PREVIEW_W,
                                height: PREVIEW_H,
                                margin: '0 auto',
                                overflow: 'hidden'
                            }}>
                                <ImagePreview
                                    // ImagePreview の Item 型に Deck が含まれるためそのまま渡す
                                    item={deckData}
                                    // ImagePreview 内でキーカード合成を行うために必要なデータを渡す
                                    keycardsData={
                                        // 合成が有効な場合にのみ allCards を渡す。ImagePreview側でキーカードIDからCardオブジェクトを探す
                                        isKeyCardGenerationEnabled ? allCards as Card[] : undefined
                                    }
                                    // ImagePreview がこのコンポーネントのロジックに基づいてカルーセルを有効にする
                                    disableCarousel={!isKeyCardGenerationEnabled}
                                />
                            </Box>
                            {/* ⭐ 【置き換え】ImagePreview の使用ここまで */}


                            {/* デッキ画像URLとカラーセレクタ */}
                            <Grid container spacing={1} alignItems="center">
                                <Grid size={{ xs: 2 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'center', height: '100%' }}>
                                        <ColorSelector
                                            currentKey={currentImageColorKey}
                                            onColorSelect={(key) => onDeckCustomFieldChange('imageColor', key)}
                                            disabled={isDisabled}
                                            label=""
                                        />
                                    </Box>
                                </Grid>
                                <Grid size={{ xs: 10 }}>
                                    <TextField
                                        label="デッキ画像URL"
                                        name="imageUrl"
                                        value={deckData.imageUrl || ''}
                                        onChange={handleInputChange}
                                        fullWidth
                                        size="small"
                                        margin="dense"
                                        disabled={isDisabled}
                                    />
                                </Grid>
                            </Grid>

                            {/* キーカード設定ボタン */}
                            {isKeyCardFeatureEnabled && (
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', ml: 0 }}>
                                    <Typography variant="subtitle2" gutterBottom sx={{ mb: 0, mt: 1 }}>
                                        キーカード
                                    </Typography>
                                    <EnhancedIconButton
                                        icon={<SettingsIcon />}
                                        tooltipText={'キーカード設定'}
                                        onClick={handleKeyCardModalOpen}
                                        disabled={isDisabled}
                                        size="small"
                                        color="primary"
                                    />
                                </Box>
                            )}
                        </Grid>

                        {/* ------------------------------------------- */}
                        {/* 2列目と3列目をまとめるGrid (xs:12, md:6) */}
                        {/* ------------------------------------------- */}
                        <Grid size={{ xs: 6, md: 6 }}>
                            <Grid container spacing={2}>
                                {/* 2列目: 基本情報（名前, シリーズ）(md:6 のうち 6/12) */}
                                <Grid size={{ xs: 12, md: 6}} sx={{mb:-2}}>
                                    <TextField
                                        label="デッキ名"
                                        name="name"
                                        value={deckData.name}
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
                                        value={deckData.series}
                                        onChange={handleInputChange}
                                        fullWidth
                                        margin="dense"
                                        size="small"
                                        disabled={isDisabled}
                                    />
                                </Grid>

                                {/* 3列目: 基本情報（デッキ No., デッキ種別）(md:6 のうち 6/12) */}
                                <Grid size={{ xs: 12, md: 6 }}  sx={{mb:-2}}>
                                    <TextField
                                        label="デッキ No. (ソート順)"
                                        name="number"
                                        type="number"
                                        value={deckData.number ?? ''}
                                        onChange={handleInputChange}
                                        fullWidth
                                        margin="dense"
                                        size="small"
                                        inputProps={{ min: 0 }}
                                        disabled={isDisabled}
                                    />

                                    <FormControl fullWidth margin="dense" required disabled={isDisabled} size="small">
                                        <InputLabel size="small">デッキ種別</InputLabel>
                                        <Select
                                            label="デッキ種別"
                                            name="deckType"
                                            value={deckData.deckType}
                                            onChange={handleSelectChange}
                                            size="small"
                                        >
                                            {DECK_TYPE_OPTIONS.map(type => (
                                                <MenuItem key={type} value={type}>{type}</MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Grid>

                                {/* 説明文とタグマネージャー (xs:12, md:12) */}
                                <Grid size={{ xs: 12, md: 12 }}>
                                    <TextField
                                        label="説明"
                                        name="description"
                                        value={deckData.description}
                                        onChange={handleInputChange}
                                        fullWidth
                                        margin="dense"
                                        size="small"
                                        multiline
                                        rows={3}
                                        disabled={isDisabled}
                                    />

                                    <Divider sx={{ my: 2 }} />
                                    <TagManager
                                        itemData={deckData}
                                        onFieldChange={onDeckCustomFieldChange}
                                        isReadOnly={isDisabled}
                                    />
                                </Grid>
                            </Grid>
                        </Grid>
                        {/* 2列目と3列目をまとめるGrid 終了 */}


                        {/* ------------------------------------------- */}
                        {/* 4列目: カスタムフィールド (xs:12, md:3) */}
                        {/* ------------------------------------------- */}
                        <Grid size={{ xs: 12, md: 3 }}>

                            <CustomFieldManager
                                itemData={deckData}
                                customFieldSettings={customFieldSettings}
                                itemType="Deck"
                                onFieldChange={onDeckCustomFieldChange}
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
                                作成日: {formatShortDateTime(deckData.createdAt)}, 更新日: {formatShortDateTime(deckData.updatedAt)}
                            </Typography>
                        </Box>
                    )}
                </form>
            </Collapse>

            {/* キーカード選択モーダル */}
            {isEditable && isKeyCardFeatureEnabled && (
                <KeyCardSelectModal
                    isOpen={isKeyCardModalOpen}
                    onClose={handleKeyCardModalClose}
                    currentDeck={deckData}
                    // allCards, ownedCards, onSaveKeyCards は isKeyCardFeatureEnabled のチェックで存在が保証されている
                    allCards={allCards!}
                    ownedCards={ownedCards!}
                    onSaveKeyCards={onSaveKeyCards!}
                />
            )}
        </>
    );
};

export default DeckInfoForm;