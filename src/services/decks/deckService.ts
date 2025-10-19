/**
 * src/services/decks/deckService.ts
 *
 * Deck（デッキ）データに関するサービス層。
 * 責務:
 * 1. メインコレクション（'decks'）における Deck データの CRUD 操作（キャッシュ同期を含む）。
 * 2. DBコア層（dbCore）とデータマッパー（dbMappers）の橋渡し。
 * 3. ❌ アーカイブコレクションへの操作ロジックは削除し、**'decks'コレクション専用**とする。
 * 4. ID指定または全件取得時のキャッシュからの高速アクセスを提供。
 * 5. ❌ 論理削除/復元のオーケストレーションはarchiveServiceに分離。
 * 6. 全ての永続化・削除操作を**バルク処理**に一本化する。
 */
import type { Deck } from "../../models/deck";
import { 
    fetchAllItemsFromCollection, 
    bulkPutItemsToCollection,
    bulkDeleteItemsFromCollection,
    bulkFetchItemsByIdsFromCollection,
    // DbCollectionName は使用しないため削除
} from '../database/dbCore';
import { 
    deckToDBDeck, 
    dbDeckToDeck, 
    // dbArchiveToDeck のインポートを削除
} from '../database/dbMappers';
import type { DBDeck /* DBArchive, ArchiveItemType のインポートを削除 */ } from "../../models/db-types";
// archiveService, ArchiveCollectionKey のインポートを削除

let _deckCache: Map<string, Deck> | null = null; 

export type CollectionKey = 'decks'; // ArchiveCollectionKey を削除
// const ARCHIVE_ITEM_TYPE: ArchiveItemType = 'deck'; // 削除


