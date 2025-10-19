/**
 * src/features/packs/hooks/usePackEditor.ts
 *
 * 特定のPackの編集画面における状態管理、データロード、保存、およびI/O操作を一元的に処理するカスタムフック。
 * Packとそれに紐づくCardデータの取得・ローカルな変更追跡（isDirty）、新規Packの初期化、
 * およびStore/Service層へのデータ永続化（保存/削除）のトリガーを提供します。
 *
 * 責務: UIの状態管理（モーダル、アラート）、ビジネスロジックの調整（isNewPack, isDirty）、
 * およびStore/Service層への委譲。DBアクセスや複雑なデータ操作は行いません。
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { usePackStore } from '../../../stores/packStore'; 
import { useCardStore } from '../../../stores/cardStore'; 
import { useShallow } from 'zustand/react/shallow';
import { createDefaultPack, createDefaultCard } from '../../../utils/dataUtils'; 
import type { Pack } from '../../../models/pack'; // RarityConfig等も比較対象となるためインポート
import type { Card as CardType } from '../../../models/card';
import { useDataFileIO } from '../../../hooks/useDataFileIO'; 

// 💡 修正: 必要なカスタムフィールド関連の型と初期値をすべてインポート
import type { CustomFieldCategory, CustomFieldIndex, CustomFieldType, FieldSetting } from '../../../models/custom-field';
import { initialCustomFieldSettings } from '../../../models/custom-field'; 


// Storeから Pack取得アクションを直接取得するヘルパー
const fetchPackByIdFromStore = () => usePackStore.getState().fetchPackById;

// ----------------------------------------------------------------------
// 💡 PackBundle に基づく比較用フィールド定義 (変更なし)
// ----------------------------------------------------------------------

/**
 * Pack および Card の新しいカスタムフィールド30個を抽出
 */
type CustomFields30 = Pick<Pack, 
    'custom_1_bool' | 'custom_2_bool' | 'custom_3_bool' | 'custom_4_bool' | 'custom_5_bool' | 'custom_6_bool' | 'custom_7_bool' | 'custom_8_bool' | 'custom_9_bool' | 'custom_10_bool' |
    'custom_1_num' | 'custom_2_num' | 'custom_3_num' | 'custom_4_num' | 'custom_5_num' | 'custom_6_num' | 'custom_7_num' | 'custom_8_num' | 'custom_9_num' | 'custom_10_num' |
    'custom_1_str' | 'custom_2_str' | 'custom_3_str' | 'custom_4_str' | 'custom_5_str' | 'custom_6_str' | 'custom_7_str' | 'custom_8_str' | 'custom_9_str' | 'custom_10_str'
>;

/**
 * Card オブジェクトから、編集/保存に関わるフィールドのみを抽出した型。
 * isDirty の比較に使用します。（自動更新されるフィールド、ID、packId を除外）
 */
type CardCompareFields = Pick<CardType, 'name' | 'number' | 'rarity' | 'imageUrl' | 'imageColor'> & CustomFields30;


/**
 * Pack オブジェクトから、編集/保存に関わるフィールドのみを抽出した型。
 * isDirty の比較に使用します。（自動更新されるフィールド、ID、totalCards、createdAt/updatedAt を除外）
 */
type PackCompareFields = Pick<Pack, 
    'name' | 'series' | 'releaseDate' | 'price' | 'cardsPerPack' | 'rarityConfig' | 'advancedRarityConfig' | 
    'imageUrl' | 'imageColor' | 'cardBackImageUrl' | 'packType' | 'description' | 'isOpened' | 'isFavorite' | 
    'specialProbabilitySlots' | 'isAdvancedRulesEnabled' | 'number'
> & CustomFields30;


/**
 * PackBundle から、編集/保存に関わるフィールドのみを抽出した型。
 * isDirty の比較に使用します。
 */
type PackBundleCompareFields = {
    // 🚨 修正: Packと比較するフィールドにカスタムフィールドを追加
    pack: PackCompareFields;
    // Cardと比較するフィールドの配列
    cards: CardCompareFields[];
};


/**
 * PackとCardのデータから、PackBundleCompareFieldsを生成するヘルパー関数。
 * @param pack - 現在のPackデータ
 * @param cards - 現在のCardリスト
 * @returns 比較用の PackBundle データ
 */
