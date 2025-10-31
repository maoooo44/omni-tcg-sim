/**
 * src/services/data-io/cardPoolJsonIO.ts
 *
 * * CardPoolState（主に Map 構造を持つ ownedCards）のデータ構造を
 * * JSON文字列へシリアライズ/デシリアライズ（Mapの変換/復元）するドメイン固有のI/Oサービス層モジュール。
 * * 責務:
 * 1. CardPoolStateオブジェクトをJSON互換の構造（MapをArray<[string, number]>）に変換するシリアライザの提供。
 * 2. JSON互換の構造をCardPoolState（Map構造）に復元するデシリアライザの提供。
 * 3. 汎用的なJSON I/Oユーティリティ（genericJsonIO）を利用し、ドメイン固有のI/Oインターフェース（export/import）を提供する。
 */

import type { CardPoolState } from '../../stores/cardPoolStore';
import { exportDataToJson, importDataFromJson, type Serializer, type Deserializer } from '../../utils/genericJsonIO';

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

/**
 * CardPoolStateをJSON文字列にエクスポートする。
 */
export const exportCardPoolToJson = (cardPoolState: CardPoolState): string => {
    return exportDataToJson(cardPoolState, cardPoolSerializer);
};

/**
 * JSON文字列からCardPoolStateをインポートする。
 */
export const importCardPoolFromJson = (jsonText: string): CardPoolState => {
    return importDataFromJson(jsonText, cardPoolDeserializer);
};