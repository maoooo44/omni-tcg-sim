/**
 * src/features/pack-management/PackInfoForm.tsx
 * * パック編集ページから基本情報の編集フォーム部分を分離したコンポーネント。
 */
import React from 'react';
import { 
    TextField, Box, Typography, Select, MenuItem, InputLabel, FormControl, 
    Button,
} from '@mui/material'; 

import type { Pack } from '../../models/pack';
import PackPreviewCard from '../../components/PackPreviewCard';

// PackEditPageから渡されるPropsの型定義
interface PackInfoFormProps {
    packData: Pack;
    isEditable: boolean;
    isDisabled: boolean; // 保存ボタンの無効化状態
    handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    handleSelectChange: (e: { target: { name: string; value: unknown } }) => void;
    handleOpenRarityEditModal: () => void;
    handleSave: (e: React.FormEvent<HTMLFormElement>) => void;
}

const packTypes = ['Booster', 'ConstructedDeck', 'Other'];

const PackInfoForm: React.FC<PackInfoFormProps> = ({
    packData,
    isEditable,
    // isDisabled, // フォーム内のフィールド無効化はisEditableで管理
    handleInputChange,
    handleSelectChange,
    handleOpenRarityEditModal,
    handleSave,
}) => {

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
                    // null/undefinedの場合は空文字を表示。numberはusePackEditで数値に変換される
                    value={packData.number ?? ''} 
                    onChange={handleInputChange}
                    fullWidth
                    margin="normal"
                    helperText="パックの表示順/図鑑番号を指定します。空欄の場合、自動採番されます。"
                    inputProps={{ min: 0 }}
                    disabled={!isEditable} 
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
                    disabled={!isEditable} 
                />
                
                {/* 3. シリーズ名 */}
                <TextField
                    label="シリーズ/バージョン"
                    name="series"
                    value={packData.series}
                    onChange={handleInputChange}
                    fullWidth
                    margin="normal"
                    disabled={!isEditable} 
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
                    disabled={!isEditable} 
                />
                
                {/* 5. パック種別 (Select) */}
                <FormControl fullWidth margin="normal" required disabled={!isEditable}>
                    <InputLabel>パック種別</InputLabel>
                    <Select
                        label="パック種別"
                        name="packType"
                        value={packData.packType}
                        onChange={handleSelectChange}
                    >
                        {packTypes.map(type => (
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
                    disabled={!isEditable} 
                />
                
                {/* 7. カード裏面画像URL */}
                <TextField
                    label="カード裏面画像URL"
                    name="cardBackUrl"
                    value={packData.cardBackUrl || ''} 
                    onChange={handleInputChange}
                    fullWidth
                    margin="normal"
                    helperText="開封時のカードの裏面に表示する画像URLを指定します。"
                    disabled={!isEditable} 
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
                    disabled={!isEditable} 
                />
                
                {/* 9. アクションボタン */}
                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
                    <Button 
                        variant="outlined" 
                        onClick={handleOpenRarityEditModal}
                        disabled={!isEditable} 
                    >
                        レアリティ設定を編集
                    </Button>
                    {/* Note: Save Button is now in the header/toolbar of PackEditPage.tsx */}
                </Box>
            </form>
        </>
    );
};

export default PackInfoForm;