// src/hooks/useCardData.ts (修正後)

import { useEffect, useState } from 'react';
import { cardService } from '../services/cards/cardService'; // 変更なし
import type { Card } from '../models/card';

/**
 * アプリケーション全体のカードデータを扱うためのフック
 */
export const useCardData = () => {
    // データがロードされたかどうかを追跡
    const [isLoaded, setIsLoaded] = useState(false);
    
    useEffect(() => {
        // コンポーネントマウント時にカードデータをロードし、キャッシュに格納
        // 💡 修正: getAllCardsFromCache() (同期) ではなく、fetchAllCards() (非同期: キャッシュヒットなければDB) を呼び出す
        cardService.fetchAllCards() 
            .then(() => { // 💡 修正: thenの引数は Card[] ですが、ここではロード完了フラグ設定に使うため、引数は不要。
                // ロード試行が完了し、キャッシュが構築されたらフラグを立てる
                setIsLoaded(true);
            })
            // エラーをキャッチして、フック外に影響を与えないようにする
            .catch((error: any) => { // 💡 修正: error に any 型アノテーションを追加 (TS7006)
                console.error('カードデータロード中に予期せぬエラーが発生しました:', error);
                // エラー時でもロード試行は完了とみなし、isLoaded を true にする
                setIsLoaded(true); 
            });
    }, []);

    /**
     * IDからカード情報を取得するヘルパー関数 (キャッシュから同期的に取得)
     * ...
     */
    const getCardInfo = (cardId: string): Card | undefined => {
        return cardService.getCardByIdFromCache(cardId);
    };

    /**
     * IDからカード名を取得する関数（UIでの利用を想定）
     * ...
     */
    const getCardName = (cardId: string): string => {
        // getCardInfoの結果を利用し、不明な場合はフォールバック
        return getCardInfo(cardId)?.name ?? '不明なカード';
    };

    return {
        isLoaded,
        getCardInfo,
        getCardName,
        // ...
    };
};