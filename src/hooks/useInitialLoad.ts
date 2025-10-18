/**
 * src/hooks/useInitialLoad.ts
 *
 * アプリケーションの初期起動時に必要な全ての非同期処理（IndexedDB接続、カードデータ、ストアデータ）をロードするカスタムフックです。
 * データの依存関係を調整し、初期化のオーケストレーションと、致命的なエラーハンドリングを担います。
 */

import { useEffect, useState } from 'react';
import { useCardData } from './useCardData'; 
import { db } from '../services/database/db'; // 💡 追加: DB接続のため
import { usePackStore } from '../stores/packStore';
import { useCardPoolStore } from '../stores/cardPoolStore';
import { useUserDataStore } from '../stores/userDataStore';
import { useCurrencyStore } from '../stores/currencyStore';
import { useCardStore } from '../stores/cardStore'; 

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
        const initialize = async () => {
            try {
                // 1. データベース接続 (最優先)
                console.log("[useInitialLoad] Establishing database connection...");
                await db.open(); 
                console.log("Database connection established successfully.");

                // カードデータがまだロードされていない場合は中断 (依存関係の制御)
                if (!isCardDataLoaded) {
                    console.log("[useInitialLoad] Waiting for Core Card Data to finish loading...");
                    return; 
                }
                
                // 2. Zustandストアからのデータロード
                console.log("[useInitialLoad] Starting initial store data load...");
                
                // アクションの取得はgetState()を使用
                const actions = [
                    usePackStore.getState().fetchPacks(),
                    useUserDataStore.getState().loadUserData(),
                    useCardPoolStore.getState().fetchCardPool(),
                    useCurrencyStore.getState().fetchCurrency(),
                    useCardStore.getState().fetchCards(), 
                ];

                // 全てのストアのロードアクションを並行して実行
                await Promise.all(actions);

                setIsDbAndStoresLoaded(true);
                console.log('✅ [useInitialLoad] All initial data loading completed.');

            } catch (error) {
                console.error('❌ [useInitialLoad] 致命的な初期化エラーが発生しました:', error);
                // DB接続失敗や初期データロード失敗はアプリの続行を妨げるため、エラー状態をセット
                setIsFatalError(true); 
                // エラーが発生してもローディング画面を解除したい場合は setIsDbAndStoresLoaded(true) にする選択肢もあるが、
                // 今回は致命的エラーとしてアプリ起動をブロックする動作を維持
            }
        };
        
        // isCardDataLoaded が true になったら次の処理を起動
        // DB接続は isCardDataLoaded のチェック前に行われるため、配列に入れるのは isCardDataLoaded のみでOK
        initialize();
    }, [isCardDataLoaded]); 

    // 致命的なエラーが発生した場合、または全てのデータロードが完了した場合にのみ true を返す
    // ユーザーは isReady && !isFatalError でメイン画面に進むか、ローディング画面/エラー画面を表示するかを決定できる
    return isDbAndStoresLoaded && !isFatalError;
};