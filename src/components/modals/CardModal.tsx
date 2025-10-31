/**
 * src/components/modals/CardModal.tsx
 *
 * カードの新規作成・編集・閲覧を行うための汎用モーダルコンポーネント。
 * * 責務:
 * 1. 親コンポーネントから受け取った Card データ (または新規データ) のローカル管理。
 * 2. `isReadOnly` プロパティに基づき、UI要素（TextField, Select, Button）の編集可否（disabled/readOnly）を制御する。
 * 3. カードの基本情報 (名前、番号、レアリティ、画像URL) および詳細情報 (text, subtext) の入力フィールドを提供する。
 * 4. カスタムフィールドの入力インターフェースを子コンポーネント `CustomFieldManager` に委譲し、状態を連携する。
 * 5. 保存 (`onSave`) および削除 (`onRemove`) アクションをトリガーする。
 * 6. タグの変更時に全文検索用の `searchText` フィールドを更新する。
 */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, TextField, Box, Typography, Grid, Select, MenuItem,
    InputLabel, FormControl, Paper, Divider, type SelectChangeEvent
} from '@mui/material';
import type { Card } from '../../models/card';
import type { RarityConfig, CardFieldSettings } from '../../models/pack';
import type { FieldSetting } from '../../models/customField';

// CustomFieldManager をインポート
import CustomFieldManager from '../controls/CustomFieldManager';
// TagManager をインポート
import TagManager from '../controls/TagManager';
// FavoriteToggleButton をインポート
import FavoriteToggleButton from '../controls/FavoriteToggleButton';
// useCardStore をインポート (★ 追加: ストアアクションを直接取得するため)
import { useCardStore } from '../../stores/cardStore';

// 共通画像ユーティリティをインポート
import { getDisplayImageUrl, DEFAULT_CARD_PREVIEW_WIDTH as PREVIEW_W, DEFAULT_CARD_PREVIEW_HEIGHT as PREVIEW_H } from '../../utils/imageUtils';

// プレースホルダーユーティリティから色設定をインポート (Selectのオプション表示に必要)
//import { PLACEHOLDER_COLOR_PRESETS } from '../../utils/placeholderUtils'; 

import { createDefaultCard } from '../../utils/dataUtils';
import ColorSelector from '../controls/ColorSelector'; // ★ 修正: ColorSelector をインポート

import { truncateString } from '../../utils/stringUtils';
// ----------------------------------------
// モーダルサイズを定数で定義
// ----------------------------------------
const MODAL_WIDTH = '1200px';
const MODAL_HEIGHT = '750px';


// Propsの定義
export interface CardModalProps {
    open: boolean;
    onClose: () => void;
    card: Card | null;
    onSave: (cardToSave: Card) => void;
    onRemove: (cardId: string) => Promise<void>;
    packRaritySettings: RarityConfig[];
    currentPackName: string; // 収録パック名
    currentPackId: string;
    // CustomFieldCategory は必須です
    customFieldSettings: CardFieldSettings;

    /** 新規追加: 閲覧モード (true) か編集モード/新規作成 (false) か */
    isReadOnly: boolean;

    onCustomFieldSettingChange: (
        itemType: 'Card' | 'Deck' | 'Pack',
        type: 'num' | 'str',
        index: number,
        settingUpdates: Partial<FieldSetting>
    ) => void;

    // onUpdateCardIsFavorite は削除
}


// ----------------------------------------
// CardModal 本体
// ----------------------------------------

