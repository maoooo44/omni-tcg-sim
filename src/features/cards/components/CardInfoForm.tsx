/**
 * src/features/cards/components/CardInfoForm.tsx
 *
 * カードの基本情報、テキスト、カスタムフィールド、タグを入力するためのフォームコンポーネント。
 * CardModalとBulkEditCardModalで再利用される。
 *  * 責務:
 * 1. カードの基本情報（名前、番号、レアリティ、画像URL等）の入力フィールドを提供
 * 2. カード詳細情報（text, subtext）の入力フィールドを提供
 * 3. カスタムフィールドとタグの管理UIを提供
 * 4. 一括編集モード時はカスタムフィールド設定ボタンを非表示
 */
import React from 'react';
import {
    TextField,
    Grid,
    Select,
    MenuItem,
    InputLabel,
    FormControl,
    Divider,
    Typography,
    Box,
    Paper,
    type SelectChangeEvent
} from '@mui/material';
import type { Card, Pack, FieldSetting } from '../../../models/models';
import CustomFieldManager from '../../../components/controls/CustomFieldManager';
import TagManager from '../../../components/controls/TagManager';
import ColorSelector from '../../../components/controls/ColorSelector';
// ImagePreviewのインポートを追加
import ImagePreview from '../../../components/common/ImagePreview';
// getDisplayImageUrlはImagePreviewに置き換えたため削除。定数のみをインポート
import { DEFAULT_CARD_PREVIEW_WIDTH as PREVIEW_W, DEFAULT_CARD_PREVIEW_HEIGHT as PREVIEW_H } from '../../../utils/imageUtils';

export interface CardInfoFormProps {
    /** 編集対象のカードデータ */
    card: Partial<Card>;

    /** 所属パック情報（一括編集時はnull） */
    currentPack: Pack | null;

    /** レアリティの選択肢 */
    rarityOptions: string[];

    /** 入力変更ハンドラ */
    onFieldChange: (field: string, value: any) => void;

    /** カスタムフィールド設定変更ハンドラ（一括編集時は未使用） */
    onCustomFieldSettingChange?: (
        itemType: 'Card' | 'Deck' | 'Pack',
        type: 'num' | 'str',
        index: number,
        settingUpdates: Partial<FieldSetting>
    ) => void;

    /** 読み取り専用モード */
    isReadOnly?: boolean;

    /** 一括編集モード（カスタムフィールド設定ボタンを非表示） */
    isBulkEdit?: boolean;
}

