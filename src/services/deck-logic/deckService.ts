// src/services/deck-logic/deckService.ts

import type { Deck } from '../../models/deck';
import { v4 as uuidv4 } from 'uuid';

// 永続化キー
const STORAGE_KEY = 'tcg_deck_data';
const DELAY = 300; 

// --- localStorage 永続化ヘルパー関数 ---

/**
 * localStorageからデッキデータをロードし、Mapを復元する
 */
const loadFromStorage = (): Deck[] => {
    try {
        const json = localStorage.getItem(STORAGE_KEY);
        if (json) {
            const rawDecks = JSON.parse(json);
            // JSONから読み込んだ際にMap<string, number>を復元する
            return rawDecks.map((deck: any) => ({
                ...deck,
                mainDeck: new Map(deck.mainDeck), // Array<[string, number]> から Map へ
                sideDeck: new Map(deck.sideDeck),
                extraDeck: new Map(deck.extraDeck),
            }));
        }
    } catch (e) {
        console.error("Error loading decks from localStorage:", e);
    }
    return [];
};

/**
 * デッキデータをlocalStorageに保存する
 */
const saveToStorage = (decks: Deck[]) => {
    try {
        // MapをJSONが扱える Array<[string, number]> 形式に変換してから保存
        const serializableDecks = decks.map(deck => ({
            ...deck,
            mainDeck: Array.from(deck.mainDeck.entries()),
            sideDeck: Array.from(deck.sideDeck.entries()),
            extraDeck: Array.from(deck.extraDeck.entries()),
        }));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(serializableDecks));
    } catch (e) {
        console.error("Error saving decks to localStorage:", e);
    }
};

// 永続化をシミュレートするため、localStorageからデータを初期ロード
let currentDecks: Deck[] = loadFromStorage();

// 💡 注意: モックデータは、localStorageが空の場合のみ使用されるようにします。
if (currentDecks.length === 0) {
    const MOCK_DECKS: Deck[] = [
        {
            deckId: 'mock-001',
            name: '高速アグロ：レッド・バーン (初期MOCK)',
            description: 'このデッキはlocalStorageが空の場合に一度だけロードされます。',
            mainDeck: new Map([ ['card-a1', 4], ['card-b2', 3] ]),
            sideDeck: new Map(),
            extraDeck: new Map(),
            createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
            updatedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
            imageUrl: undefined,
            imgColor: 'red', 
            hasUnownedCards: false, 
        },
    ];
    currentDecks = [...MOCK_DECKS];
    saveToStorage(currentDecks); // モックデータも一度保存する
}


export const deckService = {
    
    // 🚨 修正1: currentDecks (localStorageからロードされたデータ) を返す
    async getAllDecks(): Promise<Deck[]> {
        return new Promise(resolve => {
            setTimeout(() => {
                // currentDecks は常に localStorage の状態を反映
                const deckCopies = currentDecks.map(deck => ({ 
                    ...deck, 
                    mainDeck: new Map(deck.mainDeck),
                    sideDeck: new Map(deck.sideDeck),
                    extraDeck: new Map(deck.extraDeck),
                }));
                console.log(`[DeckService] ${deckCopies.length} decks resolved from localStorage.`);
                resolve(deckCopies); 
            }, DELAY);
        });
    },

    // 🚨 修正2: currentDecks から ID 検索
    async getDeck(deckId: string): Promise<Deck | undefined> {
        return new Promise(resolve => {
            setTimeout(() => {
                const deck = currentDecks.find(d => d.deckId === deckId);
                if (deck) {
                    const deckCopy: Deck = {
                        ...deck,
                        mainDeck: new Map(deck.mainDeck),
                        sideDeck: new Map(deck.sideDeck),
                        extraDeck: new Map(deck.extraDeck),
                    };
                    resolve(deckCopy);
                } else {
                    resolve(undefined);
                }
            }, DELAY);
        });
    },

    // 🚨 修正3: currentDecks を更新し、localStorage に保存
    async saveDeck(deck: Deck): Promise<void> {
        return new Promise<void>(resolve => {
            setTimeout(() => {
                const existingIndex = currentDecks.findIndex(d => d.deckId === deck.deckId);
                
                if (existingIndex !== -1) {
                    currentDecks[existingIndex] = deck; // 更新
                    console.log(`[DeckService] Deck ${deck.deckId} updated.`);
                } else {
                    currentDecks.push({ ...deck, deckId: deck.deckId || uuidv4() }); // 新規追加
                    console.log(`[DeckService] Deck ${deck.deckId} saved (new).`);
                }
                
                saveToStorage(currentDecks); // 💡 localStorage に保存！
                resolve(); 
            }, DELAY);
        });
    },

    // 🚨 修正4: currentDecks を更新し、localStorage に保存
    async deleteDeck(deckId: string): Promise<void> {
        return new Promise(resolve => {
            setTimeout(() => {
                currentDecks = currentDecks.filter(d => d.deckId !== deckId);
                saveToStorage(currentDecks); // 💡 localStorage に保存！
                console.log(`[DeckService] Deck ${deckId} deleted.`);
                resolve(); 
            }, DELAY);
        });
    },

    // 🚨 修正5: currentDecks を更新し、localStorage に保存
    async importDecks(decksToImport: Deck[]): Promise<{ importedCount: number, renamedCount: number }> {
        return new Promise(resolve => {
             setTimeout(() => {
                 let importedCount = 0;
                 let renamedCount = 0;

                 decksToImport.forEach(newDeck => {
                    const existing = currentDecks.find(d => d.deckId === newDeck.deckId);
                    if (existing) {
                        newDeck.name = `${newDeck.name} (Imported)`;
                        newDeck.deckId = uuidv4();
                        renamedCount++;
                    }
                    currentDecks.push(newDeck);
                    importedCount++;
                 });
                 
                 saveToStorage(currentDecks); // 💡 localStorage に保存！
                 resolve({ importedCount, renamedCount });
             }, DELAY);
        });
    }
};