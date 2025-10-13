import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { usePackStore } from '../../../stores/packStore'; 
import { useCardStore } from '../../../stores/cardStore'; 
import { useShallow } from 'zustand/react/shallow';
// ----------------------------------------------------------------------
import { getCardsByPackId } from '../../../services/pack-logic/packDataService';
import { createDefaultPackData, createDefaultCard } from '../../../utils/dataUtils'; 
import { cardDataService } from '../../../services/pack-logic/CardDataService'; 
import type { Pack } from '../../../models/pack';
import type { Card as CardType } from '../../../models/card';
//import { v4 as uuidv4 as uuidv4 } from 'uuid'; // createDefaultCardでID生成されるため、このimportは削除可能だが、一旦残す
import { useCardCsvIO } from '../hooks/useCardCsvIO'; 

// 🚨 修正1: DUMMY_PACK_ID の定義を削除
// const DUMMY_PACK_ID = 'dummy-pack-id-for-check';

/**
 * Pack オブジェクトから、編集/保存に関わるフィールドのみを抽出した型。
 * isDirty の比較に使用します。
 */
type PackCompareFields = Pick<Pack, 'name' | 'series' | 'releaseDate' | 'price' | 'cardsPerPack' | 'rarityConfig' | 'imageUrl'>;

// 💡 ヘルパー関数: 比較対象のフィールドを抽出する
const extractCompareFields = (pack: Pack): PackCompareFields => ({
    name: pack.name,
    series: pack.series,
    releaseDate: pack.releaseDate,
    price: pack.price,
    cardsPerPack: pack.cardsPerPack,
    rarityConfig: pack.rarityConfig, // レアリティ設定はオブジェクト比較になるため、JSON.stringifyが必要になる
    imageUrl: pack.imageUrl,
});


