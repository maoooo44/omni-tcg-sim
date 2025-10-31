import React from 'react';
import {
    TextField, Box, Typography, Select, MenuItem, InputLabel, FormControl,
    Button, Divider, Grid,
} from '@mui/material';

import type { Pack } from '../../../models/pack';
import type { Card } from '../../../models/card';
import PackPreviewCard from '../components/PackPreviewCard';
import { PACK_TYPE_OPTIONS } from '../../../models/pack';

import CustomFieldManager from '../../../components/controls/CustomFieldManager';
import type { FieldSetting } from '../../../models/customField';

// ColorSelectorをインポート（ファイルパスは仮定）
import ColorSelector from '../../../components/controls/ColorSelector'; 


// PackEditorPageから渡されるPropsの型定義
interface PackInfoFormProps {
    packData: Pack;
    isEditable: boolean;
    handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    // SelectのonChangeの型
    handleSelectChange: (e: { target: { name: string; value: unknown } }) => void;
    handleOpenRarityEditorModal: () => void;
    handleSave: (e: React.FormEvent<HTMLFormElement>) => void;

    // Packカスタムフィールドの変更ハンドラ (汎用的なハンドラとして使用)
    onPackCustomFieldChange: (field: string, value: any) => void;

    // Packカスタムフィールドの設定情報を受け取る
    customFieldSettings: Record<string, FieldSetting>;

    // Packカスタムフィールド設定変更ハンドラ
    onCustomFieldSettingChange: (
        itemType: 'Card' | 'Deck' | 'Pack',
        type: 'num' | 'str',
        index: number,
        settingUpdates: Partial<FieldSetting>
    ) => void;
    
    // ⬇️ 削除: ColorSelector専用のハンドラを削除 (onPackCustomFieldChangeで統一)
    // handleImageColorSelect: (key: string) => void;
    // handleCardBackImageColorSelect: (key: string) => void;
}

