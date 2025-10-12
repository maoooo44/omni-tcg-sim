// src/stores/deckStore.ts

import { create } from 'zustand';
import type { Deck } from '../models/deck'; 
import { v4 as uuidv4 } from 'uuid'; 
import { deckService } from '../services/deck-logic/deckService';
import { useCardPoolStore } from './cardPoolStore'; 

// デフォルトの空デッキを生成するユーティリティ関数（ストア内部で使用）
const createDefaultDeck = (id?: string): Deck => ({
    deckId: id || uuidv4(), 
    name: '新規デッキ',
    description: '',
    mainDeck: new Map(), // Map<cardId, count>
    sideDeck: new Map(),
    extraDeck: new Map(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    // 💡 修正: imgColor プロパティにデフォルト値 'default' を設定
    imgColor: 'default', 
    hasUnownedCards: false, 
});

/**
 * デッキ全体をチェックし、必要な枚数が所有枚数を超えているかを確認するヘルパー関数。
 */
const checkUnownedCards = (deck: Deck): boolean => {
    const ownedCards = useCardPoolStore.getState().ownedCards;
    const allDeckCardEntries = [
        ...deck.mainDeck.entries(),
        ...deck.sideDeck.entries(),
        ...deck.extraDeck.entries(),
    ];
    for (const [cardId, requiredCount] of allDeckCardEntries) { 
        if (requiredCount > 0 && (ownedCards.get(cardId) || 0) < requiredCount) {
            return true;
        }
    }
    return false;
};

// 💡 DeckStateの定義 (変更なし)
export interface DeckState {
    currentDeck: Deck; 
    decks: Deck[]; 
    isLoading: boolean;
    loadDecks: () => Promise<void>;
    getDeckById: (deckId: string) => Deck | undefined;
    startNewDeckEditing: () => string; 
    loadDeckForEdit: (deckId: string) => Promise<void>; // 戻り値の型を void から Promise<void> に変更
    updateDeckInfo: (info: Partial<Omit<Deck, 'mainDeck' | 'sideDeck' | 'extraDeck'>>) => void;
    updateCardCount: (zone: keyof Pick<Deck, 'mainDeck' | 'sideDeck' | 'extraDeck'>, cardId: string, count: number) => void;
    addCardToDeck: (cardId: string, zone: keyof Pick<Deck, 'mainDeck' | 'sideDeck' | 'extraDeck'>) => void;
    removeCardFromDeck: (cardId: string, zone: keyof Pick<Deck, 'mainDeck' | 'sideDeck' | 'extraDeck'>) => void;
    saveDeck: () => Promise<void>; 
    deleteDeck: (deckId: string) => Promise<void>;
    importDecks: (decksToImport: Deck[]) => Promise<{ importedCount: number, renamedCount: number }>;
}

const initialState = {
    decks: [] as Deck[],
    currentDeck: createDefaultDeck(),
    isLoading: false,
};

export const useDeckStore = create<DeckState>((set, get) => ({
    ...initialState,
    
    // --- デッキ一覧管理アクション (DB連携を有効化) ---
    loadDecks: async () => {
        set({ isLoading: true });
        try {
            // 🚨 修正1: DB呼び出しを有効化
            const deckList = await deckService.getAllDecks(); 
            
            set({ decks: deckList });
            console.log(`✅ [DeckStore] ${deckList.length} decks loaded from DB.`);
        } catch (error) {
            console.error("Failed to load decks:", error);
            set({ decks: [] }); 
        } finally {
            set({ isLoading: false });
        }
    },
    
    getDeckById: (deckId: string) => {
        return get().decks.find(d => d.deckId === deckId);
    },
    
    startNewDeckEditing: () => {
        const newDeck = createDefaultDeck(); 
        set({ currentDeck: newDeck });
        return newDeck.deckId; 
    },
    
    loadDeckForEdit: async (deckId) => { // 戻り値の型を async で Promise<void> に
        console.log(`[DeckStore] 2. loadDeckForEdit called for ID: ${deckId}.`); 
        
        if (get().currentDeck.deckId === deckId && !get().decks.some(d => d.deckId === deckId)) {
            return;
        }

        try {
            // 🚨 修正2: DB呼び出しを有効化
            const deck = await (deckService as any).getDeck(deckId); 
            
            if (deck) {
                const deckCopy: Deck = {
                    ...deck,
                    mainDeck: new Map(deck.mainDeck),
                    sideDeck: new Map(deck.sideDeck),
                    extraDeck: new Map(deck.extraDeck),
                };
                set({ currentDeck: deckCopy });
            } else {
                set({ currentDeck: createDefaultDeck(deckId) });
            }
        } catch (error) {
             console.error(`[DeckStore] Failed to load deck ${deckId}:`, error);
             set({ currentDeck: createDefaultDeck() }); 
        }
    },

    // 🚨 修正3: updateDeckInfo, updateCardCount, addCardToDeck, removeCardFromDeck を実装
    
    updateDeckInfo: (info) => {
        set(state => ({
            currentDeck: { ...state.currentDeck, ...info },
        }));
    },
    
    updateCardCount: (zone, cardId, count) => {
        set(state => {
            const newMap = new Map(state.currentDeck[zone]);
            if (count > 0) {
                newMap.set(cardId, count);
            } else {
                newMap.delete(cardId);
            }
            
            const updatedDeck = {
                ...state.currentDeck,
                [zone]: newMap,
            } as Deck; 

            const hasUnownedCards = checkUnownedCards(updatedDeck);
            
            return {
                currentDeck: {
                    ...updatedDeck,
                    hasUnownedCards: hasUnownedCards,
                }
            };
        });
    },
    
    addCardToDeck: (cardId, zone) => {
        const state = get();
        const currentCount = state.currentDeck[zone].get(cardId) || 0;
        state.updateCardCount(zone, cardId, currentCount + 1);
    },

    removeCardFromDeck: (cardId, zone) => {
        const state = get();
        const currentCount = state.currentDeck[zone].get(cardId) || 0;
        if (currentCount > 0) {
            state.updateCardCount(zone, cardId, currentCount - 1);
        }
    },

    // --- DB連携アクション ---

    saveDeck: async () => {
        const deckToSave = get().currentDeck;
        
        try {
            const finalHasUnownedCards = checkUnownedCards(deckToSave);
            const finalDeckToSave: Deck = { 
                ...deckToSave, 
                hasUnownedCards: finalHasUnownedCards,
                updatedAt: new Date().toISOString(), 
            };
            
            // 🚨 修正4: DBサービスへの保存を有効化
            await deckService.saveDeck(finalDeckToSave);
            
            await get().loadDecks(); 

            set({ currentDeck: finalDeckToSave });

            console.log(`Deck ${finalDeckToSave.deckId} saved/updated successfully.`);

        } catch (error) {
            console.error('Failed to save deck:', error);
            throw new Error('デッキの保存に失敗しました。');
        }
    },
    
    deleteDeck: async (deckId) => {
        // 🚨 修正5: DB削除を有効化
        await deckService.deleteDeck(deckId);
        
        set(state => {
            const newDecks = state.decks.filter(d => d.deckId !== deckId); 
            
            const newCurrentDeck = state.currentDeck.deckId === deckId 
                ? createDefaultDeck() 
                : state.currentDeck;

            return { decks: newDecks, currentDeck: newCurrentDeck };
        });
        console.log(`Deck ${deckId} deleted.`);
    },
        
    importDecks: async (decksToImport) => {
        // 🚨 修正6: DBインポートを有効化
        const result = await deckService.importDecks(decksToImport);

        await get().loadDecks(); 
        
        return result;
    },
}));