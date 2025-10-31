/**
 * src/stores/deckStore.ts
 *
 * * Deck（デッキ）データのグローバルな状態管理を行うZustandストア。
 * 責務は、メインのDeckリスト（decks）のキャッシュ、CRUD操作の実行、およびDeckの
 * 履歴/ゴミ箱（アーカイブ）機能への窓口提供です。
 *
 * * 責務:
 * 1. Deckコレクションの状態（decks: Deck[]）とロード状態（isLoading: boolean）を保持する。
 * 2. `deckService` を介したDBからのデータフェッチおよびメインコレクションへの永続化をトリガーする。
 * 3. `deckJsonIO` を介したDeckデータのJSONインポート/エクスポートをトリガーする。
 * 4. 独立したモジュール（createDeckArchive）から履歴（history）/ゴミ箱（trash）関連の
 * アーカイブアクションを取得し、Storeのアクションとして公開する（窓口責務）。
 * 5. デッキの保存時に、未所有カードの有無（hasUnownedCards）を計算し、DBとStoreに反映する。
 */

import { create } from 'zustand';
import type { Deck } from '../models/deck';
import { deckService } from '../services/decks/deckService';
import { checkHasUnownedCards } from './utils/deckStoreUtils';
import { exportDecksToJson, importDecksFromJson } from '../services/data-io/deckJsonIO';

import {
    createDeckArchive,
    type DeckArchive,
    type DeckArchiveDependencies
} from './utils/createDeckArchive';
import type { ArchiveDeck } from '../models/archive';


// --- DeckStore インターフェース定義 ---
export interface DeckStore {
    decks: Deck[];
    isLoading: boolean;

    // --- 1. 参照/ロード ---
    fetchAllDecks: () => Promise<void>;
    fetchDeckById: (deckId: string) => Promise<Deck | null>;

    // --- 2. CRUD/永続化 ---
    saveDeck: (deckToSave: Deck) => Promise<Deck>;
    updateDeckIsFavorite: (deckId: string, isFavorite: boolean) => Promise<Deck | null>;

    // --- 4. メモリ/ストア操作 ---
    syncDeckToStore: (deck: Deck) => void;
    removeDeckFromStore: (deckId: string) => void;
    bulkRemoveDecksFromStore: (deckIds: string[]) => void;
    bulkSyncDecksToStore: (decks: Deck[]) => void;

    // --- 5. 一括/I/O ---
    importDecksFromJson: (jsonText: string) => Promise<{ newDeckIds: string[], skippedIds: string[] }>;
    exportDecksToJson: (deckIds: string[]) => Promise<string>;

    // --- 6. DeckArchive アクション ---
    fetchAllArchiveDecksFromHistory: () => Promise<ArchiveDeck[]>;
    fetchArchiveDeckFromHistory: (archiveId: string) => Promise<ArchiveDeck | null>;
    saveLatestDeckToHistory: (deckId: string) => Promise<void>;
    saveEditingDeckToHistory: (deckToSave: Deck) => Promise<void>;
    restoreDeckFromHistory: (archiveId: string) => Promise<void>;
    bulkRestoreDecksFromHistory: (archiveIds: string[]) => Promise<void>;
    deleteDeckFromHistory: (archiveId: string) => Promise<void>;
    bulkDeleteDecksFromHistory: (archiveIds: string[]) => Promise<void>;
    updateArchiveDeckIsFavoriteToHistory: (archiveId: string, isFavorite: boolean) => Promise<void>;

    fetchAllArchiveDecksFromTrash: () => Promise<ArchiveDeck[]>;
    fetchArchiveDeckFromTrash: (archiveId: string) => Promise<ArchiveDeck | null>;
    moveDeckToTrash: (deckId: string) => Promise<void>;
    bulkMoveDecksToTrash: (deckIds: string[]) => Promise<void>;
    restoreDeckFromTrash: (archiveId: string) => Promise<void>;
    bulkRestoreDecksFromTrash: (archiveIds: string[]) => Promise<void>;
    deleteDeckFromTrash: (archiveId: string) => Promise<void>;
    bulkDeleteDecksFromTrash: (archiveIds: string[]) => Promise<void>;
    updateArchiveDeckIsFavoriteToTrash: (archiveId: string, isFavorite: boolean) => Promise<void>;

    runDeckGarbageCollection: () => Promise<void>;
}

const initialState = {
    decks: [] as Deck[],
    isLoading: false,
};

