/**
 * src/features/packs/components/PackInfoForm.tsx
 *
 * パック編集ページで使用される、Packの基本情報（名称、番号、URLなど）を入力するためのフォームコンポーネント。
 * フォーム要素のUI描画と、親コンポーネントからのイベントハンドラへのアクション伝達に責務を限定する。
 */
import React from 'react';
import { 
    TextField, Box, Typography, Select, MenuItem, InputLabel, FormControl, 
    Button,
} from '@mui/material'; 

import type { Pack } from '../../../models/pack';
import PackPreviewCard from '../components/PackPreviewCard';
import { PACK_TYPE_OPTIONS } from '../packUtils'; 

// PackEditorPageから渡されるPropsの型定義
interface PackInfoFormProps {
    packData: Pack;
    isEditable: boolean;
    //isDisable: boolean;
    handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    // SelectのonChangeの型
    handleSelectChange: (e: { target: { name: string; value: unknown } }) => void; 
    handleOpenRarityEditorModal: () => void;
    handleSave: (e: React.FormEvent<HTMLFormElement>) => void;
}

const PackInfoForm: React.FC<PackInfoFormProps> = ({
    packData,
    isEditable,
    //isDisable,
    handleInputChange,
    handleSelectChange,
    handleOpenRarityEditorModal,
    handleSave,
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
                    name="cardBackUrl"
                    value={packData.cardBackUrl || ''} 
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