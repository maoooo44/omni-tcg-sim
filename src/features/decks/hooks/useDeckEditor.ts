/**
 * src/features/decks/hooks/useDeckEditor.ts
 *
 * * デッキ編集画面のコアロジックを統合したカスタムフック。
 * * 💡 修正点:
 * 1. カスタムフィールド設定の管理を Pack Editor と同様に、**独立した state から deckData に統合**。
 * 2. 初期ロード (updateLocalState) や保存 (handleSaveDeck) 時のカスタム設定に関する冗長な処理を削除。
 * 3. ダーティチェック (isDirty) のロジックを簡素化。
 * 4. 【最新修正】カスタムフィールド設定の更新ロジックを、Pack/Deck モデルのプロパティ名 (num_1, str_2 など) に直接アクセスするように変更し、TypeScriptのエラーを解消。
 */

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useDeckStore } from '../../../stores/deckStore';
import { useCardPoolStore } from '../../../stores/cardPoolStore';
import { useShallow } from 'zustand/react/shallow';
import { useNavigate } from '@tanstack/react-router';
import { useCardStore } from '../../../stores/cardStore';
import type { Deck, DeckFieldSettings } from '../../../models/models';
import { createDefaultDeck } from '../../../utils/dataUtils';

// サブフック
import { useDeckCardManagement } from './useDeckCardManagement';
// import { useDeckFileIO } from './useDeckFileIO'; // 将来のJSON I/O機能用に保持 

// ヘルパー関数のインポート
import {
    deepCopyDeck,
    extractCompareFieldsFromDeck,
    updateLocalState,
    type DeckCompareFields,
} from './helpers/deckStateHelpers';
import {
    createHandleInputChange,
    createHandleSelectChange,
    createHandleToggleFavorite,
} from './helpers/deckFieldHandlers';
import {
    createHandleDeckCustomFieldChange,
    createHandleCustomFieldSettingChange,
} from './helpers/deckCustomFieldHandlers';

import {
    createDeckArchive,
    type DeckArchiveDependencies
} from '../../../stores/utils/createDeckArchive';

// type DeckArea = 'mainDeck' | 'sideDeck' | 'extraDeck'; // useDeckCardManagementに移動済み


/**
 * デッキ編集画面のロジック、データロード、保存処理を統合する Hook
 */
