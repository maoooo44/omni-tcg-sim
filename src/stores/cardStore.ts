/**
* src/stores/cardStore.ts
*
* Zustandを使用してアプリケーション全体のカードデータを管理するストア。
* CardDataServiceを介してIndexedDBと連携し、カードのCRUD操作とフィルタリングを提供する。
*/

import { create } from 'zustand';
import type { Card } from '../models/card'; 
import { cardDataService } from '../services/pack-logic/CardDataService'; // サービス層をインポート

export interface CardStore { 
    cards: Card[];
    
    // CRUD操作
    createCard: (card: Card) => Promise<void>;
    updateCard: (card: Card) => Promise<void>;
    deleteCard: (cardId: string) => Promise<void>;
    loadAllCards: () => Promise<void>; // サービス層からのロードに統一
    
    // 便利メソッド (既存)
    getCardsByPackId: (packId: string) => Card[];

    // packIdを指定してカードをストアから削除（DB操作はPackServiceが完了済みを想定）
    deleteCardsByPackId: (packId: string) => void; 

    // CSV I/O アクション
    importCards: (cardsToImport: Card[]) => Promise<{ importedCount: number, updatedCount: number }>;
    exportCardsToCsv: (packId: string) => Promise<string>;
}

export const useCardStore = create<CardStore>((set, get) => ({
    cards: [], 
    
    // DB操作はCardDataServiceに委譲
    createCard: async (newCard) => {
        try {
            await cardDataService.addCard(newCard); // サービス経由
            set({ cards: cardDataService.getAllCards() }); // キャッシュから再取得
        } catch (error) {
            console.error("Failed to create card:", error);
            throw error;
        }
    },
    
    // DB操作はCardDataServiceに委譲
    updateCard: async (updatedCard) => {
        try {
            await cardDataService.updateCard(updatedCard); // サービス経由
            set({ cards: cardDataService.getAllCards() }); // キャッシュから再取得
        } catch (error) {
            console.error("Failed to update card:", error);
            throw error;
        }
    },
    
    // DB操作はCardDataServiceに委譲
    deleteCard: async (cardId) => {
        try {
            await cardDataService.deleteCard(cardId); // サービス経由
            set({ cards: cardDataService.getAllCards() }); // キャッシュから再取得
        } catch (error) {
            console.error("Failed to delete card:", error);
            throw error;
        }
    },
    
    // ロードもサービス層のキャッシュロードを利用
    loadAllCards: async () => {
        try {
            await cardDataService.loadAllCardsFromCache(); // サービス経由でDBからロード
            const allCards = cardDataService.getAllCards();
            set({ cards: allCards });
            console.log(`[CardStore] Successfully loaded ${allCards.length} cards via CardDataService.`);
        } catch (error) {
            console.error("Failed to load cards:", error);
        }
    },

    getCardsByPackId: (packId) => {
        return get().cards.filter(card => card.packId === packId);
    },

    // packIdでメモリ上のカードを削除する (PackServiceがDB削除を担当するため、これはストアの状態更新のみ)
    deleteCardsByPackId: (packId) => {
        set((state) => ({
            cards: state.cards.filter(card => card.packId !== packId)
        }));
        // 注: DBからの削除はPackServiceやCardDataServiceで行う必要がある。
        console.log(`[CardStore] Memory state cleared for pack ID: ${packId}`);
    },

    // CSV一括インポートアクション
    importCards: async (cardsToImport) => {
        try {
            const existingIds = new Set(get().cards.map(c => c.cardId));
            const cardsToUpdate = cardsToImport.filter(card => existingIds.has(card.cardId));
            const newCards = cardsToImport.filter(card => !existingIds.has(card.cardId));

            // DBへの書き込み (一括でput) をサービス層に委譲
            await cardDataService.bulkPutCards(cardsToImport);

            // Store Stateの更新は、サービス層のキャッシュ更新結果を反映
            set({ cards: cardDataService.getAllCards() }); 

            return { importedCount: newCards.length, updatedCount: cardsToUpdate.length };
        } catch (error) {
            console.error("Failed to import cards:", error);
            throw new Error("カードデータの一括インポートに失敗しました。");
        }
    },
    
    // カードのエクスポートロジック (変更なし、メモリ上の状態を使用)
    exportCardsToCsv: async (packId) => {
        const targetCards = get().cards.filter(c => c.packId === packId);
        if (targetCards.length === 0) return "";
        
        // CSVのヘッダー定義
        const headers = ['cardId', 'packId', 'name', 'rarity', 'imageUrl', 'userCustomKeys', 'userCustomValues'];
        
        const rows = targetCards.map(card => {
            // userCustom をシンプルな文字列にする
            const customKeys = Object.keys(card.userCustom || {}).join('|');
            const customValues = Object.values(card.userCustom || {}).join('|');

            return [
                card.cardId,
                card.packId,
                card.name,
                card.rarity,
                card.imageUrl,
                customKeys,
                customValues,
            ].map(field => `\"${String(field || '').replace(/\"/g, '\"\"')}\"`).join(','); // CSVエンコード
        });
        
        return [headers.map(h => `\"${h}\"`).join(','), ...rows].join('\n');
    }
}));