const PackInfoForm: React.FC<PackInfoFormProps> = ({
    packData,
    isEditable,
    handleInputChange,
    handleSelectChange,
    handleOpenRarityEditorModal,
    handleSave,

    onPackCustomFieldChange, // 汎用ハンドラを使用
    customFieldSettings,
    onCustomFieldSettingChange,
    
    // ⬇️ 削除: Propsから専用ハンドラを削除
    // handleImageColorSelect,
    // handleCardBackImageColorSelect,
}) => {

    // isEditableを使って、disabled状態を統一的に管理
    const isDisabled = !isEditable;

    // ColorSelectorで使う currentKey は packData.imageColor などが入っていると仮定
    const currentImageColorKey = packData.imageColor || 'default';
    
    // ⭐ 修正箇所: currentCardBackImageColorKey の計算ロジックを変更
    // 画像URLの有無にかかわらず、設定された色を優先する。
    const currentCardBackImageColorKey = packData.cardBackImageColor || 'default';
    // 修正前: const currentCardBackImageColorKey = packData.cardBackImageUrl ? (packData.cardBackImageColor || 'default') : 'default';


    // InputAdornmentのスタイルを調整（ColorSelectorのサイズに合わせる）
    // const colorSelectorAdornmentStyle: React.CSSProperties = {
    //     paddingRight: 4, // TextFieldのpaddingを考慮
    // };


    return (
        <>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">基本情報</Typography>
            </Box>

            <PackPreviewCard pack={packData} />

            <form onSubmit={handleSave}>

                {/* 7. 画像URLとカラー選択のグループ化 (Gridを使用) */}
                <Grid container spacing={1} alignItems="center" mt={1}>
                    {/* パック表面画像設定 */}
                    <Grid size={{ xs: 2 }}> {/* ★ 修正: Grid のサイズを2に変更 */}
                        <Box sx={{ display: 'flex', justifyContent: 'center', height: '100%' }}>
                            <ColorSelector
                                currentKey={currentImageColorKey}
                                // 修正点 1: 汎用ハンドラ onPackCustomFieldChange を使用
                                onColorSelect={(key) => onPackCustomFieldChange('imageColor', key)}
                                disabled={isDisabled}
                                // ラベルは ColorSelector 内部で非表示に変更済み
                                label=""
                            />
                        </Box>
                    </Grid>
                    <Grid size={{xs:10}}>
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
                    
                    {/* カード裏面画像設定 */}
                    <Grid size={{ xs: 2 }}> {/* ★ 修正: Grid のサイズを2に変更 */}
                        <Box sx={{ display: 'flex', justifyContent: 'center', height: '100%' }}>
                            <ColorSelector
                                currentKey={currentCardBackImageColorKey} // ⭐ 修正後の値を使用
                                // 修正点 2: 汎用ハンドラ onPackCustomFieldChange を使用
                                onColorSelect={(key) => onPackCustomFieldChange('cardBackImageColor', key)}
                                disabled={isDisabled}
                                // ラベルは ColorSelector 内部で非表示に変更済み
                                label=""
                            />
                        </Box>
                    </Grid>
                    <Grid size={{xs:10}}>
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
                
                

                {/* 2. パック名 */}
                <TextField
                    label="パック名"
                    name="name"
                    value={packData.name}
                    onChange={handleInputChange}
                    fullWidth
                    margin="normal"
                    size="small"
                    required
                    disabled={isDisabled}
                />

                {/* 3. シリーズ名 */}
                <TextField
                    label="シリーズ/バージョン"
                    name="series"
                    value={packData.series}
                    onChange={handleInputChange}
                    fullWidth
                    margin="normal"
                    size="small"
                    disabled={isDisabled}
                />

                {/* 1. 図鑑 No. (ソート順) */}
                <TextField
                    label="図鑑 No. (ソート順)"
                    name="number"
                    type="number"
                    value={packData.number ?? ''}
                    onChange={handleInputChange}
                    fullWidth
                    margin="normal"
                    size="small"
                    inputProps={{ min: 0 }}
                    disabled={isDisabled}
                />
                
                {/* 5. パック種別 (Select) */}
                <FormControl fullWidth margin="normal" required disabled={isDisabled}>
                    <InputLabel>パック種別</InputLabel>
                    <Select
                        label="パック種別"
                        name="packType"
                        value={packData.packType}
                        onChange={handleSelectChange}
                        size="small"
                    >
                        {PACK_TYPE_OPTIONS.map(type => (
                            <MenuItem key={type} value={type}>{type}</MenuItem>
                        ))}
                    </Select>
                </FormControl>

                {/* 6. 封入枚数 */}
                <TextField
                    label="1パックの封入枚数"
                    name="cardsPerPack"
                    type="number"
                    value={packData.cardsPerPack}
                    onChange={handleInputChange}
                    fullWidth
                    margin="normal"
                    size="small"
                    required
                    inputProps={{ min: 1 }}
                    disabled={isDisabled}
                />

                {/* 4. 値段 (新しく追加されたフィールド) */}
                <TextField
                    label="値段"
                    name="price"
                    type="number"
                    value={packData.price}
                    onChange={handleInputChange}
                    fullWidth
                    margin="normal"
                    size="small"
                    required
                    inputProps={{ min: 0 }}
                    disabled={isDisabled}
                />
                
                {/* 8. 説明文 */}
                <TextField
                    label="説明"
                    name="description"
                    value={packData.description}
                    onChange={handleInputChange}
                    fullWidth
                    margin="normal"
                    size="small"
                    multiline
                    rows={3}
                    disabled={isDisabled}
                />


                {/* --------------------------------------------------- */}
                {/* パックのカスタムフィールドエリアの追加 */}
                <Box sx={{ mt: 4, mb: 2 }}>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="h6" gutterBottom>カスタムフィールド</Typography>

                    <CustomFieldManager
                        // 編集対象のデータ（Packオブジェクト全体）
                        itemData={packData as unknown as Card}
                        // カスタムフィールドの設定情報 (packFieldSettings)
                        customFieldSettings={customFieldSettings}
                        // 編集対象のアイテムタイプ（Pack）
                        itemType="Pack"
                        // フォームの入力変更ハンドラ
                        onFieldChange={onPackCustomFieldChange}
                        // 設定の変更ハンドラ（PackEditorから渡す）
                        onSettingChange={onCustomFieldSettingChange}
                        // 編集モード
                        isReadOnly={isDisabled}
                    />
                </Box>
                {/* --------------------------------------------------- */}


                {/* 9. アクションボタン */}
                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
                    <Button
                        variant="outlined"
                        onClick={handleOpenRarityEditorModal}
                        disabled={isDisabled}
                    >
                        レアリティ設定を編集
                    </Button>
                    {/* 保存ボタンは親コンポーネント（PackEditorPage.tsx）のヘッダー/ツールバーで管理されます。 */}
                </Box>
            </form>
        </>
    );
};

export default PackInfoForm;