const CardModal: React.FC<CardModalProps> = ({
    open, onClose, card, onSave,
    onRemove,
    packRaritySettings, currentPackName, currentPackId,
    customFieldSettings,
    onCustomFieldSettingChange,
    isReadOnly,
}) => {

    const [localCard, setLocalCard] = useState<Card | null>(card);

    // ストアアクションを直接取得 (★ 修正)
    const updateCardIsFavorite = useCardStore(state => state.updateCardIsFavorite);

    const rarityOptions: string[] = useMemo(() => {
        return packRaritySettings.map(c => c.rarityName);
    }, [packRaritySettings]);

    // imageColor の選択肢として使用するキーのリストを生成
    /*const colorPresetKeys = useMemo(() => {
        const keys = Object.keys(PLACEHOLDER_COLOR_PRESETS);
        // 現在値がプリセットにない場合も選択肢に含める必要はないため、keys のみを使用
        return keys;
    }, []);*/


    const isNew = !card;

    // モーダル開閉時の初期化ロジック
    useEffect(() => {
        if (open) {
            const baseCard: Card = card || createDefaultCard(currentPackId);

            const defaultRarityName = packRaritySettings.length > 0 ? packRaritySettings[0].rarityName : '';

            // imageColor の初期値設定。既存の値がない場合は 'default' を使用
            const defaultColor = baseCard.imageColor || 'default';

            const finalCard: Card = {
                ...baseCard,
                number: (baseCard.number === undefined || baseCard.number === null) ? null : baseCard.number,
                packId: baseCard.packId || currentPackId,
                rarity: baseCard.rarity || defaultRarityName,
                imageColor: defaultColor, // ★ 初期値設定
                // Card のカスタムフィールド (str_1-6, num_1-6) は baseCard に含まれることを想定
            };

            setLocalCard(finalCard);

        } else {
            setLocalCard(null);
        }
    }, [open, card, currentPackId, packRaritySettings]);

    const handleClose = useCallback(() => {
        onClose();
    }, [onClose]);

    /**
     * 全文検索用テキスト (searchText) を再構築する関数
     */
    const buildSearchText = useCallback((currentData: Card): string | undefined => {
        // 1. 基本フィールド (name, text, subtext)
        const baseText = [
            currentData.name,
            currentData.text,
            currentData.subtext,
        ].filter(v => typeof v === 'string' && v.trim() !== '');

        // 2. カスタムフィールド (num_1-6, str_1-6)
        const customFields = Array(6).fill(0).flatMap((_, i) => [
            // num_* は null/undefined 以外を文字列化
            currentData[`num_${i + 1}` as keyof Card] !== null && currentData[`num_${i + 1}` as keyof Card] !== undefined ? String(currentData[`num_${i + 1}` as keyof Card]) : undefined,
            // str_* は null/undefined/空文字列 以外をそのまま
            currentData[`str_${i + 1}` as keyof Card],
        ]).filter(v => v && String(v).trim() !== ''); // null, undefined, 空文字列を除外

        // 3. タグフィールド (tag: string[])
        const tags = currentData.tag || [];
        const searchTextTags = tags.join('|'); // パイプ「|」で連結

        // すべてを結合
        const parts = [...baseText, ...customFields];

        if (parts.length === 0 && searchTextTags === '') {
            return undefined;
        }

        // 検索テキスト本体とタグを結合
        const newSearchText = `${parts.join(' ')} ${searchTextTags}`.trim();

        return newSearchText || undefined;
    }, []);


    // 汎用的な変更ハンドラ
    const handleChange = useCallback(<F extends keyof Card>(field: F, rawValue: any) => {
        if (!localCard) return;

        // 閲覧モードでは変更を許可しない
        if (isReadOnly) return;

        let value: any = rawValue;
        let update: Partial<Card> = {};

        // number 型のフィールド ('number', 'num_*') の値変換
        if (field === 'number' || String(field).startsWith('num_')) {
            const numValue = rawValue === null || rawValue === '' ? null : Number(rawValue);
            value = isNaN(numValue as number) ? null : numValue;
        }

        // imageColor の変更時は、文字列としてそのまま値を設定
        if (field === 'imageColor') {
            value = rawValue; // string
        }

        // 一旦ローカルで値を更新した Card オブジェクトを作成
        const updatedCard = {
            ...localCard,
            [field]: value,
        };

        // searchText の更新が必要なフィールド
        const fieldsRequiringSearchTextUpdate = [
            'name', 'text', 'subtext', 'tag',
            'num_1', 'num_2', 'num_3', 'num_4', 'num_5', 'num_6',
            'str_1', 'str_2', 'str_3', 'str_4', 'str_5', 'str_6',
        ];

        // 変更されたフィールドが searchText に影響する場合、searchText を再構築する
        if (fieldsRequiringSearchTextUpdate.includes(field as string)) {
            const newSearchText = buildSearchText(updatedCard);
            update = { [field]: value, searchText: newSearchText };
        } else {
            update = { [field]: value };
        }

        setLocalCard(prev => prev ? {
            ...prev,
            ...update
        } : null);
    }, [localCard, isReadOnly, buildSearchText]);

    // お気に入りトグルハンドラ (★ 修正: updateCardIsFavoriteを依存配列に追加)
    const handleToggleFavorite = useCallback(async (cardId: string, isFavorite: boolean) => {
        // isNew (新規作成時) は常に不可。
        // isReadOnly が false (編集モード) の場合も不可。
        // つまり、cardIdがあり、isReadOnlyがtrue(閲覧モード)のときのみ実行を許可する。
        // isNew は Card ID が存在しないため、最初の if 文で isReadOnly のチェックは十分ですが、
        // より意図を明確にするために条件を変更します。
        if (!localCard?.cardId || !isReadOnly) { // ★ 修正: isReadOnlyがtrueのときのみ実行
            console.log(`[handleToggleFavorite] Guarded: cardId=${localCard?.cardId}, isReadOnly=${isReadOnly}`);
            return;
        }

        try {
            // ストアアクションを直接呼び出す
            const updatedCard = await updateCardIsFavorite(cardId, isFavorite);

            // ローカルの状態を、ストアからの最新データで上書き更新
            if (updatedCard) {
                setLocalCard(prev => prev ? {
                    ...prev,
                    isFavorite: updatedCard.isFavorite, // ストアから取得した最新のお気に入り状態を反映
                    updatedAt: updatedCard.updatedAt, // 更新日時も反映
                } : null);
            }
        } catch (error) {
            console.error('Failed to toggle favorite state:', error);
            // 失敗時はユーザーに通知するなどの処理
        }
    }, [localCard?.cardId, isReadOnly, updateCardIsFavorite]); // ★ localCard?.cardId を依存配列に追加

    // 保存ロジック 
    const handleSave = async () => {
        if (isReadOnly) return;

        // localCard は null チェックされているはず
        if (!localCard || !localCard.name || !localCard.packId) {
            alert('カード名と収録パックは必須です。');
            return;
        }

        const rawNumberValue = localCard.number;
        let finalNumber: number | null = null;

        const numberString = String(rawNumberValue ?? '');
        if (numberString.trim()) {
            const parsed = parseInt(numberString, 10);
            finalNumber = (isNaN(parsed) || parsed <= 0) ? null : parsed;
        } else {
            finalNumber = null;
        }

        const now = new Date().toISOString();

        // 最終的な searchText を計算し直して上書き
        const finalCardToSave: Card = {
            ...localCard,
            number: finalNumber,
            updatedAt: now,
            cardId: localCard.cardId || (isNew ? createDefaultCard(localCard.packId).cardId : ''),
            // 最後にsearchTextを再計算して上書き
            searchText: buildSearchText({ ...localCard, number: finalNumber }),
        };

        try {
            onSave(finalCardToSave);
            handleClose();
        } catch (error) {
            alert('カードの保存に失敗しました。コンソールを確認してください。');
            console.error(error);
        }
    };

    // 削除ロジック (オリジナルに戻す)
    const handleRemove = async () => {
        if (isReadOnly || isNew) return;

        if (!localCard || !localCard.cardId) {
            return;
        }

        if (!window.confirm(`カード「${localCard.name}」を完全に削除してもよろしいですか？この操作は元に戻せません。`)) {
            return;
        }

        try {
            await onRemove(localCard.cardId);
            handleClose();
        } catch (error) {
            alert('カードの削除に失敗しました。');
            console.error(error);
        }
    };

    // プレビュー画像のURLを生成 
    const displayImageUrl = useMemo(() => {
        return getDisplayImageUrl(localCard?.imageUrl, {
            width: PREVIEW_W,
            height: PREVIEW_H,
            text: localCard?.name?.substring(0, 3) || '??',
            imageColor: localCard?.imageColor, // ★ ★ ★ imageColorをimageUtils経由で渡す ★ ★ ★
        });
    }, [localCard?.imageUrl, localCard?.name, localCard?.imageColor]); // ★ ★ ★ 依存配列に imageColor を含める ★ ★ ★

    if (!localCard) return null;

    const truncatedName = truncateString(localCard.name);

    return (
        // 固定サイズを適用
        <Dialog
            open={open}
            onClose={handleClose}
            sx={{
                '& .MuiDialog-paper': { // PaperComponent のスタイルを上書き
                    width: MODAL_WIDTH,
                    maxWidth: MODAL_WIDTH, // 念のため maxWidth も設定
                    height: MODAL_HEIGHT,
                    maxHeight: MODAL_HEIGHT, // 念のため maxHeight も設定
                }
            }}
        >
            {/* DialogTitleをGridコンテナにし、レスポンシブ制御を行う */}
            <DialogTitle sx={{ p: 2, pb: 1 }}> {/* paddingを調整 */}
                <Grid container spacing={1} alignItems="center"> {/* Gridコンテナ開始 */}

                    {/* タイトルテキスト (Grid item) */}
                    {/* 画面が小さい時(xs)は12/12、中サイズ以上(md)は11/12の幅を占有 */}
                    <Grid size={{ xs: 12, md: 11 }}>
                        <Typography variant="h6" component="span">
                            {isNew
                                ? '新規カードの作成'
                                : isReadOnly
                                    ? `「${truncatedName}」の閲覧`
                                    : `「${truncatedName}」の編集`
                            }
                        </Typography>
                    </Grid>

                    {/* お気に入りトグルボタン (Grid item) */}
                    {/* 画面が小さい時(xs)は12/12、中サイズ以上(md)は1/12の幅を占有 */}
                    <Grid size={{ xs: 12, md: 1 }} sx={{ textAlign: 'right' }}>
                        {localCard.cardId && ( // Card ID が存在する場合のみ表示（新規作成時以外）
                            <FavoriteToggleButton
                                itemId={localCard.cardId}
                                isFavorite={localCard.isFavorite || false}
                                onToggle={async (id, state) => {
                                    await handleToggleFavorite(id, state);
                                }}
                                disabled={!isReadOnly}
                                size="medium"
                            />
                        )}
                    </Grid>
                </Grid> {/* Gridコンテナ終了 */}
            </DialogTitle>
            {/* DialogContent の高さを Dialog の高さからタイトルとアクションの高さを引いたものに設定し、オーバーフローを許可 */}
            <DialogContent
                dividers
                sx={{
                    // Dialog全体の高さからタイトル(約64px)とアクション(約64px)を引いた高さを仮定
                    flex: '1 1 auto', // 高さを柔軟に調整
                    overflowY: 'auto', // コンテンツが多い場合はスクロールを有効にする
                }}
            >
                {/* -------------------- ここから既存のコンテンツ -------------------- */}
                <Grid container spacing={4}>
                    {/* 左側: プレビュー (Grid size は v7形式) */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Paper elevation={3} sx={{ p: 2, textAlign: 'center' }}>
                            {/*<Typography variant="subtitle1" gutterBottom>カードプレビュー</Typography>*/}
                            <Box sx={{ width: PREVIEW_W, height: PREVIEW_H, margin: '0 auto', border: '1px solid #ccc', overflow: 'hidden' }}>
                                {/* プレビュー画像表示 */}
                                <img
                                    src={displayImageUrl}
                                    alt={localCard.name || 'プレビュー'}
                                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                />
                            </Box>

                            {/* 画像URL入力と画像色選択をFlexで並べる */}
                            <Grid container spacing={1} alignItems="center" mt={1}>
                                {/* 画像色選択 (Grid size は v7形式) */}
                                <Grid size={{ xs: 2 }}> {/* ★ 修正: Grid のサイズを2に変更 */}
                                    {/* ColorSelector コンポーネントを使用: スウォッチボタン単体として機能 */}
                                    <Box sx={{ display: 'flex', justifyContent: 'center', height: '100%' }}>
                                        <ColorSelector
                                            currentKey={localCard.imageColor || 'default'}
                                            onColorSelect={(key) => handleChange('imageColor', key)}
                                            disabled={isReadOnly}
                                            // ラベルは ColorSelector 内部で非表示に変更済み
                                            label=""
                                        />
                                    </Box>
                                </Grid>

                                {/* 画像URL入力 (Grid size は v7形式) */}
                                <Grid size={{ xs: 10 }}> {/* ★ 修正: Grid のサイズを10に変更 */}
                                    <TextField
                                        fullWidth
                                        label="画像URL"
                                        value={localCard.imageUrl || ''}
                                        onChange={(e) => handleChange('imageUrl', e.target.value)}
                                        size="small"
                                        // ★ 修正: margin="normal" を margin="none" に変更して余分なスペースを削除
                                        margin="none"
                                        disabled={isReadOnly}
                                        InputProps={{ readOnly: isReadOnly }}
                                    />
                                </Grid>
                            </Grid>
                        </Paper>
                    </Grid>

                    {/* 右側: フォーム入力 (Grid size は v7形式) */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        {/* 基本情報入力 (Grid container) */}
                        <Grid container spacing={2}>

                            <Grid size={{ xs: 12 }}>
                                {/* カード名 - isReadOnly で無効化 */}
                                <TextField
                                    fullWidth
                                    required
                                    label="カード名"
                                    value={localCard.name || ''}
                                    onChange={(e) => handleChange('name', e.target.value)}
                                    size="small"
                                    disabled={isReadOnly}
                                    InputProps={{ readOnly: isReadOnly }}
                                />
                            </Grid>

                            <Grid size={{ xs: 12 }}>
                                {/* 収録パック名 - 編集不可 */}
                                <TextField
                                    fullWidth
                                    label="収録パック"
                                    value={currentPackName || ''}
                                    size="small"
                                    InputProps={{
                                        readOnly: true, // 常に読み取り専用
                                    }}
                                    disabled
                                    // ラベルが消えないようにする
                                    InputLabelProps={{ shrink: true }}
                                />
                            </Grid>

                            <Grid size={{ xs: 6 }}>
                                {/* カード番号 - isReadOnly で無効化 */}
                                <TextField
                                    fullWidth
                                    label="カード番号"
                                    type="number"
                                    value={localCard.number ?? ''}
                                    onChange={(e) => handleChange('number', e.target.value)}
                                    size="small"
                                    disabled={isReadOnly}
                                    InputProps={{ readOnly: isReadOnly }}
                                />
                            </Grid>
                            <Grid size={{ xs: 6 }}>
                                {/* レアリティ - isReadOnly で無効化 */}
                                <FormControl fullWidth size="small" disabled={isReadOnly}>
                                    <InputLabel>レアリティ</InputLabel>
                                    <Select
                                        value={localCard.rarity || ''}
                                        label="レアリティ"
                                        onChange={(e: SelectChangeEvent) => handleChange('rarity', e.target.value)}
                                    >
                                        {rarityOptions.map(r => (
                                            <MenuItem key={r} value={r}>{r}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                        </Grid>

                        <Divider sx={{ my: 3 }} />

                        {/* CustomFieldManager コンポーネントを使用し、isReadOnly を渡す */}
                        <CustomFieldManager
                            customFieldSettings={customFieldSettings}
                            itemData={localCard}
                            onFieldChange={handleChange}
                            itemType="Card"
                            onSettingChange={onCustomFieldSettingChange}
                            isReadOnly={isReadOnly}
                        />

                        {/* TagManager コンポーネントを CustomFieldManager の下に配置 */}
                        <TagManager
                            itemData={localCard}
                            onFieldChange={(field, value) => handleChange(field, value)}
                            isReadOnly={isReadOnly}
                        />

                    </Grid>
                </Grid>
                {/* -------------------- ここまで既存のコンテンツ -------------------- */}

                <Divider sx={{ my: 3 }} />

                {/* -------------------- ここから新規追加の text/subtext -------------------- */}
                <Typography variant="h6" gutterBottom>カード詳細情報</Typography>
                <Grid container spacing={2}>
                    <Grid size={{ xs: 12 }}>
                        {/* text フィールド (複数行入力、isReadOnly対応) */}
                        <TextField
                            fullWidth
                            multiline
                            rows={4} // 任意の値 (例: 4行)
                            label="カードテキスト (text)"
                            value={localCard.text || ''}
                            onChange={(e) => handleChange('text', e.target.value)}
                            size="small"
                            disabled={isReadOnly}
                            InputProps={{ readOnly: isReadOnly }}
                        />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                        {/* subtext フィールド (複数行入力、isReadOnly対応) */}
                        <TextField
                            fullWidth
                            multiline
                            rows={2} // 任意の値 (例: 2行)
                            label="補足テキスト (subtext)"
                            value={localCard.subtext || ''}
                            onChange={(e) => handleChange('subtext', e.target.value)}
                            size="small"
                            disabled={isReadOnly}
                            InputProps={{ readOnly: isReadOnly }}
                        />
                    </Grid>
                </Grid>
                {/* -------------------- ここまで新規追加の text/subtext -------------------- */}
            </DialogContent>
            <DialogActions>

                {/* 削除ボタン: 新規作成でない かつ 閲覧モードでない 場合のみ表示 */}
                {!isNew && !isReadOnly && (
                    <Button onClick={handleRemove} color="error" variant="outlined" sx={{ mr: 'auto' }}>
                        カードを削除
                    </Button>
                )}

                {/* キャンセル/閉じるボタン */}
                <Button onClick={handleClose} variant="outlined">
                    {isReadOnly ? '閉じる' : 'キャンセル'}
                </Button>

                {/* 保存ボタン: 閲覧モードでない 場合のみ表示 */}
                {!isReadOnly && (
                    <Button onClick={handleSave} variant="contained" color="primary">
                        {isNew ? 'カードを作成' : '変更を保存'}
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
};

export default CardModal;