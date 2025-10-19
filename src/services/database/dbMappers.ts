import type { DBArchive } from '../../models/db-types';
import type { 
    ArchiveDisplayData, 
    ArchiveItemData 
} from '../../models/archive'; // 💡 必要な型定義のインポート

// 既存のエンティティマッパーから必要な関数をインポート
// これらの関数は、export * from で既に公開されているファイルに定義されていると仮定
import { dbArchiveToArchiveDeck } from './mappers/dbDeckMappers';
import { dbArchiveToArchivePack } from './mappers/dbPackMappers';
import { dbArchiveToArchivePackBundle } from './mappers/dbPackMappers'; // PackBundleマッパーもPackMappers内にあると仮定


/**
 * src/services/database/dbMappers.ts
 *
 * アプリケーションモデル（Card, Pack, Deck, PackBundle）と IndexedDBのデータ構造型（DBCard, DBPack, DBDeck, DBPackBundle, DBArchive）
 * の間で相互にデータを変換するためのマッピングロジックを提供します。
 * このファイルは、各エンティティの永続化形式とアプリケーション内部のデータ形式との関心事の分離を担います。
 * 特に、PackやDeckのアーカイブ（DBArchive）への変換と復元ロジックを含みます。
 */

export * from './mappers/dbCardMappers';
export * from './mappers/dbPackMappers';
export * from './mappers/dbDeckMappers';

// T: モデルの型 (Card, Pack, Deckなど)
// K: DBモデルの型 (DBCard, DBPack, DBDeckなど)

/**
 * カスタムインデックス30枠のマッピングロジックを共通化します。
 * @param source - 変換元のモデル (Card/Pack/Deck)
 * @param target - 変換先のモデル (DBCard/DBPack/DBDeck)
 * @returns target - カスタムインデックスがマッピングされた変換先のモデル
 */
export const mapCustomIndexes = <T extends Record<string, any>, K extends Record<string, any>>(
    source: T,
    target: K
): K => {
    for (let i = 1; i <= 10; i++) {
        // Bool
        const boolKey = `custom_${i}_bool` as keyof T & keyof K;
        if (source[boolKey] !== undefined) {
            target[boolKey] = source[boolKey];
        }
        
        // Num
        const numKey = `custom_${i}_num` as keyof T & keyof K;
        if (source[numKey] !== undefined) {
            target[numKey] = source[numKey];
        }

        // Str
        const strKey = `custom_${i}_str` as keyof T & keyof K;
        if (source[strKey] !== undefined) {
            target[strKey] = source[strKey];
        }
    }
    return target;
};

// ----------------------------------------------------
// 💡 追加: Archive Display/Item Data へのユニオン型マッパー
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

    // 💡 エラーハンドリング: 未対応のタイプはランタイムエラーとする
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

    // 💡 エラーハンドリング: 未対応のタイプはランタイムエラーとする
    throw new Error(`Unsupported archive itemType for ArchiveItemData: ${dbArchive.itemType}`);
};