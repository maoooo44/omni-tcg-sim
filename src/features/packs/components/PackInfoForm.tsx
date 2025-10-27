/**
 * src/features/packs/components/PackInfoForm.tsx
 *
 * パック編集ページで使用される、Packの基本情報（名称、番号、URLなど）を入力するためのフォームコンポーネント。
 * フォーム要素のUI描画と、親コンポーネントからのイベントハンドラへのアクション伝達に責務を限定する。
 */
import React from 'react';
import { 
    TextField, Box, Typography, Select, MenuItem, InputLabel, FormControl, 
    Button, Divider,
} from '@mui/material'; 

import type { Pack } from '../../../models/pack';
// 💡 修正1: Card 型をインポート
import type { Card } from '../../../models/card';
import PackPreviewCard from '../components/PackPreviewCard';
import { PACK_TYPE_OPTIONS } from '../../../models/pack'; 

import CustomFieldManager from '../../../components/controls/CustomFieldManager'; 
import type { FieldSetting } from '../../../models/customField';


// PackEditorPageから渡されるPropsの型定義
interface PackInfoFormProps {
    packData: Pack;
    isEditable: boolean;
    handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    // SelectのonChangeの型
    handleSelectChange: (e: { target: { name: string; value: unknown } }) => void; 
    handleOpenRarityEditorModal: () => void;
    handleSave: (e: React.FormEvent<HTMLFormElement>) => void;
    
    // 💡 修正3: Packカスタムフィールドの変更ハンドラを CustomFieldManagerProps から流用
    onPackCustomFieldChange: (field: string, value: any) => void;

    // 💡 修正4: Packカスタムフィールドの設定情報を受け取る
    customFieldSettings: Record<string, FieldSetting>;
    
    // 💡 修正5: Packカスタムフィールド設定変更ハンドラを CustomFieldManagerProps から流用
    onCustomFieldSettingChange: (
        itemType: 'Card' | 'Deck' | 'Pack',
        type: 'num' | 'str',
        index: number,
        settingUpdates: Partial<FieldSetting>
    ) => void;
}

const PackInfoForm: React.FC<PackInfoFormProps> = ({
    packData,
    isEditable,
    handleInputChange,
    handleSelectChange,
    handleOpenRarityEditorModal,
    handleSave,
    
    onPackCustomFieldChange,
    customFieldSettings,
    onCustomFieldSettingChange,
}) => {

    // isEditableを使って、disabled状態を統一的に管理
    const isDisabled = !isEditable;

    return (
        <>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">基本情報</Typography>
            </Box>
            
            <PackPreviewCard pack={packData} />

            <form onSubmit={handleSave}>
                {/* 1. 図鑑 No. (ソート順) */}
                <TextField
                    label="図鑑 No. (ソート順)"
                    name="number"
                    type="number"
                    // null/undefinedの場合は空文字を表示。
                    value={packData.number ?? ''} 
                    onChange={handleInputChange}
                    fullWidth
                    margin="normal"
                    helperText="パックの表示順/図鑑番号を指定します。空欄の場合、自動採番されます。"
                    inputProps={{ min: 0 }}
                    disabled={isDisabled} 
                />

                {/* 2. パック名 */}
                <TextField
                    label="パック名"
                    name="name"
                    value={packData.name}
                    onChange={handleInputChange}
                    fullWidth
                    margin="normal"
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
                    disabled={isDisabled} 
                />
                
                {/* 4. 封入枚数 */}
                <TextField
                    label="1パックの封入枚数"
                    name="cardsPerPack"
                    type="number"
                    value={packData.cardsPerPack}
                    onChange={handleInputChange}
                    fullWidth
                    margin="normal"
                    required
                    inputProps={{ min: 1 }}
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
                    >
                        {PACK_TYPE_OPTIONS.map(type => (
                            <MenuItem key={type} value={type}>{type}</MenuItem>
                        ))}
                    </Select>
                </FormControl>

                {/* 6. パック表面画像URL */}
                <TextField
                    label="パック表面画像URL"
                    name="imageUrl"
                    value={packData.imageUrl}
                    onChange={handleInputChange}
                    fullWidth
                    margin="normal"
                    disabled={isDisabled} 
                />
                
                {/* 7. カード裏面画像URL */}
                <TextField
                    label="カード裏面画像URL"
                    name="cardBackImageUrl"
                    value={packData.cardBackImageUrl || ''} 
                    onChange={handleInputChange}
                    fullWidth
                    margin="normal"
                    helperText="開封時のカードの裏面に表示する画像URLを指定します。"
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
                        itemData={packData as unknown as Card} // 💡 修正7: Card型をインポートしたため、エラーは解消する
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