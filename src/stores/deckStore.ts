/**
 * src/stores/deckStore.ts
 *
 * Deck（デッキ）データのグローバルな状態管理を行うZustandストア。
 * 責務は、デッキのリスト（decks）の保持、編集中のデッキ（editingDeck）の管理、
 * およびデッキの編集（カードの増減、情報更新）に関するUIロジックの実行です。
 */

import { create } from 'zustand';
import type { Deck } from '../models/deck'; 
import { deckService } from '../services/decks/deckService'; // サービス名を packService に合わせて汎用的な service に変えるべきだが、今回は既存の deckService をそのまま使用
import { useCardPoolStore } from './cardPoolStore'; 
import { createDefaultDeck } from '../utils/dataUtils';
import { useUserDataStore } from './userDataStore'; 
// 💡 修正: JSONインポート/エクスポートの責務を担う data-io サービスをインポート
import { exportDecksToJson, processImportDecks } from '../services/data-io/deckJsonIO'; 

// ... checkUnownedCards ヘルパー関数は省略 ...

const checkUnownedCards = (deck: Deck): boolean => {
    // CardPoolStoreから最新の状態を取得
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

// --- 💡 追加: Mapを含むDeckオブジェクトを安全にディープコピーするヘルパー ---
const deepCloneDeck = (deck: Deck): Deck => ({
    ...deck,
    mainDeck: new Map(deck.mainDeck),
    sideDeck: new Map(deck.sideDeck),
    extraDeck: new Map(deck.extraDeck),
});

export interface DeckState {
    decks: Deck[]; 
    editingDeck: Deck | null;
    isLoading: boolean;

    // --- 1. 参照/ロード (packStoreに合わせて修正) ---
    fetchAllDecks: () => Promise<void>; 
    fetchDeckById: (deckId: string) => Promise<Deck | null>; 
    
    // --- 2. CRUD/永続化 (isInStore関連を削除, deleteDeckを廃止) ---
    saveDeck: (deckToSave: Deck) => Promise<Deck>; 
    //createDeck: () => Promise<string>; 
    // updateDeckIsInStore: (deckId: string, isInStore: boolean) => Promise<void>; // ❌ 削除
    // deleteDeck: (deckId: string) => Promise<void>; // ❌ 削除
    // bulkUpdateDecksIsInStore: (deckIds: string[], isInStore: boolean) => Promise<void>; // ❌ 削除
    
    // --- 3. エディタ/UI操作 (変更なし) ---
    initializeNewEditingDeck: () => string; 
    loadEditingDeck: (deckId: string) => Promise<void>; 
    updateEditingDeckInfo: (info: Partial<Omit<Deck, 'mainDeck' | 'sideDeck' | 'extraDeck'>>) => void;
    updateEditingDeckCardCount: (zone: keyof Pick<Deck, 'mainDeck' | 'sideDeck' | 'extraDeck'>, cardId: string, count: number) => void;
    
    // --- 4. メモリ/ストア操作 (変更なし) ---
    syncDeckToStore: (deck: Deck) => void; 
    removeDeckFromStore: (deckId: string) => void;
    bulkRemoveDecksFromStore: (deckIds: string[]) => void; 

    // --- 5. 一括/I/O (命名修正) ---
    importDecksFromJson: (jsonText: string) => Promise<{ importedCount: number, renamedCount: number, skippedIds: string[] }>; // 💡 processImportDecks からリネーム
    exportDecksToJson: (deckIds: string[]) => Promise<string>;

    // --- 6. 📜 履歴アクション (新規追加) ---
    // 💡 修正 (項目1): 戻り値の型を Promise<Deck[]> に明記
    fetchAllDecksFromHistory: () => Promise<Deck[]>; 
    fetchDeckByIdFromHistory: (deckId: string) => Promise<Deck | null>; 
    saveDeckToHistory: (deckId: string) => Promise<void>;
    restoreDeckFromHistory: (historyId: string) => Promise<void>;

    // --- 7. 🗑️ ゴミ箱アクション (新規追加) ---
    // 💡 修正 (項目1): 戻り値の型を Promise<Deck[]> に明記
    fetchAllDecksFromTrash: () => Promise<Deck[]>; 
    fetchDeckByIdFromTrash: (deckId: string) => Promise<Deck | null>; 
    moveDeckToTrash: (deckId: string) => Promise<void>; // 💡 deleteDeck の代替
    restoreDeckFromTrash: (deckId: string) => Promise<void>;
    deleteDeckFromTrash: (deckId: string) => Promise<void>;

    // --- 8. 🛠️ メンテナンスアクション (新規追加) ---
    runDeckGarbageCollection: () => Promise<void>;
}

const initialState = {
    decks: [] as Deck[],
    editingDeck: null as Deck | null, 
    isLoading: false,
};

export const useDeckStore = create<DeckState>((set, get) => {
    
    // 💡 内部ヘルパー関数として定義 (Mapを含むためカスタム実装)
    const _setEditingDeck = (deck: Deck) => {
        set({ editingDeck: deepCloneDeck(deck) });
    };

    return {
        ...initialState,
        
        // ----------------------------------------------------------------------
        // --- 1. 参照/ロード (packStoreに合わせて修正) ---
        // ----------------------------------------------------------------------

        fetchAllDecks: async () => {
            set({ isLoading: true });
            const isAllViewMode = useUserDataStore.getState().isAllViewMode;
            console.log(`[DeckStore:fetchAllDecks] 🚀 START loading decks. (isAllViewMode: ${isAllViewMode})`);
            try {
                // 💡 修正: Serviceのキャッシュではなく、汎用的なコレクションからの取得に修正
                const decksToDisplay = await deckService.fetchAllDecksFromCollection('decks');
                set({ decks: decksToDisplay });
                console.log(`✅ [DeckStore] ${decksToDisplay.length} decks loaded for display.`); 
            } catch (error) {
                console.error("Failed to fetch decks:", error);
                set({ decks: [] }); 
            } finally {
                set({ isLoading: false });
            }
        },
        
        fetchDeckById: async (deckId: string) => { 
            try {
                // 💡 修正後のサービスインターフェースに対応
                const deck = await deckService.fetchDeckByIdFromCollection('decks', deckId);
                return deck;
            } catch (error) {
                console.error(`[DeckStore:fetchDeckById] Failed to load deck ${deckId}:`, error);
                return null;
            }
        },

        // ----------------------------------------------------------------------
        // --- 2. CRUD/永続化 (delete/isInStore関連を削除) ---
        // ----------------------------------------------------------------------
        
        saveDeck: async (deckToSave) => {
            console.log(`[DeckStore:saveDeck] 💾 START saving deck: ${deckToSave.deckId}`);
            try {
                // 1. UIロジック: 'hasUnownedCards' の設定
                const finalHasUnownedCards = checkUnownedCards(deckToSave);
                const deckWithUIState: Deck = { 
                    ...deckToSave, 
                    hasUnownedCards: finalHasUnownedCards,
                };
                
                // 2. 永続化とデータ加工 (Serviceに委譲し、最新のDeckを受け取る)
                const savedDeck = await deckService.saveDeck(deckWithUIState); 
                
                // 3. Store同期
                get().syncDeckToStore(savedDeck); 
                console.log(`[DeckStore:saveDeck] ✅ Deck finalized and saved: ${savedDeck.deckId}`);
                
                return savedDeck;
            } catch (error) {
                console.error('[DeckStore:saveDeck] ❌ Failed to save deck:', error);
                throw new Error('デッキの保存に失敗しました。');
            }
        },
        
        /*createDeck: async () => { 
            const newDeck = createDefaultDeck();
            console.log(`[DeckStore:createDeck] 🆕 START creating new deck: ${newDeck.deckId}`);

            try {
                const savedDeck = await deckService.saveDeck(newDeck);

                get().syncDeckToStore(savedDeck);
                console.log(`[DeckStore:createDeck] ✅ Deck created and synced: ${savedDeck.deckId}`);
                return savedDeck.deckId;
            } catch (error) {
                console.error('[DeckStore:createDeck] ❌ Failed to create deck:', error);
                throw new Error('デッキの作成に失敗しました。');
            }
        },*/

        /* 💡 削除: updateDeckIsInStore は packStore との統一のため削除 */
        /* 💡 削除: deleteDeck は moveDeckToTrash に置き換え */
        /* 💡 削除: bulkUpdateDecksIsInStore は packStore との統一のため削除 */

        // ----------------------------------------------------------------------
        // --- 3. エディタ/UI操作 (ヘルパー呼び出しに修正) ---
        // ----------------------------------------------------------------------
        
        initializeNewEditingDeck: () => { 
            const newDeck = createDefaultDeck(); 
            // 💡 修正: 内部ヘルパーを使用
            _setEditingDeck(newDeck);
            return newDeck.deckId; 
        },
        
        loadEditingDeck: async (deckId) => { 
            console.log(`[DeckStore] START loading deck for editor: ${deckId}.`); 
            
            const currentEditingDeck = get().editingDeck;
            if (currentEditingDeck && currentEditingDeck.deckId === deckId) {
                return;
            }
            
            try {
                const deck = await get().fetchDeckById(deckId); 
                if (deck) {
                    // 💡 修正: 内部ヘルパーを使用
                    _setEditingDeck(deck);
                } else {
                    // ロード失敗/存在しない場合はデフォルトの空デッキを設定
                    _setEditingDeck(createDefaultDeck(deckId));
                }
            } catch (error) {
                console.error(`[DeckStore] Failed to load deck ${deckId}:`, error);
                _setEditingDeck(createDefaultDeck()); 
            }
        },
        
        updateEditingDeckInfo: (info) => {
            set(state => {
                if (!state.editingDeck) return state;

                const updatedDeck: Deck = { 
                    ...state.editingDeck, 
                    ...info 
                };
                
                return {
                    editingDeck: updatedDeck,
                };
            });
        },
        
        updateEditingDeckCardCount: (zone, cardId, count) => {
            set(state => {
                if (!state.editingDeck) return state;

                const newMap = new Map(state.editingDeck[zone]);
                if (count > 0) {
                    newMap.set(cardId, count);
                } else {
                    newMap.delete(cardId);
                }
                
                const updatedDeck = {
                    ...state.editingDeck,
                    [zone]: newMap,
                } as Deck; 

                const hasUnownedCards = checkUnownedCards(updatedDeck);
                
                return {
                    editingDeck: {
                        ...updatedDeck,
                        hasUnownedCards: hasUnownedCards,
                    }
                };
            });
        },
        
        // ----------------------------------------------------------------------
        // --- 4. メモリ/ストア操作 (isInStore依存部分を修正) ---
        // ----------------------------------------------------------------------
        
        syncDeckToStore: (updatedDeck) => { 
            set(state => {
                const index = state.decks.findIndex(d => d.deckId === updatedDeck.deckId);
                const newDecks = [...state.decks];
                
                if (index !== -1) {
                    newDecks[index] = updatedDeck;
                } else {
                    // 💡 修正: isInStore のチェックを削除し、常にリストに追加（新規作成や復元時）
                    newDecks.push(updatedDeck);
                }
                
                const updatededitingDeck = state.editingDeck && state.editingDeck.deckId === updatedDeck.deckId 
                    ? deepCloneDeck(updatedDeck) // ⬅️ ここを修正
                    : state.editingDeck;
                    
                return { decks: newDecks, editingDeck: updatededitingDeck };
            });
        },
        
        removeDeckFromStore: (deckId) => {
            set(state => {
                const newDecks = state.decks.filter(d => d.deckId !== deckId);
                
                const neweditingDeck = state.editingDeck && state.editingDeck.deckId === deckId 
                    ? null 
                    : state.editingDeck;
                return { decks: newDecks, editingDeck: neweditingDeck };
            });
            console.log(`[DeckStore] Memory state cleared for deck ID: ${deckId}`);
        },

        bulkRemoveDecksFromStore: (deckIdsToRemove: string[]) => {
            const idSet = new Set(deckIdsToRemove);
            set(state => {
                const newDecks = state.decks.filter(d => !idSet.has(d.deckId));
                
                const isEditingDeckRemoved = state.editingDeck && idSet.has(state.editingDeck.deckId);
                const neweditingDeck = isEditingDeckRemoved ? null : state.editingDeck; 
                
                return { decks: newDecks, editingDeck: neweditingDeck };
            });
            console.log(`[DeckStore] Memory state cleared for ${deckIdsToRemove.length} decks.`);
        },

        // ----------------------------------------------------------------------
        // --- 5. 一括/I/O (I/O責務の分離を統一) ---
        // ----------------------------------------------------------------------
        
        /**
         * 💡 修正: processImportDecks から importDecksFromJson にリネーム
         */
        importDecksFromJson: async (jsonText: string) => {
            if (!jsonText) return { importedCount: 0, renamedCount: 0, skippedIds: [] };
            console.log(`[DeckStore:importDecksFromJson] 💾 START importing decks from JSON string...`);
            
            try {
                // data-ioサービスに処理全体を委譲
                const result = await processImportDecks(jsonText);
                
                // DBが変更されたため、Storeの状態を最新にする
                await get().fetchAllDecks(); 
                
                console.log(`[DeckStore:importDecksFromJson] ✅ Imported: ${result.importedCount}, Renamed: ${result.renamedCount}`);
                return result;
            } catch (error) {
                console.error('[DeckStore:importDecksFromJson] ❌ Failed to import decks:', error);
                throw error; 
            }
        },
        
        exportDecksToJson: async (deckIds) => {
            // 💡 修正 (項目6): データ取得ロジック（deckServiceの呼び出し）を削除し、
            // Storeが管理しているメモリ上のデッキリスト (get().decks) を使用するように統一。
            let targetDecks: Deck[] = [];
            const currentDecks = get().decks; // Storeのメモリ状態を使用

            if (deckIds.length > 0) {
                const idSet = new Set(deckIds);
                targetDecks = currentDecks.filter(d => idSet.has(d.deckId));
            } else {
                // ID指定がない場合は、メモリ上の全てを対象とする
                targetDecks = currentDecks;
            }

            if (targetDecks.length === 0) {
                throw new Error("エクスポート対象のデッキが見つかりませんでした。");
            }
            
            console.log(`[DeckStore:exportDecksToJson] 📤 Exporting ${targetDecks.length} decks to JSON...`);
            
            // I/O Service（deckJsonIO）を直接呼び出し
            const jsonString = exportDecksToJson(targetDecks);
            
            console.log(`[DeckStore:exportDecksToJson] ✅ Exported to JSON string.`);
            return jsonString;
        },
        // ----------------------------------------------------------------------
        // --- 6. 📜 履歴アクション (新規追加) ---
        // ----------------------------------------------------------------------

        saveDeckToHistory: async (deckId) => {
            console.log(`[DeckStore:saveDeckToHistory] 📜💾 START saving snapshot to history for: ${deckId}`);
            try {
                // PackStoreのロジックを模倣: Serviceに History コレクションへのセーブを委譲
                await deckService.saveDeckToCollection('history', deckId);
                console.log(`[DeckStore:saveDeckToHistory] ✅ Snapshot saved to history for: ${deckId}`);
            } catch (error) {
                console.error(`[DeckStore:saveDeckToHistory] ❌ Failed to save snapshot for ${deckId}:`, error);
                throw error;
            }
        },

        restoreDeckFromHistory: async (historyId) => {
            console.log(`[DeckStore:restoreDeckFromHistory] 📜♻️ START restoring deck from history: ${historyId}`);
            try {
                // PackStoreのロジックを模倣: Serviceに履歴からの復元処理を委譲。
                const savedDeck = await deckService.restoreDeckFromHistory(historyId);
                
                if (!savedDeck) throw new Error(`Restored deck not returned from service for history ID: ${historyId}`);
                
                // メインデッキリストに同期 (復元されたデッキを一覧に追加/更新)
                get().syncDeckToStore(savedDeck); 
                
                console.log(`[DeckStore:restoreDeckFromHistory] ✅ Main deck restored/updated from history ID: ${historyId}`);
            } catch (error) {
                console.error(`[DeckStore:restoreDeckFromHistory] ❌ Failed to restore deck from history ID ${historyId}:`, error);
                throw error;
            }
        },
        
        // 💡 修正 (項目1): インターフェースに合わせるため、実装は Deck[] を返すままで変更なし
        fetchAllDecksFromHistory: async () => {
            console.log(`[DeckStore:fetchAllDecksFromHistory] 🧺 START fetching decks from history...`);
            try {
                const decks = await deckService.fetchAllDecksFromCollection('history');
                console.log(`[DeckStore:fetchAllDecksFromHistory] ✅ Fetched ${decks.length} decks from history.`);
                return decks; 
            } catch (error) {
                console.error("[DeckStore:fetchAllDecksFromHistory] ❌ Failed to fetch decks from history:", error);
                throw error;
            }
        },

        fetchDeckByIdFromHistory: async (deckId) => {
            console.log(`[DeckStore:fetchDeckByIdFromHistory] 🔍 START fetching deck ${deckId} from history...`);
            try {
                const deck = await deckService.fetchDeckByIdFromCollection('history', deckId);
                return deck;
            } catch (error) {
                console.error(`[DeckStore:fetchDeckByIdFromHistory] ❌ Failed to fetch deck ${deckId} from history:`, error);
                return null;
            }
        },

        // ----------------------------------------------------------------------
        // --- 7. 🗑️ ゴミ箱アクション (新規追加/論理削除への置き換え) ---
        // ----------------------------------------------------------------------
        
        moveDeckToTrash: async (deckId) => {
            console.log(`[DeckStore:moveDeckToTrash] 🗑️ START moving deck to trash: ${deckId}`);
            try {
                // 1. トラッシュにセーブ (PackStoreのロジックを模倣)
                await deckService.saveDeckToCollection('trash', deckId); 
                
                // 2. 本番DBを削除 (PackStoreのロジックを模倣)
                await deckService.deleteDeckFromCollection('decks', deckId); 
                
                // 3. Storeから削除
                get().removeDeckFromStore(deckId);
                console.log(`[DeckStore:moveDeckToTrash] ✅ Deck moved to trash and removed from store: ${deckId}`);
            } catch (error) {
                console.error(`[DeckStore:moveDeckToTrash] ❌ Failed to move deck ${deckId} to trash:`, error);
                throw error;
            }
        },

        restoreDeckFromTrash: async (deckId) => {
            console.log(`[DeckStore:restoreDeckFromTrash] ♻️ START restoring deck from trash: ${deckId}`);
            try {
                // 1. トラッシュからパックを取得
                const deckToRestore = await deckService.fetchDeckByIdFromCollection('trash', deckId);
                if (!deckToRestore) throw new Error(`Deck ${deckId} not found in trash.`);
                
                // 2. 本番DBにセーブ
                const savedDeck = await deckService.saveDeck(deckToRestore); 
                
                // 3. トラッシュを削除
                await deckService.deleteDeckFromCollection('trash', deckId);
                
                // 4. Storeに追加/同期
                get().syncDeckToStore(savedDeck);
                console.log(`[DeckStore:restoreDeckFromTrash] ✅ Deck restored from trash and added to store: ${deckId}`);
            } catch (error) {
                console.error(`[DeckStore:restoreDeckFromTrash] ❌ Failed to restore deck ${deckId} from trash:`, error);
                throw error;
            }
        },

        // 💡 修正 (項目1): インターフェースに合わせるため、実装は Deck[] を返すままで変更なし
        fetchAllDecksFromTrash: async () => {
            console.log(`[DeckStore:fetchAllDecksFromTrash] 🧺 START fetching decks from trash...`);
            try {
                const decks = await deckService.fetchAllDecksFromCollection('trash');
                console.log(`[DeckStore:fetchAllDecksFromTrash] ✅ Fetched ${decks.length} decks from trash.`);
                return decks; 
            } catch (error) {
                console.error("[DeckStore:fetchAllDecksFromTrash] ❌ Failed to fetch decks from trash:", error);
                throw error;
            }
        },

        fetchDeckByIdFromTrash: async (deckId) => {
            console.log(`[DeckStore:fetchDeckByIdFromTrash] 🔍 START fetching deck ${deckId} from trash...`);
            try {
                const deck = await deckService.fetchDeckByIdFromCollection('trash', deckId);
                return deck;
            } catch (error) {
                console.error(`[DeckStore:fetchDeckByIdFromTrash] ❌ Failed to fetch deck ${deckId} from trash:`, error);
                return null;
            }
        },
        
        deleteDeckFromTrash: async (deckId) => {
            console.log(`[DeckStore:deleteDeckFromTrash] 🗑️💥 START physical deletion from trash: ${deckId}`);
            try {
                // Serviceに物理削除を委譲（DBTrashからのみ削除）
                await deckService.deleteDeckFromCollection('trash', deckId);
                console.log(`[DeckStore:deleteDeckFromTrash] ✅ Deck physically deleted from trash: ${deckId}`);
            } catch (error) {
                console.error(`[DeckStore:deleteDeckFromTrash] ❌ Failed to delete deck ${deckId} from trash:`, error);
                throw error;
            }
        },

        // ----------------------------------------------------------------------
        // --- 8. 🛠️ メンテナンスアクション (新規追加) ---
        // ----------------------------------------------------------------------

        runDeckGarbageCollection: async () => {
            console.log(`[DeckStore:runDeckGarbageCollection] 🧹 START running garbage collection...`);
            try {
                // Serviceにガベージコレクション実行を委譲
                await deckService.runDeckGarbageCollection();
                
                // データの整合性確保のため、メインのデッキリストを再ロード
                await get().fetchAllDecks();
                
                console.log(`[DeckStore:runDeckGarbageCollection] ✅ Garbage collection complete and decks reloaded.`);
            } catch (error) {
                console.error("[DeckStore:runDeckGarbageCollection] ❌ Failed to run garbage collection:", error);
                throw error;
            }
        }
    };
});
