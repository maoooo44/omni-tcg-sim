/**
 * src/features/decks/hooks/useDeckEditor.ts
 *
 * デッキ編集画面のコアロジックを提供するカスタムフック。
 * 責務：
 * 1. URLパラメータから取得したdeckIdに基づき、編集対象のデッキデータをZustandストアからロード/初期化し、ローカルで管理する。
 * 2. **ダーティチェック (isDirty)** を実装し、未保存の変更を追跡する。
 * 3. 関連するデータ（全カードリスト、所有カード資産）を他のストアから取得し、コンポーネントに提供する。
 * 4. デッキ情報（名前、説明など）の更新、カードの追加/削除、保存、削除といった永続化アクションを実行する。
 * 5. UIの状態（ローディング、保存メッセージ）を管理する。
 */

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useDeckStore } from '../../../stores/deckStore';
import { useCardPoolStore } from '../../../stores/cardPoolStore';
import { useShallow } from 'zustand/react/shallow';
import { useNavigate } from '@tanstack/react-router'; 
import { useCardStore } from '../../../stores/cardStore'; 
import type { Deck } from '../../../models/deck';
import { createDefaultDeck } from '../../../utils/dataUtils';

// 💡 修正 1: インポート名とパスを変更
import { 
    createDeckArchive, // 💡 useDeckArchive から createDeckArchive に変更
    type DeckArchiveDependencies 
} from '../../../stores/utils/createDeckArchive'; // 💡 cDeckArchive から createDeckArchive に変更


// ----------------------------------------------------------------------
// 💡 Deckのダーティチェック用フィールド定義 (変更なし)

/**
 * Deck の新しいカスタムフィールド30個を抽出
 */
type CustomFields30 = Pick<Deck, 
    'custom_1_bool' | 'custom_2_bool' | 'custom_3_bool' | 'custom_4_bool' | 'custom_5_bool' | 'custom_6_bool' | 'custom_7_bool' | 'custom_8_bool' | 'custom_9_bool' | 'custom_10_bool' |
    'custom_1_num' | 'custom_2_num' | 'custom_3_num' | 'custom_4_num' | 'custom_5_num' | 'custom_6_num' | 'custom_7_num' | 'custom_8_num' | 'custom_9_num' | 'custom_10_num' |
    'custom_1_str' | 'custom_2_str' | 'custom_3_str' | 'custom_4_str' | 'custom_5_str' | 'custom_6_str' | 'custom_7_str' | 'custom_8_str' | 'custom_9_str' | 'custom_10_str'
>;

/**
 * Deck オブジェクトから、編集/保存に関わるフィールドのみを抽出した型。
 */
type DeckCompareFields = Pick<Deck, 
    'name' | 'description' | 'imageUrl' | 'imageColor' | 'mainDeck' | 'sideDeck' | 'extraDeck' | 'isFavorite' | 'isLegal' | 'hasUnownedCards' |
    'number' | 'ruleId' | 'deckType' | 'series'
> & CustomFields30;


/**
 * Deckデータから、DeckCompareFieldsを生成するヘルパー関数。
 */
const extractCompareFieldsFromDeck = (deck: Deck): DeckCompareFields => {
    const mapToArrayAndSort = (map: Map<string, number>): [string, number][] => 
        Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));

    const deckFields: DeckCompareFields = {
        name: deck.name,
        description: deck.description,
        imageUrl: deck.imageUrl,
        imageColor: deck.imageColor,
        isFavorite: deck.isFavorite,
        isLegal: deck.isLegal,
        hasUnownedCards: deck.hasUnownedCards,
        
        number: deck.number || null,
        ruleId: deck.ruleId || undefined,
        deckType: deck.deckType,
        series: deck.series,
        
        // Map型のゾーンを比較可能な配列に変換
        mainDeck: mapToArrayAndSort(deck.mainDeck) as any,
        sideDeck: mapToArrayAndSort(deck.sideDeck) as any,
        extraDeck: mapToArrayAndSort(deck.extraDeck) as any,
        
        // カスタムフィールド30個
        custom_1_bool: deck.custom_1_bool, custom_2_bool: deck.custom_2_bool, custom_3_bool: deck.custom_3_bool, custom_4_bool: deck.custom_4_bool, custom_5_bool: deck.custom_5_bool,
        custom_6_bool: deck.custom_6_bool, custom_7_bool: deck.custom_7_bool, custom_8_bool: deck.custom_8_bool, custom_9_bool: deck.custom_9_bool, custom_10_bool: deck.custom_10_bool,
        custom_1_num: deck.custom_1_num, custom_2_num: deck.custom_2_num, custom_3_num: deck.custom_3_num, custom_4_num: deck.custom_4_num, custom_5_num: deck.custom_5_num,
        custom_6_num: deck.custom_6_num, custom_7_num: deck.custom_7_num, custom_8_num: deck.custom_8_num, custom_9_num: deck.custom_9_num, custom_10_num: deck.custom_10_num,
        custom_1_str: deck.custom_1_str, custom_2_str: deck.custom_2_str, custom_3_str: deck.custom_3_str, custom_4_str: deck.custom_4_str, custom_5_str: deck.custom_5_str,
        custom_6_str: deck.custom_6_str, custom_7_str: deck.custom_7_str, custom_8_str: deck.custom_8_str, custom_9_str: deck.custom_9_str, custom_10_str: deck.custom_10_str,
    };
    
    return deckFields;
};
// ----------------------------------------------------------------------