const CardInfoForm: React.FC<CardInfoFormProps> = ({
    card,
    currentPack,
    rarityOptions,
    onFieldChange,
    onCustomFieldSettingChange,
    isReadOnly = false,
    isBulkEdit = false,
}) => {

    const handleSelectChange = (e: SelectChangeEvent) => {
        onFieldChange(e.target.name, e.target.value);
    };

    return (
        <Box>
            <Grid container spacing={4}>
                {/* 左側: プレビュー (Grid size は v7形式) */}
                <Grid size={{ xs: 12, md: 6 }}>
                    <Paper elevation={3} sx={{ p: 2, textAlign: 'center' }}>
                        <Box sx={{ width: PREVIEW_W, height: PREVIEW_H, margin: '0 auto', border: '1px solid #ccc', overflow: 'hidden' }}>
                            {/* ImagePreviewに置き換え */}
                            <ImagePreview item={card} />
                        </Box>
                        <Grid container spacing={1} alignItems="center" mt={1}>

                            {/* 画像URL入力と画像色選択 */}
                            <Grid size={{ xs: 2 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'center', height: '100%' }}>
                                    <ColorSelector
                                        currentKey={card.imageColor || 'default'}
                                        onColorSelect={(key) => onFieldChange('imageColor', key)}
                                        disabled={isReadOnly}
                                        label=""
                                    />
                                </Box>
                            </Grid>
                            <Grid size={{ xs: 10 }}>
                                <TextField
                                    fullWidth
                                    label="画像URL"
                                    value={card.imageUrl || ''}
                                    onChange={(e) => onFieldChange('imageUrl', e.target.value)}
                                    size="small"
                                    margin="none"
                                    disabled={isReadOnly}
                                    InputProps={{ readOnly: isReadOnly }}
                                />
                            </Grid>
                        </Grid>
                    </Paper>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                    {/* 基本情報入力 */}
                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12 }}>
                            <TextField
                                fullWidth
                                required
                                label="カード名"
                                value={card.name || ''}
                                onChange={(e) => onFieldChange('name', e.target.value)}
                                size="small"
                                disabled={isReadOnly}
                                InputProps={{ readOnly: isReadOnly }}
                            />
                        </Grid>

                        {/* 収録パック名（一括編集時は非表示） */}
                        {!isBulkEdit && currentPack && (
                            <Grid size={{ xs: 12 }}>
                                <TextField
                                    fullWidth
                                    label="収録パック"
                                    value={currentPack.name || ''}
                                    size="small"
                                    InputProps={{ readOnly: true }}
                                    disabled
                                    InputLabelProps={{ shrink: true }}
                                />
                            </Grid>
                        )}

                        <Grid size={{ xs: 6 }}>
                            <TextField
                                fullWidth
                                label="カード番号"
                                type="number"
                                value={card.number ?? ''}
                                onChange={(e) => onFieldChange('number', e.target.value)}
                                size="small"
                                disabled={isReadOnly}
                                InputProps={{ readOnly: isReadOnly }}
                            />
                        </Grid>

                        <Grid size={{ xs: 6 }}>
                            <FormControl fullWidth size="small" disabled={isReadOnly}>
                                <InputLabel>レアリティ</InputLabel>
                                <Select
                                    name="rarity"
                                    value={card.rarity || ''}
                                    label="レアリティ"
                                    onChange={handleSelectChange}
                                >
                                    {rarityOptions.map(r => (
                                        <MenuItem key={r} value={r}>{r}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                    </Grid>



                    <Divider sx={{ my: 3 }} />

                    {/* カスタムフィールド */}
                    <CustomFieldManager
                        customFieldSettings={currentPack?.cardFieldSettings || {}}
                        itemData={card as Card} // 一括編集時は部分的なデータだが、CustomFieldManagerが対応
                        onFieldChange={onFieldChange}
                        itemType="Card"
                        onSettingChange={onCustomFieldSettingChange}
                        isReadOnly={isReadOnly}
                        hideSettingsButton={isBulkEdit} // 一括編集時は設定ボタンを非表示
                    />
                </Grid>
            </Grid>

            <Divider sx={{ my: 2 }} />

            {/* カード詳細情報 */}
            <Typography variant="h6" gutterBottom>カード詳細情報</Typography>
            <Grid container spacing={2}>
                <Grid size={{ xs: 12 }}>
                    <TextField
                        fullWidth
                        multiline
                        rows={4}
                        label="カードテキスト (text)"
                        value={card.text || ''}
                        onChange={(e) => onFieldChange('text', e.target.value)}
                        size="small"
                        disabled={isReadOnly}
                        InputProps={{ readOnly: isReadOnly }}
                    />
                </Grid>
                <Grid size={{ xs: 12 }}>
                    <TextField
                        fullWidth
                        multiline
                        rows={2}
                        label="補足テキスト (subtext)"
                        value={card.subtext || ''}
                        onChange={(e) => onFieldChange('subtext', e.target.value)}
                        size="small"
                        disabled={isReadOnly}
                        InputProps={{ readOnly: isReadOnly }}
                    />
                </Grid>
            </Grid>

            <Divider sx={{ my: 2 }} />

            {/* タグ管理 */}
            <TagManager
                itemData={card}
                onFieldChange={onFieldChange}
                isReadOnly={isReadOnly}
            />
        </Box >
    );
};

export default CardInfoForm;