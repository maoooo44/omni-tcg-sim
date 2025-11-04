/**
 * src/services/database/mappers/dbPackMappers.ts
 *
 * * Pack モデル/PackBundle モデル、ArchivePack モデル/ArchivePackBundle モデルとデータベースレコード（DBPack、DBPackBundle、DBArchive）間の相互マッピングを管理するモジュール。
 * * 責務:
 * 1. アプリケーションモデル（Pack）とDBレコード（DBPack）の相互変換。
 * 2. Pack.number の undefined と DBPack.number の null の相互変換など、DB格納形式に合わせた型の調整。
 * 3. PackBundleをアーカイブレコード形式（DBArchive）にラップする変換（packBundleToDBArchive）。
 * 4. DBArchiveからPack、PackBundle、ArchivePack、ArchivePackBundleモデルへの抽出・復元。
 */
import type { Pack, PackBundle, ArchivePack, ArchivePackBundle, DBPack, DBPackBundle, DBArchive } from '../../../models/models';
import { cardToDBCard, dbCardToCard } from '../dbMappers';

// =========================================================================
// Tag ユーティリティ (削除: 型が string[] に統一されたため不要)
// =========================================================================

// =========================================================================
// Pack <-> DBPack マッピング
// =========================================================================
export const packToDBPack = (pack: Pack): DBPack => {
    // tagの型が Pack: string[] -> DBPack: string[] となったため、変換関数は不要

    const dbPack: DBPack = {
        // Pack (DBPack) 定義の基本フィールド順序に従う
        packId: pack.packId,
        name: pack.name,
        // Packの undefined を DBPackの null に変換
        number: pack.number !== undefined ? pack.number : null,
        imageUrl: pack.imageUrl,
        imageColor: pack.imageColor,
        cardBackImageUrl: pack.cardBackImageUrl,
        // ★ [新規追加] cardBackImageColor を追加
        cardBackImageColor: pack.cardBackImageColor,
        price: pack.price,
        packType: pack.packType,
        cardsPerPack: pack.cardsPerPack,
        // 確率設定関連のフィールド
        rarityConfig: pack.rarityConfig,
        advancedRarityConfig: pack.advancedRarityConfig,
        specialProbabilitySlots: pack.specialProbabilitySlots,
        isAdvancedRulesEnabled: pack.isAdvancedRulesEnabled,
        // その他のフィールド
        uniqueCards: pack.uniqueCards,
        totalCards: pack.totalCards,
        series: pack.series,
        description: pack.description,
        isOpened: pack.isOpened,
        isFavorite: pack.isFavorite,
        createdAt: pack.createdAt,
        updatedAt: pack.updatedAt,
        
        // ★ [新規追加] constructedDeckCards を追加
        constructedDeckCards: pack.constructedDeckCards,

        // カスタムフィールド
        num_1: pack.num_1, num_2: pack.num_2,
        str_1: pack.str_1, str_2: pack.str_2,
        packFieldSettings: pack.packFieldSettings,
        cardFieldSettings: pack.cardFieldSettings,
        // 修正: 型が一致したため、直接代入
        tag: pack.tag,
        searchText: pack.searchText,
    }
    return dbPack;
};

export const dbPackToPack = (dbPack: DBPack): Pack => {
    // tagの型が DBPack: string[] -> Pack: string[] となったため、変換関数は不要

    const pack: Pack = {
        // Pack 定義のフィールド順序に従う
        packId: dbPack.packId,
        name: dbPack.name,
        // DBPackの null を Packの undefined に変換
        number: dbPack.number !== null ? dbPack.number : undefined,
        imageUrl: dbPack.imageUrl,
        imageColor: dbPack.imageColor,
        cardBackImageUrl: dbPack.cardBackImageUrl,
        // ★ [新規追加] cardBackImageColor を追加
        cardBackImageColor: dbPack.cardBackImageColor,
        price: dbPack.price,
        packType: dbPack.packType,
        cardsPerPack: dbPack.cardsPerPack,
        uniqueCards: dbPack.uniqueCards,
        totalCards: dbPack.totalCards,
        series: dbPack.series,
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

        // ★ [新規追加] constructedDeckCards を追加
        constructedDeckCards: dbPack.constructedDeckCards,

        // カスタムフィールド
        num_1: dbPack.num_1, num_2: dbPack.num_2,
        str_1: dbPack.str_1, str_2: dbPack.str_2,
        packFieldSettings: dbPack.packFieldSettings,
        cardFieldSettings: dbPack.cardFieldSettings,
        // 修正: 型が一致したため、直接代入
        tag: dbPack.tag,
        searchText: dbPack.searchText,
    }
    return pack;
};

// =========================================================================
// Archive への/からのマッピング
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
        // DBArchive 型のフィールド順序に従う
        archiveId: bundle.packData.packId,
        itemId: bundle.packData.packId,
        itemType: 'packBundle',
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
    // isFavorite は DBArchive のメタデータから上書き
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
    // isFavorite は DBArchive のメタデータから上書き
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
    const pack = dbPackToPack(dbPackBundle.packData);

    // 2. ArchivePack の構造に従い、Packデータと meta メタデータを統合
    return {
        // pack のプロパティ（カスタムインデックスを含む）を展開
        ...pack,

        // 修正: Archive メタデータは meta プロパティにネスト
        meta: {
            archiveId: dbArchive.archiveId,
            archivedAt: dbArchive.archivedAt,
            isManual: dbArchive.isManual,
            // isFavorite は Pack の値ではなく Archive の値を使用
            isFavorite: dbArchive.isFavorite,
        }
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
    const pack = dbPackToPack(dbPackBundle.packData);
    const cards = dbPackBundle.cardsData.map(dbCardToCard);

    // 2. ArchivePackBundle の構造に従い、PackBundleとDBArchiveのメタデータを統合
    return {
        // PackBundle の基本フィールド
        packData: {
            // pack のプロパティ（カスタムインデックスを含む）を展開
            ...pack,

            // isFavorite は DBArchive の値を採用するため上書き
            isFavorite: dbArchive.isFavorite,
        },
        cardsData: cards,

        // 修正: Archive メタデータは meta プロパティにネスト
        meta: {
            archiveId: dbArchive.archiveId,
            archivedAt: dbArchive.archivedAt,
            isFavorite: dbArchive.isFavorite,
            isManual: dbArchive.isManual,
        }
    };
};