export const useDeckEditor = (deckId: string) => {
    const [deckData, setDeckData] = useState<Deck | null>(null);
    // 復元用の完全なDeckモデルのスナップショット
    const [initialDeckModel, setInitialDeckModel] = useState<Deck | null>(null);
    const [originalDeckData, setOriginalDeckData] = useState<DeckCompareFields | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [saveMessage, setSaveMessage] = useState<string | null>(null);

    // UI状態
    const [isEditorMode, setisEditorMode] = useState<boolean>(false);
    const [isDeckBuildingMode, setIsDeckBuildingMode] = useState<boolean>(false);
    const [isDeckInfoFormCollapsed, setIsDeckInfoFormCollapsed] = useState(false);

    // [削除]: カスタムフィールド設定の独立した useState は Pack Editor に合わせて削除

    const navigate = useNavigate();

    // ========================================
    // サブフック統合
    // ========================================
    const {
        selectedDeckArea,
        handleAreaChange,
        handleCardAdd,
        handleCardRemove,
    } = useDeckCardManagement({
        deckData,
        setDeckData,
    });

    // DeckStoreから必要なアクションと状態を取得
    const {
        fetchDeckById,
        saveDeck,
        decks,
    } = useDeckStore(useShallow(state => ({
        fetchDeckById: state.fetchDeckById,
        saveDeck: state.saveDeck,
        decks: state.decks,
    })));

    // CardPoolStoreから所有カード資産を取得
    const ownedCards = useCardPoolStore(state => state.ownedCards);

    // CardStoreから全カードリストを取得
    const allCards = useCardStore(useShallow(state => state.cards));


    // --- 派生状態 ---
    const isNewDeck = useMemo(() => {
        return deckId && !decks.some(d => d.deckId === deckId);
    }, [deckId, decks]);

    /**
     * ダーティチェックロジック
     */
    const isDirty = useMemo(() => {
        if (!deckData) return false;

        // [修正]: deckData に fieldSettings が含まれるため、そのまま比較ロジックに使用
        const currentFields = extractCompareFieldsFromDeck(deckData);
        const currentJson = JSON.stringify(currentFields);

        if (isNewDeck) {
            // 新規作成時: デフォルト状態と比較
            const defaultDeck = createDefaultDeck(deckData.deckId);
            const defaultFields = extractCompareFieldsFromDeck(defaultDeck);
            return currentJson !== JSON.stringify(defaultFields);
        }

        // 既存デッキ: 初期ロード時のスナップショットと比較
        if (!originalDeckData) return false;

        return currentJson !== JSON.stringify(originalDeckData);
    }, [deckData, originalDeckData, isNewDeck]); // customFieldSettings の依存は削除


    // --- データロードと初期化 ---

    /**
     * ローカルステートを一括で更新し、ダーティチェックのベースラインを設定（ヘルパーから生成）
     */
    const updateLocalStateCallback = useCallback((deck: Deck) => {
        updateLocalState(deck, {
            setDeckData,
            setInitialDeckModel,
            setOriginalDeckData,
            setIsLoading,
        });
    }, []);


    // 1. 初期ロード / デッキ切り替えロジック
    useEffect(() => {
        const loadDeck = async () => {
            setIsLoading(true);
            handleAreaChange('mainDeck'); // エリアをリセット

            if (isNewDeck && deckId) {
                const newDeck = createDefaultDeck(deckId);
                updateLocalStateCallback(newDeck);
                setisEditorMode(true); 
                setIsDeckBuildingMode(false);
                return;
            }

            const deck = await fetchDeckById(deckId);
            if (deck) {
                updateLocalStateCallback(deck);
                setisEditorMode(true);
                setIsDeckBuildingMode(false); 
            } else {
                console.error(`[useDeckEditor] ❌ Deck ID ${deckId} not found.`);
                setDeckData(null);
                setInitialDeckModel(null);
                setOriginalDeckData(null);
                setIsLoading(false);
            }
        };
        if (!deckData || deckData.deckId !== deckId) {
            loadDeck();
        }
    }, [deckId, fetchDeckById, isNewDeck, updateLocalState, deckData]);


    // --- UI/状態変更ハンドラ ---

    const toggleEditorMode = useCallback(() => {
        setisEditorMode(prev => {
            // 編集モードをOFFにする際、ビルディングモードも強制的にOFFにする
            if (prev) {
                setIsDeckBuildingMode(false);
            }
            return !prev;
        });
    }, []);

    const handleToggleDeckBuildingMode = useCallback(() => {
        setIsDeckBuildingMode(prev => !prev);
    }, []);

    const toggleDeckInfoFormCollapse = useCallback(() => {
        setIsDeckInfoFormCollapsed(prev => !prev);
    }, []);


    // 編集内容破棄 (キャンセル) ハンドラ
    const handleCancelEdit = useCallback(() => {
        if (!deckData) return;

        if (!window.confirm('編集内容を破棄し、元の状態に戻しますか？')) {
            return;
        }

        // 1. 編集モード/ビルディングモードを閲覧モードへ解除
        setisEditorMode(false);
        setIsDeckBuildingMode(false);

        // 2. 状態を初期スナップショットに戻す
        if (isNewDeck) {
            const newDeck = createDefaultDeck(deckId);
            updateLocalStateCallback(newDeck);
            setSaveMessage('📝 新規デッキの編集内容を破棄しました。');
        } else if (initialDeckModel) { 
            // 既存デッキは initialDeckModel を復元
            const restoredDeck = deepCopyDeck(initialDeckModel);
            updateLocalStateCallback(restoredDeck);
            setSaveMessage('📝 編集内容を破棄し、閲覧モードに戻りました。');
        } else {
            setSaveMessage('📝 編集内容を破棄しましたが、オリジナルデータが不明です。再ロードします。');
            setDeckData(null); // useEffectのロードをトリガー
        }
    }, [deckData, deckId, isNewDeck, updateLocalState, initialDeckModel]);


    // --- データ更新ハンドラ（ヘルパーから生成） ---
    
    const handleInputChange = useMemo(
        () => createHandleInputChange({ deckData, setDeckData }),
        [deckData]
    );

    const handleSelectChange = useMemo(
        () => createHandleSelectChange({ deckData, setDeckData }),
        [deckData]
    );

    const onDeckCustomFieldChange = useMemo(
        () => createHandleDeckCustomFieldChange({ deckData, setDeckData }),
        [deckData]
    );
    
    const onCustomFieldSettingChange = useMemo(
        () => createHandleCustomFieldSettingChange({ deckData, setDeckData }),
        [deckData]
    );

    const handleToggleFavorite = useMemo(
        () => createHandleToggleFavorite({ 
            deckId, 
            isNewDeck: !!isNewDeck, 
            updateDeckIsFavorite: useDeckStore.getState().updateDeckIsFavorite 
        }),
        [deckId, isNewDeck]
    );

    // 指定されたゾーンのカード枚数を更新
    const updateCardCount = useCallback((zone: keyof Pick<Deck, 'mainDeck' | 'sideDeck' | 'extraDeck'>, cardId: string, count: number) => {
        setDeckData(prev => {
            if (!prev) return null;

            const newMap = new Map(prev[zone]);

            if (count > 0) {
                newMap.set(cardId, count);
            } else {
                newMap.delete(cardId);
            }

            const newMainMap = zone === 'mainDeck' ? newMap : prev.mainDeck;
            const newSideMap = zone === 'sideDeck' ? newMap : prev.sideDeck;
            const newExtraMap = zone === 'extraDeck' ? newMap : prev.extraDeck;

            const mainTotal = Array.from(newMainMap.values()).reduce((a, b) => a + b, 0);
            const sideTotal = Array.from(newSideMap.values()).reduce((a, b) => a + b, 0);
            const extraTotal = Array.from(newExtraMap.values()).reduce((a, b) => a + b, 0);
            const newTotalCards = mainTotal + sideTotal + extraTotal;
            
            // uniqueCards（ユニークなカード種類数）を計算
            const newUniqueCards = newMainMap.size + newSideMap.size + newExtraMap.size;

            return {
                ...prev,
                [zone]: newMap, 
                uniqueCards: newUniqueCards,
                totalCards: newTotalCards, 
            };
        });
    }, []);

    // [削除]: handleCardAdd/handleCardRemove は useDeckCardManagement に移動済み

    // ArchiveDependencies の構築
    const deckArchiveDependencies: DeckArchiveDependencies = {
        get: useDeckStore.getState,
    };

    // createDeckArchive を使用してアクションを取得
    const {
        moveDeckToTrash,
        restoreDeckFromTrash,
        deleteDeckFromTrash: physicalDeleteDeck,
    } = createDeckArchive(deckArchiveDependencies);


    // デッキ保存ロジック
    const handleSaveDeck = useCallback(async () => {
        if (!deckData?.name?.trim()) {
            setSaveMessage('❌ デッキ名を入力してください。');
            setTimeout(() => setSaveMessage(null), 3000);
            return;
        }

        if (!isDirty) {
            setSaveMessage('✅ 変更がありません。');
            setTimeout(() => setSaveMessage(null), 3000);
            return;
        }

        try {
            // [修正]: fieldSettings は deckData に含まれているため、別途マージは不要
            const deckToSave = deckData;
            const savedDeck = await saveDeck(deckToSave);

            if (isNewDeck) {
                // 新規作成の場合、URLを置換してリダイレクト
                navigate({ to: '/decks/$deckId', params: { deckId: savedDeck.deckId }, replace: true });
            } else {
                // 既存デッキの場合、ローカルの状態を保存後の状態に更新
                updateLocalStateCallback(savedDeck);
                setSaveMessage('✅ デッキを保存しました！');
                setTimeout(() => setSaveMessage(null), 3000);
            }
        } catch (error) {
            setSaveMessage('❌ 保存に失敗しました。');
            console.error('Save failed:', error);
            setTimeout(() => setSaveMessage(null), 3000);
        }
    }, [deckData, saveDeck, isNewDeck, navigate, updateLocalStateCallback, isDirty]); 


    // デッキ削除 (ゴミ箱に移動)
    const handleDeleteDeck = useCallback(async () => {
        if (!deckData) return;

        if (!window.confirm(`デッキ「${deckData.name}」をゴミ箱に移動しますか？\n（この操作はいつでも復元可能です）`)) {
            return;
        }

        try {
            await moveDeckToTrash(deckData.deckId);
            setSaveMessage('✅ デッキをゴミ箱に移動しました。');
            navigate({ to: '/decks' });
        } catch (error) {
            setSaveMessage('❌ デッキのゴミ箱への移動に失敗しました。');
            console.error(error);
        }
    }, [deckData, moveDeckToTrash, navigate]);


    // デッキ復元 (ゴミ箱から復元) 
    const handleRestoreDeck = useCallback(async (archiveId: string) => {
        if (!window.confirm(`デッキを一覧に復元しますか？`)) {
            return;
        }

        try {
            await restoreDeckFromTrash(archiveId);
            setSaveMessage('✅ デッキを一覧に復元しました。');
            navigate({ to: '/decks' });

        } catch (error) {
            setSaveMessage('❌ 復元に失敗しました。');
            console.error(error);
        }
    }, [restoreDeckFromTrash, navigate]);


    // 物理削除ロジック (ゴミ箱からの完全削除)
    const handlePhysicalDelete = useCallback(async (archiveId: string) => {
        if (!window.confirm(`【警告】デッキをDBから完全に物理削除しますか？\nこの操作は元に戻せません。`)) {
            return;
        }

        try {
            await physicalDeleteDeck(archiveId);
            setSaveMessage('✅ デッキを物理削除しました。');
            navigate({ to: '/decks' });
        } catch (error) {
            setSaveMessage('❌ デッキの物理削除に失敗しました。');
            console.error(error);
        }
    }, [physicalDeleteDeck, navigate]);


    // 公開する値とアクション
    return {
        deckId,
        isLoading,
        isDirty,
        saveMessage,
        currentDeck: deckData,
        isNewDeck,

        // 編集画面の状態
        isEditorMode,
        isDeckBuildingMode,
        selectedDeckArea,
        isDeckInfoFormCollapsed, 

        // デッキ編集アクション
        onSave: handleSaveDeck,
        onDelete: handleDeleteDeck,
        onRestore: handleRestoreDeck,
        onPhysicalDelete: handlePhysicalDelete,

        // 状態変更ハンドラ
        toggleEditorMode, 
        onCancelEdit: handleCancelEdit,
        handleToggleDeckBuildingMode,
        handleAreaChange,
        toggleDeckInfoFormCollapse,

        // データ更新ハンドラ 
        handleInputChange,
        handleSelectChange,
        updateCardCount,
        
        // カスタムフィールド関連のハンドラ
        onDeckCustomFieldChange, // Deckのカスタムフィールド値の変更
        // [修正]: fieldSettings は Pack/DeckFieldSettings 型に合うように
        customFieldSettings: deckData?.deckFieldSettings as DeckFieldSettings, 
        onCustomFieldSettingChange, // Deckのカスタムフィールド設定の変更 (Pack Editor互換シグネチャ)

        // DeckEditorPage.tsxで期待されていたプロパティ
        handleCardAdd,
        handleCardRemove,

        // ⭐ 【追加】お気に入りトグル関数を返却
        handleToggleFavorite,

        // 参照データ
        allCards: allCards,
        ownedCards: ownedCards,
    };
};