export const usePackEdit = (packId: string) => {
    const navigate = useNavigate();
    
    // Storeから必要な関数と状態を取得
    const { loadPackById, initializeNewPackEditing, savePack, packs, removePackFromStore, /*loadPacks,*/ /*deletePack*/ updatePackIsInStore, } = usePackStore(useShallow(state => ({
        loadPackById: state.loadPackById,
        initializeNewPackEditing: state.initializeNewPackEditing,
        savePack: state.savePack,
        packs: state.packs,
        // 💡 修正1: cleanPack から removePackFromStore に変更
        removePackFromStore: state.removePackFromStore, 
        loadPacks: state.loadPacks,
        deletePack: state.deletePack, 
        updatePackIsInStore: state.updatePackIsInStore, 
    })));
    
    // CardStoreから該当パックのカードの数を取得し、Storeの変更を監視する
    // 💡 修正2: removeCardFromStore と updateCardIsInStore を取得
    const { /*removeCardFromStore,*/ cardCountInStore, updateCardIsInStore } = useCardStore(useShallow(state => ({ // ✅ updateCardIsInStore を追加
        removeCardFromStore: state.removeCardFromStore,
        updateCardIsInStore: state.updateCardIsInStore, // ✅ 追加
        cardCountInStore: state.cards.filter(c => c.packId === packId).length
    })));

    // ----------------------------------------------------------------------
    
    const { 
        isLoading: isCsvIOLoading, 
        statusMessage: csvIOStatusMessage, 
        handleImportCsvFile,
    } = useCardCsvIO(packId); 
    
    // --- 状態管理 ---
    const [packData, setPackData] = useState<Pack | null>(null);
    const [originalPackData, setOriginalPackData] = useState<PackCompareFields | null>(null);
    const [originalCardIds, setOriginalCardIds] = useState<string[]>([]);
    const [originalCardData, setOriginalCardData] = useState<CardType[]>([]);
    
    const [isEditMode, setIsEditMode] = useState(false); 
    const [isDeletionInProgress, setIsDeletionInProgress] = useState(false); // ✅ デバッグ用フラグ
    const [saveAlert, setSaveAlert] = useState<string | null>(null);
    const [cards, setCards] = useState<CardType[]>([]); // 現在編集中のカードリスト

    // UI/I/O 関連の状態（省略）
    const [isCardModalOpen, setIsCardModalOpen] = useState(false);
    const [editingCard, setEditingCard] = useState<CardType | null>(null);
    const [isRarityModalOpen, setIsRarityModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [fileToImport, setFileToImport] = useState<File | null>(null);
    const [isJsonImportModalOpen, setIsJsonImportModalOpen] = useState(false);
    const [jsonFileToImport, setJsonFileToImport] = useState<File | null>(null);
    const [jsonIOStatusMessage, /*setJsonIOStatusMessage*/] = useState<string>('');
    const [isJsonIOLoading, /*setIsJsonIOLoading*/] = useState(false);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

    const csvIO = useMemo(() => ({ isLoading: isCsvIOLoading, statusMessage: csvIOStatusMessage }), [isCsvIOLoading, csvIOStatusMessage]);


    // --- 派生状態 ---
    // 🚨 修正2: packIdがpacksに存在するかどうかで判断する。
    const isNewPack = useMemo(() => {
        const isNew = packId ? !packs.some(p => p.packId === packId) : false;
        console.log(`[usePackEdit:isNewPack] Recalculated: packId=${packId}, isNewPack=${isNew}, packs.length=${packs.length}, isDeletionInProgress=${isDeletionInProgress}`); // ✅ ログ追加
        return isNew;
    }, [packId, packs, isDeletionInProgress]); 
    const isExistingPack = useMemo(() => !isNewPack && !!packId, [isNewPack, packId]); 
    const isDisabled = useMemo(() => !isEditMode, [isEditMode]); 
    const totalCardCount = cards.length; 
    
    // isDirty ロジック（変更なし）
    const isDirty = useMemo(() => {
        if (!packData || !originalPackData) return false;

        const currentFields = extractCompareFields(packData);
        const isPackDataModified = JSON.stringify(currentFields) !== JSON.stringify(originalPackData);

        const currentCardIds = cards.map(c => c.cardId).sort();
        const isCardListModified = JSON.stringify(currentCardIds) !== JSON.stringify(originalCardIds.sort());

        const isCardContentModified = JSON.stringify(cards) !== JSON.stringify(originalCardData);

        if (!packData.isInStore) {
            return isPackDataModified || cards.length > 0;
        }

        return isPackDataModified || isCardListModified || isCardContentModified;

    }, [packData, originalPackData, cards, originalCardIds, originalCardData]); 

// --------------------------------------------------------------------------------------------------

// --- データロードと初期化 ---
    useEffect(() => {
        console.log(`[usePackEdit:useEffect] 💥 START: packId=${packId}, isNewPack=${isNewPack}, isDeletionInProgress=${isDeletionInProgress}`); // ✅ ログ追加
        
        const loadPackData = async () => {
            // ✅ 修正3-1: 削除処理中は新規パック作成ロジックをスキップ
            if (isDeletionInProgress) { 
                console.warn(`[usePackEdit:loadPackData] ⚠️ Deletion in progress (ID: ${packId}), skipping load/init logic.`); // ✅ ログ追加
                return;
            }

            // 🚨 修正3: packIdがルーティングで渡ってきたが、packsに存在しない (isNewPack) かつpackIdが空ではない場合
            if (isNewPack && packId) {
                console.log(`[usePackEdit:loadPackData] 🟢 New Pack Init Logic START for ID: ${packId}`); // ✅ ログ追加
                
                // DBに isDraft:true で初期保存され、新しいIDが返却される
                const newPackId = await initializeNewPackEditing(); 
                
                // 新しいIDにリダイレクト。これによりuseEffectが再実行される
                if (packId !== newPackId) {
                    console.log(`[usePackEdit:loadPackData] 🔄 Redirecting to new ID: ${newPackId}`); // ✅ ログ追加
                    navigate({ to: '/data/packs/$packId', params: { packId: newPackId }, replace: true });
                    return; // navigate後に処理を中断
                }
                
                const defaultData = createDefaultPackData();
                // initializeNewPackEditing() がDB保存後のデータを返すため、
                // loadPackById(newPackId) を使う方がより確実だが、
                // 今回は initializeNewPackEditing がIDのみ生成すると仮定し、defaultDataで初期化する
                const initialPack: Pack = { ...defaultData, packId: newPackId, isInStore: false };

                setPackData(initialPack);
                setOriginalPackData(extractCompareFields(initialPack)); 
                setOriginalCardIds([]); 
                setOriginalCardData([]);
                setIsEditMode(true); 
                console.log(`[usePackEdit:loadPackData] New Pack Init Logic END (PackData Set).`); // ✅ ログ追加
                
            } else if (isExistingPack && packId) { 
                console.log(`[usePackEdit:loadPackData] 🟡 Existing Pack Loading START for ID: ${packId}`); // ✅ ログ追加
                const pack = await loadPackById(packId); 
                
                if (pack) {
                    setPackData(pack);
                    setOriginalPackData(extractCompareFields(pack)); 
                    setIsEditMode(!pack.isInStore); 
                    console.log(`[usePackEdit:loadPackData] Existing Pack Loaded: ${pack.name}`); // ✅ ログ追加
                } else {
                    // IDが無効な場合（DBにない、しかしルーティングではIDがある）
                    console.error(`[usePackEdit:loadPackData] ❌ Pack ID ${packId} not found in DB or Store.`); // ✅ ログ追加
                    setPackData(null); 
                    setOriginalPackData(null); 
                    setOriginalCardIds([]); 
                    setOriginalCardData([]);
                    setIsEditMode(false);
                }
            } else if (!packId) {
                // packIdが空の場合（通常は起こらないはずだが念のため）
                console.log(`[usePackEdit:loadPackData] ⚪ No Pack ID - clearing state.`); // ✅ ログ追加
                setPackData(null);
                setOriginalPackData(null);
                setCards([]);
            }
        };

        const loadCardsData = async () => { 
            // 🚨 修正3-1: isExistingPack のみでチェック
            if (isExistingPack && packId) {
                console.log(`[usePackEdit:loadCardsData] Loading Cards for ID: ${packId}`); // ✅ ログ追加
                const loadedCards = await getCardsByPackId(packId); 
                setCards(loadedCards);
                setOriginalCardIds(loadedCards.map(c => c.cardId)); 
                setOriginalCardData(JSON.parse(JSON.stringify(loadedCards))); 
                console.log(`[usePackEdit:loadCardsData] Cards Loaded: ${loadedCards.length} cards.`); // ✅ ログ追加
            } else {
                setCards([]);
                setOriginalCardIds([]);
                setOriginalCardData([]);
            }
        };

        loadPackData();
        loadCardsData();
        console.log(`[usePackEdit:useEffect] END: Dependencies processed.`); // ✅ ログ追加
    }, [packId, loadPackById, initializeNewPackEditing, isExistingPack, isNewPack, navigate, isDeletionInProgress]);

    // Card Store の変更を監視し、ローカルのカードリストをリフレッシュする (変更なし)
    useEffect(() => {
        if (isExistingPack && packId) {
            
            const refetchCards = async () => {
                const updatedCards = await getCardsByPackId(packId); 
                setCards(updatedCards);
            };
            refetchCards();
        }
    }, [packId, cardCountInStore, isExistingPack]); 

// --------------------------------------------------------------------------------------------------

    // その他ハンドラ (変更なし)
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

    const toggleEditMode = useCallback(() => {
        setIsEditMode(prev => !prev);
    }, []);

    // 💡 修正: handleCloseCardEditModal の定義を、使用する関数よりも前に移動

    const handleCloseCardEditModal = () => { setEditingCard(null); setIsCardModalOpen(false); };
    const handleOpenRarityEditModal = () => { setIsRarityModalOpen(true); };
    const handleCloseRarityEditModal = () => { setIsRarityModalOpen(false); };

const handleCardSave = useCallback((cardToSave: CardType) => {
        if (!packData) return;
        const isNew = !cards.some(c => c.cardId === cardToSave.cardId);

        // 💡 修正: 新規カードの場合は isInStore: false を初期設定する
        const finalCard: CardType = isNew
            ? { 
                ...cardToSave, 
                packId: packData.packId, 
                isInStore: false, // 👈 新規カードはストアから除外（ローカル/ドラフト）として開始
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
        handleCloseCardEditModal(); // ✅ 呼び出し
    }, [packData, cards, handleCloseCardEditModal]); // ✅ 依存配列に追加

    // 💡 修正3: handleRemoveCard (DB/Storeへの直接更新に専念)
    const handleRemoveCard = useCallback(async (cardId: string) => { // ✅ async に変更
        if (!window.confirm("このカードをパックから削除（ストアから除外）しますか？")) return;

        try {
            // Storeの updateCardIsInStore を呼び出すことで、DB更新とStore状態の変更を行う
            await updateCardIsInStore(cardId, false); 
            
            setSaveAlert('✅ カードをストアから除外しました。');
            handleCloseCardEditModal(); // ✅ 呼び出し
        } catch (error) {
            console.error("カードのストアからの除外中にエラーが発生しました:", error);
            setSaveAlert('❌ カードのストアからの除外に失敗しました。');
        }
    }, [updateCardIsInStore, handleCloseCardEditModal]); // ✅ 依存配列に追加

    const handleRarityEditSave = useCallback((updatedPack: Pack) => {
        setPackData(updatedPack);
        handleCloseRarityEditModal(); 
    }, []);
    
    // handleSave (変更なし)
    const handleSave = useCallback(async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!packData) return;

        try {
            const savedPack = await savePack(packData);
            
            if (isNewPack) {
                setPackData(savedPack); 
                setOriginalPackData(extractCompareFields(savedPack)); 
                
                navigate({ to: '/data/packs/$packId', params: { packId: savedPack.packId }, replace: true });
            }

            if (cards.length > 0) {
                // 💡 packIdを付与し、bulkPutCardsでupsert
                const cardsToSave = cards.map(c => ({ ...c, packId: savedPack.packId }));
                await cardDataService.bulkPutCards(cardsToSave); 
            }
            
            const updatedCards = await getCardsByPackId(savedPack.packId);
            setCards(updatedCards);
            
            setOriginalPackData(extractCompareFields(savedPack)); 
            setOriginalCardIds(updatedCards.map(c => c.cardId));
            setOriginalCardData(JSON.parse(JSON.stringify(updatedCards))); 

            setSaveAlert('✅ パック情報と収録カードが正常に保存されました。');
        } catch (error) {
            console.error("保存中にエラーが発生しました:", error);
            setSaveAlert('❌ 保存中にエラーが発生しました。');
        }
    }, [packData, cards, savePack, isNewPack, navigate]);

    // 💡 修正4: handleRemovePack (削除処理)
    const handleRemovePack = useCallback(async () => { // ✅ async に変更
        if (!packData) return;
        if (!window.confirm(`パック「${packData.name}」を本当に削除しますか？\n（この削除はストアからのみ行われ、24時間以内なら復元可能です）`)) return;

        const idToDelete = packData.packId;
        console.log(`[usePackEdit:handleRemovePack] 🚀 START Deletion for ID: ${idToDelete}. isDeletionInProgress=${isDeletionInProgress}`); // ✅ ログ追加

        try {
            // 削除処理の開始をマーク
            setIsDeletionInProgress(true); 
            console.log(`[usePackEdit:handleRemovePack] Deletion flag set to true.`); // ✅ ログ追加

            console.log(`[usePackEdit:handleRemovePack] Calling updatePackIsDraft (DB async, calls removePackFromStore)...`); // ✅ ログ追加
            await updatePackIsInStore(idToDelete, false); 
            console.log(`[usePackEdit:handleRemovePack] updatePackIsDraft AWAIT COMPLETED.`); // ✅ ログ追加

            // updatePackIsDraft の中で removePackFromStore が呼ばれるため、ここではコメントアウト
            // removePackFromStore(idToDelete); 
            // console.log(`[usePackEdit:handleRemovePack] removePackFromStore (Store sync) COMPLETED.`); // ✅ ログ追加 (今回はupdatePackIsDraft内)


            setSaveAlert('✅ パックが正常に削除されました。');
            setPackData(null); 
            
            console.log(`[usePackEdit:handleRemovePack] Navigating to /data/packs...`); // ✅ ログ追加
            navigate({ to: '/data/packs', replace: true }); 
            console.log(`[usePackEdit:handleRemovePack] Navigation initiated.`); // ✅ ログ追加
            
        } catch (error) {
            console.error("[usePackEdit:handleRemovePack] ❌ ERROR during deletion:", error); 
            setSaveAlert('❌ パックの削除に失敗しました。');
        } finally {
            // 削除処理の終了
            setIsDeletionInProgress(false); 
            console.log(`[usePackEdit:handleRemovePack] 🏁 FINALLY: Deletion flag set to false.`); // ✅ ログ追加
            //loadPacks();
        }
    }, [packData, navigate, removePackFromStore, updatePackIsInStore, isDeletionInProgress, /*loadPacks*/]); // 💡 isDeletionInProgressも依存配列に追加
    

    // CSV/JSON I/O のメニューハンドラ (変更なし)
    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => { setAnchorEl(event.currentTarget); };
    const handleMenuClose = () => { setAnchorEl(null); };

    const handleImportClick = (type: 'csv' | 'json') => {
        handleMenuClose();
        if (type === 'csv') setIsImportModalOpen(true);
        if (type === 'json') setIsJsonImportModalOpen(true);
    };

    const handleExportClick = (type: 'csv' | 'json') => {
        handleMenuClose();
        if (!packData) {
            console.error('Pack data not loaded for export.');
            return;
        }
        console.log(`Exporting pack ${packData.name} as ${type}...`);
    };
    
    // その他モーダルハンドラ
    const handleOpenCardEditModal = useCallback((card: CardType | null) => { 
        if (!packData) return; 

        if (!card) {
            // 🚨 修正5: dataUtils の createDefaultCard を使用
            const defaultCard: CardType = createDefaultCard(packData.packId);
            
            // レアリティのデフォルト値をPackの設定に合わせて上書き
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

    // 以前の handleCloseCardEditModal の定義は上に移動済み

    // const handleCloseCardEditModal = () => { setEditingCard(null); setIsCardModalOpen(false); }; // ❌ 元々の位置
    // const handleOpenRarityEditModal = () => { setIsRarityModalOpen(true); };
    // const handleCloseRarityEditModal = () => { setIsRarityModalOpen(false); };

    const handleConfirmImport = useCallback(async () => {
        if (!fileToImport || isCsvIOLoading) {
            console.warn('No file selected or already loading.');
            return;
        }
        
        handleImportCsvFile(fileToImport); 
        
        setIsImportModalOpen(false); 
        setFileToImport(null);
        
    }, [fileToImport, isCsvIOLoading, handleImportCsvFile]);
    
    return {
        packData: packData as Pack, 
        isNewPack,
        isExistingPack, 
        isEditMode,
        isDirty, 
        toggleEditMode,
        csvIO, 
        isDisabled, 
        saveAlert, 
        setSaveAlert,
        handleInputChange,
        handleSelectChange,
        handleSave, 
        // 💡 修正6: handleRemovePack に変更
        handleRemovePack, 
        totalCardCount, 
        
        cards, 
        handleCardSave, 
        handleRemoveCard, 
        
        // カード編集モーダル
        isCardModalOpen,
        editingCard,
        handleOpenCardEditModal,
        handleCloseCardEditModal, // ✅ 修正後の位置
        // レアリティ編集モーダル
        isRarityModalOpen,
        handleOpenRarityEditModal,
        handleCloseRarityEditModal, // ✅ 修正後の位置
        handleRarityEditSave, 
        // I/O メニュー
        anchorEl,
        handleMenuOpen,
        handleMenuClose,
        handleImportClick,
        handleExportClick,
        // CSV I/O
        isImportModalOpen,
        setIsImportModalOpen,
        fileToImport,
        handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => { setFileToImport(e.target.files ? e.target.files[0] : null); },
        handleConfirmImport, 
        // JSON I/O
        isJsonImportModalOpen,
        setIsJsonImportModalOpen,
        jsonFileToImport,
        jsonIOStatusMessage,
        isJsonIOLoading,
        handleJsonFileChange: (e: React.ChangeEvent<HTMLInputElement>) => { setJsonFileToImport(e.target.files ? e.target.files[0] : null); },
        handleConfirmJsonImport: () => { console.log('JSON Import confirmed'); },

        // 💡 修正7: cleanPack を removePackFromStore に変更
        removePackFromStore, 

    };
};