/**
 * デッキ編集画面のロジック、データロード、保存処理を統合する Hook
 */
export const useDeckEditor = (deckId: string) => {
    const [deckData, setDeckData] = useState<Deck | null>(null);
    const [originalDeckData, setOriginalDeckData] = useState<DeckCompareFields | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [saveMessage, setSaveMessage] = useState<string | null>(null);
    const navigate = useNavigate(); 

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
        return deckId === 'new' || !decks.some(d => d.deckId === deckId);
    }, [deckId, decks]);
    
    /**
     * ダーティチェックロジック
     */
    const isDirty = useMemo(() => {
        if (!deckData) return false;

        const currentFields = extractCompareFieldsFromDeck(deckData);

        if (isNewDeck) {
            const defaultDeck = createDefaultDeck(deckData.deckId);
            const defaultFields = extractCompareFieldsFromDeck(defaultDeck);
            
            return JSON.stringify(currentFields) !== JSON.stringify(defaultFields);
        }

        if (!originalDeckData) return false;
        
        return JSON.stringify(currentFields) !== JSON.stringify(originalDeckData);
    }, [deckData, originalDeckData, isNewDeck]);


    // --- データロードと初期化 ---

    /**
     * ローカルステートを一括で更新し、ダーティチェックのベースラインを設定
     */
    const updateLocalState = useCallback((deck: Deck) => {
        setDeckData(deck);
        setOriginalDeckData(extractCompareFieldsFromDeck(deck));
        setIsLoading(false);
        console.log(`[useDeckEditor] ✅ Local state set for Deck ID: ${deck.deckId}`);
    }, []);


    // 1. 初期ロード / デッキ切り替えロジック
    useEffect(() => {
        const loadDeck = async () => {
            setIsLoading(true);
            
            if (deckId === 'new') {
                const newDeck = createDefaultDeck();
                updateLocalState(newDeck);
                return;
            }

            const deck = await fetchDeckById(deckId); 
            
            if (deck) {
                updateLocalState(deck);
            } else {
                console.error(`[useDeckEditor] ❌ Deck ID ${deckId} not found.`);
                setDeckData(null);
                setOriginalDeckData(null);
                setIsLoading(false);
            }
        };
          
        if (!deckData || deckData.deckId !== deckId) {
            loadDeck();
        }

    }, [deckId, fetchDeckById]);

    // --- UI/データ更新ハンドラ (変更なし) ---
    
    const updateDeckInfo = useCallback((info: Partial<Omit<Deck, 'mainDeck' | 'sideDeck' | 'extraDeck' | 'totalCards'>>) => {
        setDeckData(prev => prev ? ({ ...prev, ...info }) : null);
    }, []);
    
    const updateCardCount = useCallback((zone: keyof Pick<Deck, 'mainDeck' | 'sideDeck' | 'extraDeck'>, cardId: string, count: number) => {
        setDeckData(prev => {
            if (!prev) return null;

            const newMap = new Map(prev[zone]);
            
            if (count > 0) {
                newMap.set(cardId, count);
            } else {
                newMap.delete(cardId);
            }
            
            const newTotalCards = Array.from(prev.mainDeck.values()).reduce((a, b) => a + b, 0) +
                Array.from(prev.sideDeck.values()).reduce((a, b) => a + b, 0) +
                Array.from(prev.extraDeck.values()).reduce((a, b) => a + b, 0);

            return { 
                ...prev, 
                [zone]: newMap,
                totalCards: newTotalCards,
            };
        });
    }, []);
    
    
    // 💡 修正 2: ArchiveDependencies の構築方法を変更 (getState を渡す)
    // useDeckStore.getState は get 関数と同じ型シグネチャ () => DeckStore を持つ