const extractCompareFieldsFromBundle = (pack: Pack, cards: CardType[]): PackBundleCompareFields => {
    // 1. Packの比較フィールドを抽出
    // 🚨 修正: Pack の全比較対象フィールドを網羅
    const packFields: PackCompareFields = {
        name: pack.name,
        series: pack.series,
        releaseDate: pack.releaseDate,
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
        // 🚨 修正: Packのカスタムフィールド30個を追加
        custom_1_bool: pack.custom_1_bool, custom_2_bool: pack.custom_2_bool, custom_3_bool: pack.custom_3_bool, custom_4_bool: pack.custom_4_bool, custom_5_bool: pack.custom_5_bool,
        custom_6_bool: pack.custom_6_bool, custom_7_bool: pack.custom_7_bool, custom_8_bool: pack.custom_8_bool, custom_9_bool: pack.custom_9_bool, custom_10_bool: pack.custom_10_bool,
        custom_1_num: pack.custom_1_num, custom_2_num: pack.custom_2_num, custom_3_num: pack.custom_3_num, custom_4_num: pack.custom_4_num, custom_5_num: pack.custom_5_num,
        custom_6_num: pack.custom_6_num, custom_7_num: pack.custom_7_num, custom_8_num: pack.custom_8_num, custom_9_num: pack.custom_9_num, custom_10_num: pack.custom_10_num,
        custom_1_str: pack.custom_1_str, custom_2_str: pack.custom_2_str, custom_3_str: pack.custom_3_str, custom_4_str: pack.custom_4_str, custom_5_str: pack.custom_5_str,
        custom_6_str: pack.custom_6_str, custom_7_str: pack.custom_7_str, custom_8_str: pack.custom_8_str, custom_9_str: pack.custom_9_str, custom_10_str: pack.custom_10_str,
    };

    // 2. Cardから比較フィールドを抽出（カスタムフィールド30個を含む）
    const cardFields: CardCompareFields[] = cards.map(c => ({
        name: c.name,
        number: c.number,
        rarity: c.rarity,
        imageUrl: c.imageUrl,
        imageColor: c.imageColor,
        // Cardのカスタムフィールド30個
        custom_1_bool: c.custom_1_bool, custom_2_bool: c.custom_2_bool, custom_3_bool: c.custom_3_bool, custom_4_bool: c.custom_4_bool, custom_5_bool: c.custom_5_bool,
        custom_6_bool: c.custom_6_bool, custom_7_bool: c.custom_7_bool, custom_8_bool: c.custom_8_bool, custom_9_bool: c.custom_9_bool, custom_10_bool: c.custom_10_bool,
        custom_1_num: c.custom_1_num, custom_2_num: c.custom_2_num, custom_3_num: c.custom_3_num, custom_4_num: c.custom_4_num, custom_5_num: c.custom_5_num,
        custom_6_num: c.custom_6_num, custom_7_num: c.custom_7_num, custom_8_num: c.custom_8_num, custom_9_num: c.custom_9_num, custom_10_num: c.custom_10_num,
        custom_1_str: c.custom_1_str, custom_2_str: c.custom_2_str, custom_3_str: c.custom_3_str, custom_4_str: c.custom_4_str, custom_5_str: c.custom_5_str,
        custom_6_str: c.custom_6_str, custom_7_str: c.custom_7_str, custom_8_str: c.custom_8_str, custom_9_str: c.custom_9_str, custom_10_str: c.custom_10_str,
    }));

    // Cardの順番によるダーティを避けるため、一貫した並び順でソート (number を使用)
    cardFields.sort((a, b) => (a.number || 0) - (b.number || 0));

    return {
        pack: packFields,
        cards: cardFields,
    };
};
// ---------------------------------------------------------


