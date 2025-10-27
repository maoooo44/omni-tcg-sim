/**
 * src/hooks/useCardData.ts
 */

import { useEffect, useState, useCallback } from 'react';
import { cardService } from '../services/cards/cardService';
import type { Card } from '../models/card';
import { packService } from '../services/packs/packService';
// ★ CardFieldSettings に加えて Pack もインポート
import type { Pack } from '../models/pack'; 

/**
 * アプリケーション全体のカードデータを扱うためのフック
 */
export const useCardData = () => {
    // データがロードされたかどうかを追跡
    const [isLoaded, setIsLoaded] = useState(false);
    
    useEffect(() => {
        // ロードロジックは変更なし
        cardService.fetchAllCards() 
            .then(() => { 
                setIsLoaded(true);
            })
            .catch((error: any) => { 
                console.error('カードデータロード中に予期せぬエラーが発生しました:', error);
                setIsLoaded(true); 
            });
    }, []);

    /**
     * IDからカード情報を非同期で取得するヘルパー関数 (fetchCardsByIdsを使用)
     */
    // useCallbackでラップし、不要な再生成を防ぐ
    const fetchCardInfo = useCallback(async (cardId: string): Promise<Card | undefined> => {
        const result = await cardService.fetchCardsByIds([cardId]);
        // [0] に結果が入る (Card | null)
        return result[0] ?? undefined;
    }, []);

    /**
     * ★ 修正: カードIDから、そのカードが属するパックの**情報全体**を非同期で取得する。
     * @param cardId カードID
     */
    const fetchPackInfoForCard = useCallback(async (cardId: string): Promise<Pack | undefined> => {
        // 1. cardId からカード情報を取得
        const card = await fetchCardInfo(cardId); 
        
        if (!card) {
            console.warn(`Card data not found for ID: ${cardId}`);
            return undefined;
        }

        try {
            // 2. card.packId を使ってパック情報を非同期で取得
            const packs = await packService.fetchPacksByIds([card.packId]);
            
            const pack = packs[0];

            if (!pack) {
                console.warn(`Pack data not found for ID: ${card.packId}.`);
                return undefined;
            }

            // 3. パック全体を返却
            return pack;
        } catch (error) {
            console.error(`Failed to fetch pack data for card ${cardId}:`, error);
            return undefined;
        }
    }, [fetchCardInfo]); // fetchCardInfo に依存

    /**
     * IDからカード名を取得する関数（UIでの利用を想定）
     */
    const fetchCardName = useCallback(async (cardId: string): Promise<string> => {
        const card = await fetchCardInfo(cardId);
        // カードオブジェクトの name プロパティにアクセス
        return card?.name ?? '不明なカード';
    }, [fetchCardInfo]);

    return {
        isLoaded,
        fetchCardInfo,
        fetchCardName,
        // ★ fetchCardFieldSettings を fetchPackInfoForCard に置き換え
        fetchPackInfoForCard,
    };
};