export const deckService = {

    // ----------------------------------------
    // [1] Cache Load / Read (キャッシュ/DBからの取得)
    // ----------------------------------------

    getAllDecksFromCache(): Deck[] { 
        return _deckCache ? Array.from(_deckCache.values()) : []; 
    },
    
    getDeckByIdFromCache(deckId: string): Deck | undefined { 
        return _deckCache?.get(deckId); 
    },

    /**
     * Deck IDを指定して複数のデッキを一括取得します。（バルク処理に一本化）
     * メインコレクション（'decks'）からのみ取得します。
     * @param ids - Deck IDの配列。
     * @returns Deck | null の配列。結果配列の順序は ids の順序と一致します。
     */
    async fetchDecksByIds(ids: string[]): Promise<(Deck | null)[]> {
        if (ids.length === 0) return [];
        
        const collectionKey: CollectionKey = 'decks';
        console.log(`[DeckService:fetchDecksByIds] 🔍 Fetching ${ids.length} packs from ${collectionKey} (Bulk).`);

        // 1. キャッシュヒットしたDeckと、DBからフェッチが必要なIDを分離
        const resultsMap = new Map<string, Deck>();
        const idsToFetchFromDB: string[] = [];

        for (const deckId of ids) {
            const cachedDeck = this.getDeckByIdFromCache(deckId);
            if (cachedDeck) {
                resultsMap.set(deckId, cachedDeck);
            } else {
                idsToFetchFromDB.push(deckId);
            }
        }

        // 2. DBからのバルク取得が必要な場合
        if (idsToFetchFromDB.length > 0) {
            console.log(`[DeckService:fetchDecksByIds] ➡️ Cache miss for ${idsToFetchFromDB.length} IDs. Fetching from DB...`);
            
            // dbCore の正式なバルク取得関数を使用
            const fetchedDecksOrNull = await bulkFetchItemsByIdsFromCollection<Deck, DBDeck>(
                idsToFetchFromDB, 
                collectionKey,
                dbDeckToDeck 
            );
            
            // 3. 取得結果を Deck に変換し、キャッシュと結果Mapに追加
            fetchedDecksOrNull.forEach(deck => {
                if (deck) {
                    _deckCache?.set(deck.deckId, deck);
                    resultsMap.set(deck.deckId, deck);
                }
            });
        }

        // 4. 元の ids の順序で結果配列を再構成
        const finalDecks: (Deck | null)[] = ids.map(id => resultsMap.get(id) ?? null);
        
        return finalDecks;
    },


    /**
     * メインコレクション（'decks'）から全ての Deck データを取得します。
     */
    async fetchAllDecks(): Promise<Deck[]> {
        const collectionKey: CollectionKey = 'decks';
        console.log(`[DeckService:fetchAllDecks] 🔍 Fetching all decks from ${collectionKey}.`);
        
        if (_deckCache) {
            console.log(`[DeckService:fetchAllDecks] ✅ Cache hit (all decks).`);
            return this.getAllDecksFromCache();
        }

        const converter = dbDeckToDeck as (dbRecord: DBDeck) => Deck;
        
        try {
            // dbCore.fetchAllItemsFromCollection はコレクション全体を取得するバルク操作
            const decks = await fetchAllItemsFromCollection<Deck, DBDeck>(
                collectionKey,
                converter
            );
            if (!_deckCache) {
                _deckCache = new Map(decks.map(d => [d.deckId, d]));
            }
            return decks;
        } catch (error) {
            console.error(`[DeckService:fetchAllDecks] ❌ Failed to fetch from ${collectionKey}:`, error);
            throw error;
        }
    },

    // ----------------------------------------
    // [2] CRUD (保存・更新の一本化 - バルク対応)
    // ----------------------------------------

    /**
     * Deck[] をメインコレクション（'decks'）に保存します。（バルク処理）
     * @param itemsToSave - 保存する Deck モデルの配列。updatedAtは呼び出し元が設定済みである必要があります。
     */
    async saveDecks(itemsToSave: Deck[]): Promise<Deck[]> {
        
        if (itemsToSave.length === 0) return [];
        
        const collectionKey: CollectionKey = 'decks';
        console.log(`[DeckService:saveDecks] 💾 Saving ${itemsToSave.length} items to ${collectionKey}...`);
        
        // updatedAtは呼び出し元（Store）で設定されている前提
        const recordsToSave = itemsToSave.map(deckToDBDeck);

        try {
            // DBに一括保存
            await bulkPutItemsToCollection<DBDeck>('decks', recordsToSave);

            // キャッシュと戻り値を準備
            const savedDecks = recordsToSave.map(dbRecord => dbDeckToDeck(dbRecord));
            savedDecks.forEach(deck => _deckCache?.set(deck.deckId, deck));
            
            console.log(`[DeckService:saveDecks] ✅ Successfully saved ${savedDecks.length} decks to ${collectionKey}.`);
            return savedDecks;

        } catch (error) {
            console.error(`[DeckService:saveDecks] ❌ Failed to save decks to ${collectionKey}:`, error);
            throw error;
        }
    },
    
    // ----------------------------------------
    // [3] Physical Deletion (物理削除)
    // ----------------------------------------

    /**
     * Deck IDを指定して Deck データをメインコレクションから物理削除します。（バルク対応）
     * @param ids - Deck IDの配列。
     */
    async deleteDecks(ids: string[]): Promise<void> {
        if (ids.length === 0) return;
        
        const collectionKey: CollectionKey = 'decks';
        console.log(`[DeckService:deleteDecks] 🗑️ Deleting ${ids.length} items from ${collectionKey} (Bulk).`);
        
        try {
            // 1. DeckをDBから一括削除
            await bulkDeleteItemsFromCollection('decks', ids);

            // 2. キャッシュを更新
            ids.forEach(id => _deckCache?.delete(id)); 
            
            // 3. 物理カスケード: デッキには関連エンティティがないため、追加の削除処理は不要。
            
            console.log(`[DeckService:deleteDecks] ✅ Deleted ${ids.length} decks from ${collectionKey}.`);
        } catch (error) {
            console.error(`[DeckService:deleteDecks] ❌ Failed to delete from ${collectionKey}:`, error);
            throw error;
        }
    },


    // ----------------------------------------
    // [4] Logical Deletion/Restore/Maintenance (archiveServiceに分離したため削除)
    // ----------------------------------------

    // restoreDecksFromArchive メソッドは削除
    // runDeckGarbageCollection メソッドは削除
};