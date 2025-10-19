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
    
    // 💡 修正: DB接続が成功したことを示すフラグ（再試行トリガーとは分ける）
    const [isDbConnected, setIsDbConnected] = useState(false); 
    // 💡 修正: DB接続処理の実行を一度だけ制御するためのフラグ
    const [hasAttemptedDbConnection, setHasAttemptedDbConnection] = useState(false);


    useEffect(() => {
        const initialize = async () => {
            // 💡 修正: DB接続を一度だけ試行するロジック
            if (!hasAttemptedDbConnection) {
                setHasAttemptedDbConnection(true); // 試行フラグを立てる
                try {
                    // 1. データベース接続 (最優先)
                    console.log("[useInitialLoad] Establishing database connection...");
                    await db.open(); 
                    console.log("Database connection established successfully.");
                    setIsDbConnected(true); // DB接続成功
                } catch (error) {
                    console.error('❌ [useInitialLoad] 致命的な初期化エラーが発生しました:', error);
                    
                    // DBリセットロジック (以前の修正で削除済みか、コメントアウトされている前提)
                    if (error && ((error as any).name === 'ConstraintError' || (error as any).name === 'DatabaseClosedError')) {
                        console.warn('[useInitialLoad] ⚠️ 致命的なDB構造エラーを検出。データベースの削除と再構築を試みます。');
                        try {
                            // --------------------------------------------------------------------------------------------------
                            // 💡 データの誤削除防止のため、この部分はコメントアウトを維持（またはロジックを削除）
                            // --------------------------------------------------------------------------------------------------
                            /*
                            await db.delete();
                            console.log('✅ [useInitialLoad] データベース削除に成功しました。');
                            */
                            
                            // 再接続を促すためにフラグをリセット
                            setHasAttemptedDbConnection(false); 
                            setIsFatalError(false);
                        } catch (resetError) {
                            console.error('❌ [useInitialLoad] データベースの削除中にエラーが発生しました:', resetError);
                            setIsFatalError(true);
                        }
                    } else {
                        setIsFatalError(true);
                    }
                    setIsDbAndStoresLoaded(false); 
                    return; // DB接続失敗で終了
                }
            }
            
            // -----------------------------------------------------------------
            // 💡 DB接続が完了し、CardDataのロードが完了したらストアロードに進む
            // -----------------------------------------------------------------

            // DB未接続またはCardData未完了の場合は処理しない
            if (!isDbConnected || !isCardDataLoaded) {
                 if (isDbConnected && !isCardDataLoaded) {
                    console.log("[useInitialLoad] Waiting for Core Card Data to finish loading...");
                 }
                 // 💡 処理の続行は isCardDataLoaded の変更によってトリガーされる
                 return; 
            }
            
            // 2. Zustandストアからのデータロード
            console.log("[useInitialLoad] Starting initial store data load...");
            
            // アクションの取得はgetState()を使用
            const actions = [
                usePackStore.getState().fetchAllPacks(),
                useUserDataStore.getState().loadUserData(),
                useCardPoolStore.getState().fetchCardPool(),
                useCurrencyStore.getState().fetchCurrency(),
                useCardStore.getState().fetchAllCards(), 
            ];

            try {
                // 全てのストアのロードアクションを並行して実行
                await Promise.all(actions);

                setIsDbAndStoresLoaded(true);
                console.log('✅ [useInitialLoad] All initial data loading completed.');
            } catch (error) {
                 // ストアロード中のエラーハンドリング
                 console.error('❌ [useInitialLoad] ストアデータロード中にエラーが発生しました:', error);
                 setIsFatalError(true);
                 setIsDbAndStoresLoaded(false); 
            }
        };
        
        // 💡 修正: isDbConnected, isCardDataLoaded, hasAttemptedDbConnection を依存配列に追加
        // これで、DB接続完了、CardData完了のいずれかで処理が再実行されます。
        initialize();
    }, [isCardDataLoaded, isDbConnected, hasAttemptedDbConnection]); 

    // 致命的なエラーが発生した場合、または全てのデータロードが完了した場合にのみ true を返す
    return isDbAndStoresLoaded && !isFatalError;
};