import type { Card } from '../../../models/card';
import type { DBCard, DBPackBundle, DBArchive } from '../../../models/db-types'; 
//import { mapCustomIndexes } from '../dbMappers';

// =========================================================================
// 1. Card <-> DBCard マッピング (カスタムインデックス30枠をヘルパー関数に置き換え)
// =========================================================================

/**
 * アプリケーションの Card モデルを、データベースに保存する DBCard 形式に変換します。
 * @param card - 変換対象の Card モデル
 * @returns DBCard - DB保存形式のカードレコード
 */
export const cardToDBCard = (card: Card): DBCard => {
    const dbCard: DBCard = {
        // 基本フィールド
        cardId: card.cardId,
        packId: card.packId,
        name: card.name,
        // Cardの undefined を DBCardの null に変換
        number: card.number !== undefined ? card.number : null,
        imageUrl: card.imageUrl,
        imageColor: card.imageColor, 
        rarity: card.rarity,
        text: card.text,
        subtext: card.subtext,
        isFavorite: card.isFavorite,
        createdAt: card.createdAt,
        updatedAt: card.updatedAt,
        num_1: card.num_1, num_2: card.num_2, num_3: card.num_3,
        num_4: card.num_4, num_5: card.num_5, num_6: card.num_6, 
        str_1: card.str_1, str_2: card.str_2, str_3: card.str_3,
        str_4: card.str_4, str_5: card.str_5, str_6: card.str_6, 
        tag:card.tag,
        searchText:card.searchText,
    }
    return dbCard;
    // 💡 修正: カスタムインデックスの30行をヘルパー関数に置き換え
    // mapCustomIndexes<Card, DBCard>(card, dbCard);
};

/**
 * データベースの DBCard レコードを、アプリケーションで利用する Card モデルに変換します。
 * @param dbCard - 変換対象の DBCard レコード
 * @returns Card - アプリケーションで使用するカードモデル
 */
export const dbCardToCard = (dbCard: DBCard): Card => {
    const card: Card = {
        // 基本フィールド
        cardId: dbCard.cardId,
        packId: dbCard.packId,
        name: dbCard.name,
        // DBCardの null を Cardの undefined に変換
        number: dbCard.number !== null ? dbCard.number : undefined,
        imageUrl: dbCard.imageUrl,
        imageColor: dbCard.imageColor, 
        rarity: dbCard.rarity,
        isFavorite: dbCard.isFavorite,
        createdAt: dbCard.createdAt,
        updatedAt: dbCard.updatedAt,

        num_1: dbCard.num_1, num_2: dbCard.num_2, num_3: dbCard.num_3, num_4: dbCard.num_4, num_5: dbCard.num_5, num_6: dbCard.num_6, 
        str_1: dbCard.str_1, str_2: dbCard.str_2, str_3: dbCard.str_3, 
        str_4: dbCard.str_4, str_5: dbCard.str_5, str_6: dbCard.str_6, 
        tag:dbCard.tag,
        searchText:dbCard.searchText,
        
        // カスタムインデックスの初期値
    } as Card; // 一時的な型アサーション
    return card;
    // 💡 修正: カスタムインデックスの30行をヘルパー関数に置き換え
    //return mapCustomIndexes<DBCard, Card>(dbCard, card);
};

/**
 * DBArchive (PackBundle) レコードから Card モデル群を抽出・変換します。
 * @param dbArchive DBArchive レコード
 * @returns Card モデルの配列
 */
export const dbArchiveToCards = (dbArchive: DBArchive): Card[] => {
    const dbPackBundle = dbArchive.itemData as DBPackBundle;
    return dbPackBundle.cardsData.map(dbCardToCard);
};



