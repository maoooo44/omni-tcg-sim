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
// ----------------------------------------------------------------------
//import { cardSearchService } from '../../../services/cards/cardSearchService'; // 保存後のDBリロード用として残す
// 🚨 cardDataService の直接使用は Store に移譲するため非推奨だが、一旦残す
// import { cardDataService } from '../../../services/cards/cardDataService'; 
import { createDefaultPackData, createDefaultCard } from '../../../utils/dataUtils'; 
import type { Pack } from '../../../models/pack';
import type { Card as CardType } from '../../../models/card';
import { useDataFileIO } from '../../../hooks/useDataFileIO'; 

/**
 * Pack オブジェクトから、編集/保存に関わるフィールドのみを抽出した型。
 * isDirty の比較に使用します。
 */
type PackCompareFields = Pick<Pack, 'name' | 'series' | 'releaseDate' | 'price' | 'cardsPerPack' | 'rarityConfig' | 'imageUrl'>;

// ヘルパー関数: 比較対象のフィールドを抽出する
const extractCompareFields = (pack: Pack): PackCompareFields => ({
    name: pack.name,
    series: pack.series,
    releaseDate: pack.releaseDate,
    price: pack.price,
    cardsPerPack: pack.cardsPerPack,
    rarityConfig: pack.rarityConfig,
    imageUrl: pack.imageUrl,
});

// --- 💡 修正: Card のダーティチェック用フィールド定義を更新 ---
/**
 * Card オブジェクトから、編集/保存に関わるフィールドのみを抽出した型。
 * isDirty の比較に使用します。（自動更新されるフィールドを除外）
 */
type CardCompareFields = Pick<CardType, 'name' | 'number' | 'rarity' | 'imageUrl' | 'imageColor' | 'userCustom'>; // 'userCustom' を含む

// ヘルパー関数: Cardの比較対象のフィールドを抽出する
const extractCardCompareFields = (card: CardType): CardCompareFields => ({
    name: card.name,
    number: card.number,
    rarity: card.rarity,
    imageUrl: card.imageUrl,
    imageColor: card.imageColor,
    userCustom: card.userCustom, // オブジェクトなので、後の JSON.stringify で比較されます
});
// ---------------------------------------------------------


