/**
* src/services/database/dbMappers.ts
*
* アプリケーションモデル（Card, Pack, Deck, PackBundle）と IndexedDBのデータ構造型（DBCard, DBPack, DBDeck, DBPackBundle, DBArchive）
* の間で相互にデータを変換するためのマッピングロジックを提供します。
* このファイルは、各エンティティの永続化形式とアプリケーション内部のデータ形式との関心事の分離を担います。
* 特に、PackやDeckのアーカイブ（DBArchive）への変換と復元ロジックを含みます。
*/

// ... (必要な型インポート)
import type { Card } from '../../models/card';
import type { Pack, PackBundle } from '../../models/pack';
import type { Deck } from '../../models/deck';
import type { DBCard, DBPack, DBDeck, DBPackBundle, DBArchive } from '../../models/db-types'; 

// =========================================================================
// 1. Card <-> DBCard マッピング (変更なし)
// =========================================================================
export const cardToDBCard = (card: Card): DBCard => {
    return {
        cardId: card.cardId,
        packId: card.packId,
        number: card.number !== undefined ? card.number : null,
        name: card.name,
        rarity: card.rarity,
        imageUrl: card.imageUrl,
        isFavorite: card.isFavorite,
        imageColor: card.imageColor, 
        userCustom: card.userCustom || {},
        createdAt: card.createdAt,
        updatedAt: card.updatedAt,
    };
};

export const dbCardToCard = (dbCard: DBCard): Card => {
    return {
        cardId: dbCard.cardId,
        packId: dbCard.packId,
        number: dbCard.number !== null ? dbCard.number : undefined,
        name: dbCard.name,
        imageUrl: dbCard.imageUrl,
        imageColor: dbCard.imageColor, 
        rarity: dbCard.rarity,
        isFavorite: dbCard.isFavorite,
        createdAt: dbCard.createdAt,
        updatedAt: dbCard.updatedAt,
        userCustom: dbCard.userCustom || {},
    };
};

// =========================================================================
// 2. Pack <-> DBPack マッピング
// =========================================================================
export const packToDBPack = (pack: Pack): DBPack => {
    return {
        packId: pack.packId,
        number: pack.number !== undefined ? pack.number : null,
        name: pack.name,
        series: pack.series,
        description: pack.description,
        imageUrl: pack.imageUrl,
        cardBackImageUrl: pack.cardBackImageUrl,
        imageColor: pack.imageColor,
        isFavorite: pack.isFavorite,
        
        // ★ 修正: totalCards のマッピングを追加
        totalCards: pack.totalCards, 

        cardsPerPack: pack.cardsPerPack,
        packType: pack.packType, 
        price: pack.price,
        releaseDate: pack.releaseDate,
        isOpened: pack.isOpened,
        
        rarityConfig: pack.rarityConfig,
        advancedRarityConfig: pack.advancedRarityConfig || undefined,
        specialProbabilitySlots: pack.specialProbabilitySlots,
        isAdvancedRulesEnabled: pack.isAdvancedRulesEnabled,

        userCustom: pack.userCustom || {},
        
        createdAt: pack.createdAt,
        updatedAt: pack.updatedAt,
    };
};

export const dbPackToPack = (dbPack: DBPack): Pack => {
    return {
        packId: dbPack.packId,
        number: dbPack.number !== null ? dbPack.number : undefined,
        name: dbPack.name,
        series: dbPack.series,
        description: dbPack.description,
        imageUrl: dbPack.imageUrl,
        cardBackImageUrl: dbPack.cardBackImageUrl,
        imageColor: dbPack.imageColor,
        isFavorite: dbPack.isFavorite,
        
        // ★ 修正: totalCards のマッピングを追加
        totalCards: dbPack.totalCards,

        cardsPerPack: dbPack.cardsPerPack,
        packType: dbPack.packType,
        price: dbPack.price,
        releaseDate: dbPack.releaseDate,
        isOpened: dbPack.isOpened,
        
        rarityConfig: dbPack.rarityConfig,
        advancedRarityConfig: (dbPack.advancedRarityConfig && dbPack.advancedRarityConfig.length > 0) 
            ? dbPack.advancedRarityConfig 
            : undefined,
        specialProbabilitySlots: dbPack.specialProbabilitySlots,
        isAdvancedRulesEnabled: dbPack.isAdvancedRulesEnabled,

        userCustom: dbPack.userCustom || {},
        
        createdAt: dbPack.createdAt,
        updatedAt: dbPack.updatedAt,
    };
};

// =========================================================================
// 3. Deck <-> DBDeck マッピング (変更なし)
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
    return {
        deckId: deck.deckId,
        number: deck.number !== undefined ? deck.number : null,
        name: deck.name,
        description: deck.description,
        
        imageUrl: deck.imageUrl,
        imgColor: deck.imgColor,
        ruleId: deck.ruleId,
        series: deck.series,
        deckType: deck.deckType,
        isLegal: deck.isLegal,
        isFavorite: deck.isFavorite,
        userCustom: deck.userCustom || {},
        
        mainDeck: mapToRecord(deck.mainDeck), 
        sideDeck: mapToRecord(deck.sideDeck),
        extraDeck: mapToRecord(deck.extraDeck), 

        hasUnownedCards: deck.hasUnownedCards,
        createdAt: deck.createdAt, 
        updatedAt: deck.updatedAt,
    };
};

