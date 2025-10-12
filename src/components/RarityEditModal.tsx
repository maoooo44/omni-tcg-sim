/**
 * src/components/RarityEditModal.tsx
 *
 * 特定のパックに収録されるカードのレアリティ設定（レアリティ名と封入確率）を編集するためのモーダルです。
 * カスタムフック `useRarityEditor` を使用して、レアリティの追加・削除、確率の変更、合計確率のバリデーションロジックを管理します。
 * 💡 修正: Zustandストアへの直接更新を削除し、親コンポーネントのローカル状態を更新する onSave ハンドラを使用するように変更。
 */

import React, { useCallback, useMemo } from 'react';
import { 
    Dialog, DialogTitle, DialogContent, DialogActions, 
    Button, TextField, Box, Typography, IconButton, Grid, 
    Divider, Alert
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
// 💡 修正: usePackStore は不要になったため、インポートを削除。Pack型のみ必要
// import { usePackStore } from '../stores/packStore'; 
import type { Pack } from '../models/pack';
// 💡 修正: useShallow は不要になったため削除
// import { useShallow } from 'zustand/react/shallow';
import { useRarityEditor } from '../features/pack-management/hooks/useRarityEditor'; 

// モーダルが受け取るプロパティ
interface RarityEditModalProps {
    open: boolean;
    onClose: () => void;
    packId: string;
    // ★ 修正: 親コンポーネントのローカル状態（編集対象のPackデータ）
    packData: Pack; 
    // ★ 修正: 親コンポーネントに編集結果を渡すためのコールバック
    onSave: (updatedPack: Pack) => void;
}

// ★ 修正: packData と onSave を引数に追加
const RarityEditModal: React.FC<RarityEditModalProps> = ({ open, onClose, /*packId,*/ packData, onSave }) => { 
    
    // 💡 修正: Zustandストアからの取得を削除
    // const { packs, updatePack } = usePackStore(useShallow(state => ({
    //     packs: state.packs,
    //     updatePack: state.updatePack,
    // })));
    
    // 💡 修正: 渡された packData を編集対象とする
    const packToEdit = packData;
    
    // 既存パックのレアリティ設定を初期値として渡す
    const initialRarities = useMemo(() => 
        // packToEdit を使用
        packToEdit?.rarityConfig || [{ rarityName: 'Common', probability: 1.0 }]
    , [packToEdit]);
    
    
    // カスタムフックからすべての状態とハンドラを取得
    const {
        editingRarities,
        totalProbability,
        probabilityMismatch,
        handleAddRarity,
        handleRemoveRarity,
        handleRarityChange,
        getFinalRarityConfig, // 保存時に最終設定を取得する関数
    } = useRarityEditor(initialRarities);
    
    
    const handleSave = useCallback(async () => {
        if (!packToEdit) {
            console.error("保存失敗: 編集対象のパックが見つかりません。");
            return;
        }

        const newRarityConfig = getFinalRarityConfig();
        
        // パック全体のデータ構造に反映し、親に返す Pack オブジェクトを作成
        const updatedPack: Pack = {
            ...packToEdit,
            rarityConfig: newRarityConfig,
        };
        
        try {
            // ★ 修正: ストアへの直接更新を削除し、親の onSave ハンドラを呼び出す
            // await updatePack(updatedPack); // 削除
            onSave(updatedPack); // 親コンポーネントに更新された Pack データを渡す
            onClose(); // 成功したらモーダルを閉じる
        } catch (error) {
            console.error("レアリティ設定の保存（親コンポーネントへの通知）に失敗しました:", error);
            alert("レアリティ設定の保存中にエラーが発生しました。");
        }
    }, [packToEdit, getFinalRarityConfig, onSave, onClose]);


    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>
                {/* packToEdit を使用 */}
                {packToEdit?.name ? `${packToEdit.name} のレアリティ設定` : 'レアリティ設定を編集'}
            </DialogTitle>
            <DialogContent dividers>
                
                {/* レアリティ設定リスト */}
                <Box sx={{ maxHeight: 400, overflowY: 'auto' }}>
                    {editingRarities.map((rarity, index) => (
                        <Grid container spacing={2} key={index} alignItems="center" sx={{ mb: 2 }}>
                            
                            {/* 1. レアリティ名 */}
                            <Grid size={{xs:6}}>
                                <TextField
                                    label="レアリティ名"
                                    value={rarity.rarityName}
                                    onChange={(e) => 
                                        handleRarityChange(index, 'rarityName', e.target.value)
                                    }
                                    fullWidth
                                />
                            </Grid>
                            
                            {/* 2. 確率 (封入率) */}
                            <Grid size={{xs:5}}>
                                <TextField
                                    label="確率 (0.0〜1.0)"
                                    type="number"
                                    inputProps={{ step: "0.0001", min: "0" }}
                                    value={rarity.probability.toString()}
                                    onChange={(e) => 
                                        handleRarityChange(index, 'probability', e.target.value)
                                    }
                                    fullWidth
                                />
                            </Grid>
                            
                            {/* 3. 削除ボタン */}
                            <Grid size={{xs:1}}>
                                <IconButton 
                                    onClick={() => handleRemoveRarity(index)} 
                                    color="error"
                                    // 少なくとも1つは残す
                                    disabled={editingRarities.length <= 1} 
                                >
                                    <DeleteIcon />
                                </IconButton>
                            </Grid>
                        </Grid>
                    ))}
                </Box>

                {/* レアリティ追加ボタン */}
                <Button 
                    startIcon={<AddIcon />} 
                    onClick={handleAddRarity} 
                    variant="outlined" 
                    sx={{ mt: 2 }}
                    fullWidth
                >
                    レアリティを追加
                </Button>
                
                <Divider sx={{ my: 2 }} />
                
                {/* 合計値の表示と警告 */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                    <Typography variant="h6">合計確率:</Typography>
                    <Typography variant="h6" color={probabilityMismatch ? 'error' : 'textPrimary'}>
                        {totalProbability.toFixed(4)} / 1.0000 
                    </Typography>
                </Box>
                
                {probabilityMismatch && (
                    <Alert severity="warning" sx={{ mt: 1 }}>
                        合計確率が **1.0** と異なっています。パック抽選が正常に機能しない可能性があります。
                    </Alert>
                )}

            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} variant="outlined">
                    キャンセル
                </Button>
                <Button 
                    onClick={handleSave} 
                    variant="contained" 
                    color="primary"
                    // レアリティが0個になる保存は防ぐ
                    disabled={editingRarities.length === 0}
                >
                    設定を保存
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default RarityEditModal;