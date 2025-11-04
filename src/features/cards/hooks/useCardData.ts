/**
 * src/features/cards/hooks/useCardData.ts
 *
 * * アプリケーションのグローバルなカードデータアクセスを一元管理するためのカスタムフック。
 * データの初期ロード状態を追跡し、IDをキーとした非同期的なカード情報および関連パック情報の取得機能を提供します。
 *
 * * 責務:
 * 1. 初期ロード時に `cardService` を介して全カードデータをロードし、状態 (`isLoaded`) を管理する。
 * 2. IDから単一または複数のカード情報を非同期で取得するラッパー関数 (`fetchCardInfo`) を提供する。
 * 3. カードIDから、そのカードが属するパック全体の情報を非同期で取得する複合関数 (`fetchPackInfoForCard`) を提供する。
 * 4. UI表示用のカード名取得ヘルパー関数 (`fetchCardName`) を提供する。
 */

import { useEffect, useState, useCallback } from 'react';
import { cardService } from '../../../services/cards/cardService';
import type { Card, Pack } from '../../../models/models';
import { packService } from '../../../services/packs/packService';

/**
 * アプリケーション全体のカードデータを扱うためのフック
 */
export const useCardData = () => {
    // データがロードされたかどうかを追跡
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        // ロードロジック
        cardService.fetchAllCards()
            .then(() => {
                setIsLoaded(true);
            })
            .catch((error: any) => {
                console.error('カードデータロード中に予期せぬエラーが発生しました:', error);
                // エラーが発生した場合もUIを表示するためロード完了とする
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
     * カードIDから、そのカードが属するパックの**情報全体**を非同期で取得する。
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
        fetchPackInfoForCard,
    };
};