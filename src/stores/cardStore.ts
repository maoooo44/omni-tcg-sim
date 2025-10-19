/**
 * src/stores/cardStore.ts
 *
 * Card（カード）データのグローバルな状態管理を行うZustandストア。
 * 責務は、カードのリスト（cards）の保持、およびカードに関する非同期操作の実行とStoreの同期です。
 */
import { create } from 'zustand';
import type { Card } from '../models/card';
// 💡 修正: Serviceのファイル名を変更
import { cardService } from '../services/cards/cardService';
// I/O責務分離のため cardCsvIO をインポート
import * as cardCsvIO from '../services/data-io/cardCsvIO';

// 💡 追加: customFieldDefs の型をインポート
import type { CustomFieldDefinition } from '../services/data-io/dataIOUtils'; 

// 💡 修正: importCardsFromCsv の戻り値の型
export interface ImportResult {
    importedCount: number;
    updatedCount: number;
}

export interface CardStore {
    cards: Card[];
    isLoading: boolean;

    // ----------------------------------------------------------------------
    // --- 1. 参照/ロード (コレクション指定の個別アクションに統一) ---
    // ----------------------------------------------------------------------
    fetchAllCards: () => Promise<void>;
    fetchCardById: (cardId: string) => Promise<Card | null>; 
    /** * @NEW: 指定されたパックIDに紐づくカード群をDBまたはキャッシュから取得します。（単数）
     */
    fetchCardsByPackId: (packId: string) => Promise<Card[]>; // 👈 既存
    /** * @NEW: 指定されたパックID（配列）に紐づくカード群をDBまたはキャッシュから取得します。（一括）
     */
    bulkFetchCardsByPackIds: (packIds: string[]) => Promise<Card[]>; // 👈 追加
    
    // --- 2. CRUD/永続化 (physical delete) ---
    saveCard: (card: Card) => Promise<void>; 
    deleteCard: (cardId: string) => Promise<void>; 

    // --- 4. メモリ/ストア操作 (Stateに対する低レベル操作) ---
    syncCardToStore: (card: Card) => void;
    removeCardFromStore: (cardId: string) => void;
    bulkSyncCardsToStore: (cardsToSync: Card[]) => void;
    bulkRemoveCardsFromStore: (cardIds: string[]) => void;
    removeCardsFromStoreByPackId: (packId: string) => void;

    // --- 5. 一括/I/O ---
    bulkSaveCards: (cards: Card[]) => Promise<void>;
    bulkDeleteCards: (cardIds: string[]) => Promise<void>; 
    // 💡 修正: customFieldDefs を受け取るようにシグネチャを変更
    importCardsFromCsv: (packId: string, csvText: string, customFieldDefs: CustomFieldDefinition[]) => Promise<ImportResult>;
    exportCardsToCsv: (packId: string) => Promise<string>;
}

const initialState = {
    cards: [] as Card[], 
    isLoading: false,
};