export const usePackEditor = (packId: string) => {
    const navigate = useNavigate();
    
    // Storeから必要な関数と状態を取得
    const { savePack, packs, movePackToTrash } = usePackStore(useShallow(state => ({
        savePack: state.savePack,
        packs: state.packs,
        movePackToTrash: state.movePackToTrash,
    })));
    
    // CardStoreから必要なアクションと状態を取得
    const { cardCountInStore, bulkSaveCards } = useCardStore(useShallow(state => ({
        cardCountInStore: state.cards.filter(c => c.packId === packId).length,
        bulkSaveCards: state.bulkSaveCards,
    })));

    // 💡 Storeの fetchCardsByPackId を個別に取得
    const fetchCardsByPackId = useCardStore(state => state.fetchCardsByPackId);

    // ----------------------------------------------------------------------
    
    // --- 状態管理 ---
    const [packData, setPackData] = useState<Pack | null>(null);
    const [newlyInitializedPackId, setNewlyInitializedPackId] = useState<string | null>(null); 
    const [originalPackBundleData, setOriginalPackBundleData] = useState<PackBundleCompareFields | null>(null);
    
    const [isEditorMode, setIsEditorMode] = useState(true); 
    const [isDeletionInProgress, setIsDeletionInProgress] = useState(false); 
    const [saveAlert, setSaveAlert] = useState<string | null>(null);
    const [cards, setCards] = useState<CardType[]>([]); // 現在編集中のカードリスト

    // UI/I/O 関連の状態
    const [isCardModalOpen, setIsCardModalOpen] = useState(false);
    const [editingCard, setEditingCard] = useState<CardType | null>(null);
    const [isRarityModalOpen, setIsRarityModalOpen] = useState(false);
    
    // 💡 追加: カスタムフィールド設定の状態
    const [customFieldSettings, setCustomFieldSettings] = useState<CustomFieldCategory>(
        initialCustomFieldSettings // 💡 共通の初期設定で初期化
    );

    // --- Data Loaders ---
    
    /**
     * PackとCardをロードし、ローカルステートとオリジナルデータを更新する
     * @param pack - ロードされたPackデータ (loadPackData から渡される)
     */
    const updateLocalBundleState = useCallback((pack: Pack, loadedCards: CardType[] | null) => {
             // Packデータを設定
        setPackData(pack);
        
        // カードリストを設定
        const finalCards = loadedCards || [];
        setCards(finalCards); 

        // オリジナルデータを PackBundleCompareFields として保存
        const originalBundleData = extractCompareFieldsFromBundle(pack, finalCards);
        setOriginalPackBundleData(originalBundleData);

        if (process.env.NODE_ENV !== 'production') {
            console.debug(`[usePackEditor:updateLocalBundleState] 💾 Original Pack Bundle Data Set.`);
        }
    }, []);

    const loadCardList = useCallback(async () => {
        if (!packId || !packData) {
            setCards([]);
            return;
        }

        // Storeのキャッシュからカードを取得
        const loadedCards = await fetchCardsByPackId(packId); 
        
        // PackとCardの両方を更新（ダーティチェックのリセットも含む）
        updateLocalBundleState(packData, loadedCards);

    }, [packId, packData, fetchCardsByPackId, updateLocalBundleState]);


    // 【追加】useDataFileIO に渡す、インポート完了後のカードリスト更新コールバック
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

        // 現在の Pack と Card から PackBundleCompareFields を生成
        const currentBundle = extractCompareFieldsFromBundle(packData, cards);

        // 新規パックの場合は、Packデータがデフォルトから変更されたか、カードが1枚でも追加されていれば dirty
        if (isNewPack) {
             const defaultPack = createDefaultPack(packData.packId);
             // 💡 修正: Packにもカスタムフィールドが追加されたため、デフォルト Pack も比較に含める。
             const defaultBundle = extractCompareFieldsFromBundle(defaultPack, []);
             
             // Packデータ（名前など）がデフォルトから変更されたか
             const isPackDataModifiedFromDefault = JSON.stringify(currentBundle.pack) !== JSON.stringify(defaultBundle.pack);
             
             return isPackDataModifiedFromDefault || cards.length > 0;
        }

        // 既存パックの場合は、オリジナルと比較
        return JSON.stringify(currentBundle) !== JSON.stringify(originalPackBundleData);

    }, [packData, cards, originalPackBundleData, isNewPack]); 

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
                    const defaultData = createDefaultPack();
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

                // updateLocalBundleState を使用して Pack/Card/Original State を一括更新
                updateLocalBundleState(initialPack, []);
                setIsEditorMode(true); 
            } else if (isExistingPack && packId) { 
                setNewlyInitializedPackId(null); 
                const pack = await fetchPackByIdFromStore()(packId); 
                
                if (pack) {
                    // Cardをロード
                    const loadedCards = await fetchCardsByPackId(pack.packId); 
                    
                    // updateLocalBundleState を使用して Pack/Card/Original State を一括更新
                    updateLocalBundleState(pack, loadedCards);
                    setIsEditorMode(true); 
                } else {
                    console.error(`[usePackEditor:loadPackData] ❌ Pack ID ${packId} not found in DB or Store.`); 
                    setPackData(null); 
                    setOriginalPackBundleData(null); 
                    setCards([]);
                    setIsEditorMode(false);
                }
            } else if (!packId) {
                setNewlyInitializedPackId(null); 
                setPackData(null);
                setOriginalPackBundleData(null); 
                setCards([]);
            }
        };

        loadPackData();

    }, [packId, isExistingPack, isNewPack, navigate, isDeletionInProgress, packData, newlyInitializedPackId, updateLocalBundleState]); 

    // Card Store の変更を監視し、ローカルのカードリストをリフレッシュする 
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
    
    // 💡 Packのカスタムフィールドの変更ハンドラ 
    const handlePackCustomFieldChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        if (!packData) return;
        const { name, value } = e.target;
        
        setPackData(prev => {
            if (!prev) return null;

            let finalValue: any = value;
            
            if (name.endsWith('_bool')) {
                // boolean のカスタムフィールドの場合、チェックボックス等からの値を考慮
                finalValue = (e.target as HTMLInputElement).type === 'checkbox' ? (e.target as HTMLInputElement).checked : (value === 'true');
            } else if (name.endsWith('_num')) {
                // number のカスタムフィールドの場合
                finalValue = value === '' ? undefined : Number(value);
            }
            
            return { ...prev, [name]: finalValue };
        });

    }, [packData]);

    // 💡 追加: カスタムフィールド設定 (CustomFieldCategory) の変更ハンドラ
    const handleCustomFieldSettingChange = useCallback((
        type: CustomFieldType, 
        index: CustomFieldIndex, 
        field: keyof FieldSetting, 
        value: any
    ) => {
        setCustomFieldSettings(prev => {
            const newSettings = { ...prev };
            const category = newSettings[type];
            
            if (category) {
                // 既存の FieldSetting をコピーし、指定されたフィールドを更新
                category[index] = { ...category[index], [field]: value };
            }
            return newSettings;
        });
    }, []);

    const toggleEditorMode = useCallback(() => {
        setIsEditorMode(prev => !prev);
    }, []);

    const handleCloseCardEditorModal = () => { setEditingCard(null); setIsCardModalOpen(false); };
    const handleOpenRarityEditorModal = () => { setIsRarityModalOpen(true); };
    const handleCloseRarityEditorModal = () => { setIsRarityModalOpen(false); };

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
        handleCloseCardEditorModal(); 
    }, [packData, cards]);

    const handleRemoveCard = useCallback(async (cardId: string) => { 
        if (!window.confirm("このカードをゴミ箱へ移動しますか？\n（編集画面から削除されます）")) return;

        try {
             setCards(prevCards => prevCards.filter(c => c.cardId !== cardId));
             setSaveAlert('✅ カードを編集画面から除外しました。保存時にDBから削除されます。');
             handleCloseCardEditorModal(); 
        } catch (error) {
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

            // 1. Pack Store のセーブアクションを呼び出す (Packをアンパック)
            const savedPack = await savePack(packData);
            
            if (isNewPack) {
                setNewlyInitializedPackId(null); 
                navigate({ to: '/data/packs/$packId', params: { packId: savedPack.packId }, replace: true });
            }

            // 2. Card Store のセーブアクションを呼び出す (Cardをアンパック)
            if (cards.length > 0) {
                const cardsToSave = cards.map(c => ({ 
                    ...c, 
                    packId: savedPack.packId, // 新規パックの場合、確定したIDを割り当てる
                }));
                
                await bulkSaveCards(cardsToSave); 
            }
            
            // --- ★ Pack/Card のオリジナル状態のリセットを共通化（isDirtyをfalseにするため） ★ ---
            // Storeに同期された最新のカードリストを取得し、Packと共にオリジナルBundle状態を更新
            await loadCardList(); 

            setSaveAlert('✅ パック情報と収録カードが正常に保存されました。');
        } catch (error) {
            console.error("[usePackEditor:handleSave] ❌ 保存中にエラーが発生しました:", error);
            setSaveAlert('❌ 保存中にエラーが発生しました。');
        }
    }, [packData, cards, savePack, isNewPack, navigate, bulkSaveCards, loadCardList]); 

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
        // 💡 Packカスタムフィールドの変更ハンドラ
        handlePackCustomFieldChange, 
        handleSave, 
        handleRemovePack, 
        totalCardCount,

        // 💡 追加: カスタムフィールド設定 (CardModal等に渡す)
        customFieldSettings, 
        // 💡 追加: カスタムフィールド設定の変更ハンドラ (PackEditorから直接変更する場合)
        handleCustomFieldSettingChange, 

        
        cards, 
        handleCardSave, 
        handleRemoveCard, 

        // カード編集モーダル
        isCardModalOpen,
        editingCard,
        handleOpenCardEditorModal,
        handleCloseCardEditorModal, 
        // レアリティ編集モーダル
        isRarityModalOpen,
        handleOpenRarityEditorModal,
        handleCloseRarityEditorModal, 
        handleRarityEditorSave, 

        // useDataFileIO のすべてのプロパティを展開して追加
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