export const dbDeckToDeck = (dbDeck: DBDeck): Deck => {
    return {
        deckId: dbDeck.deckId,
        number: dbDeck.number !== null ? dbDeck.number : undefined,
        name: dbDeck.name,
        description: dbDeck.description,
        
        imageUrl: dbDeck.imageUrl,
        imgColor: dbDeck.imgColor,
        ruleId: dbDeck.ruleId,
        series: dbDeck.series,
        deckType: dbDeck.deckType,
        isLegal: dbDeck.isLegal,
        isFavorite: dbDeck.isFavorite,
        userCustom: dbDeck.userCustom || {},
        
        mainDeck: recordToMap(dbDeck.mainDeck), 
        sideDeck: recordToMap(dbDeck.sideDeck),
        extraDeck: recordToMap(dbDeck.extraDeck), 
        
        hasUnownedCards: dbDeck.hasUnownedCards,
        createdAt: dbDeck.createdAt, 
        updatedAt: dbDeck.updatedAt,
    };
};


// =========================================================================
// 4. Archive <-> Pack/Deck 相互変換マッピング (変更なし)
// =========================================================================

/**
 * PackBundle（Packと紐づくカード群）を DBArchive の形式に変換します。
 * @param bundle PackBundle モデル
 * @returns DBArchive モデル
 */
export const packBundleToDBArchive = (bundle: PackBundle): DBArchive => {
    const dbPackBundle: DBPackBundle = {
        packData: packToDBPack(bundle.packData),
        cardsData: (bundle.cardsData || []).map(cardToDBCard),
    };

    return {
        archiveId: bundle.packData.packId, // PackID を archiveId (History ID) として使用
        itemId: bundle.packData.packId, 
        itemType: 'packBundle',
        archivedAt: new Date().toISOString(), // 現在時刻をアーカイブ日時とする
        itemData: dbPackBundle,
        isFavorite: bundle.packData.isFavorite, // Pack の isFavorite 状態を保持
    };
};

/**
 * Deckモデルを DBArchive の形式に変換します。
 * @param deck Deck モデル
 * @returns DBArchive モデル
 */
export const deckToDBArchive = (deck: Deck): DBArchive => {
    return {
        archiveId: deck.deckId, // DeckID を archiveId (History ID) として使用
        itemId: deck.deckId,
        itemType: 'deck',
        archivedAt: new Date().toISOString(), // 現在時刻をアーカイブ日時とする
        itemData: deckToDBDeck(deck),
        isFavorite: deck.isFavorite, // Deck の isFavorite 状態を保持
    };
};


/**
 * DBArchive (PackBundle) レコードから Pack モデルを抽出・変換します。
 * @param dbArchive DBArchive レコード
 * @returns Pack モデル
 */
export const dbArchiveToPack = (dbArchive: DBArchive): Pack => {
    // itemData は DBPackBundle を期待
    const dbPackBundle = dbArchive.itemData as DBPackBundle;
    
    // DBPack を Pack に変換。PackのID/isFavoriteを維持し、Archiveのメタデータは無視
    const pack = dbPackToPack(dbPackBundle.packData);
    
    // DBArchive の isFavorite をモデルに反映（上書き）
    pack.isFavorite = dbArchive.isFavorite; 
    
    return pack;
};

/**
 * DBArchive (PackBundle) レコードから PackBundle モデルを抽出・変換します。
 * @param dbArchive DBArchive レコード
 * @returns PackBundle モデル
 */
export const dbArchiveToPackBundle = (dbArchive: DBArchive): PackBundle => {
    // itemData は DBPackBundle を期待
    const dbPackBundle = dbArchive.itemData as DBPackBundle;

    const pack = dbPackToPack(dbPackBundle.packData);
    const cards = dbPackBundle.cardsData.map(dbCardToCard);
    
    // DBArchive の isFavorite を Pack モデルに反映（上書き）
    pack.isFavorite = dbArchive.isFavorite; 

    return {
        packData: pack,
        cardsData: cards,
    };
};

/**
 * DBArchive (DBDeck) レコードから Deck モデルを抽出・変換します。
 * @param dbArchive DBArchive レコード
 * @returns Deck モデル
 */
export const dbArchiveToDeck = (dbArchive: DBArchive): Deck => {
    // itemData は DBDeck を期待
    const dbDeck = dbArchive.itemData as DBDeck;
    
    // DBDeck を Deck に変換。DeckのID/isFavoriteを維持し、Archiveのメタデータは無視
    const deck = dbDeckToDeck(dbDeck);
    
    // DBArchive の isFavorite をモデルに反映（上書き）
    deck.isFavorite = dbArchive.isFavorite;
    
    return deck;
};

/**
 * DBArchive (PackBundle) レコードから Card モデル群を抽出・変換します。
 * @param dbArchive DBArchive レコード
 * @returns Card モデルの配列
 */
export const dbArchiveToCards = (dbArchive: DBArchive): Card[] => {
    // itemData は DBPackBundle を期待
    const dbPackBundle = dbArchive.itemData as DBPackBundle;

    return dbPackBundle.cardsData.map(dbCardToCard);
};