/**
 * src/features/packs/hooks/usePackEditor.ts
 *
 * 特定のPackの編集画面における状態管理、データロード、保存、およびI/O操作を一元的に処理するカスタムフック。
 * Packとそれに紐づくCardデータの取得・ローカルな変更追跡（isDirty）、新規Packの初期化、
 * およびStore/Service層へのデータ永続化（保存/削除）のトリガーを提供します。
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { usePackStore } from '../../../stores/packStore'; 
import { useCardStore } from '../../../stores/cardStore'; 
import { useShallow } from 'zustand/react/shallow';
import { createDefaultPack, createDefaultCard } from '../../../utils/dataUtils'; 
import type { Pack } from '../../../models/pack'; 
import type { Card as CardType } from '../../../models/card';
import { useDataFileIO } from '../../../hooks/useDataFileIO'; 

// FieldSetting と CardFieldSettings は Pack モデルから
import type { CardFieldSettings } from '../../../models/pack'; 
import type { FieldSetting } from '../../../models/customField'; 

// Storeから Pack取得アクションを直接取得するヘルパー
const fetchPackByIdFromStore = () => usePackStore.getState().fetchPackById;

// ----------------------------------------------------------------------
// PackBundle に基づく比較用フィールド定義
// ----------------------------------------------------------------------

type CardCompareFields = Pick<CardType, 'name' | 'number' | 'imageUrl' | 'imageColor' | 'rarity' |
    'text' | 'subtext' | 'isFavorite' | 'num_1' | 'num_2' | 'num_3' | 'num_4' | 'num_5' | 'num_6' |
    'str_1' | 'str_2' | 'str_3' | 'str_4' | 'str_5' | 'str_6' | 'tag' | 'searchText'>;


type PackCompareFields = Pick<Pack, 
    'name' | 'number' | 'imageUrl' | 'imageColor' | 'cardBackImageUrl'  | 'price' | 'packType' | 'cardsPerPack' |'series' |
    'description' | 'isOpened' | 'isFavorite' | 'rarityConfig' | 'advancedRarityConfig' |'specialProbabilitySlots' | 'isAdvancedRulesEnabled' |
    'num_1' | 'num_2' | 'str_1' | 'str_2' | 'packFieldSettings' | 'cardFieldSettings' | 'tag' | 'searchText'>;


type PackBundleCompareFields = {
    pack: PackCompareFields;
    cards: CardCompareFields[];
};


const extractCompareFieldsFromBundle = (pack: Pack, cards: CardType[]): PackBundleCompareFields => {
    const packFields: PackCompareFields = {
        name: pack.name,
        series: pack.series,
        price: pack.price,
        cardsPerPack: pack.cardsPerPack,
        rarityConfig: pack.rarityConfig,
        advancedRarityConfig: pack.advancedRarityConfig,
        imageUrl: pack.imageUrl,
        imageColor: pack.imageColor,
        cardBackImageUrl: pack.cardBackImageUrl,
        packType: pack.packType,
        description: pack.description,
        isOpened: pack.isOpened,
        isFavorite: pack.isFavorite,
        specialProbabilitySlots: pack.specialProbabilitySlots,
        isAdvancedRulesEnabled: pack.isAdvancedRulesEnabled,
        number: pack.number,
        num_1: pack.num_1, num_2: pack.num_2, str_1: pack.str_1, str_2: pack.str_2,
        packFieldSettings: pack.packFieldSettings, cardFieldSettings: pack.cardFieldSettings, tag:pack.tag, searchText:pack.searchText,
        
    };

    const cardFields: CardCompareFields[] = cards.map(c => ({
        name: c.name,
        number: c.number,
        imageUrl: c.imageUrl,
        imageColor: c.imageColor,
        rarity: c.rarity,
        text: c.text,
        subtext: c.subtext,
        isFavorite: c.isFavorite,
        num_1: c.num_1, num_2: c.num_2, num_3: c.num_3, num_4: c.num_4, num_5: c.num_5, num_6: c.num_6,
        str_1: c.str_1, str_2: c.str_2, str_3: c.str_3, str_4: c.str_4, str_5: c.str_5, str_6: c.str_6,
        tag:c.tag, searchText:c.searchText,
        
    }));

    cardFields.sort((a, b) => (a.number || 0) - (b.number || 0));

    return {
        pack: packFields,
        cards: cardFields,
    };
};
// ---------------------------------------------------------


export const usePackEditor = (packId: string) => {
    // ... (usePackEditor の初期定義、状態定義、useMemo は省略) ...
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
    const [newlyInitializedPackId, setNewlyInitializedPackId] = useState<string | null>(null); 
    // originalPackBundleDataは「初期ロード時のpack+cardsのスナップショット」
    const [originalPackBundleData, setOriginalPackBundleData] = useState<PackBundleCompareFields | null>(null);
    // 元のカードIDリスト（削除カード検出用）
    const [originalCardIds, setOriginalCardIds] = useState<Set<string>>(new Set());
    
    const [isEditorMode, setIsEditorMode] = useState(true); 
    const [isDeletionInProgress, setIsDeletionInProgress] = useState(false); 
    const [saveAlert, setSaveAlert] = useState<string | null>(null);
    const [cards, setCards] = useState<CardType[]>([]); 

    // UI/I/O 関連の状態
    const [isCardModalOpen, setIsCardModalOpen] = useState(false);
    const [editingCard, setEditingCard] = useState<CardType | null>(null);
    const [isRarityModalOpen, setIsRarityModalOpen] = useState(false);

    // --- Data Loaders ---
    
    const updateLocalBundleState = useCallback((pack: Pack, loadedCards: CardType[] | null) => {
        setPackData(pack);
        const finalCards = loadedCards || [];
        setCards(finalCards);
        // originalPackBundleDataは初回ロード時のみセット（nullのときのみ）
        setOriginalPackBundleData(prev => prev ?? extractCompareFieldsFromBundle(pack, finalCards));
        // 元のカードIDリストも初回ロード時のみセット
        setOriginalCardIds(prev => prev.size === 0 ? new Set(finalCards.map(c => c.cardId)) : prev);
        if (process.env.NODE_ENV !== 'production') {
            console.debug(`[usePackEditor:updateLocalBundleState] 💾 Original Pack Bundle Data Set.`);
        }
    }, []);

    const loadCardList = useCallback(async () => {
        if (!packId || !packData) {
            setCards([]);
            return;
        }

        const loadedCards = await fetchCardsByPackId(packId); 
        
        updateLocalBundleState(packData, loadedCards);

    }, [packId, packData, fetchCardsByPackId, updateLocalBundleState]);


    const handleCardListUpdateAfterIO = useCallback(async () => {
        await loadCardList();
    }, [loadCardList]);


    // I/O 関連の状態とハンドラを useDataFileIO に委譲
    const fileIO = useDataFileIO(packId, packData, handleCardListUpdateAfterIO);

    // --- 派生状態 ---
    const isNewPack = useMemo(() => {
        const isIdNotInStore = packId ? !packs.some(p => p.packId === packId) : false;
        
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
            if (packData && packData.packId === packId) {
                return;
            } else if (packData && packData.packId !== packId) {
                setPackData(null);
            }

            if (isNewPack && packId) {
                let newPackId = packId;
                if (!newlyInitializedPackId) {
                    const defaultData = createDefaultPack(packId);
                    newPackId = defaultData.packId;
                    setNewlyInitializedPackId(newPackId);
                } else {
                    newPackId = newlyInitializedPackId;
                }
                if (packId !== newPackId) {
                    navigate({ to: '/data/packs/$packId', params: { packId: newPackId }, replace: true });
                    return;
                }
                const initialPack: Pack = createDefaultPack(newPackId);
                // originalPackBundleDataを初期化
                setOriginalPackBundleData(extractCompareFieldsFromBundle(initialPack, []));
                setOriginalCardIds(new Set());
                updateLocalBundleState(initialPack, []);
                setIsEditorMode(true);
            } else if (isExistingPack && packId) {
                setNewlyInitializedPackId(null);
                const pack = await fetchPackByIdFromStore()(packId);
                if (pack) {
                    const loadedCards = await fetchCardsByPackId(pack.packId);
                    setOriginalPackBundleData(extractCompareFieldsFromBundle(pack, loadedCards));
                    setOriginalCardIds(new Set(loadedCards.map(c => c.cardId)));
                    updateLocalBundleState(pack, loadedCards);
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
                setNewlyInitializedPackId(null);
                setPackData(null);
                setOriginalPackBundleData(null);
                setOriginalCardIds(new Set());
                setCards([]);
            }
        };

        loadPackData();

    }, [packId, isExistingPack, isNewPack, navigate, isDeletionInProgress, packData, newlyInitializedPackId, updateLocalBundleState]); 

    useEffect(() => {
        if (packData) {
            if (process.env.NODE_ENV !== 'production') {
                console.debug(`[usePackEditor:useEffect] 🔄 Card count changed, refetching cards for Pack ID: ${packId} from Store Cache.`);
            }
            loadCardList();
        }
    }, [packId, cardCountInStore, packData, loadCardList]); 

// --------------------------------------------------------------------------------------------------

    // --- ハンドラ定義 (packDataのセッター) ---
    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        if (!packData) return;
        const { name, value } = e.target;
        setPackData(prev => prev ? ({ ...prev, [name]: name === 'price' ? Number(value) : value }) : null);
    }, [packData]);
    
    const handleSelectChange = useCallback((e: any) => { 
        if (!packData) return;
        const { name, value } = e.target;
        setPackData(prev => prev ? ({ ...prev, [name]: value }) : null);
    }, [packData]);
    
    // Packのカスタムフィールドの変更ハンドラ (CustomFieldManager からの (field, value) 呼び出しに対応)
    // CustomFieldManager は onFieldChange(fieldKey, value) の形式で呼ぶため、ここも同様のシグネチャに合わせる。
    const handlePackCustomFieldChange = useCallback((field: string, value: any) => {
        if (!packData) return;

        setPackData(prev => {
            if (!prev) return null;

            let finalValue: any = value;

            // 数値系カスタムフィールドは空文字を undefined に、数値文字列は Number に変換
            if (typeof field === 'string' && field.startsWith('num_')) {
                finalValue = value === '' ? undefined : Number(value);
            }

            return { ...prev, [field]: finalValue } as Pack;
        });

    }, [packData]);

    // CardModal が期待する形式のカスタムフィールド設定変更ハンドラを定義
    const handleCustomFieldSettingChange = useCallback((
        type: 'num' | 'str',
        index: number,
        field: keyof FieldSetting,
        value: any
    ) => {
        if (!packData) return;
        
        setPackData(prev => {
            if (!prev) return null;

            // フィールドキー ('num_1', 'str_2'など) を構築
            const fieldKey = `${type}_${index}` as keyof CardFieldSettings; 
            
            const currentFieldSettings = prev.cardFieldSettings; 
            
            // 特定のキーの FieldSetting を取得
            const targetFieldSetting: FieldSetting = currentFieldSettings[fieldKey]; 
            
            // 変更を適用した新しい FieldSetting オブジェクトを生成
            const newFieldSetting: FieldSetting = {
                ...targetFieldSetting, 
                [field]: value 
            };
            
            // 新しい設定を CardFieldSettings に反映
            const newCardFieldSettings: CardFieldSettings = {
                ...currentFieldSettings,
                [fieldKey]: newFieldSetting,
            };

            // 戻り値の型が Pack | null となる
            return {
                ...prev,
                cardFieldSettings: newCardFieldSettings,
            };
        });
        
    }, [packData]);


    const toggleEditorMode = useCallback(() => {
        setIsEditorMode(prev => !prev);
    }, []);

    // --- モーダル制御ハンドラ ---
    const handleCloseCardModal = () => { setEditingCard(null); setIsCardModalOpen(false); };
    const handleOpenRarityEditorModal = () => { setIsRarityModalOpen(true); };
    const handleCloseRarityEditorModal = () => { setIsRarityModalOpen(false); };

    // --- カード保存・削除ハンドラ ---
    const handleCardSave = useCallback((cardToSave: CardType) => {
        if (!packData) return;
        const isNew = !cards.some(c => c.cardId === cardToSave.cardId);

        const finalCard: CardType = isNew
            ? { 
                ...cardToSave, 
                packId: packData.packId, 
              }
            : cardToSave;

        setCards(prevCards => {
            if (isNew) {
                return [...prevCards, finalCard];
            } else {
                return prevCards.map(c => 
                    c.cardId === finalCard.cardId ? finalCard : c
                );
            }
        });
        handleCloseCardModal(); 
    }, [packData, cards]);

    const handleRemoveCard = useCallback(async (cardId: string) => { 
    try {
        // カードリストから該当カードを除外する
        setCards(prevCards => prevCards.filter(c => c.cardId !== cardId));
        
        // 成功メッセージを設定（保存時にDBから削除される旨を通知）
        setSaveAlert('✅ カードを編集画面から除外しました。');
        
        // モーダルを閉じる
        handleCloseCardModal(); 
    } catch (error) {
        // エラー処理
        console.error("[usePackEditor:handleRemoveCard] ❌ カードの削除中にエラーが発生しました:", error);
        setSaveAlert('❌ カードの削除に失敗しました。');
    }
}, []);

    const handleRarityEditorSave = useCallback((updatedPack: Pack) => {
        setPackData(updatedPack);
        handleCloseRarityEditorModal(); 
    }, []);
    
    // handleSave
    const handleSave = useCallback(async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!packData) return;

        try {
            if (process.env.NODE_ENV !== 'production') {
                console.debug(`[usePackEditor:handleSave] 💾 Saving pack and ${cards.length} cards for ID: ${packData.packId}`);
            }

            // 1. パック保存
            const savedPack = await savePack(packData);

            // 保存成功時にoriginalPackBundleDataを最新状態で更新
            setOriginalPackBundleData(extractCompareFieldsFromBundle(savedPack, cards));

            if (isNewPack) {
                setNewlyInitializedPackId(null);
                navigate({ to: '/data/packs/$packId', params: { packId: savedPack.packId }, replace: true });
            }

            // 2. カード保存
            if (cards.length > 0) {
                const cardsToSave = cards.map(c => ({
                    ...c,
                    packId: savedPack.packId,
                }));
                await bulkSaveCards(cardsToSave);
            }

            // 3. 削除されたカードをDBから削除
            const currentCardIds = new Set(cards.map(c => c.cardId));
            const deletedCardIds = Array.from(originalCardIds).filter(id => !currentCardIds.has(id));
            
            if (deletedCardIds.length > 0) {
                if (process.env.NODE_ENV !== 'production') {
                    console.debug(`[usePackEditor:handleSave] 🗑️ Deleting ${deletedCardIds.length} removed cards from DB`);
                }
                await bulkDeleteCards(deletedCardIds);
            }

            // 元のカードIDリストを更新
            setOriginalCardIds(currentCardIds);

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
            
            navigate({ to: '/data/packs', replace: true }); 
            
        } catch (error) {
            console.error("[usePackEditor:handleRemovePack] ❌ ERROR during move to trash:", error); 
            setSaveAlert('❌ パックのゴミ箱への移動に失敗しました。');
            setIsDeletionInProgress(false); 
        }
    }, [packData, navigate, movePackToTrash]); 
    
    // カード編集モーダルオープン
    const handleOpenCardEditorModal = useCallback((card: CardType | null) => { 
        if (!packData) return; 

        if (!card) {
            const defaultCard: CardType = createDefaultCard(packData.packId);
            
            const defaultRarity = (packData.rarityConfig && packData.rarityConfig.length > 0)
                ? packData.rarityConfig[0].rarityName
                : 'Common'; 

            setEditingCard({
                ...defaultCard,
                rarity: defaultRarity,
            });
            
        } else {
            setEditingCard(card);
        }
        setIsCardModalOpen(true); 
    }, [packData]); 

    const handleOpenCardViewModal = useCallback((card: CardType) => {
        if (!packData) return;

        // 閲覧モードとしてカードデータをセット
        setEditingCard(card);
        setIsCardModalOpen(true);
        
        // 検証用のログ
        if (process.env.NODE_ENV !== 'production') {
            const settingsToPass = packData.cardFieldSettings || {};
            const isReadOnly = !isEditorMode;
            console.log('*** CardModal Parent Debug (PackEditor/View Mode) ***');
            console.log('Is this ReadOnly? (Expected:', !isEditorMode, '):', isReadOnly);
            console.log('Card Field Settings to pass:', settingsToPass);
            console.log(`=> 設定キーの数: ${Object.keys(settingsToPass).length}, isVisible: true の設定数: ${Object.values(settingsToPass).filter(s => s.isVisible).length}`);
            console.log('*************************************************');
        }

    }, [packData, isEditorMode]);

    
    return {
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

        csvIO: fileIO.csvIO,
        jsonIOStatusMessage: fileIO.jsonIOStatusMessage,
        isJsonIOLoading: fileIO.isJsonIOLoading,

        isImportModalOpen: fileIO.isImportModalOpen,
        setIsImportModalOpen: fileIO.setIsImportModalOpen,
        fileToImport: fileIO.fileToImport,
        handleConfirmImport: fileIO.handleConfirmImport,
        
        isJsonImportModalOpen: fileIO.isJsonImportModalOpen,
        setIsJsonImportModalOpen: fileIO.setIsJsonImportModalOpen,
        jsonFileToImport: fileIO.jsonFileToImport,
        handleFileChange: fileIO.handleFileChange,
        handleConfirmJsonImport: fileIO.handleConfirmJsonImport,

        anchorEl: fileIO.anchorEl,
        handleMenuOpen: fileIO.handleMenuOpen,
        handleMenuClose: fileIO.handleMenuClose,
        handleImportClick: fileIO.handleImportClick,
        handleExportClick: fileIO.handleExportClick,
        
    };
};