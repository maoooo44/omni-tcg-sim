import type { Card } from '../../../models/card';
import type { DBCard, DBPackBundle, DBArchive } from '../../../models/db-types'; 
import { mapCustomIndexes } from '../dbMappers';

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
        isFavorite: card.isFavorite,
        createdAt: card.createdAt,
        updatedAt: card.updatedAt,
        
        // カスタムインデックスの初期値はここでは省略。以下のヘルパー関数でマッピングを完了させます。
    } as DBCard; // 一時的な型アサーション。最終的に mapCustomIndexes で全フィールドが満たされることを前提とします。

    // 💡 修正: カスタムインデックスの30行をヘルパー関数に置き換え
    return mapCustomIndexes<Card, DBCard>(card, dbCard);
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
        
        // カスタムインデックスの初期値
    } as Card; // 一時的な型アサーション

    // 💡 修正: カスタムインデックスの30行をヘルパー関数に置き換え
    return mapCustomIndexes<DBCard, Card>(dbCard, card);
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



