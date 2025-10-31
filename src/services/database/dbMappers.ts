/**
 * src/services/database/dbMappers.ts
 *
 * * データベースマッパー層の統合エントリポイント。
 * * 責務:
 * 1. 各エンティティ固有のマッパーモジュール（dbCardMappers, dbPackMappers, dbDeckMappers）の関数を再エクスポートする。
 * 2. アーカイブ機能（history, trash）で使用されるDBArchiveレコードを、アプリケーションのユニオン表示モデル（ArchiveDisplayData, ArchiveItemData）に変換するルーター/ブリッジング機能を提供する。
 * 3. itemTypeに応じて適切なエンティティマッパー（dbArchiveToArchiveDeck, dbArchiveToArchivePack, dbArchiveToArchivePackBundle）へ処理を委譲する。
 */
import type { DBArchive } from '../../models/db-types';
import type {
    ArchiveDisplayData,
    ArchiveItemData
} from '../../models/archive';

import { dbArchiveToArchiveDeck } from './mappers/dbDeckMappers';
import { dbArchiveToArchivePack } from './mappers/dbPackMappers';
import { dbArchiveToArchivePackBundle } from './mappers/dbPackMappers';


export * from './mappers/dbCardMappers';
export * from './mappers/dbPackMappers';
export * from './mappers/dbDeckMappers';

// ----------------------------------------------------
// Archive Display/Item Data へのユニオン型マッパー
// ----------------------------------------------------

/**
 * DBArchive (生のアーカイブレコード) を ArchiveDisplayData (リスト表示用メタデータ) に変換します。
 * ArchiveDisplayData = ArchiveDeck | ArchivePack
 * @param dbArchive - データベースから取得したDBArchiveレコード
 * @returns ArchiveDisplayData - ArchiveDeck または ArchivePack のユニオン型
 */
export const dbArchiveToArchiveDisplayData = (dbArchive: DBArchive): ArchiveDisplayData => {
    if (dbArchive.itemType === 'deck') {
        // Deckの場合、ArchiveDeckを返す
        return dbArchiveToArchiveDeck(dbArchive);

    } else if (dbArchive.itemType === 'packBundle') {
        // PackBundleの場合、ArchivePackを返す
        return dbArchiveToArchivePack(dbArchive);
    }

    throw new Error(`Unsupported archive itemType for ArchiveDisplayData: ${dbArchive.itemType}`);
};


/**
 * DBArchive (生のアーカイブレコード) を ArchiveItemData (個別表示/復元用の完全データ) に変換します。
 * ArchiveItemData = ArchiveDeck | ArchivePackBundle
 * @param dbArchive - データベースから取得したDBArchiveレコード
 * @returns ArchiveItemData - ArchiveDeck または ArchivePackBundle のユニオン型
 */
export const dbArchiveToArchiveItemData = (dbArchive: DBArchive): ArchiveItemData => {
    if (dbArchive.itemType === 'deck') {
        // Deckの場合、ArchiveDeckを返す
        return dbArchiveToArchiveDeck(dbArchive);

    } else if (dbArchive.itemType === 'packBundle') {
        // PackBundleの場合、ArchivePackBundleを返す
        return dbArchiveToArchivePackBundle(dbArchive);
    }

    throw new Error(`Unsupported archive itemType for ArchiveItemData: ${dbArchive.itemType}`);
};