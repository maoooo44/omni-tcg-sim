/**
 * src/services/decks/deckService.ts
 *
 * * Deck（デッキ）データに関するサービス層モジュール。
 * * 責務:
 * 1. メインコレクション（'decks'）における Deck データの CRUD 操作（**バルク処理を基本**とする）。
 * 2. Deck データのインメモリキャッシュ（_deckCache）のロード、読み取り、同期。
 * 3. DBコア層（dbCore）とデータマッパー（dbMappers）を結合し、ドメインモデル（Deck）の永続化と取得を担う。
 * 4. DB操作のロギングとエラーハンドリングを行う。
 */
import type { Deck } from "../../models/models";
import {
    fetchAllItemsFromCollection,
    bulkPutItemsToCollection,
    bulkDeleteItemsFromCollection,
    bulkFetchItemsByIdsFromCollection,
    bulkUpdateItemsSingleFieldToCollection,
    bulkUpdateItemsMultipleFieldsToCollection
} from '../database/dbCore';
import {
    deckToDBDeck,
    dbDeckToDeck,
} from '../database/dbMappers';
import type { DBDeck } from "../../models/models";

let _deckCache: Map<string, Deck> | null = null;

export type CollectionKey = 'decks';


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
        console.log(`[DeckService:fetchDecksByIds] 🔍 Fetching ${ids.length} decks from ${collectionKey} (Bulk).`); // 修正適用箇所

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
            // キャッシュが未初期化の場合のみ初期化
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
    // CRUD (保存・更新の一本化 - バルク対応)
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
    // Physical Deletion (物理削除)
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
    // Field Update (ストアアクションから利用されるフィールド更新)
    // ----------------------------------------

    /**
     * 複数のDeckアイテムの特定のフィールドを、すべて同じ値で一括更新します。
     * @param ids 更新するDeckの主キーの配列
     * @param field 更新するフィールド名 ('isFavorite', 'updatedAt'など)
     * @param value 設定する新しい値 (全IDに適用)
     * @returns 更新されたレコードの総数
     */
    async updateDecksSingleField(
        ids: string[],
        field: string,
        value: any
    ): Promise<number> {
        // コレクションキーの型は、ファイル先頭で定義されている CollectionKey ('decks' と想定)
        const collectionKey: CollectionKey = 'decks'; 
        console.log(`[DeckService:updateDecksSingleField] ⚡️ Bulk updating field '${field}' on ${collectionKey} for ${ids.length} items.`);
        
        try {
            // dbCoreの汎用バルク更新関数をコレクション名 'decks' 固定で呼び出す
            const numUpdated = await bulkUpdateItemsSingleFieldToCollection(
                ids,
                collectionKey,
                field,
                value
            );
            
            // ★キャッシュ更新ロジック: 必要に応じて追加
            // 2. キャッシュ更新ロジックの修正: _deckCache が null でないことを確認
            if (numUpdated > 0 && _deckCache) { // ★ 修正: _deckCache が存在することを保証
                const cache = _deckCache; // nullでないことが保証されたローカル変数に代入
                
                ids.forEach(id => {
                    const cachedDeck = cache.get(id); // ローカル変数 'cache' を使用
                    if (cachedDeck) {
                        // キャッシュ内のオブジェクトの新しいコピーを作成し、特定のフィールドを更新
                        const updatedDeck: Deck = { 
                            ...cachedDeck,
                            [field]: value 
                        };
                        // キャッシュに上書き保存
                        cache.set(id, updatedDeck); // ローカル変数 'cache' を使用
                        console.log(`[DeckService:updateDecksSingleField] ✅ Cache updated for Deck ID: ${id}.`);
                    }
                });
            }
            
            
            return numUpdated;

        } catch (error) {
            console.error(`[DeckService:updateDecksSingleField] ❌ Failed to update field ${field}:`, error);
            throw error;
        }
    },

        /**
         * 複数のDeckアイテムに対して、同じフィールドを一括更新します。
         * @param ids 更新する Deck の ID 配列
         * @param fields 更新するフィールド（Partial<Deck>）。updatedAt はストア層で追加される前提
         * @returns 更新されたレコードの総数
         */
        async updateDecksMultipleFields(
            ids: string[],
            fields: Partial<Deck>
        ): Promise<number> {
            const collectionKey: CollectionKey = 'decks';
            console.log(`[DeckService:updateDecksMultipleFields] ⚡️ Bulk updating multiple fields on ${collectionKey} for ${ids.length} items.`);
            
            try {
                // dbCoreの汎用バルク更新関数を呼び出す
                const updates = ids.map(id => ({ id, ...fields }));
                const numUpdated = await bulkUpdateItemsMultipleFieldsToCollection(
                    ids,
                    collectionKey,
                    updates
                );
                
                // キャッシュ更新ロジック
                if (numUpdated > 0 && _deckCache) {
                    const cache = _deckCache;
    
                    ids.forEach(id => {
                        const cachedDeck = cache.get(id);
                        if (cachedDeck) {
                            // 更新内容をマージして新しいオブジェクトを作成
                            const updatedDeck: Deck = { 
                                ...cachedDeck,
                                ...fields
                            } as Deck;
                            cache.set(id, updatedDeck);
                            console.log(`[DeckService:updateDecksMultipleFields] ✅ Cache updated for Deck ID: ${id}.`);
                        }
                    });
                }
                
                return numUpdated;
    
            } catch (error) {
                console.error(`[DeckService:updateDecksMultipleFields] ❌ Failed to update multiple fields:`, error);
                throw error;
            }
        },
};