import type { Pack, PackBundle } from '../../../models/pack';
import type { ArchivePack, ArchivePackBundle } from '../../../models/archive'; 
import type { DBPack, DBPackBundle, DBArchive } from '../../../models/db-types'; 
import { mapCustomIndexes,cardToDBCard, dbCardToCard } from '../dbMappers';

// =========================================================================
// 2. Pack <-> DBPack マッピング (カスタムインデックス30枠をヘルパー関数に置き換え)
// =========================================================================
export const packToDBPack = (pack: Pack): DBPack => {
    const dbPack: DBPack = {
        // Pack (DBPack) 定義の基本フィールド順序に従う
        packId: pack.packId,
        name: pack.name,
        // Packの undefined を DBPackの null に変換
        number: pack.number !== undefined ? pack.number : null,
        imageUrl: pack.imageUrl,
        imageColor: pack.imageColor,
        cardBackImageUrl: pack.cardBackImageUrl,
        price: pack.price, 
        packType: pack.packType, 
        cardsPerPack: pack.cardsPerPack, 
        // DBPackの確率設定関連のフィールドは Pack 定義の基本フィールドの後に続く
        rarityConfig: pack.rarityConfig, 
        advancedRarityConfig: pack.advancedRarityConfig,
        specialProbabilitySlots: pack.specialProbabilitySlots,
        isAdvancedRulesEnabled: pack.isAdvancedRulesEnabled,
        // DBPackのその他のフィールド
        totalCards: pack.totalCards, 
        series: pack.series, 
        releaseDate: pack.releaseDate, 
        description: pack.description, 
        isOpened: pack.isOpened, 
        isFavorite: pack.isFavorite,
        createdAt: pack.createdAt,
        updatedAt: pack.updatedAt, 
    } as DBPack; // 一時的な型アサーション

    // 💡 修正: カスタムインデックスの30行をヘルパー関数に置き換え
    return mapCustomIndexes<Pack, DBPack>(pack, dbPack);
};

export const dbPackToPack = (dbPack: DBPack): Pack => {
    const pack: Pack = {
        // Pack 定義のフィールド順序に従う
        packId: dbPack.packId,
        name: dbPack.name,
        // DBPackの null を Packの undefined に変換
        number: dbPack.number !== null ? dbPack.number : undefined,
        imageUrl: dbPack.imageUrl,
        imageColor: dbPack.imageColor,
        cardBackImageUrl: dbPack.cardBackImageUrl,
        price: dbPack.price,
        packType: dbPack.packType,
        cardsPerPack: dbPack.cardsPerPack,
        totalCards: dbPack.totalCards,
        series: dbPack.series,
        releaseDate: dbPack.releaseDate,
        description: dbPack.description,
        isOpened: dbPack.isOpened,
        isFavorite: dbPack.isFavorite,
        createdAt: dbPack.createdAt,
        updatedAt: dbPack.updatedAt, 

        // 確率用
        rarityConfig: dbPack.rarityConfig,
        // 空配列の場合は undefined に変換
        advancedRarityConfig: (dbPack.advancedRarityConfig && dbPack.advancedRarityConfig.length > 0) 
            ? dbPack.advancedRarityConfig 
            : undefined,
        specialProbabilitySlots: dbPack.specialProbabilitySlots,
        isAdvancedRulesEnabled: dbPack.isAdvancedRulesEnabled,
    } as Pack; // 一時的な型アサーション

    // 💡 修正: カスタムインデックスの30行をヘルパー関数に置き換え
    return mapCustomIndexes<DBPack, Pack>(dbPack, pack);
};

/**
 * PackBundle（Packと紐づくカード群）を DBArchive の形式に変換します。
 * @param bundle PackBundle モデル
 * @returns DBArchive モデル
 */
export const packBundleToDBArchive = (bundle: PackBundle): DBArchive => {
    const dbPackBundle: DBPackBundle = {
        packData: packToDBPack(bundle.packData), // 💡 packToDBPackが修正されたため、ここは間接的に修正済
        cardsData: (bundle.cardsData || []).map(cardToDBCard), // 💡 cardToDBCardが修正されたため、ここは間接的に修正済
    };

    // 💡 修正: collectionKey の固定値設定を削除（ただし、DBArchiveでは必須フィールドのため、呼び出し側で解決される前提）
    return {
        // DBArchive 型のフィールド順序に従う
        archiveId: bundle.packData.packId,
        itemId: bundle.packData.packId, 
        itemType: 'packBundle',
        // collectionKey: ... 👈 必須だが、ここでは設定しない
        archivedAt: new Date().toISOString(),
        itemData: dbPackBundle,
        isFavorite: bundle.packData.isFavorite,
        isManual: true,
    };
};