export const usePackEditor = (packId: string) => {
    const navigate = useNavigate();
    
    // Storeから必要な関数と状態を取得
    // 💡 変更点: deletePack を usePackStore から取得
    const { fetchEditingPack, initializeNewPackEditing, savePack, packs, updatePackIsInStore, removePackFromStore, deletePack} = usePackStore(useShallow(state => ({
        fetchEditingPack: state.loadEditingPack,
        initializeNewPackEditing: state.initializeNewEditingPack,
        savePack: state.savePack,
        packs: state.packs,
        updatePackIsInStore: state.updatePackIsInStore, 
        removePackFromStore: state.removePackFromStore,
        deletePack: state.deletePack, // 👈 物理削除用に追加
    })));
    
    // CardStoreから該当パックのカードの数を取得し、Storeの変更を監視する
    // 💡 変更点: deleteCard を useCardStore から取得
    const { cardCountInStore, updateCardIsInStore, getCardsByPackId, bulkPutCards, deleteCard } = useCardStore(useShallow(state => ({ // 👈 bulkPutCards, deleteCard を追加
        updateCardIsInStore: state.updateCardIsInStore, 
        cardCountInStore: state.cards.filter(c => c.packId === packId).length,
        getCardsByPackId: state.getCardsByPackId, // 👈 StoreのgetCardsByPackIdを取得
        bulkPutCards: state.bulkPutCards, // 👈 追加
        deleteCard: state.deleteCard, // ★ 追加: カードの物理削除用
    })));

    // ----------------------------------------------------------------------
    
    // --- 状態管理 ---
    const [packData, setPackData] = useState<Pack | null>(null);
    const [newlyInitializedPackId, setNewlyInitializedPackId] = useState<string | null>(null); // 👈 無限ループ回避用
    const [originalPackData, setOriginalPackData] = useState<PackCompareFields | null>(null);
    const [originalCardIds, setOriginalCardIds] = useState<string[]>([]);
    const [originalCardData, setOriginalCardData] = useState<CardType[]>([]); // ダーティチェック用に全カードデータを保持
    
    const [isEditorMode, setIsEditorMode] = useState(false); 
    const [isDeletionInProgress, setIsDeletionInProgress] = useState(false); 
    const [saveAlert, setSaveAlert] = useState<string | null>(null);
    const [cards, setCards] = useState<CardType[]>([]); // 現在編集中のカードリスト

    // UI/I/O 関連の状態（コア編集用のみ残す）
    const [isCardModalOpen, setIsCardModalOpen] = useState(false);
    const [editingCard, setEditingCard] = useState<CardType | null>(null);
    const [isRarityModalOpen, setIsRarityModalOpen] = useState(false);
    
    // --- Card Data Loaders ---
    /**
     * 現在のpackIdに基づいてカードリストを再取得し、状態を更新する
     * CSV/JSONインポート完了後、ローカル状態をリフレッシュするために使用される
     */
    const loadCardList = useCallback(async () => { // 👈 loadCardList はそのまま残す
        if (!packId || !packData) {
            setCards([]);
            setOriginalCardIds([]);
            setOriginalCardData([]);
            return;
        }

        // Storeのキャッシュから同期的にカードを取得する
        const loadedCards = getCardsByPackId(packId); 
        setCards(loadedCards);
        setOriginalCardIds(loadedCards.map(c => c.cardId)); 
        // Deep Copyでオリジナルデータを更新
        setOriginalCardData(JSON.parse(JSON.stringify(loadedCards))); 
    }, [packId, packData, getCardsByPackId]);


    // 【追加】useDataFileIO に渡す、インポート完了後のカードリスト更新コールバック
    const handleCardListUpdateAfterIO = useCallback(async () => {
        // CSVインポート/JSONインポートなどでStoreが更新された後、ローカルのカードリストを再ロードする
        await loadCardList();
    }, [loadCardList]);


    // I/O 関連の状態とハンドラを useDataFileIO に委譲
    // 修正: 第3引数として handleCardListUpdateAfterIO を渡す
    const fileIO = useDataFileIO(packId, packData, handleCardListUpdateAfterIO);

    // --- 派生状態 ---
    const isNewPack = useMemo(() => {
        // StoreのpacksリストにIDが存在しない場合、新規パックと見なす
        const isIdNotInStore = packId ? !packs.some(p => p.packId === packId) : false;
        
        // 🚨 修正: packDataに既にIDがセットされており、かつそのIDが現在のURLのIDと一致するなら、
        // ローカルでの初期化は完了しているため、新規パックではないと判定する。
        if (packData && packData.packId === packId) {
            return false;
        }

        // 💡 削除直後に isNewPack が true になることを許容
        return isIdNotInStore;
    }, [packId, packs, packData]); // 👈 isDeletionInProgress を依存配列から削除
    
    const isExistingPack = useMemo(() => !isNewPack && !!packId, [isNewPack, packId]); 
    
    const isDisabled = useMemo(() => !isEditorMode, [isEditorMode]); 
    const totalCardCount = cards.length; 
    
    // isDirty ロジック（カードの比較ロジックを修正）
    const isDirty = useMemo(() => {
        if (!packData || !originalPackData) return false;

        const currentFields = extractCompareFields(packData);
        // Packデータの比較
        const isPackDataModified = JSON.stringify(currentFields) !== JSON.stringify(originalPackData);

        // Cardリスト（構成）の比較
        const currentCardIds = cards.map(c => c.cardId).sort();
        const originalCardIdsSorted = originalCardIds.sort(); // ソートしてから比較
        const isCardListModified = JSON.stringify(currentCardIds) !== JSON.stringify(originalCardIdsSorted);

        // Cardコンテンツ（個々のデータ）の比較
        // 💡 修正: タイムスタンプなどの変化を無視するため、編集可能なフィールドのみを比較する
        const currentCardContents = cards.map(extractCardCompareFields);
        const originalCardContents = originalCardData.map(extractCardCompareFields);
        const isCardContentModified = JSON.stringify(currentCardContents) !== JSON.stringify(originalCardContents);

        // 新規パックの場合は、パックデータが変更されたか、カードが1枚でも追加されていれば dirty
        if (!packData.isInStore) {
            return isPackDataModified || cards.length > 0;
        }

        return isPackDataModified || isCardListModified || isCardContentModified;

    }, [packData, originalPackData, cards, originalCardIds, originalCardData]); 

// --------------------------------------------------------------------------------------------------

// --- データロードと初期化 ---
    useEffect(() => {
        const loadPackData = async () => {
            if (isDeletionInProgress) { 
                // 💡 削除処理が進行中の場合は、新規作成やロードをスキップ
                // navigateが完了し、コンポーネントがアンマウントされるのを待つ
                return;
            }
            if (process.env.NODE_ENV !== 'production') {
                console.debug(`[usePackEditor:loadPackData] ⚙️ Attempting to load pack data for ID: ${packId}`);
            }

            // 💡 ガード 1: packDataがセット済みで、かつpackIdが現在のpackDataのIDと一致すればスキップ
            if (packData && packData.packId === packId) {
                return;
            } else if (packData && packData.packId !== packId) {
                // IDが変わった場合は、packData を null にして再ロードを許可する
                setPackData(null); 
            }

            if (isNewPack && packId) {
                let newPackId = packId;

                // 💡 ガード 2: newlyInitializedPackId があれば Store 初期化 (UUID生成) は行わない
                // Store初期化は最初の一度だけ行い、IDをローカルに保持する
                if (!newlyInitializedPackId) {
                    newPackId = await initializeNewPackEditing(); 
                } else {
                    newPackId = newlyInitializedPackId;
                }
                
                if (packId !== newPackId) {
                    // 新しいUUIDが生成された場合、URLを置き換えて再レンダリングをトリガー
                    navigate({ to: '/data/packs/$packId', params: { packId: newPackId }, replace: true });
                    setNewlyInitializedPackId(newPackId); // 👈 生成したIDをStateに保持
                    return; // URL遷移したら、この useEffect の実行を終了
                }
                
                // URL遷移後の再実行または最初から有効なpackIdで新規作成画面に来た場合
                setNewlyInitializedPackId(newPackId); // 👈 確定したIDをStateに保持

                // navigateが実行されず、packIdが確定した後の処理
                const defaultData = createDefaultPackData();
                const initialPack: Pack = { ...defaultData, packId: newPackId, isInStore: false };

                setPackData(initialPack); // 👈 ここで packData が設定されることで、isNewPackがfalseになる
                setOriginalPackData(extractCompareFields(initialPack)); 
                setOriginalCardIds([]); 
                setOriginalCardData([]);
                setIsEditorMode(true); 
            } else if (isExistingPack && packId) { 
                setNewlyInitializedPackId(null); // 既存パックの場合は初期化用IDをリセット
                const pack = await fetchEditingPack(packId); 
                
                if (pack) {
                    setPackData(pack);
                    setOriginalPackData(extractCompareFields(pack)); 
                    setIsEditorMode(!pack.isInStore); // 💡 論理削除パックは編集モードで開く
                } else {
                    // IDが無効な場合のエラー処理
                    console.error(`[usePackEditor:loadPackData] ❌ Pack ID ${packId} not found in DB or Store.`); 
                    setPackData(null); 
                    setOriginalPackData(null); 
                    setOriginalCardIds([]); 
                    setOriginalCardData([]);
                    setIsEditorMode(false);
                }
            } else if (!packId) {
                setNewlyInitializedPackId(null); // packIdがない場合はリセット
                setPackData(null);
                setOriginalPackData(null);
                setCards([]);
            }
        };

        // 🚨 修正: 既存の loadCardsData のロジックを loadCardList に移動し、ここで呼び出す
        const initialLoadCardsData = () => {
            if (isExistingPack && packId) {
                if (process.env.NODE_ENV !== 'production') {
                    console.debug(`[usePackEditor:initialLoadCardsData] ⚙️ Attempting to load cards for Pack ID: ${packId} from Store Cache.`);
                }
                // Storeのキャッシュから同期的にカードを取得する
                const loadedCards = getCardsByPackId(packId); 
                setCards(loadedCards);
                setOriginalCardIds(loadedCards.map(c => c.cardId)); 
                setOriginalCardData(JSON.parse(JSON.stringify(loadedCards))); 
            } else {
                setCards([]);
                setOriginalCardIds([]);
                setOriginalCardData([]);
            }
        };


        loadPackData();
        // PackDataロードの副作用として、カードリストをロードする
        initialLoadCardsData(); 
    }, [packId, fetchEditingPack, initializeNewPackEditing, isExistingPack, isNewPack, navigate, isDeletionInProgress, packData, newlyInitializedPackId, getCardsByPackId]); // 👈 依存配列は維持

    // Card Store の変更を監視し、ローカルのカードリストをリフレッシュする 
    // 💡 この useEffect は、cardCountInStore の変化（つまり Store への新規追加や削除）を検知し、
    // loadCardList を呼び出してローカル状態を更新するために使用します。
    useEffect(() => {
        if (isExistingPack && packId) {
            if (process.env.NODE_ENV !== 'production') {
                console.debug(`[usePackEditor:useEffect] 🔄 Card count changed, refetching cards for Pack ID: ${packId} from Store Cache.`);
            }
            loadCardList();
        }
    }, [packId, cardCountInStore, isExistingPack, loadCardList]); 

// --------------------------------------------------------------------------------------------------

    // --- ハンドラ定義 ---
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

    const toggleEditorMode = useCallback(() => {
        setIsEditorMode(prev => !prev);
    }, []);

    // モーダルクローズ関数はステートセッターのみを呼ぶため、useCallbackは不要
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
                isInStore: false, // 💡 保存時まで isInStore: false のままローカル state に保持
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

    // handleRemoveCard: カードをDB/Storeから論理削除（isInStore: false）
    const handleRemoveCard = useCallback(async (cardId: string) => { 
        if (!window.confirm("このカードをパックから削除（ストアから除外）しますか？")) return;

        try {
            await updateCardIsInStore(cardId, false); 
            
            setSaveAlert('✅ カードをストアから除外しました。');
            handleCloseCardEditorModal(); 
        } catch (error) {
            console.error("[usePackEditor:handleRemoveCard] ❌ カードのストアからの除外中にエラーが発生しました:", error);
            setSaveAlert('❌ カードのストアからの除外に失敗しました。');
        }
    }, [updateCardIsInStore]);

    // ★ 新規追加: handleRestoreCard - カードを復元（isInStore: true）
    const handleRestoreCard = useCallback(async (cardId: string) => { 
        try {
            await updateCardIsInStore(cardId, true);
            setSaveAlert('✅ カードをパックに復元しました。');
            handleCloseCardEditorModal(); 
        } catch (error) {
            console.error("[usePackEditor:handleRestoreCard] ❌ カードの復元中にエラーが発生しました:", error);
            setSaveAlert('❌ カードの復元に失敗しました。');
        }
    }, [updateCardIsInStore]);

    // ★ 新規追加: handlePhysicalDeleteCard - カードをDB/Storeから物理削除（警告ロジックはモーダル側が担当）
    const handlePhysicalDeleteCard = useCallback(async (cardId: string) => {
        try {
            // DB/Storeから完全に削除する
            await deleteCard(cardId);
            
            // ローカルのカードリストからも削除 (Storeの状態が変化するため、useEffectでloadCardListが呼ばれるが、ここでは即座にリストを更新)
            setCards(prevCards => prevCards.filter(c => c.cardId !== cardId));
            
            setSaveAlert('✅ カードを完全に削除しました。');
            handleCloseCardEditorModal(); 
        } catch (error) {
            console.error("[usePackEditor:handlePhysicalDeleteCard] ❌ カードの物理削除中にエラーが発生しました:", error);
            setSaveAlert('❌ カードの物理削除に失敗しました。');
        }
    }, [deleteCard]);

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

            const savedPack = await savePack(packData);
            
            if (isNewPack) {
                
                setNewlyInitializedPackId(null); // 💡 保存が完了したので初期化フラグをリセット

                // URLを既存のPack IDに変更し、履歴を置き換える
                navigate({ to: '/data/packs/$packId', params: { packId: savedPack.packId }, replace: true });
            }

            // カードの保存（新規パックの場合はパックIDを確実に設定してから保存）
            if (cards.length > 0) {
                const cardsToSave = cards.map(c => ({ ...c, packId: savedPack.packId }));
                
                // [重要] handleCardSaveで新規カードのisInStoreがfalseに設定されているため、
                // DBに永続化する際は明示的にisInStoreをtrueにする。
                const cardsToFinalize = cardsToSave.map(c => ({...c, isInStore: true}));
                
                // 💡 修正: cardDataService.bulkSaveCards の代わりに Store の bulkPutCards を使用し、
                // DB保存と Store State の同期を同時に行う
                await bulkPutCards(cardsToFinalize); 
            }
            
            // --- ★ Pack/Card のオリジナル状態のリセットを共通化（isDirtyをfalseにするため） ★ ---
            // 1. 最新のPackデータをセットし、オリジナルPackデータを更新
            setPackData(savedPack); 
            setOriginalPackData(extractCompareFields(savedPack)); 
            
            // 2. Storeに同期された最新のカードリストを取得し、オリジナルCard状態を更新
            await loadCardList(); // 👈 loadCardList を呼び出して最新の状態をセットする

            setSaveAlert('✅ パック情報と収録カードが正常に保存されました。');
        } catch (error) {
            console.error("[usePackEditor:handleSave] ❌ 保存中にエラーが発生しました:", error);
            setSaveAlert('❌ 保存中にエラーが発生しました。');
        }
    }, [packData, cards, savePack, isNewPack, navigate, bulkPutCards, loadCardList]); // 👈 依存配列も更新

    // handleRemovePack: パックをDB/Storeから論理削除（isInStore: false）
    const handleRemovePack = useCallback(async () => { 
        if (!packData) return;
        if (!window.confirm(`パック「${packData.name}」をストアから除外（論理削除）しますか？\n（この操作はいつでも復元可能です）`)) return;

        const idToDelete = packData.packId;

        try {
            setIsDeletionInProgress(true); // 👈 削除開始フラグをセット
            await updatePackIsInStore(idToDelete, false); 
            setSaveAlert('✅ パックをストアから除外（論理削除）しました。');
            
            navigate({ to: '/data/packs', replace: true }); 
            
        } catch (error) {
            console.error("[usePackEditor:handleRemovePack] ❌ ERROR during logical deletion:", error); 
            setSaveAlert('❌ パックの論理削除に失敗しました。');
            setIsDeletionInProgress(false); // 削除失敗時はフラグをリセット
        }
    }, [packData, navigate, updatePackIsInStore]); 
    
    
    // 💡 新規追加: handlePhysicalDeletePack - パックをDB/Storeから物理削除（2段階警告）
    const handlePhysicalDeletePack = useCallback(async () => {
        if (!packData) return;

        // 1段階目の警告
        const firstConfirmation = window.confirm(
            `警告：パック「${packData.name}」を完全に削除します。この操作は元に戻せません。\n\n収録カードを含む全データが抹消されます。\n本当によろしいですか？`
        );
        if (!firstConfirmation) return;

        // 2段階目の警告
        const secondConfirmation = window.confirm(
            `最終警告：本当にこのパックを**完全に抹消**しますか？\nこの操作は重大です。`
        );
        if (!secondConfirmation) return;

        const idToDelete = packData.packId;

        try {
            setIsDeletionInProgress(true);
            // 物理削除関数を呼び出す
            await deletePack(idToDelete);
            
            setSaveAlert('✅ パックをDBおよびストアから完全に削除しました。');
            // 削除後はパック一覧画面へ遷移
            navigate({ to: '/data/packs', replace: true }); 

        } catch (error) {
            console.error("[usePackEditor:handlePhysicalDeletePack] ❌ ERROR during physical deletion:", error);
            setSaveAlert('❌ パックの完全削除に失敗しました。');
            setIsDeletionInProgress(false);
        }
    }, [packData, navigate, deletePack]); // 依存配列に deletePack を追加


    // 💡 新規追加: handleRestorePack - パックを復元（isInStore: true）
    const handleRestorePack = useCallback(async () => { 
        if (!packData) return;
        
        try {
            // isInStoreを true に更新 (DBにもStoreにも反映される)
            await updatePackIsInStore(packData.packId, true);
            
            // ローカルPackDataも更新
            const restoredPack = { ...packData, isInStore: true };
            setPackData(restoredPack);
            setOriginalPackData(extractCompareFields(restoredPack));
            
            setSaveAlert('✅ パックをストアに復元しました。');
            setIsEditorMode(true); // 復元後は編集可能モードにする

        } catch (error) {
            console.error("[usePackEditor:handleRestorePack] ❌ パックの復元中にエラーが発生しました:", error);
            setSaveAlert('❌ パックの復元に失敗しました。');
        }
    }, [packData, updatePackIsInStore]);


    // カード編集モーダルオープン
    const handleOpenCardEditorModal = useCallback((card: CardType | null) => { 
        if (!packData) return; 

        if (!card) {
            // 新規カード作成時
            const defaultCard: CardType = createDefaultCard(packData.packId);
            
            // レアリティ設定があれば、最初のレアリティをデフォルト値とする
            const defaultRarity = (packData.rarityConfig && packData.rarityConfig.length > 0)
                ? packData.rarityConfig[0].rarityName
                : 'Common'; 

            setEditingCard({
                ...defaultCard,
                rarity: defaultRarity,
            });
            
        } else {
            // 既存カード編集時
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
        removePackFromStore, // PackEditorPage のアンマウント時クリーンアップ用
        
        isDisabled, 
        saveAlert, 
        setSaveAlert,
        handleInputChange,
        handleSelectChange,
        handleSave, 
        handleRemovePack, 
        // 💡 変更点: パック物理削除・復元ハンドラを追加
        handlePhysicalDeletePack,
        handleRestorePack,
        totalCardCount,

        
        cards, 
        handleCardSave, 
        handleRemoveCard, 
        // ★ 追加: カードの復元・物理削除ハンドラ
        onRestore: handleRestoreCard, // 💡 CardEditorModalに渡す用
        onPhysicalDelete: handlePhysicalDeleteCard, // 💡 CardEditorModalに渡す用

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