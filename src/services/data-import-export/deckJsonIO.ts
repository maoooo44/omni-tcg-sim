// src/services/data-import-export/deckJsonIO.ts

import type { Deck } from '../../models/deck';
import { exportDataToJson, importDataFromJson, type Serializer, type Deserializer } from './genericJsonIO';

// --- 固有の変換ロジックの定義 ---

/** デッキのMap構造をJSON互換配列に変換するシリアライザ */
const deckSerializer: Serializer<Deck[]> = (decks: Deck[]) => {
    return decks.map(d => ({
        ...d,
        // Map<string, number> を Array<[string, number]> 形式に変換
        mainDeck: Array.from(d.mainDeck.entries()), 
        sideDeck: Array.from(d.sideDeck.entries()),
        extraDeck: Array.from(d.extraDeck.entries()),
    }));
};

/** JSON互換配列をDeckのMap構造に復元するデシリアライザ */
const deckDeserializer: Deserializer<Deck[]> = (loadedData: any): Deck[] => {
    if (!Array.isArray(loadedData)) {
        throw new Error('JSONの形式が正しくありません。Deckの配列である必要があります。');
    }
    // JSON互換配列を Map 構造に復元
    return loadedData.map((d: any) => ({
        ...d,
        mainDeck: new Map(d.mainDeck),
        sideDeck: new Map(d.sideDeck),
        extraDeck: new Map(d.extraDeck),
    })) as Deck[];
};

// --- 汎用I/Oを使用した公開関数 ---

export const exportDecksToJson = (decks: Deck[]): string => {
    return exportDataToJson(decks, deckSerializer);
};

export const importDecksFromJson = (jsonText: string): Deck[] => {
    return importDataFromJson(jsonText, deckDeserializer);
};