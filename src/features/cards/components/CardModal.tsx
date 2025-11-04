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
    Button, Typography, Grid,
} from '@mui/material';
import type { Card, Pack, FieldSetting } from '../../../models/models';

// CustomFieldManager をインポート
// FavoriteToggleButton をインポート
import FavoriteToggleButton from '../../../components/common/FavoriteToggleButton';
// useCardStore をインポート (★ 追加: ストアアクションを直接取得するため)
import { useCardStore } from '../../../stores/cardStore';

// 共通画像ユーティリティをインポート

import { createDefaultCard } from '../../../utils/dataUtils';

import { truncateString } from '../../../utils/stringUtils';

// CardInfoForm をインポート（同じディレクトリ）
import CardInfoForm from './CardInfoForm';
// ----------------------------------------
// モーダルサイズを定数で定義
// ----------------------------------------
import { MODAL_WIDTH, MODAL_HEIGHT } from '../../../configs/configs';


// Propsの定義
export interface CardModalProps {
    open: boolean;
    onClose: () => void;
    card: Card | null;
    onSave: (cardToSave: Card) => void;
    onRemove: (cardId: string) => Promise<void>;
    currentPack: Pack; // ★ パック関連のプロパティを1つに統合

    /** 新規追加: 閲覧モード (true) か編集モード/新規作成 (false) か */
    isReadOnly: boolean;

    // onCustomFieldSettingChange は 4つの引数を取る
    onCustomFieldSettingChange: (
        itemType: 'Card' | 'Deck' | 'Pack',
        type: 'num' | 'str',
        index: number,
        settingUpdates: Partial<FieldSetting>
    ) => void;
}


// ----------------------------------------
// CardModal 本体
// ----------------------------------------

const CardModal: React.FC<CardModalProps> = ({
    open, onClose, card, onSave,
    onRemove,
    currentPack,
    onCustomFieldSettingChange,
    isReadOnly,
}) => {

    const [localCard, setLocalCard] = useState<Card | null>(card);

    // ストアアクションとストアの全カードを取得 (★ 修正)
    const updateCardIsFavorite = useCardStore(state => state.updateCardIsFavorite);
    const storeCards = useCardStore(state => state.cards);

    const rarityOptions: string[] = useMemo(() => {
        return currentPack.rarityConfig.map(c => c.rarityName);
    }, [currentPack.rarityConfig]);

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
            // 🟢 修正: 閲覧モード時はストアから最新のカードデータを取得
            let baseCard: Card;
            if (isReadOnly && card) {
                // 閲覧モードの場合、ストアから最新のカードを取得
                const latestCard = storeCards.find(c => c.cardId === card.cardId);
                baseCard = latestCard || card; // ストアに見つからない場合はpropsのcardを使用
                console.log('🔍 CardModal - 閲覧モード: ストアから最新カードを取得', baseCard.cardId, 'isFavorite:', baseCard.isFavorite);
            } else {
                baseCard = card || createDefaultCard(currentPack.packId);
            }

            const defaultRarityName = currentPack.rarityConfig.length > 0 ? currentPack.rarityConfig[0].rarityName : '';

            // imageColor の初期値設定。既存の値がない場合は 'default' を使用
            const defaultColor = baseCard.imageColor || 'default';

            const finalCard: Card = {
                ...baseCard,
                number: (baseCard.number === undefined || baseCard.number === null) ? null : baseCard.number,
                packId: baseCard.packId || currentPack.packId,
                rarity: baseCard.rarity || defaultRarityName,
                imageColor: defaultColor, // ★ 初期値設定
                // Card のカスタムフィールド (str_1-6, num_1-6) は baseCard に含まれることを想定
            };

            setLocalCard(finalCard);

        } else {
            setLocalCard(null);
        }
    }, [open, card, currentPack.packId, currentPack.rarityConfig, isReadOnly, storeCards]);

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

    // CardInfoForm用のフィールド変更ハンドラ（型互換性のためのラッパー）
    const handleFieldChange = useCallback((field: string, value: any) => {
        handleChange(field as keyof Card, value);
    }, [handleChange]);

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

    // 🚨 ⭐ 修正: CustomFieldManager の onSettingChange プロパティを受け取り、
    // onCustomFieldSettingChange (正しい4つの引数) に変換して渡すラッパーを定義
    const handleCardFieldSettingWrapper = useCallback(
        (
            _itemType: 'Card' | 'Deck' | 'Pack',
            type: 'num' | 'str',
            index: number,
            settingUpdates: Partial<FieldSetting>
        ) => {
            // isReadOnly が false で、かつ実際に更新がある場合のみ実行
            if (!isReadOnly && Object.keys(settingUpdates).length > 0) {
                // onCustomFieldSettingChange は 4つの引数 (itemType, type, index, settingUpdates) を取るため、
                // settingUpdates を展開せずにそのまま渡す
                onCustomFieldSettingChange('Card', type, index, settingUpdates);
            }
        },
        [onCustomFieldSettingChange, isReadOnly] // isReadOnly を依存配列に追加
    );

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
                                onToggle={async (id: string, state: boolean) => {
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

                <CardInfoForm
                    card={localCard}
                    currentPack={currentPack}
                    rarityOptions={rarityOptions}
                    onFieldChange={handleFieldChange}
                    onCustomFieldSettingChange={handleCardFieldSettingWrapper}
                    isReadOnly={isReadOnly}
                    isBulkEdit={false}
                />

                {/* -------------------- ここまで既存のコンテンツ -------------------- */}
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