/**
* src/features/pack-management/hooks/usePackEdit.ts
* 【適用した修正】
* 1. useEffect内から navigate を全て削除し、IDが目まぐるしく変わる無限ループを解消。
* 2. handleSave内でのみ navigate を実行し、新規パック保存後にURLを確定IDに遷移させる。
* 3. handleSaveの依存配列に isNewPack と navigate を追加。
*/

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { usePackStore } from '../../../stores/packStore'; 
import { getCardsByPackId } from '../../../services/pack-logic/packDataService';
import { createDefaultPack } from '../../../services/pack-logic/packUtils';
import { cardDataService } from '../../../services/pack-logic/CardDataService'; 
import type { Pack } from '../../../models/pack';
import type { Card as CardType } from '../../../models/card';
import { v4 as uuidv4 } from 'uuid'; 

// CSV/JSON I/O の型定義を仮定
interface CsvIOStatus {
    isLoading: boolean;
    statusMessage: string;
}

// ダミーデータはpackIdを持たない前提 (createDefaultPackのシグネチャに依存)
const DUMMY_PACK_DATA = createDefaultPack(); 

export const usePackEdit = (packId: string) => {
    const navigate = useNavigate();
    const { loadPackById, initializeNewPackEditing, savePack, packs } = usePackStore();
    
    // --- 状態管理 ---
    const [packData, setPackData] = useState<Pack | null>(null);
    const [isEditMode, setIsEditMode] = useState(true);
    const [saveAlert, setSaveAlert] = useState<string | null>(null);
    const [cards, setCards] = useState<CardType[]>([]); 

    // UI/I/O 関連の状態（PackEditPage.tsxから抜粋）
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
    const [csvIO, /*setCsvIO*/] = useState<CsvIOStatus>({ isLoading: false, statusMessage: '' });

    // --- 派生状態 ---
    const isNewPack = useMemo(() => !packs.some(p => p.packId === packId), [packId, packs]); 
    const isExistingPack = useMemo(() => !isNewPack, [isNewPack]); 
    const isDisabled = useMemo(() => !isEditMode, [isEditMode]); 
    const totalCardCount = cards.length; 

    // --- データロードと初期化 ---
    useEffect(() => {
        const loadPackData = async () => {
            if (packId && packId !== DUMMY_PACK_DATA.packId) {
                const pack = await loadPackById(packId); 
                if (pack) {
                    setPackData(pack);
                    setIsEditMode(false); 
                } else {
                    // IDが無効な場合は新規作成モードへ
                    initializeNewPackEditing();
                    // 🚨 修正 1: navigate 削除 - 無限ループ回避
                    setPackData(createDefaultPack()); 
                    setIsEditMode(true);
                }
            } else {
                // IDがないかダミーIDの場合は新規作成モードへ
                initializeNewPackEditing();
                // 🚨 修正 2: navigate 削除 - 無限ループ回避
                setPackData(createDefaultPack()); 
                setIsEditMode(true);
            }
        };

        const loadCardsData = async () => { 
            if (packId && packId !== DUMMY_PACK_DATA.packId) {
                const loadedCards = await getCardsByPackId(packId); 
                setCards(loadedCards);
            } else {
                setCards([]);
            }
        };

        loadPackData();
        loadCardsData();
        // 🚨 修正 3: navigate を依存配列から削除しても動作するが、念のため残します。
    }, [packId, loadPackById, initializeNewPackEditing, navigate]); 

    // 💡 PackEditPage.tsxから呼び出される入力変更ハンドラ
    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        if (!packData) return;
        const { name, value } = e.target;
        setPackData(prev => prev ? ({ ...prev, [name]: name === 'price' ? Number(value) : value }) : null);
    }, [packData]);
    
    // 💡 PackEditPage.tsxから呼び出されるSelect変更ハンドラ
    const handleSelectChange = useCallback((e: any) => { 
        if (!packData) return;
        const { name, value } = e.target;
        setPackData(prev => prev ? ({ ...prev, [name]: value }) : null);
    }, [packData]);


    const toggleEditMode = useCallback(() => {
        setIsEditMode(prev => !prev);
    }, []);

    // --- カード操作ハンドラ (ローカル状態のみ更新) ---
    /**
     * CardEditModalから呼び出される統合保存ハンドラ。
     */
    const handleCardSave = useCallback((cardToSave: CardType) => {
        if (!packData) return;
        const isNew = !cards.some(c => c.cardId === cardToSave.cardId);

        const finalCard: CardType = isNew
            ? { 
                ...cardToSave, 
                packId: packData.packId, 
                registrationSequence: -1, 
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
        handleCloseCardEditModal();
    }, [packData, cards]); 

    /**
     * カードの削除もローカル状態の更新に切り替える
     */
    const handleDeleteCard = useCallback((cardId: string) => {
        if (!window.confirm("このカードをパックから削除しますか？")) return;
        setCards(prevCards => prevCards.filter(c => c.cardId !== cardId));
        handleCloseCardEditModal();
    }, []); 

    /**
     * RarityEditModal から返された新しい Pack データをローカル状態に適用する。
     */
    const handleRarityEditSave = useCallback((updatedPack: Pack) => {
        setPackData(updatedPack);
        handleCloseRarityEditModal(); 
    }, []);
    
    // 🚨 修正 4: handleSave を統合し、URL遷移ロジックを追加
    const handleSave = useCallback(async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!packData) return;

        try {
            // 1. パック情報の保存とリスト更新をストアに委譲 (永続化を維持)
            const savedPack = await savePack(packData);
            
            // 2. 新規パックの場合のみ、URLを確定IDに遷移させる (URL遷移の復元)
            if (isNewPack) {
                // ローカルのpackDataも新しいIDで更新
                setPackData(savedPack); 
                // 💡 遷移: URLを新しいパックIDに置き換える
                navigate({ to: '/data/packs/$packId', params: { packId: savedPack.packId }, replace: true });
            }

            // 3. 収録カードの保存
            if (cards.length > 0) {
                const cardsToSave = cards.map(c => ({ 
                    ...c, 
                    packId: savedPack.packId 
                }));
                await cardDataService.bulkPutCards(cardsToSave); 
            }
            
            // 4. 保存成功後、DBから最新のカードリストを再取得
            const updatedCards = await getCardsByPackId(savedPack.packId);
            setCards(updatedCards);
            
            setSaveAlert('✅ パック情報と収録カードが正常に保存されました。');
            setIsEditMode(false); 
        } catch (error) {
            console.error("保存中にエラーが発生しました:", error);
            setSaveAlert('❌ 保存中にエラーが発生しました。');
        }
    }, [packData, cards, savePack, isNewPack, navigate]);

    const handleDelete = useCallback(async () => {
        if (!packData || !isExistingPack) return;
        if (!window.confirm(`パック「${packData.name}」を本当に削除しますか？`)) return;

        try {
            const { deletePack } = usePackStore.getState();
            await deletePack(packData.packId);
            setSaveAlert('✅ パックが正常に削除されました。');
            navigate({ to: '/data/packs' }); // パック一覧へ遷移
        } catch (error) {
            setSaveAlert('❌ パックの削除に失敗しました。');
        }
    }, [packData, isExistingPack, navigate]);

    // CSV/JSON I/O のメニューハンドラ (中略)
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
    
    // その他モーダルハンドラ (中略)
    const handleOpenCardEditModal = useCallback((card: CardType | null) => { 
        if (!packData) return; 

        if (!card) {
            const defaultRarity = (packData.rarityConfig && packData.rarityConfig.length > 0)
                ? packData.rarityConfig[0].rarityName
                : 'Common'; 

            const defaultCard: CardType = {
                cardId: uuidv4(), 
                packId: packData.packId, 
                name: '新しいカード',
                rarity: defaultRarity, 
                imageUrl: '',
                registrationSequence: -1, 
                userCustom: {},
            };
            setEditingCard(defaultCard);
        } else {
            setEditingCard(card);
        }
        setIsCardModalOpen(true); 
    }, [packData]); 

    const handleCloseCardEditModal = () => { setEditingCard(null); setIsCardModalOpen(false); };
    const handleOpenRarityEditModal = () => { setIsRarityModalOpen(true); };
    const handleCloseRarityEditModal = () => { setIsRarityModalOpen(false); };

    return {
        packData: packData as Pack, 
        isNewPack,
        isExistingPack, 
        isEditMode,
        toggleEditMode,
        csvIO, 
        isDisabled, 
        saveAlert, 
        setSaveAlert,
        handleInputChange,
        handleSelectChange,
        handleSave, 
        handleDelete,
        totalCardCount, 
        
        cards, 
        handleCardSave, 
        handleDeleteCard, 
        
        // カード編集モーダル
        isCardModalOpen,
        editingCard,
        handleOpenCardEditModal,
        handleCloseCardEditModal,
        // レアリティ編集モーダル
        isRarityModalOpen,
        handleOpenRarityEditModal,
        handleCloseRarityEditModal,
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
        handleConfirmImport: () => { console.log('CSV Import confirmed'); },
        // JSON I/O
        isJsonImportModalOpen,
        setIsJsonImportModalOpen,
        jsonFileToImport,
        jsonIOStatusMessage,
        isJsonIOLoading,
        handleJsonFileChange: (e: React.ChangeEvent<HTMLInputElement>) => { setJsonFileToImport(e.target.files ? e.target.files[0] : null); },
        handleConfirmJsonImport: () => { console.log('JSON Import confirmed'); },
    };
};