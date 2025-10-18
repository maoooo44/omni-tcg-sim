/**
 * src/features/decks/hooks/useDeckEditor.ts
 *
 * デッキ編集画面のコアロジックを提供するカスタムフック。
 * 責務：
 * 1. URLパラメータから取得したdeckIdに基づき、編集対象のデッキデータをZustandストアからロード/初期化する。
 * 2. 関連するデータ（全カードリスト、所有カード資産）を他のストアから取得し、コンポーネントに提供する。
 * 3. デッキ情報（名前、説明など）の更新、カードの追加/削除、保存、削除といった永続化アクションを実行する。
 * 4. UIの状態（ローディング、保存メッセージ）を管理する。
 */

import { useEffect, useState, useCallback } from 'react';
import { useDeckStore } from '../../../stores/deckStore';
import { useCardPoolStore } from '../../../stores/cardPoolStore';
import { useShallow } from 'zustand/react/shallow';
import { useNavigate } from '@tanstack/react-router'; 
import { useCardStore } from '../../../stores/cardStore'; 

/**
 * デッキ編集画面のロジック、データロード、保存処理を統合する Hook
 */
export const useDeckEditor = (deckId: string) => {
    const [isLoading, setIsLoading] = useState(true);
    const [saveMessage, setSaveMessage] = useState<string | null>(null);
    const navigate = useNavigate(); 

    // DeckStoreから必要な状態とアクションをuseShallowで一度に取得
    const {
        currentDeck,
        fetchDeckForEditor,
        updateDeckInfo,
        saveCurrentDeck,
        deleteDeckFromStore, 
        addCardToDeck, 
        removeCardFromDeck,
        // 💡 追記: 論理削除/復元用のアクション
        updateDeckIsInStore,
    } = useDeckStore(useShallow(state => ({
        currentDeck: state.currentDeck,
        fetchDeckForEditor: state.fetchDeckForEditor,
        updateDeckInfo: state.updateDeckInfo,
        saveCurrentDeck: state.saveCurrentDeck,
        deleteDeckFromStore: state.deleteDeck, // 物理削除用
        addCardToDeck: state.addCardToDeck,
        removeCardFromDeck: state.removeCardFromDeck, 
        // 💡 追記
        updateDeckIsInStore: state.updateDeckIsInStore,
    })));
    
    // カードプールストアから所有カード資産を取得（頻繁に更新されないためshallowは不要だがパフォーマンスに問題なし）
    const ownedCards = useCardPoolStore(state => state.ownedCards);
    
    // CardStoreから全カードリストをuseShallowで取得（巨大なデータに対する最適化）
    const allCards = useCardStore(useShallow(state => state.cards)); 


    // 1. 初期ロード / デッキ切り替えロジック
    useEffect(() => {
        // 新しいIDに切り替わる際に必ずローディングを開始
        setIsLoading(true); 

        // A. メモリ上のデータが既に新しいIDと一致しているか確認
        if (currentDeck && currentDeck.deckId === deckId) {
            // データが既にロード済みであれば、2つ目のuseEffectでisLoading(false)になるのを待つ。
            return; 
        }

        // B. 不一致: URLのIDに対応するデッキをロード、または新規デッキとして初期化
        fetchDeckForEditor(deckId); 
    }, [deckId, fetchDeckForEditor]); // 依存配列は適切


    // 2. currentDeckが設定されたらローディングを解除 (非同期ロード完了の検知)
    useEffect(() => {
        // currentDeckが設定され、かつURLのIDと一致したら、ロード完了とみなす
        if (currentDeck && currentDeck.deckId === deckId && isLoading) {
            setIsLoading(false);
        }
    }, [currentDeck, deckId, isLoading]); // 依存配列は適切


    // 3. デッキ保存ロジック (useCallbackでメモ化)
    const handleSaveDeck = useCallback(async () => {
        if (!currentDeck?.name?.trim()) { // バリデーションとOptional chaining
            alert('デッキ名を入力してください。');
            return;
        }

        try {
            await saveCurrentDeck(); 
            setSaveMessage('デッキを保存しました！');
            setTimeout(() => setSaveMessage(null), 3000);
        } catch (error) {
            setSaveMessage('保存に失敗しました。');
            console.error('Save failed:', error);
        }
    }, [currentDeck, saveCurrentDeck]);
    
    // 4. デッキ削除 (論理削除: isInStore=false に変更) ロジック (useCallbackでメモ化)
    const handleDeleteDeck = useCallback(async () => {
        if (!currentDeck) return; 
        
        if (!window.confirm(`デッキ「${currentDeck.name}」を非表示（論理削除）にしますか？\n※一覧から消えますが、後で復元可能です。`)) {
            return;
        }
        try {
            // 💡 修正: updateDeckIsInStore を使用して論理削除 (isInStore: false)
            await updateDeckIsInStore(currentDeck.deckId, false); 
            
            // 削除後、一覧画面へ遷移
            navigate({ to: '/user/decks' });
        } catch (error) {
            alert('デッキの削除に失敗しました。');
            console.error(error);
        }
    }, [currentDeck, updateDeckIsInStore, navigate]);
    
    // 5. デッキ復元 (isInStore=true に変更) ロジック (useCallbackでメモ化)
    const handleRestoreDeck = useCallback(async () => {
        if (!currentDeck || currentDeck.isInStore) return; 
        
        if (!window.confirm(`デッキ「${currentDeck.name}」を一覧に復元しますか？`)) {
            return;
        }
        try {
            // 💡 追加: updateDeckIsInStore を使用して復元 (isInStore: true)
            await updateDeckIsInStore(currentDeck.deckId, true); 
            setSaveMessage('デッキを一覧に復元しました。');
            setTimeout(() => setSaveMessage(null), 3000);
        } catch (error) {
            alert('デッキの復元に失敗しました。');
            console.error(error);
            setSaveMessage('復元に失敗しました。');
        }
    }, [currentDeck, updateDeckIsInStore]);
    
    // 6. 物理削除ロジック (useCallbackでメモ化) - 高度な操作として提供
    const handlePhysicalDelete = useCallback(async () => {
        if (!currentDeck) return; 
        
        if (!window.confirm(`【警告】デッキ「${currentDeck.name}」をDBから完全に物理削除しますか？\nこの操作は元に戻せません。`)) {
            return;
        }
        try {
            // ストアのアクションを使用して物理削除とストア状態のリセットを行う
            await deleteDeckFromStore(currentDeck.deckId); 
            // 削除後、一覧画面へ遷移
            navigate({ to: '/user/decks' });
        } catch (error) {
            alert('デッキの物理削除に失敗しました。');
            console.error(error);
        }
    }, [currentDeck, deleteDeckFromStore, navigate]);


    // 公開する値とアクション
    return {
        isLoading,
        saveMessage,
        currentDeck: currentDeck, 
        onSave: handleSaveDeck, 
        onDelete: handleDeleteDeck, 
        onRestore: handleRestoreDeck, // 💡 復元アクションを追加
        onPhysicalDelete: handlePhysicalDelete, // 💡 物理削除アクションを追加
        updateDeckInfo,
        addCard: addCardToDeck, 
        removeCard: removeCardFromDeck,
        allCards: allCards, 
        ownedCards: ownedCards,
    };
};