export const useCardStore = create<CardStore>((set, get) => ({
    ...initialState,
    
    // ----------------------------------------------------------------------
    // --- 1. 参照/ロード (個別アクション) ---
    // ----------------------------------------------------------------------
    
    fetchAllCards: async () => { set({ isLoading: true });
        console.log(`[CardStore:fetchAllCards] 🚀 START loading main cards.`);
        
        try {
            // Service層でDBロードを行う 
            // 💡 修正: cardDataService -> cardService に変更
            const allCards = await cardService.fetchAllCards(); 
            set({ cards: allCards });
            console.log(`[CardStore:fetchAllCards] ✅ Loaded ${allCards.length} cards for display.`);
        } catch (error) {
            console.error(`[CardStore:fetchAllCards] ❌ Failed to load cards:`, error); 
            set({ cards: [] });
        } finally {
            set({ isLoading: false });
        }
    },

    fetchCardById: async (cardId: string) => {
        try {
            // 💡 修正: cardDataService -> cardService に変更
            const cards = await cardService.fetchCardsByIds([cardId]);
            return cards[0] || null; 
        } catch (error) {
            console.error(`[CardStore:fetchCardById] Failed to load card ${cardId}:`, error);
            return null;
        }
    },

    /**
     * @NEW: 指定されたパックIDに紐づくカード群をDBまたはキャッシュから取得します。（単数）
     * Storeのcardsは更新しません。
     */
    fetchCardsByPackId: async (packId: string) => { // 👈 既存実装の利用
        try {
            // 💡 cardServiceにfetchCardsByPackIdsを実装する必要があります。
            const cards = await cardService.fetchCardsByPackIds([packId]);
            return cards;
        } catch (error) {
            console.error(`[CardStore:fetchCardsByPackId] Failed to load cards for pack ${packId}:`, error);
            return [];
        }
    },

    /**
     * @NEW: 指定されたパックID（配列）に紐づくカード群をDBまたはキャッシュから一括取得します。
     * Storeのcardsは更新しません。 (修正箇所)
     */
    bulkFetchCardsByPackIds: async (packIds: string[]) => { // 👈 新規実装
        if (packIds.length === 0) return [];
        try {
            // Service層で複数のPack IDに対する一括取得（DBクエリまたは並列フェッチ）を委譲
            const cards = await cardService.fetchCardsByPackIds(packIds);
            return cards;
        } catch (error) {
            console.error(`[CardStore:bulkFetchCardsByPackIds] Failed to load cards for ${packIds.length} packs:`, error);
            return [];
        }
    },
    // ----------------------------------------------------------------------
    // --- 2. CRUD/永続化 ---
    // ----------------------------------------------------------------------
    
    saveCard: async (cardToSave) => {
        try {
            // ServiceのsaveCardsが更新日時、numberを設定し、最新のCard配列を返す
            // 💡 修正: cardDataService.bulkSaveCards -> cardService.saveCards に変更
            const savedCards = await cardService.saveCards([cardToSave]);
            
            if (savedCards.length > 0) {
                 get().syncCardToStore(savedCards[0]);
            } else {
                 throw new Error("Card save failed, service returned no cards.");
            }
        } catch (error) {
            console.error("[CardStore:saveCard] Failed to save card:", error);
            throw error;
        }
    },
    
    deleteCard: async (cardId) => {
        console.log(`[CardStore:deleteCard] 💥 START physical deletion: ${cardId}`);
        try {
            // 1. ServiceにメインDBからの物理削除を委譲。
            // 💡 修正: cardDataService -> cardService に変更
            await cardService.deleteCards([cardId]); 
            
            // 2. Storeから削除
            get().removeCardFromStore(cardId);

            console.log(`[CardStore:deleteCard] ✅ Card physically deleted and removed from store: ${cardId}`);
        } catch (error) {
            console.error("[CardStore:deleteCard] ❌ Failed to delete card:", error);
            throw error;
        }
    },
    
    // ----------------------------------------------------------------------
    // --- 4. メモリ/ストア操作 (既存のまま) ---
    // ----------------------------------------------------------------------
    
    syncCardToStore: (updatedCard) => {
        set(state => {
            const index = state.cards.findIndex(card => card.cardId === updatedCard.cardId);
            if (index !== -1) {
                const newCards = [...state.cards];
                newCards[index] = updatedCard;
                return { cards: newCards };
            } else {
                return { cards: [...state.cards, updatedCard] };
            }
        });
    },

    removeCardFromStore: (cardId) => {
        set(state => ({
            cards: state.cards.filter(c => c.cardId !== cardId)
        }));
        console.log(`[CardStore] Memory state cleared for card ID: ${cardId}`);
    },

    bulkSyncCardsToStore: (cardsToSync: Card[]) => {
        set(state => {
            const updatedCardsMap = new Map(state.cards.map(c => [c.cardId, c]));
            cardsToSync.forEach(card => {
                updatedCardsMap.set(card.cardId, card);
            });
            return { cards: Array.from(updatedCardsMap.values()) };
        });
    },

    bulkRemoveCardsFromStore: (cardIdsToRemove: string[]) => {
        const idSet = new Set(cardIdsToRemove);
        set(state => ({
            cards: state.cards.filter(c => !idSet.has(c.cardId))
        }));
        console.log(`[CardStore] Memory state cleared for ${cardIdsToRemove.length} cards.`);
    },

    removeCardsFromStoreByPackId: (packId) => {
        set((state) => ({
            cards: state.cards.filter(card => card.packId !== packId)
        }));
        console.log(`[CardStore:removeCardsFromStoreByPackId] Memory state cleared for pack ID: ${packId}`);
    },

    // ----------------------------------------------------------------------
    // --- 5. 一括/I/O ---
    // ----------------------------------------------------------------------

    bulkSaveCards: async (cardsToFinalize: Card[]) => {
        try {
            if (cardsToFinalize.length === 0) return;
            
            // 💡 修正: cardDataService.bulkSaveCards -> cardService.saveCards に変更
            const savedCards = await cardService.saveCards(cardsToFinalize);
            
            get().bulkSyncCardsToStore(savedCards);

            console.log(`[CardStore:bulkSaveCards] ✅ Bulk save finished for ${savedCards.length} cards. Store state updated.`);
        } catch (error) {
            console.error("Failed to bulk save cards:", error);
            throw error;
        }
    },
    
    bulkDeleteCards: async (cardIds: string[]) => {
        try {
            if (cardIds.length === 0) return;
            // 💡 修正: cardDataService -> cardService に変更
            await cardService.deleteCards(cardIds);
            
            get().bulkRemoveCardsFromStore(cardIds);
            console.log(`[CardStore:bulkDeleteCards] ✅ Successfully deleted ${cardIds.length} cards.`);
        } catch (error) {
            console.error("Failed to bulk delete cards:", error);
            throw error;
        }
    },

    // 💡 修正: customFieldDefs を受け取るようにシグネチャと実装を変更
    importCardsFromCsv: async (
        packId: string, 
        csvText: string, 
        customFieldDefs: CustomFieldDefinition[]
    ): Promise<ImportResult> => {
        try {
            // 1. I/O Service に CSVパースと Card オブジェクトへのマッピングを完全に委譲
            const cardsToImport = await cardCsvIO.importCardsFromCsv(packId, csvText, customFieldDefs);

            if (cardsToImport.length === 0) {
                return { importedCount: 0, updatedCount: 0 };
            }

            // 2. Serviceのバルク参照関数を使用して既存カードIDを取得 (新規/更新のカウントのため)
            const cardIdsToCacheCheck = cardsToImport.map(c => c.cardId);
            const fetchedCards = await cardService.fetchCardsByIds(cardIdsToCacheCheck);
            const preExistingCardIds = new Set(fetchedCards
                .filter((c): c is Card => c !== null)
                .map(c => c.cardId)
            );

            // 3. DB保存はServiceに委譲。
            const savedCards = await cardService.saveCards(cardsToImport);

            // 4. Storeを同期
            get().bulkSyncCardsToStore(savedCards);

            // 5. 結果を計算
            const importedCount = savedCards.filter(card => !preExistingCardIds.has(card.cardId)).length;
            const updatedCount = savedCards.length - importedCount;

            return { importedCount: importedCount, updatedCount: updatedCount };
        } catch (error) {
            console.error("[CardStore:importCardsFromCsv] Failed to import cards:", error);
            // ユーザーに表示するエラーメッセージは、ServiceまたはHookでより具体的に生成されるべき
            throw new Error("カードデータの一括インポートに失敗しました。");
        }
    },
    
    exportCardsToCsv: async (packId) => {
        try {
            // 1. Service層からエクスポート対象のデータ（メインコレクション）を取得
            const cardsToExport = await cardService.fetchCardsByPackIds([packId]); 
            
            // 2. I/O ServiceにCSV生成を委譲
            const csvString = await cardCsvIO.exportCardsToCsv(cardsToExport);
            return csvString;
        } catch (error) {
            console.error("[CardStore:exportCardsToCsv] ❌ Failed to export cards:", error);
            throw error;
        }
    },
}));