/**
 * src/hooks/useCardData.ts
 *
 * アプリケーション全体のカードデータ（全パックのカード情報）を管理し、
 * ロード状態の追跡と、カード情報の取得ヘルパー関数を提供するカスタムフックです。
 * 主に、データの初期ロードを保証し、UIコンポーネントがカード情報にアクセスするための
 * シンプルなインターフェースを提供します。
 */

import { useEffect, useState } from 'react';
import { cardDataService } from '../services/pack-logic/CardDataService'; 
import type { Card } from '../models/card';

/**
 * アプリケーション全体のカードデータを扱うためのフック
 */
export const useCardData = () => {
    // データがロードされたかどうかを追跡
    const [isLoaded, setIsLoaded] = useState(false);
    
    useEffect(() => {
        // コンポーネントマウント時にカードデータをロード
        cardDataService.loadAllCardsFromCache() 
            .then((success: boolean) => {
                if (success) {
                    setIsLoaded(true);
                } else {
                    console.error('カードデータの初期ロードに失敗しました。');
                }
            });
    }, []);

    /**
     * IDからカード情報を取得するヘルパー関数
     * @param cardId カードID
     * @returns Cardオブジェクト、または見つからなかった場合は undefined
     */
    const getCardInfo = (cardId: string): Card | undefined => {
        return cardDataService.getCardById(cardId);
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
        // 必要に応じて、全カードリストなどを提供することも可能
        // getAllCards: () => cardDataService.getAllCards(), 
    };
};