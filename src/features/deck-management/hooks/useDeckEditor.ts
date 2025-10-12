/**
 * src/features/deck-management/hooks/useDeckEditor.ts
 * * デッキ編集画面のコアロジックを提供するカスタムフック。
 */

import { useEffect, useState } from 'react';
import { useDeckStore } from '../../../stores/deckStore';
import { useCardPoolStore } from '../../../stores/cardPoolStore';
import { useShallow } from 'zustand/react/shallow';
import { useNavigate } from '@tanstack/react-router'; 
import { useCardStore } from '../../../stores/cardStore'; 
// import { deckService } from '../../../services/deck-logic/deckService'; // サービスはロジックの参照用として維持

/**
 * デッキ編集画面のロジック、データロード、保存処理を統合する Hook
 */
export const useDeckEditor = (deckId: string) => {
    const [isLoading, setIsLoading] = useState(true);
    const [saveMessage, setSaveMessage] = useState<string | null>(null);
    const navigate = useNavigate(); 

    // 🚨 LOG K: Hookの実行開始
    //console.log(`[useDeckEditor] K. Hook execution start for ID: ${deckId}.`); 

    // Zustandストアから編集中のデッキデータとアクションを取得
    const {
        currentDeck,
        loadDeckForEdit,
        updateDeckInfo,
        saveDeck,
        deleteDeck: deleteDeckFromStore 
    } = useDeckStore(useShallow(state => ({
        currentDeck: state.currentDeck,
        loadDeckForEdit: state.loadDeckForEdit,
        updateDeckInfo: state.updateDeckInfo,
        saveDeck: state.saveDeck,
        deleteDeck: state.deleteDeck,
    })));
    
    // カードプールストアから所有カード資産を取得
    const ownedCards = useCardPoolStore(state => state.ownedCards);
    // CardStoreから全カードリストをuseShallowで取得
    const allCards = useCardStore(state => state.cards); 


    // 1. 初期ロード / デッキ切り替えロジック
    useEffect(() => {
        // 🚨 LOG E: useEffect開始
        //console.log(`[useDeckEditor] E. useEffect[1] start for ID: ${deckId}.`); 
        // setIsLoading(true);

        // A. 新規作成・編集中データ優先ロードのロジック
        if (currentDeck && currentDeck.deckId === deckId) {
            console.log(`[useDeckEditor] E1. Prioritizing in-memory state for ID: ${deckId}.`);
            // メモリ上のデータがあれば、この時点ではロード完了としない（2つ目のuseEffectに任せる）
            return; 
        }

        // B. 不一致: URLのIDに対応するデッキをロード、または新規デッキとして初期化
        loadDeckForEdit(deckId); 
        
        // 🚨 LOG F: loadDeckForEdit 呼び出し後
        //console.log(`[useDeckEditor] F. Loading/Initializing deck for ID: ${deckId}. loadDeckForEdit dispatched.`);
        
        // ❌ 修正: ここで setIsLoading(false) を呼ぶと、非同期処理完了前にUIが描画されクラッシュするため削除。
        // setIsLoading(false); // 削除

        // 依存配列に deckId が含まれているため、URLパラメータが変わるたびにこのuseEffectは再実行されます。
    }, [deckId, currentDeck, loadDeckForEdit, navigate]); 
    
    // 2. currentDeckが設定されたらローディングを解除 (新規追加)
    useEffect(() => {
        // currentDeckが設定され、かつURLのIDと一致したら、ロード完了とみなす
        if (currentDeck && currentDeck.deckId === deckId && isLoading) {
            // 🚨 LOG G: currentDeckが設定され、ロード完了
            //console.log(`[useDeckEditor] G. currentDeck loaded/set. currentDeck name: ${currentDeck.name}. Stopping loading.`); 
            setIsLoading(false);
        } else if (!currentDeck && deckId && !isLoading) {
             // 🚨 LOG H: デッキデータが予期せず失われた
             //console.log(`[useDeckEditor] H. Deck data lost unexpectedly for ID: ${deckId}.`); 
        }
    }, [currentDeck, deckId]);


    // 3. デッキ保存ロジック
    const handleSaveDeck = async () => {
        if (!currentDeck.name.trim()) {
            alert('デッキ名を入力してください。');
            return;
        }

        try {
            await saveDeck(); 
            setSaveMessage('デッキを保存しました！');
            setTimeout(() => setSaveMessage(null), 3000);
        } catch (error) {
            setSaveMessage('保存に失敗しました。');
            console.error('Save failed:', error);
        }
    };
    
    // 4. デッキ削除ロジック (リスト画面へのナビゲーションは残します)
    const handleDeleteDeck = async () => {
        if (!window.confirm(`デッキ「${currentDeck.name}」を完全に削除しますか？`)) {
            return;
        }
        try {
            // ストアのアクションを使用して削除とストア状態のリセットを行う
            deleteDeckFromStore(currentDeck.deckId); 
            navigate({ to: '/user/decks' });
        } catch (error) {
            alert('デッキの削除に失敗しました。');
            console.error(error);
        }
    };

    // 5. (その他のロジック: カード数計算、所有数チェックなど)

    const { addCardToDeck, removeCardFromDeck } = useDeckStore(
        useShallow(state => ({
            addCardToDeck: state.addCardToDeck,
            removeCardFromDeck: state.removeCardFromDeck, 
        }))
    );

    // 🚨 LOG L: Hook return の直前（最終状態を確認）
    //console.log(`[useDeckEditor] L. Hook return (end of render cycle). isLoading: ${isLoading}, currentDeck ID: ${currentDeck ? currentDeck.deckId : 'null'}`); 

    return {
        isLoading,
        saveMessage,
        currentDeck,
        handleSaveDeck,
        handleDeleteDeck,
        updateDeckInfo,
        addCard: addCardToDeck,      
        removeCard: removeCardFromDeck,
        allCards: allCards, 
        ownedCards: ownedCards,
    };
};