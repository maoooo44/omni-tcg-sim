// src/services/database/dbUtils.ts

// ★ 修正: db.ts から db インスタンスをインポートする
import { db } from './db'; 

// db.tsからDexieインスタンスとコレクションの型をインポートすると仮定
// import { db, CollectionName } from './db'; // 元々あった行。これを実際にインポートするように変更

// 🚨 注意: このコードは、dbインスタンスと CollectionName の型が
// アプリケーション内で定義され、インポート可能であることを前提としています。

/**
 * データベースの指定されたコレクションから、numberフィールドの最大値を取得します。
 * * @param collectionName 調査対象のコレクション（テーブル）名。
 * @param numberFieldName 最大値を調べるフィールド名（デフォルトは 'number'）。
 * @returns 既存の最大の number。データが存在しない場合は null を返します。
 */
export const getMaxNumberByCollection = async (
    collectionName: string, // CollectionName のような型が良い
    numberFieldName: string = 'number'
): Promise<number | null> => {

    // 💡 以下の擬似コードは、dbがDexieインスタンスであることを前提としています。
    
    // 指定されたコレクションを取得
    const collection = (db as any)[collectionName]; // ★ db がインポートされたことでエラー解消
    if (!collection) {
        console.error(`Collection not found: ${collectionName}`);
        return null; 
    }

    try {
        // numberフィールドを降順でソートし、最初の要素を取得
        // numberが設定されていないレコードやnullのレコードを除外するロジックが必要です
        const item = await collection
            .orderBy(numberFieldName)
            .reverse() // 降順
            .limit(1)
            .first();

        // アイテムが存在し、numberフィールドが有効な数値であればそれを返す
        if (item && item[numberFieldName] !== undefined && item[numberFieldName] !== null) {
            return item[numberFieldName];
        }
        
        return null;
        
    } catch (error) {
        console.error(`Error fetching max number from ${collectionName}:`, error);
        return null;
    }
};