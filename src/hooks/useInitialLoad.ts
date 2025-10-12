/**
 * src/hooks/useInitialLoad.ts
 *
 * アプリケーションの初期起動時に必要な全てのデータ（カードデータ、ストアデータ）をロードするカスタムフックです。
 * データ永続化層からの読み込みが完了するまで、アプリケーションのメインUIの描画をブロックするために使用されます。
 */

import { useEffect, useState } from 'react';
import { useCardData } from './useCardData'; 
import { usePackStore } from '../stores/packStore';
import { useCardPoolStore } from '../stores/cardPoolStore';
import { useUserDataStore } from '../stores/userDataStore';
import { useCurrencyStore } from '../stores/currencyStore';
// useCardStore とその型をインポート
import { useCardStore, type CardStore } from '../stores/cardStore'; 

// 既存のストア型をインポート
import type { PackState } from '../stores/packStore';
import type { CardPoolState } from '../stores/cardPoolStore';
import type { UserDataState } from '../stores/userDataStore';
import type { CurrencyState } from '../stores/currencyStore';

// ロードアクションを持つストアのインターフェースを統合
type StoreActions = Pick<PackState, 'loadPacks'> & 
                    Pick<CardPoolState, 'loadCardPool'> & 
                    Pick<UserDataState, 'loadUserData'> &
                    Pick<CurrencyState, 'loadCurrency'> &
                    Pick<CardStore, 'loadAllCards'>; 

/**
 * アプリケーションの初期起動時に必要な全てのデータ（カードデータ、ストアデータ）をロードするフック
 * @returns {boolean} 全てのデータロードが完了したら true
 */
export const useInitialLoad = (): boolean => {
    // 1. useCardDataフックを使用して、全カードデータ（PackLogic）のロード状態を監視
    const { isLoaded: isCardDataLoaded } = useCardData();
    
    // 2. Zustandストアからのデータロード状態を監視
    const [isStoresLoaded, setIsStoresLoaded] = useState(false);

    useEffect(() => {
        // カードデータがまだロードされていない場合は処理を中断
        if (!isCardDataLoaded) {
            console.log("Waiting for Card Data (useCardData) to finish loading...");
            return; 
        }

        const loadAllStores = async () => {
            
            // ZustandストアのgetState()メソッドを使用して、DBからのロードアクションを取得
            // 型安全性のために 'unknown' を経由して StoreActions にキャスト
            const { loadPacks } = usePackStore.getState() as unknown as StoreActions;
            const { loadCardPool } = useCardPoolStore.getState() as unknown as StoreActions;
            const { loadUserData } = useUserDataStore.getState() as unknown as StoreActions;
            const { loadCurrency } = useCurrencyStore.getState() as unknown as StoreActions;
            const { loadAllCards } = useCardStore.getState() as unknown as StoreActions; 

            try {
                console.log("Starting initial store data load...");
                
                // 全てのストアのロードアクションを並行して実行
                await Promise.all([
                    loadPacks(), 
                    loadUserData(),
                    loadCardPool(),
                    loadCurrency(),
                    loadAllCards(), 
                ]);

                setIsStoresLoaded(true);
                console.log('✅ All initial store data loading completed.');

            } catch (error) {
                console.error('初期データロード中に致命的なエラーが発生しました:', error);
                // エラーが発生してもロード完了として扱い、アプリを続行させる
                setIsStoresLoaded(true);
            }
        };
        
        loadAllStores();
        
    }, [isCardDataLoaded]); 

    // カードデータとストアデータの両方がロード完了したら true を返す
    return isCardDataLoaded && isStoresLoaded;
};