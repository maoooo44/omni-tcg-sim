/**
 * src/stores/cardStore.ts
 *
 * Card（カード）データのグローバルな状態管理を行うZustandストア。
 * 責務は、カードのリスト（cards）の保持、およびカードに関する非同期操作の実行とStoreの同期です。
 */
import { create } from 'zustand';
import type { Card } from '../models/card';
// Serviceから CollectionKey 型をインポート
import { cardDataService, type CollectionKey } from '../services/cards/cardDataService';
// 💡 修正 (項目 3, 5): I/O責務分離のため cardCsvIO をインポート (※ファイルは後で作る前提)
import * as cardCsvIO from '../services/data-io/cardCsvIO';
import { useUserDataStore } from './userDataStore';


export interface CardStore {
    cards: Card[];

    // ----------------------------------------------------------------------
    // --- 1. 参照/ロード (コレクション指定の個別アクションに統一) --- (項目4)
    // ----------------------------------------------------------------------
    // 💡 修正: 汎用アクション(fetchAllCardsFromCollection, fetchCardByIdFromCollection)を廃止し、個別アクションに分離。
    fetchAllCards: () => Promise<void>;
    fetchCardById: (cardId: string) => Promise<Card | null>;
    
    // --- 2. CRUD/永続化 (move/restore/physical delete) ---
    saveCard: (card: Card) => Promise<void>;
    moveCardToTrash: (cardId: string) => Promise<void>;
    
    // --- 4. メモリ/ストア操作 (Stateに対する低レベル操作) ---
    syncCardToStore: (card: Card) => void;
    removeCardFromStore: (cardId: string) => void;
    bulkSyncCardsToStore: (cardsToSync: Card[]) => void;
    bulkRemoveCardsFromStore: (cardIds: string[]) => void;
    removeCardsFromStoreByPackId: (packId: string) => void;

    // --- 5. 一括/I/O ---
    bulkSaveCards: (cards: Card[]) => Promise<void>;
    bulkDeleteCards: (cardIds: string[]) => Promise<void>; 
    // 💡 修正 (項目 3, 5): インポートはCSVデータを受け取る形式に変更（StoreがI/Oワークフローの調整役になるため）
    importCards: (csvText: string, packId: string) => Promise<{ importedCount: number, updatedCount: number }>;
    exportCardsToCsv: (packId: string) => Promise<string>;

    // --- 6. 📜 履歴アクション ---
    /*fetchAllCardsFromHistory: () => Promise<Card[]>;
    fetchCardByIdFromHistory: (historyId: string) => Promise<Card | null>;
    saveCardToHistory: (cardId: string) => Promise<void>;
    restoreCardFromHistory: (historyId: string) => Promise<void>;*/

    // --- 7. 🗑️ ゴミ箱アクション ---
    fetchAllCardsFromTrash: () => Promise<Card[]>;
    fetchCardByIdFromTrash: (cardId: string) => Promise<Card | null>;
    restoreCardFromTrash: (cardId: string) => Promise<void>;
    deleteCardFromTrash: (cardId: string) => Promise<void>; 
    
    // --- 8. 🛠️ メンテナンスアクション ---
    runCardGarbageCollection: () => Promise<void>;
}

