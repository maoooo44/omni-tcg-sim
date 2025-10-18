/**
 * src/hooks/useCardData.ts
 *
 * アプリケーション全体のカードデータ（全パックのカード情報）を管理し、
 * ロード状態の追跡と、カード情報の取得ヘルパー関数を提供するカスタムフックです。
 * 主に、データの初期ロードを保証し、UIコンポーネントがカード情報にアクセスするための
 * シンプルなインターフェースを提供します。
 */

import { useEffect, useState } from 'react';
import { cardDataService } from '../services/cards/cardDataService'; 
import type { Card } from '../models/card';

/**
 * アプリケーション全体のカードデータを扱うためのフック
 */
export const useCardData = () => {
    // データがロードされたかどうかを追跡
    const [isLoaded, setIsLoaded] = useState(false);
    
    useEffect(() => {
        // コンポーネントマウント時にカードデータをロードし、キャッシュに格納
        cardDataService.loadAllCardsFromCache() 
            .then((success: boolean) => {
                if (success) {
                    setIsLoaded(true);
                } else {
                    // ロード失敗時でも、アプリの動作を止めず、ログを出力
                    console.error('カードデータの初期ロードに失敗しました。');
                    // ロードが完了したと見なして isLoaded を true にするか、
                    // エラー状態を別途保持するかは、アプリケーションの要件によるが、ここでは一旦 true にする選択肢もある
                    // 例: setIsLoaded(true); // ロード試行は完了
                }
            })
            // エラーをキャッチして、フック外に影響を与えないようにする
            .catch(error => {
                console.error('カードデータロード中に予期せぬエラーが発生しました:', error);
                // setIsLoaded(true); // エラーでも試行は完了
            });
    }, []);

    /**
     * IDからカード情報を取得するヘルパー関数 (キャッシュから同期的に取得)
     * @param cardId カードID
     * @returns Cardオブジェクト、または見つからなかった場合は undefined
     */
    const getCardInfo = (cardId: string): Card | undefined => {
        return cardDataService.getCardByIdFromCache(cardId);
    };

    /**
     * IDからカード名を取得する関数（UIでの利用を想定）
     * @param cardId カードID
     * @returns カード名、または不明な場合は '不明なカード'
     */
    const getCardName = (cardId: string): string => {
        // getCardInfoの結果を利用し、不明な場合はフォールバック
        return getCardInfo(cardId)?.name ?? '不明なカード';
    };

    return {
        isLoaded,
        getCardInfo,
        getCardName,
        // getAllCards: () => cardDataService.getAllCards(), // 必要に応じてキャッシュにある全データも公開可能
    };
};