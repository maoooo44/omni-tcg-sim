
import type { Deck } from '../../../models/deck';
import type { ArchiveDeck } from '../../../models/archive'; 
import type { DBDeck,  DBArchive } from '../../../models/db-types'; 
//import { mapCustomIndexes } from '../dbMappers';

// =========================================================================
// 3. Deck <-> DBDeck マッピング (カスタムインデックス30枠をヘルパー関数に置き換え)
// =========================================================================

/**
 * Deckモデルの Map を JSON互換の Record<string, number> に変換します。
 * @param map - 変換元の Map
 * @returns 変換後の Record
 */
const mapToRecord = (map: Map<string, number>): Record<string, number> => {
    return Object.fromEntries(map);
};

/**
 * DBDeck の Record<string, number> を Deckモデルの Map に変換します。
 * @param record - 変換元の Record
 * @returns 変換後の Map
 */
const recordToMap = (record: Record<string, number>): Map<string, number> => {
    return new Map(Object.entries(record));
};


export const deckToDBDeck = (deck: Deck): DBDeck => {
    const dbDeck: DBDeck = {
        // Deck / DBDeck 定義のフィールド順序に従う
        deckId: deck.deckId,
        name: deck.name,
        // Deckの undefined を DBDeckの null に変換
        number: deck.number !== undefined ? deck.number : null,
        imageUrl: deck.imageUrl,
        imageColor: deck.imageColor,
        ruleId: deck.ruleId,
        deckType: deck.deckType,
        totalCards: deck.totalCards,
        series: deck.series,
        description: deck.description,
        isLegal: deck.isLegal,
        hasUnownedCards: deck.hasUnownedCards,
        isFavorite: deck.isFavorite,
        createdAt: deck.createdAt,
        updatedAt: deck.updatedAt,
        
        // MapをRecordに変換
        mainDeck: mapToRecord(deck.mainDeck), 
        sideDeck: mapToRecord(deck.sideDeck),
        extraDeck: mapToRecord(deck.extraDeck),
        
        num_1: deck.num_1, num_2: deck.num_2, num_3: deck.num_3,
        num_4: deck.num_4,
        str_1: deck.str_1, str_2: deck.str_2, str_3: deck.str_3,
        str_4: deck.str_4,
        fieldSettings: deck.fieldSettings,
        tag:deck.tag,
        searchText:deck.searchText,
    }
    return dbDeck;
};

export const dbDeckToDeck = (dbDeck: DBDeck): Deck => {
    const deck: Deck = {
        // Deck / DBDeck 定義のフィールド順序に従う
        deckId: dbDeck.deckId,
        name: dbDeck.name,
        // DBDeckの null を Deckの undefined に変換
        number: dbDeck.number !== null ? dbDeck.number : undefined,
        imageUrl: dbDeck.imageUrl,
        imageColor: dbDeck.imageColor,
        ruleId: dbDeck.ruleId,
        deckType: dbDeck.deckType,
        totalCards: dbDeck.totalCards,
        series: dbDeck.series,
        description: dbDeck.description,
        isLegal: dbDeck.isLegal,
        hasUnownedCards: dbDeck.hasUnownedCards,
        isFavorite: dbDeck.isFavorite,
        createdAt: dbDeck.createdAt,
        updatedAt: dbDeck.updatedAt,

        // RecordをMapに変換
        mainDeck: recordToMap(dbDeck.mainDeck), 
        sideDeck: recordToMap(dbDeck.sideDeck),
        extraDeck: recordToMap(dbDeck.extraDeck), 

        num_1: dbDeck.num_1, num_2: dbDeck.num_2, num_3: dbDeck.num_3,
        num_4: dbDeck.num_4,
        str_1: dbDeck.str_1, str_2: dbDeck.str_2, str_3: dbDeck.str_3,
        str_4: dbDeck.str_4,
        fieldSettings: dbDeck.fieldSettings,
        tag:dbDeck.tag,
        searchText:dbDeck.searchText,
    }
    return deck;
};

/**
 * Deckモデルを DBArchive の形式に変換します。
 * @param deck Deck モデル
 * @returns DBArchive モデル
 */
export const deckToDBArchive = (deck: Deck): DBArchive => {
    // 💡 修正: collectionKey の固定値設定を削除（ただし、DBArchiveでは必須フィールドのため、呼び出し側で解決される前提）
    return {
        // DBArchive 型のフィールド順序に従う
        archiveId: deck.deckId,
        itemId: deck.deckId,
        itemType: 'deck',
        // collectionKey: ... 👈 必須だが、ここでは設定しない
        archivedAt: new Date().toISOString(),
        itemData: deckToDBDeck(deck), // 💡 deckToDBDeckが修正されたため、ここは間接的に修正済
        isFavorite: deck.isFavorite,
        isManual: true,
    };
};

/**
 * DBArchive (DBDeck) レコードから Deck モデルを抽出・変換します。
 * @param dbArchive DBArchive レコード
 * @returns Deck モデル
 */
export const dbArchiveToDeck = (dbArchive: DBArchive): Deck => {
    const dbDeck = dbArchive.itemData as DBDeck;
    const deck = dbDeckToDeck(dbDeck);
    deck.isFavorite = dbArchive.isFavorite;
    return deck;
};


/**
 * DBArchive (DBDeck) レコードから ArchiveDeck モデルを抽出・変換します。
 * @param dbArchive - 変換対象の DBArchive レコード
 * @returns ArchiveDeck - アーカイブメタデータを含む Deck モデル
 */
export const dbArchiveToArchiveDeck = (dbArchive: DBArchive): ArchiveDeck => {
    // itemData は DBDeck を期待
    const dbDeck = dbArchive.itemData as DBDeck;
    
    // 1. DBDeck を基本の Deck モデルに変換
    const deck = dbDeckToDeck(dbDeck); // すべてのカスタムインデックスがマッピングされている

    // 2. ArchiveDeck 型のフィールド順序に従い、DBArchiveのメタデータを統合
    return {
        // 💡 修正: deck のほぼ全てのプロパティ（カスタムインデックスを含む）をスプレッド構文で展開
        ...deck,
        
        // ⚠️ 上書きが必要なフィールドや、展開前に Deck に存在しなかったフィールドを後から記述
        
        // Map型はJSON互換ではないため、DeckからArchiveDeckへの変換でRecordのMapへの再変換は不要
        
        // Archive メタデータ (deckに存在しないフィールド)
        archiveId: dbArchive.archiveId,
        archivedAt: dbArchive.archivedAt,
        isManual: dbArchive.isManual,

        // isFavorite は Archive の値で上書きする (必須: isFavoriteがDeckとArchiveで重複)
        isFavorite: dbArchive.isFavorite, 
    };
};