export const useCardStore = create<CardStore>((set, get) => ({
    cards: [],
    
    // ----------------------------------------------------------------------
    // --- 1. 参照/ロード (個別アクション) ---
    // ----------------------------------------------------------------------
    
    // 💡 修正 (項目 2, 4): メインコレクション参照アクション
    fetchAllCards: async () => {
        const collectionKey: CollectionKey = 'cards';
        // 💡 修正 (項目 2): isAllViewModeとフィルタリングロジックを完全に削除。StoreはUI表示制御の責務を持たない。
        console.log(`[CardStore:fetchAllCards] 🚀 START loading main cards from ${collectionKey}.`);
        
        try {
            // Service層でDBロードとコレクションに応じたデータ変換を行う (汎用関数を利用)
            const allCards = await cardDataService.fetchAllCardsFromCollection(collectionKey);
            
            // StoreのStateを更新
            set({ cards: allCards });
            console.log(`[CardStore:fetchAllCards] ✅ Loaded ${allCards.length} cards for display.`);
        } catch (error) {
            console.error(`[CardStore:fetchAllCards] ❌ Failed to load cards from ${collectionKey}:`, error);
            set({ cards: [] });
            throw error;
        }
    },
    
    // 💡 修正 (項目 4): メインコレクション単一参照アクション
    fetchCardById: async (cardId: string) => {
        try {
            // データ取得ロジックはCardDataServiceに一元化 (汎用関数を利用)
            // 💡 修正: IDを第一引数に
            const card = await cardDataService.fetchCardByIdFromCollection(cardId, 'cards');
            return card;
        } catch (error) {
            console.error(`[CardStore:fetchCardById] Failed to load card ${cardId} from cards:`, error);
            return null;
        }
    },

    // ----------------------------------------------------------------------
    // --- 2. CRUD/永続化 ---
    // ----------------------------------------------------------------------
    
    saveCard: async (cardToSave) => {
        try {
            // ServiceのsaveCardが更新日時、numberを設定し、最新のCardを返す
            const savedCard = await cardDataService.saveCard(cardToSave);
            // StoreのStateをServiceから返された最新のデータで同期
            get().syncCardToStore(savedCard);
        } catch (error) {
            console.error("[CardStore:saveCard] Failed to save card:", error);
            throw error;
        }
    },
    
    moveCardToTrash: async (cardId) => {
        console.log(`[CardStore:moveCardToTrash] 🗑️ START moving card to trash: ${cardId}`);
        try {
            // 1. トラッシュにセーブ
            // 💡 修正: IDを第一引数に
            await cardDataService.saveCardToCollection(cardId, 'trash');
            
            // 2. **メインDB**から削除 (物理削除)
            // 💡 修正: IDを第一引数に
            await cardDataService.deleteCardFromCollection(cardId, 'cards');
            
            // 3. Storeから削除
            get().removeCardFromStore(cardId);

            console.log(`[CardStore:moveCardToTrash] ✅ Card moved to trash and removed from store: ${cardId}`);
        } catch (error) {
            console.error("[CardStore:moveCardToTrash] ❌ Failed to move card to trash:", error);
            throw error;
        }
    },
    
    // ----------------------------------------------------------------------
    // --- 4. メモリ/ストア操作 ---
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
            
            // DB操作はServiceに委譲
            const savedCards = await cardDataService.bulkSaveCards(cardsToFinalize);
            
            // StoreのStateを同期
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
            // DB削除はServiceに委譲 (メインコレクションからの物理削除)
            await cardDataService.bulkDeleteCards(cardIds);
            // StoreのStateから除去
            get().bulkRemoveCardsFromStore(cardIds);
            console.log(`[CardStore:bulkDeleteCards] ✅ Successfully deleted ${cardIds.length} cards.`);
        } catch (error) {
            console.error("Failed to bulk delete cards:", error);
            throw error;
        }
    },

    // 💡 修正 (項目 3, 5): I/Oワークフロー調整役として修正
    importCards: async (csvText: string, packId: string) => {
        try {
            // 1. I/O ServiceにCSVパースを委譲
            const cardsToImport = await cardCsvIO.importCardsFromCsv(csvText, packId);

            // 2. Serviceのキャッシュに依存してインポート前の状態をチェック
            // （このロジックはCardDataServiceの利用を許容）
            const preExistingCards = new Set(
                cardsToImport.map(c => c.cardId)
                    .filter(id => cardDataService.getCardByIdFromCache(id))
            );
            
            // 3. DB保存はServiceに委譲。加工済みカードリストを受け取る。
            const savedCards = await cardDataService.bulkSaveCards(cardsToImport);

            // 4. Storeの状態を同期する。
            get().bulkSyncCardsToStore(savedCards);

            // 5. カウントロジック
            const importedCount = savedCards.filter(card => !preExistingCards.has(card.cardId)).length;
            const updatedCount = savedCards.length - importedCount;

            return { importedCount: importedCount, updatedCount: updatedCount };
        } catch (error) {
            console.error("[CardStore:importCards] Failed to import cards:", error);
            throw new Error("カードデータの一括インポートに失敗しました。");
        }
    },
    
    // 💡 修正 (項目 3, 5): I/Oワークフロー調整役として修正
    exportCardsToCsv: async (packId) => {
        try {
            // 1. Service層からエクスポート対象のデータ（メインコレクション）を取得
            const cardsToExport = await cardDataService.getCardsByPackId(packId); 
            
            // 2. I/O ServiceにCSV生成を委譲
            const csvString = await cardCsvIO.exportCardsToCsv(cardsToExport);
            return csvString;
        } catch (error) {
            console.error("[CardStore:exportCardsToCsv] ❌ Failed to export cards:", error);
            throw error;
        }
    },

    // ----------------------------------------------------------------------
    // --- 6. 📜 履歴アクション ---
    // ----------------------------------------------------------------------

     // 💡 新規追加 (項目 4): 履歴コレクション全参照アクション
    /*fetchAllCardsFromHistory: async () => {
        const collectionKey: CollectionKey = 'history';
        console.log(`[CardStore:fetchAllCardsFromHistory] 📜 🚀 START loading cards from ${collectionKey}.`);
        
        try {
            // Service層でDBロードとコレクションに応じたデータ変換を行う (汎用関数を利用)
            const historyCards = await cardDataService.fetchAllCardsFromCollection(collectionKey);
            // 履歴はStore Stateを更新しない
            return historyCards; 
        } catch (error) {
            console.error(`[CardStore:fetchAllCardsFromHistory] ❌ Failed to load cards from ${collectionKey}:`, error);
            throw error;
        }
    },

    // 💡 新規追加 (項目 4): 履歴コレクション単一参照アクション
    fetchCardByIdFromHistory: async (historyId: string) => {
        try {
            // データ取得ロジックはCardDataServiceに一元化 (汎用関数を利用)
            // 💡 修正: IDを第一引数に
            const card = await cardDataService.fetchCardByIdFromCollection(historyId, 'history');
            return card;
        } catch (error) {
            console.error(`[CardStore:fetchCardByIdFromHistory] Failed to load card ${historyId} from history:`, error);
            return null;
        }
    },


    saveCardToHistory: async (cardId) => {
        console.log(`[CardStore:saveCardToHistory] 📜💾 START saving snapshot to history for: ${cardId}`);
        try {
            // Serviceに履歴コレクションへの保存を委譲
            // 💡 修正: IDを第一引数に
            await cardDataService.saveCardToCollection(cardId, 'history');
            console.log(`[CardStore:saveCardToHistory] ✅ Snapshot saved to history for: ${cardId}`);
        } catch (error) {
            console.error(`[CardStore:saveCardToHistory] ❌ Failed to save snapshot for ${cardId}:`, error);
            throw error;
        }
    },

    restoreCardFromHistory: async (historyId) => {
        console.log(`[CardStore:restoreCardFromHistory] 📜♻️ START restoring card from history: ${historyId}`);
        try {
            // 1. Serviceに履歴からの復元処理を委譲。
            const savedCard = await cardDataService.restoreCardFromHistory(historyId);
            
            if (!savedCard) throw new Error(`Restored card not returned from service for history ID: ${historyId}`);
            
            // 2. メインカードリストに同期
            get().syncCardToStore(savedCard); 
            
            console.log(`[CardStore:restoreCardFromHistory] ✅ Main card restored/updated from history ID: ${historyId}`);
        } catch (error) {
            console.error(`[CardStore:restoreCardFromHistory] ❌ Failed to restore card from history ID ${historyId}:`, error);
            throw error;
        }
    },*/

    // ----------------------------------------------------------------------
    // --- 7. 🗑️ ゴミ箱アクション ---
    // ----------------------------------------------------------------------
    
    // 💡 修正 (項目 4): トラッシュコレクション全参照アクション
    fetchAllCardsFromTrash: async () => {
        const collectionKey: CollectionKey = 'trash';
        console.log(`[CardStore:fetchAllCardsFromTrash] 🚀 START loading cards from ${collectionKey}.`);
        
        try {
            // Service層でDBロードとコレクションに応じたデータ変換を行う (汎用関数を利用)
            const allCards = await cardDataService.fetchAllCardsFromCollection(collectionKey);
            // トラッシュはStore Stateを更新しない
            return allCards; 
        } catch (error) {
            console.error(`[CardStore:fetchAllCardsFromTrash] ❌ Failed to load cards from ${collectionKey}:`, error);
            throw error;
        }
    },
    
    // 💡 修正 (項目 4): トラッシュコレクション単一参照アクション
    fetchCardByIdFromTrash: async (cardId: string) => {
        try {
            // データ取得ロジックはCardDataServiceに一元化 (汎用関数を利用)
            // 💡 修正: IDを第一引数に
            const card = await cardDataService.fetchCardByIdFromCollection(cardId, 'trash');
            return card;
        } catch (error) {
            console.error(`[CardStore:fetchCardByIdFromTrash] Failed to load card ${cardId} from trash:`, error);
            return null;
        }
    },

    restoreCardFromTrash: async (cardId) => {
        console.log(`[CardStore:restoreCardFromTrash] ♻️ START restoring card from trash: ${cardId}`);
        try {
            // 1. トラッシュからパックを取得 (💡 修正: 汎用アクションを個別アクションに置き換え)
            // fetchCardByIdFromTrash の中で service の呼び出しは修正済み
            const cardToRestore = await get().fetchCardByIdFromTrash(cardId);
            if (!cardToRestore) throw new Error(`Card ${cardId} not found in trash.`);
            
            // 2. 本番DBにセーブ (ServiceのsaveCardを利用)
            const savedCard = await cardDataService.saveCard(cardToRestore); 
            
            // 3. トラッシュから削除 (Serviceの汎用関数を利用)
            // 💡 修正: IDを第一引数に
            await cardDataService.deleteCardFromCollection(cardId, 'trash');
            
            // 4. Storeに追加/同期
            get().syncCardToStore(savedCard);
            console.log(`[CardStore:restoreCardFromTrash] ✅ Card restored from trash and added to store: ${cardId}`);
        } catch (error) {
            console.error(`[CardStore:restoreCardFromTrash] ❌ Failed to restore card ${cardId} from trash:`, error);
            throw error;
        }
    },

    deleteCardFromTrash: async (cardId) => {
        console.log(`[CardStore:deleteCardFromTrash] 🗑️💥 START physical deletion from trash: ${cardId}`);
        try {
            // Serviceに物理削除を委譲（**trashコレクション**からのみ削除）
            // 💡 修正: IDを第一引数に
            await cardDataService.deleteCardFromCollection(cardId, 'trash');
            console.log(`[CardStore:deleteCardFromTrash] ✅ Card physically deleted from trash: ${cardId}`);
        } catch (error) {
            console.error(`[CardStore:deleteCardFromTrash] ❌ Failed to delete card ${cardId} from trash:`, error);
            throw error;
        }
    },
    
    // ----------------------------------------------------------------------
    // --- 8. 🛠️ メンテナンスアクション (新規追加) ---
    // ----------------------------------------------------------------------

    runCardGarbageCollection: async () => {
        console.log(`[CardStore:runCardGarbageCollection] 🧹 START running card garbage collection...`);
        try {
            // Serviceにガベージコレクション実行を委譲 (親パックのないカードの削除など)
            await cardDataService.runCardGarbageCollection(); 
            
            // データの整合性確保のため、メインのカードリストを再ロード
            // 💡 修正: 汎用アクションを個別アクションに置き換え
            await get().fetchAllCards();
            
            console.log(`[CardStore:runCardGarbageCollection] ✅ Card garbage collection complete and cards reloaded.`);
        } catch (error) {
            console.error("[CardStore:runCardGarbageCollection] ❌ Failed to run card garbage collection:", error);
            throw error;
        }
    },
}));