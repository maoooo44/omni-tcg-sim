/**
 * src/stores/utils/createDeckArchive.ts
 *
 * * Deckエンティティ専用の履歴（'history'）とゴミ箱（'trash'）へのアーカイブ操作を管理するアクションファクトリ関数。
 * * 責務:
 * 1. Deckの永続化層（deckService）とStore層（DeckStore）への依存関係を `_archiveCoreUtils.ts` に注入するための `ArchiveHandler` を構成する。
 * 2. 共通ロジック（CRUD, GC）は `_archiveCoreUtils` に委譲し、Deck固有のビジネスロジック（例：ゴミ箱移動、`hasUnownedCards` の更新）をラップして提供する。
 * 3. 編集中のDeckを直接受け取って履歴に保存する機能（`saveEditingDeckToHistory`）を提供する。
 */

import { archiveService } from '../../services/archive/archiveService';
import { deckService } from '../../services/decks/deckService';
import {
    dbArchiveToArchiveDisplayData,
    dbArchiveToArchiveItemData,
    deckToDBDeck
} from '../../services/database/dbMappers';
import type {
    Deck,
    ArchiveDeck,
    ArchiveItemType,
    ArchiveItemToSave,
    DBDeck
} from '../../models/models';
import type { DeckStore } from '../deckStore';

import { checkHasUnownedCards } from '../utils/deckStoreUtils';

import {
    createCommonArchiveActions,
    type ArchiveHandler,
    type ArchiveMappers,
} from './_archiveCoreUtils';


// ----------------------------------------
// 定数 
// ----------------------------------------
const ARCHIVE_ITEM_TYPE: ArchiveItemType = 'deck' as const;

// ----------------------------------------
// Deck Archiveの依存関係インターフェース 
// ----------------------------------------
export interface DeckArchiveDependencies {
    // 依存関係としてZustandの get 関数全体を受け取る (遅延評価のため)
    get: () => DeckStore;
}


// ----------------------------------------
// Hookの型定義 (DeckArchive) 
// ----------------------------------------
export interface DeckArchive {
    fetchAllArchiveDecksFromHistory: () => Promise<ArchiveDeck[]>;
    fetchArchiveDeckFromHistory: (archiveId: string) => Promise<ArchiveDeck | null>;
    deleteDeckFromHistory: (archiveId: string) => Promise<void>;
    bulkDeleteDecksFromHistory: (archiveIds: string[]) => Promise<void>;
    fetchAllArchiveDecksFromTrash: () => Promise<ArchiveDeck[]>;
    fetchArchiveDeckFromTrash: (archiveId: string) => Promise<ArchiveDeck | null>;
    deleteDeckFromTrash: (archiveId: string) => Promise<void>;
    bulkDeleteDecksFromTrash: (archiveIds: string[]) => Promise<void>;
    runDeckGarbageCollection: () => Promise<void>;

    saveLatestDeckToHistory: (deckId: string) => Promise<void>;
    saveEditingDeckToHistory: (deckToSave: Deck) => Promise<void>;
    moveDeckToTrash: (deckId: string) => Promise<void>;
    bulkMoveDecksToTrash: (deckIds: string[]) => Promise<void>;

    restoreDeckFromHistory: (archiveId: string) => Promise<void>;
    bulkRestoreDecksFromHistory: (archiveIds: string[]) => Promise<void>;
    restoreDeckFromTrash: (archiveId: string) => Promise<void>;
    bulkRestoreDecksFromTrash: (archiveIds: string[]) => Promise<void>;

    updateArchiveDeckIsFavoriteToHistory: (archiveId: string, isFavorite: boolean) => Promise<void>;
    bulkUpdateArchiveDecksIsFavoriteToHistory: (archiveIds: string[], isFavorite: boolean) => Promise<number>;
    updateArchiveDeckIsFavoriteToTrash: (archiveId: string, isFavorite: boolean) => Promise<void>;
    bulkUpdateArchiveDecksIsFavoriteToTrash: (archiveIds: string[], isFavorite: boolean) => Promise<number>;
}


/**
 * Deckのアーカイブ操作のためのアクションファクトリ関数。
 * @param dependencies Deck Storeの get 関数
 * @returns DeckArchive
 */