/**
 * DBArchive (PackBundle) レコードから Pack モデルを抽出・変換します。
 * @param dbArchive DBArchive レコード
 * @returns Pack モデル
 */
export const dbArchiveToPack = (dbArchive: DBArchive): Pack => {
    const dbPackBundle = dbArchive.itemData as DBPackBundle;
    const pack = dbPackToPack(dbPackBundle.packData);
    pack.isFavorite = dbArchive.isFavorite; 
    return pack;
};

/**
 * DBArchive (PackBundle) レコードから PackBundle モデルを抽出・変換します。
 * @param dbArchive DBArchive レコード
 * @returns PackBundle モデル
 */
export const dbArchiveToPackBundle = (dbArchive: DBArchive): PackBundle => {
    const dbPackBundle = dbArchive.itemData as DBPackBundle;
    const pack = dbPackToPack(dbPackBundle.packData);
    const cards = dbPackBundle.cardsData.map(dbCardToCard);
    pack.isFavorite = dbArchive.isFavorite; 
    return {
        packData: pack,
        cardsData: cards,
    };
};


/**
 * DBArchive (PackBundle) レコードから ArchivePack モデルを抽出・変換します。
 * @param dbArchive - 変換対象の DBArchive レコード
 * @returns ArchivePack - アーカイブメタデータを含む Pack モデル
 */
export const dbArchiveToArchivePack = (dbArchive: DBArchive): ArchivePack => {
    // itemData は DBPackBundle を期待
    const dbPackBundle = dbArchive.itemData as DBPackBundle;
    
    // 1. DBPack を基本の Pack モデルに変換
    const pack = dbPackToPack(dbPackBundle.packData); // すべてのカスタムインデックスがマッピングされている
    
    // 2. ArchivePack 型のフィールド順序に従い、DBArchiveのメタデータを統合
    return {
        // 💡 修正: pack のほぼ全てのプロパティ（カスタムインデックスを含む）をスプレッド構文で展開
        ...pack,
        
        // Archive メタデータ (packに存在しないフィールド)
        archiveId: dbArchive.archiveId,
        archivedAt: dbArchive.archivedAt,
        isManual: dbArchive.isManual,

        // isFavorite は Archive の値で上書きする (必須: isFavoriteがPackとArchiveで重複)
        isFavorite: dbArchive.isFavorite, 
    };
};

/**
 * DBArchive (PackBundle) レコードから ArchivePackBundle モデルを抽出・変換します。
 * @param dbArchive - 変換対象の DBArchive レコード
 * @returns ArchivePackBundle - アーカイブメタデータを含む PackBundle モデル
 */
export const dbArchiveToArchivePackBundle = (dbArchive: DBArchive): ArchivePackBundle => {
    // itemData は DBPackBundle を期待
    const dbPackBundle = dbArchive.itemData as DBPackBundle;

    // 1. Pack データと Cards データを基本モデルに変換
    const pack = dbPackToPack(dbPackBundle.packData); // カスタムインデックスはpackに含まれている
    const cards = dbPackBundle.cardsData.map(dbCardToCard); 
    
    // 2. ArchivePackBundle の構造に従い、PackBundleとDBArchiveのメタデータを統合
    return {
        // PackBundle の基本フィールド
        packData: {
            // 💡 修正: pack のほぼ全てのプロパティ（カスタムインデックスを含む）をスプレッド構文で展開
            ...pack,
            
            // isFavorite は DBArchive の値を採用するため上書き
            isFavorite: dbArchive.isFavorite, 
        },
        cardsData: cards,

        // Archive メタデータ
        archiveId: dbArchive.archiveId,
        archivedAt: dbArchive.archivedAt,
        isFavorite: dbArchive.isFavorite,
        isManual: dbArchive.isManual,
    };
};