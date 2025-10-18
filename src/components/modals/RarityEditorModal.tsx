/**
 * src/components/modals/RarityEditorModal.tsx
 *
 * 特定のパックに収録されるカードのレアリティ設定（レアリティ名と封入確率）を編集するためのモーダルコンポーネントです。
 * カスタムフック `useRarityEditor` を使用して、レアリティの追加・削除、確率の変更、合計確率のバリデーションなどの編集ロジックを完全に分離しています。
 * このコンポーネントは純粋な Presentational コンポーネントとして動作し、編集対象のパックデータと、
 * 編集後のデータを親コンポーネントに返すための `onSave` コールバックを受け取ります。
 */

import React, { useCallback, useMemo, useState } from 'react'; 
import { 
    Dialog, DialogTitle, DialogContent, DialogActions, 
    Button, TextField, Box, Typography, IconButton, Grid, 
    Divider, Alert, Switch, FormControlLabel, DialogContentText 
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
// Pack, AdvancedRarityConfig, RarityConfig, specialProbabilitySlots を含む型定義
import type { Pack, AdvancedRarityConfig, RarityConfig } from '../../models/pack'; 
import { useRarityEditor } from '../../features/packs/hooks/useRarityEditor'; 

// モーダルが受け取るプロパティ
interface RarityEditorModalProps {
    open: boolean;
    onClose: () => void;
    // 編集対象のPackデータ
    packData: Pack; 
    // 親コンポーネントに編集結果を渡すためのコールバック
    onSave: (updatedPack: Pack) => void;
}

const RarityEditorModal: React.FC<RarityEditorModalProps> = ({ open, onClose, packData, onSave }) => { 
    
    const packToEditor = packData;
    const [openWarning, setOpenWarning] = useState(false);
    
    // useRarityEditor の初期値として、Advanced/Classicどちらの設定も考慮して渡す必要がある
    const initialRarities = useMemo(() => {
        const initial = packToEditor.isAdvancedRulesEnabled 
            ? packToEditor.advancedRarityConfig 
            : packToEditor.rarityConfig;
            
        if (initial && initial.length > 0) {
            return initial.map(c => ({ 
                ...c, 
                // fixedValue は整数として扱うように初期値が小数でも丸める
                fixedValue: Math.round((c as AdvancedRarityConfig).fixedValue ?? 0), 
                specialProbability: (c as AdvancedRarityConfig).specialProbability ?? 0.0,
            })) as (AdvancedRarityConfig & { specialProbability: number })[];
        }
        // データがない場合のデフォルト値 (AdvancedRarityConfig形式)
        return [{ rarityName: 'Common', probability: 1.0, specialProbability: 0.0, fixedValue: 0 }];
    }, [packToEditor]);
    
    
    // ★ カスタムフックからすべての状態とハンドラを取得 (シグネチャ変更に対応)
    const {
        editingRarities,
        isAdvancedEnabled, 
        specialProbabilitySlots, // ★ NEW: 特殊確率枠数
        totalProbability,
        probabilityMismatch,
        totalSpecialProbability, // ★ NEW: 合計特殊確率
        specialProbabilityMismatch, // ★ NEW: 特殊確率不一致フラグ
        totalFixedValue, 
        baseDrawSlots, // ★ NEW: 基本抽選枠 (余り)
        baseDrawSlotsNegative, // ★ NEW: 基本抽選枠が負の数になるフラグ
        handleAdvancedToggle, 
        handleSpecialProbabilitySlotsChange, // ★ NEW: 特殊確率枠数変更ハンドラ
        handleFixedValueChange, 
        handleAddRarity,
        handleRemoveRarity,
        handleRarityChange,
        getFinalRarityConfig, 
        getFinalPackDetails, // ★ NEW: Pack詳細 (specialProbabilitySlots を含む)
    } = useRarityEditor(
        initialRarities, 
        packToEditor.isAdvancedRulesEnabled,
        packToEditor.specialProbabilitySlots ?? 0, // ★ NEW: 初期特殊確率枠数を渡す
        packToEditor.cardsPerPack // ★ NEW: 封入枚数を渡す
    );
    
    
    // ★ アドバンスドモード切り替え処理 (変更なし)
    const handleToggleAdvanced = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const checked = event.target.checked;
        if (checked) {
            setOpenWarning(true);
        } else {
            handleAdvancedToggle(false);
        }
    }, [handleAdvancedToggle]);

    const handleConfirmAdvanced = useCallback(() => {
        handleAdvancedToggle(true);
        setOpenWarning(false);
    }, [handleAdvancedToggle]);

    const handleCancelAdvanced = useCallback(() => {
        setOpenWarning(false);
    }, []);
    
    
    const handleSave = useCallback(async () => {
        if (!packToEditor) {
            console.error("保存失敗: 編集対象のパックが見つかりません。");
            onClose();
            return;
        }

        const finalConfig = getFinalRarityConfig(isAdvancedEnabled); 
        const finalDetails = getFinalPackDetails(); // ★ NEW: specialProbabilitySlots を含む詳細を取得
        
        // パック全体のデータ構造に反映し、親に返す Pack オブジェクトを作成
        const updatedPack: Pack = {
            ...packToEditor,
            ...finalDetails, // ★ NEW: isAdvancedRulesEnabled と specialProbabilitySlots を更新

            // モードに応じて設定を格納するフィールドを振り分ける
            rarityConfig: isAdvancedEnabled ? (packToEditor.rarityConfig as RarityConfig[]) : (finalConfig as RarityConfig[]),
            advancedRarityConfig: isAdvancedEnabled ? (finalConfig as AdvancedRarityConfig[]) : undefined, 
        };
        
        try {
            onSave(updatedPack); 
            onClose(); 
        } catch (error) {
            console.error("レアリティ設定の保存（親コンポーネントへの通知）に失敗しました:", error);
            alert("レアリティ設定の保存中にエラーが発生しました。");
        }
    }, [packToEditor, getFinalRarityConfig, getFinalPackDetails, onSave, onClose, isAdvancedEnabled]);


    // ★ 保存ボタンの無効化条件に特殊確率、基本抽選枠のバリデーションを追加
    const disableSave = editingRarities.length === 0 || probabilityMismatch || 
        (isAdvancedEnabled && (specialProbabilityMismatch || baseDrawSlotsNegative));

    // ★ Grid のサイズを動的に変更
    // レアリティ名: 4, 基本確率: 2, 特殊確率: 3, 確定枚数: 2, 削除: 1 (合計12)
    const rarityNameSize = isAdvancedEnabled ? 3 : 6;
    const probabilitySize = isAdvancedEnabled ? 3 : 5;
    const specialProbabilitySize = isAdvancedEnabled ? 3 : 0; // 非アドバンスド時は非表示
    const fixedValueSize = isAdvancedEnabled ? 2 : 0; // 非アドバンスド時は非表示
    const deleteSize = 1;
    // 合計: 3+3+3+2+1=12 (アドバンスド) / 6+5+1=12 (クラシック)

    return (
        <>
            {/* 1. 警告ダイアログ (変更なし) */}
            <Dialog open={openWarning} onClose={handleCancelAdvanced}>
                <DialogTitle>{"高度な封入設定を有効にしますか？"}</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        このモードでは、**確定枚数**、**特殊確率枠数**、**特殊確率**を設定できます。
                        パック抽選は、確定→特殊確率枠→基本抽選枠の順序で行われます。
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCancelAdvanced} color="primary">キャンセル</Button>
                    <Button onClick={handleConfirmAdvanced} color="primary" autoFocus variant="contained">有効にする</Button>
                </DialogActions>
            </Dialog>
        
            {/* 2. メインモーダル */}
            <Dialog open={open} onClose={onClose} maxWidth="xl" fullWidth>
                <DialogTitle>
                    {packToEditor?.name ? `${packToEditor.name} のレアリティ設定` : 'レアリティ設定を編集'}
                </DialogTitle>
                <DialogContent dividers>
                    
                    {/* ★ アドバンスドモード トグル */}
                    <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                        <Typography variant="body2" color="textSecondary" sx={{ mr: 1 }}>
                            高度な封入設定を使用
                        </Typography>
                        <FormControlLabel
                            control={
                                <Switch checked={isAdvancedEnabled} onChange={handleToggleAdvanced} color="primary" />
                            }
                            label={isAdvancedEnabled ? "ON" : "OFF"}
                            labelPlacement="start"
                        />
                    </Box>
                    
                    <Divider sx={{ my: 1 }} />
                    
                    {/* ★ NEW: 上部のサマリーセクション (アドバンスド時のみ表示) */}
                    {isAdvancedEnabled && (
                        <Box sx={{ mb: 3, p: 2, border: '1px solid #ddd', borderRadius: 1 }}>
                            <Grid container spacing={2}>
                                {/* 確定枚数合計 */}
                                <Grid size={4}>
                                    <Typography variant="subtitle1" component="div">
                                        **確定枚数合計:** <Box component="span" fontWeight="bold" color="secondary.main">{totalFixedValue}</Box> / {packToEditor.cardsPerPack}
                                    </Typography>
                                </Grid>
                                {/* 特殊確率枠数 */}
                                <Grid size={4}>
                                    <TextField
                                        label="特殊確率枠数"
                                        type="number"
                                        inputProps={{ step: "1", min: "0", max: packToEditor.cardsPerPack }}
                                        value={specialProbabilitySlots}
                                        onChange={(e) => handleSpecialProbabilitySlotsChange(e.target.value)}
                                        fullWidth
                                        size="small"
                                    />
                                </Grid>
                                {/* 基本抽選枠 (余り) */}
                                <Grid size={4}>
                                    <Typography variant="subtitle1" component="div" color={baseDrawSlotsNegative ? 'error' : 'textPrimary'}>
                                        **基本抽選枠 (余り):** <Box component="span" fontWeight="bold">{Math.max(0, baseDrawSlots)}</Box>
                                    </Typography>
                                    {baseDrawSlotsNegative && (
                                        <Typography variant="caption" color="error">
                                            枠の合計 ({totalFixedValue + specialProbabilitySlots}) が封入枚数 ({packToEditor.cardsPerPack}) を超えています。
                                        </Typography>
                                    )}
                                </Grid>
                            </Grid>
                        </Box>
                    )}
                    
                    <Divider sx={{ my: 1 }} />
                    
                    {/* ヘッダー行 (Gridのサイズに合わせる) */}
                    <Grid container spacing={2} alignItems="center" sx={{ mb: 1, px: 2 }}>
                        <Grid size={rarityNameSize}>
                            <Typography variant="subtitle2">レアリティ名</Typography>
                        </Grid>
                        <Grid size={probabilitySize}>
                            <Typography variant="subtitle2">{isAdvancedEnabled ? '基本確率' : '確率 (0.0〜1.0)'}</Typography>
                        </Grid>
                        {isAdvancedEnabled && (
                            <Grid size={specialProbabilitySize}>
                                <Typography variant="subtitle2" align="center">特殊確率 (0.0〜1.0)</Typography>
                            </Grid>
                        )}
                        {isAdvancedEnabled && (
                            <Grid size={fixedValueSize}>
                                <Typography variant="subtitle2" align="center">確定枚数 (整数)</Typography>
                            </Grid>
                        )}
                        <Grid size={deleteSize}>
                            <Typography variant="subtitle2">削除</Typography>
                        </Grid>
                    </Grid>
                    <Divider />
                    
                    {/* レアリティ設定リスト */}
                    <Box sx={{ maxHeight: 400, overflowY: 'auto' }}>
                        {editingRarities.map((rarity, index) => (
                            <Grid container spacing={2} key={index} alignItems="center" sx={{ mb: 2 }}>
                                
                                {/* 1. レアリティ名 */}
                                <Grid size={rarityNameSize}> 
                                    <TextField
                                        label="レアリティ名"
                                        value={rarity.rarityName}
                                        onChange={(e) => 
                                            handleRarityChange(index, 'rarityName', e.target.value)
                                        }
                                        fullWidth
                                        size="small"
                                    />
                                </Grid>
                                
                                {/* 2. 基本確率 */}
                                <Grid size={probabilitySize}>
                                    <TextField
                                        label={isAdvancedEnabled ? '基本確率' : '確率 (0.0〜1.0)'}
                                        type="number"
                                        inputProps={{ step: "0.0001", min: "0" }}
                                        value={rarity.probability.toString()}
                                        onChange={(e) => 
                                            handleRarityChange(index, 'probability', e.target.value)
                                        }
                                        fullWidth
                                        size="small"
                                    />
                                </Grid>
                                
                                {/* ★ 3. 特殊確率 (アドバンスド時のみ表示) */}
                                {isAdvancedEnabled && (
                                    <Grid size={specialProbabilitySize}>
                                        <TextField
                                            label="特殊確率"
                                            type="number"
                                            inputProps={{ step: "0.0001", min: "0" }}
                                            value={(rarity as AdvancedRarityConfig).specialProbability?.toString() || '0'} 
                                            onChange={(e) => 
                                                handleRarityChange(index, 'specialProbability', e.target.value)
                                            }
                                            fullWidth
                                            size="small"
                                        />
                                    </Grid>
                                )}

                                {/* ★ 4. 確定枚数 (Fixed Value) - 整数 (アドバンスド時のみ表示) */}
                                {isAdvancedEnabled && (
                                    <Grid size={fixedValueSize}>
                                        <TextField
                                            label="確定枚数"
                                            type="number"
                                            inputProps={{ step: "1", min: "0" }}
                                            value={(rarity as AdvancedRarityConfig).fixedValue?.toString() || '0'} 
                                            onChange={(e) => 
                                                handleFixedValueChange(index, e.target.value) 
                                            }
                                            fullWidth
                                            size="small"
                                        />
                                    </Grid>
                                )}
                                
                                {/* 5. 削除ボタン */}
                                <Grid size={deleteSize}>
                                    <IconButton 
                                        onClick={() => handleRemoveRarity(index)} 
                                        color="error"
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
                        <Typography variant="h6">合計基本確率:</Typography>
                        <Typography variant="h6" color={probabilityMismatch ? 'error' : 'textPrimary'}>
                            {totalProbability.toFixed(4)} / 1.0000 
                        </Typography>
                    </Box>

                    {/* ★ NEW: 合計特殊確率の表示と警告 (アドバンスド時のみ) */}
                    {isAdvancedEnabled && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                            <Typography variant="h6">合計特殊確率:</Typography>
                            <Typography variant="h6" color={specialProbabilityMismatch ? 'error' : 'textPrimary'}>
                                {totalSpecialProbability.toFixed(4)} / 1.0000 
                            </Typography>
                        </Box>
                    )}

                    {/* 警告メッセージ */}
                    {probabilityMismatch && (
                        <Alert severity="warning" sx={{ mt: 1 }}>
                            **警告:** 基本確率の合計が **1.0** と異なっています。
                        </Alert>
                    )}
                    {isAdvancedEnabled && specialProbabilityMismatch && (
                        <Alert severity="warning" sx={{ mt: 1 }}>
                            **警告:** 特殊確率の合計が **1.0** と異なっています。特殊抽選が正常に機能しません。
                        </Alert>
                    )}
                    {isAdvancedEnabled && baseDrawSlotsNegative && (
                        <Alert severity="error" sx={{ mt: 1 }}>
                            **エラー:** 確定枠と特殊枠の合計 ({totalFixedValue + specialProbabilitySlots}) がパックの封入枚数 ({packToEditor.cardsPerPack}) を超えています。
                        </Alert>
                    )}

                </DialogContent>
                <DialogActions>
                    <Button onClick={onClose} variant="outlined">キャンセル</Button>
                    <Button 
                        onClick={handleSave} 
                        variant="contained" 
                        color="primary"
                        disabled={disableSave}
                    >
                        設定を保存
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default RarityEditorModal;