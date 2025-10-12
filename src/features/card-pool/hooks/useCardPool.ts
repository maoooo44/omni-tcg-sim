/**
 * src/features/card-pool/hooks/useCardPool.ts
 * 
 * カードプールの状態管理と永続化を統合するカスタムHook。
 * アプリケーション起動時にIndexedDBからカードプールデータをロードし、Zustandストアを初期化する。
 * データの永続化（DB保存）ロジックはストアのアクション内に集約されており、このHookは初期ロードに専念する。
 */
import { useEffect } from 'react'; 
import { useCardPoolStore } from '../../../stores/cardPoolStore';
import { useShallow } from 'zustand/react/shallow';

export const useCardPool = () => {
    
    // Zustandストアから必要なアクションと状態を取得
    const { loadCardPool, ownedCards } = useCardPoolStore(
        useShallow(state => ({
            loadCardPool: state.loadCardPool,
            ownedCards: state.ownedCards,
        }))
    );
    
    // ----------------------------------------------------
    // 1. 初期化ロジック: DBからデータをロードし、Zustandストアを初期化
    // ----------------------------------------------------
    // 目的: アプリケーション起動時に loadCardPool アクションを一度だけ実行
    useEffect(() => {
        // loadCardPool はストア内で DB ロードを実装済み
        loadCardPool();
    }, [loadCardPool]); // loadCardPool は参照安定性が保証されていると仮定

    
    // ----------------------------------------------------
    // 2. 永続化ロジック (削除)
    // ----------------------------------------------------
    // 理由: DB保存ロジックは cardPoolStore.ts のアクションに移管済み。
    // useEffect(() => {
    //     if (ownedCards.size === 0 && Array.from(ownedCards.values()).length === 0) {
    //          return;
    //     }
    //
    //     const saveToDB = async () => {
    //         await cardPoolService.bulkUpdateCardCounts(ownedCards);
    //         console.log("Card pool data saved to IndexedDB.");
    //     };
    //     
    //     const timeoutId = setTimeout(saveToDB, 500); 
    //     return () => clearTimeout(timeoutId);
    // }, [ownedCards]); 

    // 外部で利用される可能性があるため、ownedCards を返すのは維持
    return { ownedCards }; 
};