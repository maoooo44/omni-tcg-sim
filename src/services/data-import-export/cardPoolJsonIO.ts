// src/services/data-import-export/cardPoolJsonIO.ts

import type { CardPoolState } from '../../stores/cardPoolStore';
import { exportDataToJson, importDataFromJson, type Serializer, type Deserializer } from './genericJsonIO';

// --- 固有の変換ロジックの定義 ---

/** カードプールのMap構造をJSON互換配列に変換するシリアライザ */
const cardPoolSerializer: Serializer<CardPoolState> = (cardPoolState: CardPoolState) => {
    return {
        ...cardPoolState,
        // Map<string, number> を Array<[string, number]> 形式に変換
        ownedCards: Array.from(cardPoolState.ownedCards.entries()),
    };
};

/** JSON互換配列をCardPoolStateのMap構造に復元するデシリアライザ */
const cardPoolDeserializer: Deserializer<CardPoolState> = (loadedData: any): CardPoolState => {
    if (!loadedData || !loadedData.ownedCards) {
        throw new Error('JSONの形式が正しくありません。CardPoolデータが必要です。');
    }
    // JSON互換配列を Map 構造に復元
    loadedData.ownedCards = new Map(loadedData.ownedCards);
    
    return loadedData as CardPoolState;
};

// --- 汎用I/Oを使用した公開関数 ---

export const exportCardPoolToJson = (cardPoolState: CardPoolState): string => {
    return exportDataToJson(cardPoolState, cardPoolSerializer);
};

export const importCardPoolFromJson = (jsonText: string): CardPoolState => {
    return importDataFromJson(jsonText, cardPoolDeserializer);
};