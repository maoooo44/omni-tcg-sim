/**
 * src/services/database/mappers/dbDeckMappers.ts
 *
 * * Deck モデル、ArchiveDeck モデルとデータベースレコード（DBDeck、DBArchive）間の相互マッピングを管理するモジュール。
 * * 責務:
 * 1. アプリケーションモデル（Deck）とDBレコード（DBDeck）の相互変換（Map構造とRecord構造の相互変換を含む）。
 * 2. Deck.number の undefined と DBDeck.number の null の相互変換など、DB格納形式に合わせた型の調整。
 * 3. Deckモデルをアーカイブレコード形式（DBArchive）にラップする変換（deckToDBArchive）。
 * 4. DBArchiveからDeckモデル、およびArchiveDeckモデルへの抽出・復元（dbArchiveToDeck, dbArchiveToArchiveDeck）。
 */
import type { Deck } from '../../../models/deck';
import type { ArchiveDeck } from '../../../models/archive';
import type { DBDeck, DBArchive } from '../../../models/db-types';

// =========================================================================
// Map <-> Record ユーティリティ
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

// =========================================================================
// Tag ユーティリティ (削除: 型が string[] に統一されたため不要)
// =========================================================================
// 以前の Tag ユーティリティ関数は削除されます。

// =========================================================================
// Deck <-> DBDeck マッピング
// =========================================================================

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

        // カスタムフィールド
        num_1: deck.num_1, num_2: deck.num_2, num_3: deck.num_3,
        num_4: deck.num_4,
        str_1: deck.str_1, str_2: deck.str_2, str_3: deck.str_3,
        str_4: deck.str_4,
        fieldSettings: deck.fieldSettings,
        // 修正: 型が一致したため、直接代入
        tag: deck.tag,
        searchText: deck.searchText,
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

        // カスタムフィールド
        num_1: dbDeck.num_1, num_2: dbDeck.num_2, num_3: dbDeck.num_3,
        num_4: dbDeck.num_4,
        str_1: dbDeck.str_1, str_2: dbDeck.str_2, str_3: dbDeck.str_3,
        str_4: dbDeck.str_4,
        fieldSettings: dbDeck.fieldSettings,
        // 修正: 型が一致したため、直接代入
        tag: dbDeck.tag,
        searchText: dbDeck.searchText,
    }
    return deck;
};

// =========================================================================
// Archive への/からのマッピング
// =========================================================================

/**
 * Deckモデルを DBArchive の形式に変換します。
 * @param deck Deck モデル
 * @returns DBArchive モデル
 */
export const deckToDBArchive = (deck: Deck): DBArchive => {
    return {
        // DBArchive 型のフィールド順序に従う
        archiveId: deck.deckId,
        itemId: deck.deckId,
        itemType: 'deck',
        archivedAt: new Date().toISOString(),
        itemData: deckToDBDeck(deck),
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
    deck.isFavorite = dbArchive.isFavorite; // ArchiveのisFavoriteで上書き
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
    const deck = dbDeckToDeck(dbDeck);

    // 2. ArchiveDeck の構造に従い、Deckデータと meta メタデータを統合
    return {
        // deck のプロパティを展開
        ...deck,

        // 修正: Archive メタデータは meta プロパティにネスト
        meta: {
            archiveId: dbArchive.archiveId,
            archivedAt: dbArchive.archivedAt,
            isManual: dbArchive.isManual,
            // isFavorite は Archive の値を使用 (Deckの isFavorite と重複するが、Archiveの情報を採用)
            isFavorite: dbArchive.isFavorite,
        }
    };
};