const deckArchiveDependencies: DeckArchiveDependencies = {
    // DeckStore の getState を get として渡す (Zustandの get() と getState() は同じシグネチャ)
    get: useDeckStore.getState, 
    // getCardStoreState と getCardPoolStoreState は削除 (createDeckArchiveで不要なため)
};

    // 💡 修正 3: useDeckArchive から createDeckArchive に変更し、アクションを取得
    const {
        moveDeckToTrash,
        restoreDeckFromTrash,
        deleteDeckFromTrash: physicalDeleteDeck, 
    } = createDeckArchive(deckArchiveDependencies); // 💡 createDeckArchive を使用


    // 3. デッキ保存ロジック (変更なし)
    const handleSaveDeck = useCallback(async () => {
        if (!deckData?.name?.trim()) {
            setSaveMessage('デッキ名を入力してください。');
            setTimeout(() => setSaveMessage(null), 3000);
            return;
        }
        
        if (!isDirty) {
            setSaveMessage('変更がありません。');
            setTimeout(() => setSaveMessage(null), 3000);
            return;
        }

        try {
            const savedDeck = await saveDeck(deckData); 
            
            if (isNewDeck) {
                navigate({ to: '/user/decks/$deckId', params: { deckId: savedDeck.deckId }, replace: true });
            } else {
                updateLocalState(savedDeck);
            }

            setSaveMessage('デッキを保存しました！');
            setTimeout(() => setSaveMessage(null), 3000);
        } catch (error) {
            setSaveMessage('保存に失敗しました。');
            console.error('Save failed:', error);
        }
    }, [deckData, saveDeck, isNewDeck, navigate, updateLocalState, isDirty]);
    
    
    // 4. デッキ削除 (メインDBから削除しゴミ箱に移動) ロジック (変更なし)
    const handleDeleteDeck = useCallback(async () => {
        if (!deckData) return; 
        
        if (!window.confirm(`デッキ「${deckData.name}」をゴミ箱に移動しますか？`)) {
            return;
        }
        
        try {
            await moveDeckToTrash(deckData.deckId); 
            navigate({ to: '/user/decks' });
        } catch (error) {
            setSaveMessage('デッキのゴミ箱への移動に失敗しました。');
            console.error(error);
        }
    }, [deckData, moveDeckToTrash, navigate]);
    
    
    // 5. デッキ復元 (ゴミ箱から復元) ロジック (変更なし)
    const handleRestoreDeck = useCallback(async (archiveId: string) => { 
        if (!window.confirm(`デッキを一覧に復元しますか？`)) {
             return;
        }
        
        try {
            await restoreDeckFromTrash(archiveId); 
            setSaveMessage('デッキを一覧に復元しました。');
            navigate({ to: '/user/decks' });
            
        } catch (error) {
            setSaveMessage('復元に失敗しました。');
            console.error(error);
        }
    }, [restoreDeckFromTrash, navigate]);
    
    
    // 6. 物理削除ロジック (ゴミ箱からの完全削除) (変更なし)
    const handlePhysicalDelete = useCallback(async (archiveId: string) => { 
        if (!window.confirm(`【警告】デッキをDBから完全に物理削除しますか？\nこの操作は元に戻せません。`)) {
            return;
        }
        
        try {
            await physicalDeleteDeck(archiveId); 
            setSaveMessage('デッキを物理削除しました。');
            navigate({ to: '/user/decks' });
        } catch (error) {
            setSaveMessage('デッキの物理削除に失敗しました。');
            console.error(error);
        }
    }, [physicalDeleteDeck, navigate]);


    // 公開する値とアクション (変更なし)
    return {
        isLoading,
        isDirty, 
        saveMessage,
        currentDeck: deckData, 
        
        onSave: handleSaveDeck, 
        onDelete: handleDeleteDeck, 
        onRestore: handleRestoreDeck, 
        onPhysicalDelete: handlePhysicalDelete, 
        
        updateDeckInfo,
        updateCardCount,
        
        allCards: allCards, 
        ownedCards: ownedCards,
    };
};