export const createDeckArchive = (dependencies: DeckArchiveDependencies): DeckArchive => {

    // get() 関数を内部で取得
    const get = dependencies.get;

    // ----------------------------------------------------------------------
    // Deck固有の復元後処理
    // ----------------------------------------------------------------------
    const _postRestoreAction = async (restoredDecks: Deck[]): Promise<Deck[]> => {
        // Deck固有の処理: 復元後にhasUnownedCardsをチェック
        const decksToSave = restoredDecks.map(d => {
            const finalHasUnownedCards = checkHasUnownedCards(d);
            return {
                ...d,
                hasUnownedCards: finalHasUnownedCards, // hasUnownedCards のみ更新
            };
        });

        return decksToSave;
    };


    // 1. Deck固有の依存関係を構成
    // TEntity: Deck, TArchiveData: DBDeck
    const deckHandler: ArchiveHandler<Deck, DBDeck> = {
        itemType: ARCHIVE_ITEM_TYPE,
        mainService: {
            fetchByIds: async (ids: string[]) => {
                const decks = await deckService.fetchDecksByIds(ids);
                return decks.filter((deck): deck is Deck => deck !== null);
            },
            save: deckService.saveDecks,
            delete: deckService.deleteDecks,
        },
        storeActions: {
            // get() を通じて実行することで、Store内で安全に呼び出し可能に
            syncToStore: (decks: Deck[]) => get().bulkSyncDecksToStore(decks),
            bulkRemoveFromStore: (ids: string[]) => get().bulkRemoveDecksFromStore(ids),
        },
        mappers: {
            toArchiveData: deckToDBDeck,
            fromArchiveData: (data: any) => data as Deck,
        },
        postRestoreAction: _postRestoreAction,
    };

    const deckArchiveMappers: ArchiveMappers = {
        toArchiveDisplayData: dbArchiveToArchiveDisplayData,
        toArchiveItemData: dbArchiveToArchiveItemData,
    };

    // 2. 共通ロジックを生成 (Deck固有のアクションを生成)
    const commonActions = createCommonArchiveActions(deckHandler, deckArchiveMappers);

    // ----------------------------------------------------------------------
    // --- 履歴・ゴミ箱 アクション ---
    // ----------------------------------------------------------------------

    const fetchAllArchiveDecksFromHistory = () => commonActions.fetchAllArchiveMetadata('history') as Promise<ArchiveDeck[]>;

    const fetchArchiveDeckFromHistory = async (archiveId: string): Promise<ArchiveDeck | null> => {
        const itemData = await commonActions.fetchArchiveItemData(archiveId, 'history');
        if (!itemData) return null;
        return itemData as ArchiveDeck;
    };


    const fetchAllArchiveDecksFromTrash = () => commonActions.fetchAllArchiveMetadata('trash') as Promise<ArchiveDeck[]>;

    const fetchArchiveDeckFromTrash = async (archiveId: string): Promise<ArchiveDeck | null> => {
        const itemData = await commonActions.fetchArchiveItemData(archiveId, 'trash');
        if (!itemData) return null;
        return itemData as ArchiveDeck;
    };


    // 履歴保存 (既存: DBから最新を取得して保存)
    const saveLatestDeckToHistory = async (deckId: string) => {
        const latestDecks = await deckService.fetchDecksByIds([deckId]);
        const deckToArchive = latestDecks[0];
        if (!deckToArchive) throw new Error(`Deck ID ${deckId} not found in main DB.`);

        const archiveData: DBDeck = deckHandler.mappers.toArchiveData(deckToArchive);

        // 修正: ArchiveItemToSave の構造変更（metaを導入）
        const itemToSave: ArchiveItemToSave<DBDeck> = {
            itemType: ARCHIVE_ITEM_TYPE,
            itemId: deckId,
            data: archiveData,
            meta: {
                isManual: false, // 最新を自動保存
            }
        };
        await archiveService.saveItemsToArchive([itemToSave], 'history');
    };

    // 編集中のDeckを直接受け取り、Historyへ保存する
    const saveEditingDeckToHistory = async (deckToSave: Deck) => {
        if (!deckToSave) return;
        const deckId = deckToSave.deckId;

        // DBDeckにマッピング
        const archiveData: DBDeck = deckHandler.mappers.toArchiveData(deckToSave);

        // 修正: ArchiveItemToSaveの構造変更（metaを導入）
        const itemToSave: ArchiveItemToSave<DBDeck> = {
            itemType: ARCHIVE_ITEM_TYPE,
            itemId: deckId,
            data: archiveData,
            meta: {
                isManual: true, // 編集中の手動保存
            }
        };

        // Historyへ保存
        await archiveService.saveItemsToArchive([itemToSave], 'history');
    };

    // 履歴復元 
    const restoreDeckFromHistory = (archiveId: string): Promise<void> => commonActions.bulkRestoreItemsFromArchive([archiveId], 'history').then(() => { });
    const bulkRestoreDecksFromHistory = (archiveIds: string[]): Promise<void> => commonActions.bulkRestoreItemsFromArchive(archiveIds, 'history').then(() => { });

    // 履歴物理削除
    const deleteDeckFromHistory = (archiveId: string) => commonActions.bulkDeleteItemsFromArchive([archiveId], 'history');
    const bulkDeleteDecksFromHistory = (archiveIds: string[]) => commonActions.bulkDeleteItemsFromArchive(archiveIds, 'history');

    const updateArchiveDeckIsFavoriteToHistory = (archiveId: string, isFavorite: boolean) => {
        return commonActions.updateItemIsFavoriteToArchive(archiveId, 'history', isFavorite).then(() => {});
    };

    const bulkUpdateArchiveDecksIsFavoriteToHistory = (archiveIds: string[], isFavorite: boolean) => {
        return commonActions.bulkUpdateItemsIsFavoriteToArchive(archiveIds, 'history', isFavorite);
    };

    // ゴミ箱移動 
    const moveDeckToTrash = (deckId: string) => bulkMoveDecksToTrash([deckId]);

    const bulkMoveDecksToTrash = async (deckIds: string[]) => {
        if (deckIds.length === 0) return;

        const decksToArchive = await deckService.fetchDecksByIds(deckIds);

        const itemsToSave: ArchiveItemToSave<DBDeck>[] = decksToArchive
            .filter((deck): deck is Deck => deck !== null)
            .map(deckToArchive => {
                const archiveData: DBDeck = deckHandler.mappers.toArchiveData(deckToArchive);
                return {
                    itemType: ARCHIVE_ITEM_TYPE,
                    itemId: deckToArchive.deckId,
                    data: archiveData,
                    // 修正: ArchiveItemToSaveの構造変更（metaを導入）
                    meta: {
                        isManual: false, // ゴミ箱移動は通常 isManual: false (自動処理)
                    }
                };
            });

        // 1. Archiveへ保存
        if (itemsToSave.length > 0) {
            await archiveService.saveItemsToArchive(itemsToSave, 'trash');
        }

        // 2. Main DBから削除
        await deckService.deleteDecks(deckIds);

        // 3. Storeから削除
        get().bulkRemoveDecksFromStore(deckIds);

    };

    // ゴミ箱復元 
    const restoreDeckFromTrash = (archiveId: string): Promise<void> => commonActions.bulkRestoreItemsFromArchive([archiveId], 'trash').then(() => { });
    const bulkRestoreDecksFromTrash = (archiveIds: string[]): Promise<void> => commonActions.bulkRestoreItemsFromArchive(archiveIds, 'trash').then(() => { });

    // ゴミ箱物理削除
    const deleteDeckFromTrash = (archiveId: string) => commonActions.bulkDeleteItemsFromArchive([archiveId], 'trash');
    const bulkDeleteDecksFromTrash = (archiveIds: string[]) => commonActions.bulkDeleteItemsFromArchive(archiveIds, 'trash');

    const updateArchiveDeckIsFavoriteToTrash = (archiveId: string, isFavorite: boolean) => {
        return commonActions.updateItemIsFavoriteToArchive(archiveId, 'trash', isFavorite).then(() => {});
    };

    const bulkUpdateArchiveDecksIsFavoriteToTrash = (archiveIds: string[], isFavorite: boolean) => {
        return commonActions.bulkUpdateItemsIsFavoriteToArchive(archiveIds, 'trash', isFavorite);
    };
    
    // GCアクション 
    const runDeckGarbageCollection = async () => {
        console.log(`[DeckArchive:runDeckGarbageCollection] 🧹 START running garbage collection...`);
        try {
            await commonActions.runGarbageCollection();

            get().fetchAllDecks();

            console.log(`[DeckArchive:runDeckGarbageCollection] ✅ Garbage collection complete and decks reloaded.`);
        } catch (error) {
            console.error("[DeckArchive:runDeckGarbageCollection] ❌ Failed to run garbage collection:", error);
            throw error;
        }
    };


    return {
        fetchAllArchiveDecksFromHistory,
        fetchArchiveDeckFromHistory,
        saveLatestDeckToHistory,
        saveEditingDeckToHistory,
        restoreDeckFromHistory,
        bulkRestoreDecksFromHistory,
        deleteDeckFromHistory,
        bulkDeleteDecksFromHistory,
        updateArchiveDeckIsFavoriteToHistory,
        bulkUpdateArchiveDecksIsFavoriteToHistory,

        fetchAllArchiveDecksFromTrash,
        fetchArchiveDeckFromTrash,
        moveDeckToTrash,
        bulkMoveDecksToTrash,
        restoreDeckFromTrash,
        bulkRestoreDecksFromTrash,
        deleteDeckFromTrash,
        bulkDeleteDecksFromTrash,
        updateArchiveDeckIsFavoriteToTrash,
        bulkUpdateArchiveDecksIsFavoriteToTrash,

        runDeckGarbageCollection,
    };
};