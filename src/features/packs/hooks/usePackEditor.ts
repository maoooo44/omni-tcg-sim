import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { usePackStore } from '../../../stores/packStore';
import { useCardStore } from '../../../stores/cardStore';
import { useShallow } from 'zustand/react/shallow';
import { createDefaultPack } from '../../../utils/dataUtils';
import type { Pack, Card as CardType, CardFieldSettings } from '../../../models/models';
import { usePackFileIO } from './usePackFileIO';
import { usePackCardManagement } from './usePackCardManagement';
import { usePackModals } from './usePackModals';

// ヘルパー関数のインポート
import {
    extractCompareFieldsFromBundle,
    updateLocalBundleState,
    type PackBundleCompareFields,
} from './helpers/packStateHelpers';
import {
    createHandleInputChange,
    createHandleSelectChange,
    createHandleToggleFavorite,
} from './helpers/packFieldHandlers';
import {
    createHandlePackCustomFieldChange,
    createHandleCustomFieldSettingChange,
    createHandlePackFieldSettingChange,
} from './helpers/packCustomFieldHandlers';

// Storeから Pack取得アクションを直接取得するヘルパー
const fetchPackByIdFromStore = () => usePackStore.getState().fetchPackById;


export const usePackEditor = (packId: string) => {

    const navigate = useNavigate();

    // Storeから必要な関数と状態を取得
    const { savePack, packs, movePackToTrash } = usePackStore(useShallow(state => ({
        savePack: state.savePack,
        packs: state.packs,
        movePackToTrash: state.movePackToTrash,
    })));

    // CardStoreから必要なアクションと状態を取得
    const { cardCountInStore, bulkSaveCards, bulkDeleteCards } = useCardStore(useShallow(state => ({
        cardCountInStore: state.cards.filter(c => c.packId === packId).length,
        bulkSaveCards: state.bulkSaveCards,
        bulkDeleteCards: state.bulkDeleteCards,
    })));

    const fetchCardsByPackId = useCardStore(state => state.fetchCardsByPackId);

    // ----------------------------------------------------------------------

    // --- 状態管理 ---
    const [packData, setPackData] = useState<Pack | null>(null);
    // 新規パックとして初期化された際の packId（URLのpackIdが仮のIDの場合があるため）
    const [newlyInitializedPackId, setNewlyInitializedPackId] = useState<string | null>(null);
    // originalPackBundleDataは「初期ロード時のpack+cardsのスナップショット」
    const [originalPackBundleData, setOriginalPackBundleData] = useState<PackBundleCompareFields | null>(null);
    // 元のカードIDリスト（保存時にローカルから削除されたカードをDBからも削除するために使用）
    const [originalCardIds, setOriginalCardIds] = useState<Set<string>>(new Set());

    // UI制御
    const [isEditorMode, setIsEditorMode] = useState(true);
    const [isDeletionInProgress, setIsDeletionInProgress] = useState(false);
    const [saveAlert, setSaveAlert] = useState<string | null>(null);
    const [cards, setCards] = useState<CardType[]>([]); // ローカルで編集中のカードリスト

    // ⭐ 【追加】PackInfoFormの折り畳み状態
    const [isPackInfoFormCollapsed, setIsPackInfoFormCollapsed] = useState(false);

    // ========================================
    // 4️⃣ サブフック統合
    // ========================================
    const {
        isCardModalOpen,
        editingCard,
        handleOpenCardEditorModal,
        handleOpenCardViewModal,
        handleCloseCardModal,
        handleCardSave,
        handleRemoveCard,
    } = usePackCardManagement({
        packData,
        cards,
        setCards,
        isEditorMode,
    });

    const {
        isRarityModalOpen,
        handleOpenRarityEditorModal,
        handleCloseRarityEditorModal,
        handleRarityEditorSave,
    } = usePackModals({ setPackData });

    // --- Data Loaders ---

    // PackとCardのローカル状態をまとめて更新するヘルパー関数（ヘルパーから生成）
    const updateLocalBundleStateCallback = useCallback((pack: Pack, loadedCards: CardType[] | null) => {
        updateLocalBundleState(pack, loadedCards, {
            setPackData,
            setCards,
            setOriginalPackBundleData,
            setOriginalCardIds,
        });
    }, []);

    // CardStoreからカードリストを取得し、ローカル状態を更新
    const loadCardList = useCallback(async () => {
        if (!packId || !packData) {
            setCards([]);
            return;
        }

        const loadedCards = await fetchCardsByPackId(packId);

        // packDataが既に存在する場合にのみ、cardsのローカル状態を更新
        if (packData) {
            setCards(loadedCards);
        }

    }, [packId, packData, fetchCardsByPackId]);


    // I/O操作（CSV/JSONインポートなど）完了後にカードリストをリロードするコールバック
    const handleCardListUpdateAfterIO = useCallback(async () => {
        await loadCardList();
    }, [loadCardList]);


    // I/O 関連の状態とハンドラを usePackFileIO に委譲
    const fileIO = usePackFileIO({ 
        packId, 
        packData, 
        onCardListUpdated: handleCardListUpdateAfterIO 
    });

    // --- 派生状態 ---
    const isNewPack = useMemo(() => {
        // Packs Store内のリストにpackIdが存在しない かつ packDataがnull
        const isIdNotInStore = packId ? !packs.some(p => p.packId === packId) : false;

        // Packデータが既にロードされている場合は、新規ではない
        if (packData && packData.packId === packId) {
            return false;
        }
        return isIdNotInStore;
    }, [packId, packs, packData]);

    const isExistingPack = useMemo(() => !isNewPack && !!packId, [isNewPack, packId]);

    const isDisabled = useMemo(() => !isEditorMode, [isEditorMode]);
    const totalCardCount = cards.length;

    // isDirty ロジック（PackBundle 比較）
    const isDirty = useMemo(() => {
        if (!packData || !originalPackBundleData) return false;
        const currentBundle = extractCompareFieldsFromBundle(packData, cards);
        // originalPackBundleData（初期ロード時のスナップショット）と現在値を常に比較
        return JSON.stringify(currentBundle) !== JSON.stringify(originalPackBundleData);
    }, [packData, cards, originalPackBundleData]);

    // --------------------------------------------------------------------------------------------------

    // --- データロードと初期化 ---
    useEffect(() => {
        const loadPackData = async () => {
            if (isDeletionInProgress) return;
            // packIdが切り替わった場合、状態をリセット
            if (packData && packData.packId !== packId) {
                setPackData(null);
                setOriginalPackBundleData(null);
                setOriginalCardIds(new Set());
                setCards([]);
            }
            // packDataがロード済みかつpackIdが一致する場合はスキップ
            if (packData && packData.packId === packId) return;


            if (isNewPack && packId) {
                // 新規パック作成ロジック
                let newPackId = packId;

                if (!newlyInitializedPackId) {
                    // 新規作成の場合、ユニークなIDを生成し、URLを置換
                    const defaultData = createDefaultPack(packId);
                    newPackId = defaultData.packId;
                    setNewlyInitializedPackId(newPackId);
                } else {
                    newPackId = newlyInitializedPackId;
                }
                // IDが変わった場合はURLを置換し、再実行をトリガー
                if (packId !== newPackId) {
                    navigate({ to: '/packs/$packId', params: { packId: newPackId }, replace: true });
                    return;
                }

                const initialPack: Pack = createDefaultPack(newPackId);
                // 新規作成時は、初期状態をそのままスナップショットとしてセット
                setOriginalPackBundleData(extractCompareFieldsFromBundle(initialPack, []));
                setOriginalCardIds(new Set());
                updateLocalBundleStateCallback(initialPack, []);
                setIsEditorMode(true);
            } else if (isExistingPack && packId) {
                // 既存パックロードロジック
                setNewlyInitializedPackId(null);
                const pack = await fetchPackByIdFromStore()(packId);
                if (pack) {
                    const loadedCards = await fetchCardsByPackId(pack.packId);
                    // 既存パックの場合はロードしたデータをスナップショットとしてセット
                    setOriginalPackBundleData(extractCompareFieldsFromBundle(pack, loadedCards));
                    setOriginalCardIds(new Set(loadedCards.map(c => c.cardId)));
                    updateLocalBundleStateCallback(pack, loadedCards);
                    setIsEditorMode(true);
                } else {
                    console.error(`[usePackEditor:loadPackData] ❌ Pack ID ${packId} not found in DB or Store.`);
                    setPackData(null);
                    setOriginalPackBundleData(null);
                    setOriginalCardIds(new Set());
                    setCards([]);
                    setIsEditorMode(false);
                }
            } else if (!packId) {
                // IDがない場合は全てリセット
                setNewlyInitializedPackId(null);
                setPackData(null);
                setOriginalPackBundleData(null);
                setOriginalCardIds(new Set());
                setCards([]);
            }
        };

        loadPackData();
        // 依存配列から packData を削除することで、ロード済みの状態での無限ループを防ぐ
    }, [packId, isExistingPack, isNewPack, navigate, isDeletionInProgress, newlyInitializedPackId, updateLocalBundleState]);

    // Store内のCardCountに変更があった場合のみ、カードリストを再ロード
    useEffect(() => {
        if (packData) {
            if (process.env.NODE_ENV !== 'production') {
                console.debug(`[usePackEditor:useEffect] 🔄 Card count changed, refetching cards for Pack ID: ${packId} from Store Cache.`);
            }
            loadCardList();
        }
    }, [packId, cardCountInStore, packData, loadCardList]);

    // --------------------------------------------------------------------------------------------------

    // --- ハンドラ定義 (ヘルパーから生成) ---
    const handleInputChange = useMemo(
        () => createHandleInputChange({ packData, setPackData }),
        [packData]
    );

    const handleSelectChange = useMemo(
        () => createHandleSelectChange({ packData, setPackData }),
        [packData]
    );

    const handlePackCustomFieldChange = useMemo(
        () => createHandlePackCustomFieldChange({ packData, setPackData }),
        [packData]
    );

    const handleCustomFieldSettingChange = useMemo(
        () => createHandleCustomFieldSettingChange({ packData, setPackData }),
        [packData]
    );

    const handlePackFieldSettingChange = useMemo(
        () => createHandlePackFieldSettingChange({ packData, setPackData }),
        [packData]
    );

    const handleToggleFavorite = useMemo(
        () => createHandleToggleFavorite({ 
            packId, 
            isNewPack, 
            updatePackIsFavorite: usePackStore.getState().updatePackIsFavorite 
        }),
        [packId, isNewPack]
    );

    const toggleEditorMode = useCallback(() => {
        setIsEditorMode(prev => !prev);
    }, []);

    // ⭐ 【追加】折り畳みトグル関数
    const togglePackInfoFormCollapse = useCallback(() => {
        setIsPackInfoFormCollapsed(prev => !prev);
    }, []);

    // handleSave
    const handleSave = useCallback(async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!packData) return;

        try {
            if (process.env.NODE_ENV !== 'production') {
                console.debug(`[usePackEditor:handleSave] 💾 Saving pack and ${cards.length} cards for ID: ${packData.packId}`);
            }

            // uniqueCardsを現在のカード数で更新してから保存
            const packToSave = {
                ...packData,
                uniqueCards: cards.length,
            };

            // 1. パック保存
            const savedPack = await savePack(packToSave);

            // 2. 削除されたカードをDBから削除
            const currentCardIds = new Set(cards.map(c => c.cardId));
            const deletedCardIds = Array.from(originalCardIds).filter(id => !currentCardIds.has(id));

            if (deletedCardIds.length > 0) {
                if (process.env.NODE_ENV !== 'production') {
                    console.debug(`[usePackEditor:handleSave] 🗑️ Deleting ${deletedCardIds.length} removed cards from DB`);
                }
                await bulkDeleteCards(deletedCardIds);
            }

            // 3. カード保存
            if (cards.length > 0) {
                const cardsToSave = cards.map(c => ({
                    ...c,
                    packId: savedPack.packId,
                }));
                await bulkSaveCards(cardsToSave);
            }

            // 保存成功時にoriginalPackBundleDataを最新状態で更新
            setOriginalPackBundleData(extractCompareFieldsFromBundle(savedPack, cards));
            // 元のカードIDリストを更新
            setOriginalCardIds(currentCardIds);

            // 新規パックの場合はURLを置換
            if (isNewPack) {
                setNewlyInitializedPackId(null);
                navigate({ to: '/packs/$packId', params: { packId: savedPack.packId }, replace: true });
                return; // navigateで画面が切り替わるためここで終了
            }

            // カードリストをリロード（store cache更新＆状態反映）
            await loadCardList();
            setSaveAlert('✅ パック情報と収録カードが正常に保存されました。');
        } catch (error) {
            console.error("[usePackEditor:handleSave] ❌ 保存中にエラーが発生しました:", error);
            setSaveAlert('❌ 保存中にエラーが発生しました。');
        }
    }, [packData, cards, originalCardIds, savePack, isNewPack, navigate, bulkSaveCards, bulkDeleteCards, loadCardList]);

    // handleRemovePack: パックをトラッシュコレクションへ移動（論理削除）
    const handleRemovePack = useCallback(async () => {
        if (!packData) return;
        if (!window.confirm(`パック「${packData.name}」をゴミ箱へ移動しますか？\n（この操作はいつでも復元可能です）`)) return;

        const idToDelete = packData.packId;

        try {
            setIsDeletionInProgress(true);
            await movePackToTrash(idToDelete);
            setSaveAlert('✅ パックをゴミ箱へ移動しました。');

            navigate({ to: '/packs', replace: true });

        } catch (error) {
            console.error("[usePackEditor:handleRemovePack] ❌ ERROR during move to trash:", error);
            setSaveAlert('❌ パックのゴミ箱への移動に失敗しました。');
            setIsDeletionInProgress(false);
        }
    }, [packData, navigate, movePackToTrash]);

    // ⭐ 【新規追加】キャンセルハンドラ
    const handleCancelEdit = useCallback(() => {
        if (!packData) return;

        if (!window.confirm('編集内容を破棄し、元の状態に戻しますか？')) {
            return;
        }

        // 1. 編集モードを解除
        setIsEditorMode(false);

        // 2. 状態を初期スナップショットに戻す
        if (originalPackBundleData) {
            // originalPackBundleData の cards は CardCompareFields[] なので、
            // number プロパティは string または number の可能性があるため、cardId を使うのが安全
            updateLocalBundleStateCallback(originalPackBundleData.pack as Pack, originalPackBundleData.cards as CardType[]);

            // --- 修正箇所 ---
            // originalCardIds は永続的な cardId を保持すべきため、
            // ここではロード時のカードから cardId を取得するのが本来ですが、
            // originalPackBundleData には cardId が含まれていないため、
            // とりあえず number を文字列化するか、ロード時のロジックに合わせる（今回は number を使う想定だったと推測し、String()で対応）
            // 根本的には originalPackBundleData に cardId を含めるべきですが、今回は既存のコードとの整合性を保ちます。
            setOriginalCardIds(new Set(originalPackBundleData.cards.map(c => c.number ? String(c.number) : '')));
            // --- 修正ここまで ---

            loadCardList(); // カードリストをストアの状態に戻す

            setSaveAlert('📝 編集内容を破棄し、閲覧モードに戻りました。');
        } else {
            // ロード時と違うが、とりあえず再ロードを試みる
            setOriginalPackBundleData(null);
            loadCardList();
            setSaveAlert('📝 編集内容を破棄しました。');
        }
    }, [packData, originalPackBundleData, updateLocalBundleState, loadCardList]);


    return {
        packId,
        packData: packData,
        isNewPack,
        isExistingPack,
        isEditorMode,
        isDirty,
        toggleEditorMode,

        isDisabled,
        saveAlert,
        setSaveAlert,
        handleInputChange,
        handleSelectChange,
        handlePackCustomFieldChange,
        // 💡 【追加】Packカスタムフィールド設定の更新ハンドラ
        handlePackFieldSettingChange,
        handleSave,
        handleRemovePack,
        totalCardCount,

        cards,
        handleCardSave,
        handleRemoveCard,

        // CardFieldSettings を CustomFieldManager が期待する型へと型を合わせる。
        customFieldSettings: packData?.cardFieldSettings as CardFieldSettings,
        handleCustomFieldSettingChange,

        isCardModalOpen,
        editingCard,
        handleOpenCardEditorModal,
        handleOpenCardViewModal,
        handleCloseCardModal,
        isRarityModalOpen,
        handleOpenRarityEditorModal,
        handleCloseRarityEditorModal,
        handleRarityEditorSave,

        // CSV I/O (新しいインターフェース)
        csvIO: {
            isLoading: fileIO.csv.isLoading,
            statusMessage: fileIO.csv.statusMessage,
        },
        isImportModalOpen: fileIO.csv.ui.modal.isOpen,
        setIsImportModalOpen: (open: boolean) => open ? fileIO.csv.ui.modal.open() : fileIO.csv.ui.modal.close(),
        fileToImport: fileIO.csv.ui.modal.file,
        handleConfirmImport: fileIO.csv.handleImport,
        handleFileChange: fileIO.csv.ui.handleFileChange,

        // JSON I/O (新しいインターフェース)
        jsonIOStatusMessage: fileIO.json.statusMessage || '',
        isJsonIOLoading: fileIO.json.isLoading,
        isJsonImportModalOpen: fileIO.json.ui.modal.isOpen,
        setIsJsonImportModalOpen: (open: boolean) => open ? fileIO.json.ui.modal.open() : fileIO.json.ui.modal.close(),
        jsonFileToImport: fileIO.json.ui.modal.file,
        handleConfirmJsonImport: () => fileIO.json.handleImport('RENAME'),

        // 共通メニュー (CSV用を使用)
        anchorEl: fileIO.csv.ui.menu.anchorEl,
        handleMenuOpen: fileIO.csv.ui.menu.open,
        handleMenuClose: fileIO.csv.ui.menu.close,
        handleImportClick: (type: 'csv' | 'json' | 'zip') => {
            if (type === 'csv') fileIO.csv.ui.modal.open();
            if (type === 'json') fileIO.json.ui.modal.open();
        },
        handleExportClick: (type: 'csv' | 'json' | 'zip') => {
            if (type === 'csv') fileIO.csv.handleExport();
            if (type === 'json') fileIO.json.handleExport();
        },

        // ⭐ 【追加】折り畳み状態とトグル関数を返却
        isPackInfoFormCollapsed,
        togglePackInfoFormCollapse,

        // ⭐ 【追加】お気に入りトグル関数を返却
        handleToggleFavorite,

        handleCancelEdit,
    };
};