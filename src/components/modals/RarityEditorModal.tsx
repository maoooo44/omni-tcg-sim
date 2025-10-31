/**
 * src/components/modals/RarityEditorModal.tsx
 *
 * 特定のパックに収録されるカードのレアリティ設定（レアリティ名と封入確率/確定枚数）を編集するためのモーダルコンポーネントです。
 * カスタムフック `useRarityEditor` と連携し、高度な封入設定（Advanced/Classic）の切り替えを含むUIを提供します。
 *
 * * 責務:
 * 1. レアリティ設定の編集UI (レアリティ名、基本確率、特殊確率、確定枚数) をレンダリングする。
 * 2. 独自コンポーネント `RarityProbabilityInput` を使用し、確率の入力値 (0〜100%) のリアルタイム整形とバリデーションを行う。
 * 3. Classic / Advanced モードの切り替えUIと、Advancedモード有効時の警告ダイアログを提供する。
 * 4. Advancedモードにおける「確定枚数合計」「特殊確率枠数」「基本抽選枠」のサマリーと関連するバリデーション警告を、フックの計算結果に基づいて表示する。
 * 5. フックから提供されるハンドラをボタンや入力欄に接続し、保存時 (`onSave`) にフックの最終結果を親コンポーネントに通知する。
 */

import React, { useCallback, useMemo, useState } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, TextField, Box, Typography, IconButton, Grid,
    Divider, Alert, Switch, FormControlLabel, DialogContentText
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import type { Pack, AdvancedRarityConfig, RarityConfig } from '../../models/pack';
import { useRarityEditor } from '../../features/packs/hooks/useRarityEditor';

// --- RarityProbabilityInput: 確率入力用のカスタムコンポーネント ---
interface RarityProbabilityInputProps {
    value: number; // 内部で扱う 0.0〜1.0 の値
    onChange: (value: number) => void;
    label: string;
}

