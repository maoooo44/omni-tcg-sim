/**
 * src/hooks/useInitialLoad.ts
 *
 * アプリケーションの初期起動時に必要な全ての非同期処理（IndexedDB接続、カードデータ、ストアデータ）をロードするカスタムフックです。
 * データの依存関係を調整し、初期化のオーケストレーションと、致命的なエラーハンドリングを担います。
 */

import { useEffect, useState } from 'react';
import { useCardData } from './useCardData'; 
import { db } from '../services/database/db'; 
import { usePackStore } from '../stores/packStore';
import { useCardPoolStore } from '../stores/cardPoolStore';
import { useUserDataStore } from '../stores/userDataStore';
import { useCurrencyStore } from '../stores/currencyStore';
import { useCardStore } from '../stores/cardStore'; 

// 💡 デバッグ用: useEffectの実行回数を監視するためのカウンターをグローバルに配置
let effectRunCount = 0; 
// 💡 デバッグ用: DB接続試行フラグをモジュールスコープに配置 (StrictMode対策)
let isDbConnectionAttempted = false; 

/**
 * アプリケーションの初期起動時に必要な全てのデータ（カードデータ、ストアデータ）をロードするフック
 * @returns {boolean} 全てのデータロードが完了したら true
 */
export const useInitialLoad = (): boolean => {
    // 1. useCardDataフックを使用して、全カードデータ（PackLogic）のロード状態を監視
    const { isLoaded: isCardDataLoaded } = useCardData();
    
    // 2. データベースとストアのロード状態を統合して監視
    const [isDbAndStoresLoaded, setIsDbAndStoresLoaded] = useState(false);
    const [isFatalError, setIsFatalError] = useState(false); // 致命的なDBエラーなどを監視

    useEffect(() => {
        effectRunCount += 1; // 実行回数をインクリメント
        console.log(`[useInitialLoad] 🚀 useEffect executed. Count: ${effectRunCount}, isCardDataLoaded: ${isCardDataLoaded}`);

        const initialize = async () => {
            try {
                // 1. データベース接続 (最優先)
                if (!isDbConnectionAttempted) { // 💡 Strict Modeで2回呼ばれてもDB接続は1回のみ試行する
                    isDbConnectionAttempted = true;
                    console.log("[useInitialLoad] Establishing database connection...");
                    await db.open(); 
                    console.log("✅ Database connection established successfully.");
                } else {
                    console.log("[useInitialLoad] Database connection already attempted. Skipping db.open().");
                }


                // カードデータがまだロードされていない場合は中断 (依存関係の制御)
                if (!isCardDataLoaded) {
                    console.log("[useInitialLoad] Waiting for Core Card Data to finish loading (1st pass). Exit.");
                    return; 
                }
                
                // 2. Zustandストアからのデータロード
                console.log("[useInitialLoad] Starting initial store data load (2nd pass)...");
                
                // アクションの取得はgetState()を使用
                const actions = [
                    usePackStore.getState().fetchAllPacks().then(() => console.log("   - Packs fetched.")),
                    useUserDataStore.getState().loadUserData().then(() => console.log("   - UserData loaded.")),
                    useCardPoolStore.getState().fetchCardPool().then(() => console.log("   - CardPool fetched.")),
                    useCurrencyStore.getState().fetchCurrency().then(() => console.log("   - Currency fetched.")),
                    useCardStore.getState().fetchAllCards().then(() => console.log("   - All Cards fetched.")), 
                ];

                // 全てのストアのロードアクションを並行して実行
                await Promise.all(actions);

                setIsDbAndStoresLoaded(true);
                console.log('✅ [useInitialLoad] All initial data loading completed. Setting isDbAndStoresLoaded=true.');

            } catch (error) {
                console.error('❌ [useInitialLoad] 致命的な初期化エラーが発生しました:', error);
                // 致命的なエラーとしてアプリ起動をブロック
                setIsFatalError(true); 
            }
        };
        
        initialize();

    }, [isCardDataLoaded]); // isCardDataLoaded の変更でのみ再実行される

    // 致命的なエラーが発生した場合、または全てのデータロードが完了した場合にのみ true を返す
    return isDbAndStoresLoaded && !isFatalError;
};