export const useDeckStore = create<DeckStore>((set, get) => {

    // createDeckArchive の依存関係を構築: get 関数全体を渡す
    const deckArchiveDependencies: DeckArchiveDependencies = {
        get: get as () => DeckStore,
    };

    // createDeckArchive のインスタンスを取得
    const deckArchiveActions: DeckArchive = createDeckArchive(deckArchiveDependencies);

    return {
        ...initialState,

        // --- 1. 参照/ロード ---
        fetchAllDecks: async () => {
            set({ isLoading: true });
            try {
                const decksToDisplay = await deckService.fetchAllDecks();
                set({ decks: decksToDisplay });
                console.log(`[DeckStore:fetchAllDecks] ✅ ${decksToDisplay.length} decks loaded for display.`);
            } catch (error) {
                console.error("Failed to fetch decks:", error);
                set({ decks: [] });
            } finally {
                set({ isLoading: false });
            }
        },

        fetchDeckById: async (deckId: string) => {
            try {
                const decks = await deckService.fetchDecksByIds([deckId]);
                return decks && decks.length > 0 ? decks[0] : null;
            } catch (error) {
                console.error(`[DeckStore:fetchDeckById] Failed to load deck ${deckId}:`, error);
                return null;
            }
        },

        // --- 2. CRUD/永続化 ---
        saveDeck: async (deckToSave) => {
            console.log(`[DeckStore:saveDeck] 💾 START saving deck: ${deckToSave.deckId}`);

            const now = new Date().toISOString();

            // checkHasUnownedCards の呼び出しを引数一つに修正
            const finalHasUnownedCards = checkHasUnownedCards(deckToSave);

            const deckWithUpdatedTimestamp: Deck = {
                ...deckToSave,
                updatedAt: now,
                hasUnownedCards: finalHasUnownedCards,
            };

            try {
                const savedDecks = await deckService.saveDecks([deckWithUpdatedTimestamp]);

                if (!savedDecks || savedDecks.length === 0) throw new Error("Service returned empty result.");

                const savedDeck = savedDecks[0];

                get().syncDeckToStore(savedDeck);
                console.log(`[DeckStore:saveDeck] ✅ Deck finalized and saved: ${savedDeck.deckId}`);

                return savedDeck;
            } catch (error) {
                console.error('[DeckStore:saveDeck] ❌ Failed to save deck:', error);
                throw new Error('デッキの保存に失敗しました。');
            }
        },


        updateDeckIsFavorite: async (deckId: string, isFavorite: boolean): Promise<Deck | null> => {
            console.log(`[DeckStore:updateDeckIsFavorite] Toggling favorite state for Deck ID: ${deckId} to ${isFavorite}`);

            try {
                // サービス層の汎用バルク関数を、単一のID配列で呼び出す
                const numUpdated = await deckService.updateDecksField(
                    [deckId], // 1つだけのIDを配列として渡す
                    'isFavorite', // 更新フィールド名
                    isFavorite
                );

                if (numUpdated === 1) {
                    // DBが更新されたので、最新のDeckデータを取得してストアの状態を同期させる
                    const updatedDeck = await get().fetchDeckById(deckId);

                    if (updatedDeck) {
                        get().syncDeckToStore(updatedDeck);
                        console.log(`[DeckStore:updateDeckIsFavorite] ✅ Updated Deck ID: ${deckId} in DB and Store.`);
                        return updatedDeck;
                    }
                }

                if (numUpdated === 0) {
                    console.warn(`[DeckStore:updateDeckIsFavorite] ⚠️ Deck ID: ${deckId} not found for update.`);
                }

                return null;
            
            } catch (error) {
                console.error(`[DeckStore:updateDeckIsFavorite] ❌ Failed to update favorite state for ${deckId}:`, error);
                throw error;
            }
        },

        // --- 4. メモリ/ストア操作 ---
        syncDeckToStore: (updatedDeck) => {
            set(state => {
                const index = state.decks.findIndex(d => d.deckId === updatedDeck.deckId);
                const newDecks = [...state.decks];

                if (index !== -1) {
                    newDecks[index] = updatedDeck;
                } else {
                    newDecks.push(updatedDeck);
                }

                return { decks: newDecks };
            });
        },

        removeDeckFromStore: (deckId) => {
            set(state => {
                const newDecks = state.decks.filter(d => d.deckId !== deckId);

                return { decks: newDecks };
            });
            console.log(`[DeckStore:removeDeckFromStore] Memory state cleared for deck ID: ${deckId}`);
        },

        bulkRemoveDecksFromStore: (deckIds: string[]) => {
            const idSet = new Set(deckIds);
            set(state => {
                const newDecks = state.decks.filter(d => !idSet.has(d.deckId));

                return { decks: newDecks };
            });
            console.log(`[DeckStore:bulkRemoveDecksFromStore] Memory state cleared for ${deckIds.length} decks.`);
        },

        bulkSyncDecksToStore: (decks: Deck[]) => {
            set(state => {
                const updatedDeckMap = new Map(decks.map(d => [d.deckId, d]));
                const existingDeckIds = new Set(state.decks.map(d => d.deckId));

                const newDecks = state.decks.map(d =>
                    updatedDeckMap.has(d.deckId) ? updatedDeckMap.get(d.deckId)! : d
                );

                // 新しいデッキを追加
                decks.forEach(updatedDeck => {
                    if (!existingDeckIds.has(updatedDeck.deckId)) {
                        newDecks.push(updatedDeck);
                    }
                });

                return { decks: newDecks };
            });
            console.log(`[DeckStore:bulkSyncDecksToStore] Memory state synced for ${decks.length} decks.`);
        },

        // --- 5. 一括/I/O ---
        importDecksFromJson: async (jsonText: string) => {
            if (!jsonText) return { newDeckIds: [], skippedIds: [] };
            console.log(`[DeckStore:importDecksFromJson] 💾 START importing decks from JSON string...`);

            try {
                // I/O ServiceにパースとDB保存を委譲
                const result = await importDecksFromJson(jsonText);

                // DBの全件を再ロードしてStoreを更新
                await get().fetchAllDecks();

                console.log(`[DeckStore:importDecksFromJson] ✅ Imported: ${result.newDeckIds.length}. Skipped: ${result.skippedIds.length}`);

                return { newDeckIds: result.newDeckIds, skippedIds: result.skippedIds };
            } catch (error) {
                console.error('[DeckStore:importDecksFromJson] ❌ Failed to import decks:', error);
                throw error;
            }
        },

        exportDecksToJson: async (deckIds) => {

            if (deckIds.length === 0) {
                throw new Error("エクスポート対象のデッキIDが指定されていません。");
            }

            console.log(`[DeckStore:exportDecksToJson] 📤 Exporting ${deckIds.length} decks to JSON...`);

            // I/O ServiceにDB参照とJSON生成を委譲
            const jsonString = await exportDecksToJson(deckIds);

            console.log(`[DeckStore:exportDecksToJson] ✅ Exported to JSON string.`);
            return jsonString;
        },

        // ----------------------------------------------------------------------
        // --- 6. DeckArchive アクション (createDeckArchiveからの委譲) ---
        // ----------------------------------------------------------------------

        // 📜 履歴アクション
        fetchAllArchiveDecksFromHistory: deckArchiveActions.fetchAllArchiveDecksFromHistory,
        fetchArchiveDeckFromHistory: deckArchiveActions.fetchArchiveDeckFromHistory,
        saveLatestDeckToHistory: deckArchiveActions.saveLatestDeckToHistory,
        saveEditingDeckToHistory: deckArchiveActions.saveEditingDeckToHistory,
        restoreDeckFromHistory: deckArchiveActions.restoreDeckFromHistory,
        bulkRestoreDecksFromHistory: deckArchiveActions.bulkRestoreDecksFromHistory,
        deleteDeckFromHistory: deckArchiveActions.deleteDeckFromHistory,
        bulkDeleteDecksFromHistory: deckArchiveActions.bulkDeleteDecksFromHistory,
        updateArchiveDeckIsFavoriteToHistory: deckArchiveActions.updateArchiveDeckIsFavoriteToHistory,

        // 🗑️ ゴミ箱アクション
        fetchAllArchiveDecksFromTrash: deckArchiveActions.fetchAllArchiveDecksFromTrash,
        fetchArchiveDeckFromTrash: deckArchiveActions.fetchArchiveDeckFromTrash,
        moveDeckToTrash: deckArchiveActions.moveDeckToTrash,
        bulkMoveDecksToTrash: deckArchiveActions.bulkMoveDecksToTrash,
        restoreDeckFromTrash: deckArchiveActions.restoreDeckFromTrash,
        bulkRestoreDecksFromTrash: deckArchiveActions.bulkRestoreDecksFromTrash,
        deleteDeckFromTrash: deckArchiveActions.deleteDeckFromTrash,
        bulkDeleteDecksFromTrash: deckArchiveActions.bulkDeleteDecksFromTrash,
        updateArchiveDeckIsFavoriteToTrash: deckArchiveActions.updateArchiveDeckIsFavoriteToTrash,

        // 🛠️ メンテナンスアクション
        runDeckGarbageCollection: deckArchiveActions.runDeckGarbageCollection,
    };
});