const RarityProbabilityInput: React.FC<RarityProbabilityInputProps> = ({ value, onChange, label }) => {

    // 内部の 0.0〜1.0 の値を 0〜100 の文字列に変換（表示用）
    const formatValueToDisplay = (num: number): string => {
        // 1. 100倍してパーセンテージ値にする (toFixed(2)で浮動小数点誤差を防ぎ、小数点以下2桁で固定)
        const val100 = (num * 100).toFixed(2);

        // 2. 末尾の不要な ".00" や ".0" を削除（10.00 -> 10, 10.50 -> 10.5）
        let formatted = val100.replace(/\.00$/, ''); // 10.00 -> 10
        formatted = formatted.replace(/(\.\d)0$/, '$1'); // 10.50 -> 10.5

        // ユーザーが入力した値と異ならないよう、可能な限りシンプルに整形
        return formatted;
    };

    // 表示用のローカルな状態 (ユーザー入力そのまま)
    // 初期値は親のvalueから整形した値
    const [displayValue, setDisplayValue] = useState(formatValueToDisplay(value));

    // 親のvalueによる強制上書きを意図的に削除し、ユーザー入力を尊重する

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        let rawInput = e.target.value;

        // 1. 数値以外の文字を削除（数値、小数点のみを許可）
        rawInput = rawInput.replace(/[^\d.]/g, '');
        const parts = rawInput.split('.');
        if (parts.length > 2) {
            rawInput = parts[0] + '.' + parts.slice(1).join('');
        }

        // 2. 小数点以下3桁以上を削除（リアルタイム制限）
        const decimalIndex = rawInput.indexOf('.');
        if (decimalIndex !== -1 && rawInput.length > decimalIndex + 3) {
            rawInput = rawInput.substring(0, decimalIndex + 3);
        }

        // 3. 表示値を更新（ユーザーの入力に追従）
        setDisplayValue(rawInput);

        // 4. バリデーションと強制修正（親への通知値の決定）
        let floatValue = parseFloat(rawInput);

        // 5. 特殊な入力（"."や空文字）を処理
        if (rawInput === '' || rawInput === '.') {
            floatValue = 0;
        } else if (isNaN(floatValue) || floatValue < 0) {
            floatValue = 0;
        } else if (floatValue > 100) {
            // 100を超える場合、リアルタイムで100に修正し、入力も100に強制
            floatValue = 100;
            setDisplayValue("100"); // 表示も100に修正
        }

        // 6. 内部値 (0.0〜1.0) に変換して親に通知
        const newInternalValue = floatValue / 100;
        onChange(newInternalValue);

    }, [onChange]);


    const handleBlur = useCallback(() => {
        // フォーカスアウト時：親に通知済みの値（value）を基に、表示を再整形する
        setDisplayValue(formatValueToDisplay(value));

        // valueが浮動小数点誤差を持っている場合でも、formatValueToDisplayで確実に小数点以下2桁に丸められ、表示がクリーンになる

    }, [value]);


    return (
        <TextField
            label={label}
            // type="text" に固定し、ブラウザの勝手な補完を防ぐ
            type="text"
            inputMode="decimal"
            value={displayValue}
            onChange={handleChange}
            onBlur={handleBlur} // フォーカスアウト時に表示を整形（末尾の.などを削除）

            fullWidth
            size="small"
            // 入力支援として min/max を設定 (実際の制限は JS で行う)
            inputProps={{ min: "0", max: "100" }}
        />
    );
};
// -------------------------------------------------------------

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


    // カスタムフックからすべての状態とハンドラを取得
    const {
        editingRarities,
        isAdvancedEnabled,
        specialProbabilitySlots,
        totalProbability,
        probabilityMismatch,
        totalSpecialProbability,
        specialProbabilityMismatch,
        totalFixedValue,
        baseDrawSlots,
        baseDrawSlotsNegative,
        handleAdvancedToggle,
        handleSpecialProbabilitySlotsChange,
        handleFixedValueChange,
        handleAddRarity,
        handleRemoveRarity,
        handleRarityChange,
        getFinalRarityConfig,
        getFinalPackDetails,
    } = useRarityEditor(
        initialRarities,
        packToEditor.isAdvancedRulesEnabled,
        packToEditor.specialProbabilitySlots ?? 0,
        packToEditor.cardsPerPack
    );


    // アドバンスドモード切り替え処理
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
        const finalDetails = getFinalPackDetails();

        // パック全体のデータ構造に反映し、親に返す Pack オブジェクトを作成
        const updatedPack: Pack = {
            ...packToEditor,
            ...finalDetails,

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


    // 保存ボタンの無効化条件に特殊確率、基本抽選枠のバリデーションを追加
    const disableSave = editingRarities.length === 0 || probabilityMismatch ||
        (isAdvancedEnabled && (specialProbabilityMismatch || baseDrawSlotsNegative));

    // Grid のサイズを動的に変更
    // レアリティ名: 3, 基本確率: 3, 特殊確率: 3, 確定枚数: 2, 削除: 1 (合計12)
    const rarityNameSize = isAdvancedEnabled ? 3 : 6;
    const probabilitySize = isAdvancedEnabled ? 3 : 5;
    const specialProbabilitySize = isAdvancedEnabled ? 3 : 0;
    const fixedValueSize = isAdvancedEnabled ? 2 : 0;
    const deleteSize = 1;

    return (
        <>
            {/* 1. 警告ダイアログ */}
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

                    {/* アドバンスドモード トグル */}
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

                    {/* 上部のサマリーセクション (アドバンスド時のみ表示) */}
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
                            <Typography variant="subtitle2">{isAdvancedEnabled ? '基本確率' : '確率 (0〜100)'}</Typography>
                        </Grid>
                        {isAdvancedEnabled && (
                            <Grid size={specialProbabilitySize}>
                                <Typography variant="subtitle2" align="center">特殊確率 (0〜100)</Typography>
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

                    {/* レアリティ設定リスト (固定高さ & 上部パディング追加) */}
                    <Box sx={{ height: 400, overflowY: 'auto', pt: 2 }}>
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

                                {/* 2. 基本確率 - リアルタイム制限付き TextField */}
                                <Grid size={probabilitySize}>
                                    <RarityProbabilityInput
                                        label={isAdvancedEnabled ? '基本確率' : '確率'}
                                        value={rarity.probability}
                                        onChange={(newValue) =>
                                            // newValueは 0.0〜1.0 の数値。toString() に変換してフックに渡す
                                            handleRarityChange(index, 'probability', newValue.toString())
                                        }
                                    />
                                </Grid>

                                {/* 3. 特殊確率 (アドバンスド時のみ表示) - リアルタイム制限付き TextField */}
                                {isAdvancedEnabled && (
                                    <Grid size={specialProbabilitySize}>
                                        <RarityProbabilityInput
                                            label="特殊確率"
                                            value={(rarity as AdvancedRarityConfig).specialProbability || 0}
                                            onChange={(newValue) =>
                                                // newValueは 0.0〜1.0 の数値。toString() に変換してフックに渡す
                                                handleRarityChange(index, 'specialProbability', newValue.toString())
                                            }
                                        />
                                    </Grid>
                                )}

                                {/* 4. 確定枚数 (Fixed Value) - 整数 (アドバンスド時のみ表示) */}
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
                            {(totalProbability * 100).toFixed(2)}% / 100.00%
                        </Typography>
                    </Box>

                    {/* 合計特殊確率の表示と警告 (アドバンスド時のみ) */}
                    {isAdvancedEnabled && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                            <Typography variant="h6">合計特殊確率:</Typography>
                            <Typography variant="h6" color={specialProbabilityMismatch ? 'error' : 'textPrimary'}>
                                {(totalSpecialProbability * 100).toFixed(2)}% / 100.00%
                            </Typography>
                        </Box>
                    )}

                    {/* 警告メッセージ */}
                    {probabilityMismatch && (
                        <Alert severity="warning" sx={{ mt: 1 }}>
                            **警告:** 基本確率の合計が **100.00%** と異なっています。
                        </Alert>
                    )}
                    {isAdvancedEnabled && specialProbabilityMismatch && (
                        <Alert severity="warning" sx={{ mt: 1 }}>
                            **警告:** 特殊確率の合計が **100.00%** と異なっています。特殊抽選が正常に機能しません。
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