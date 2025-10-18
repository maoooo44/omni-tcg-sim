/**
 * src/services/data-io/packJsonIO.ts
 *
 * 単一/複数のPackとその収録カード（関連データ）をまとめてJSON形式でシリアライズ/デシリアライズするドメインI/Oサービス。
 * JSONI/Oだけでなく、インポート時のID再採番とデータ初期化ロジックも担う。
 */

import { packService } from '../packs/packService';
import { cardSearchService } from '../cards/cardSearchService';
import { cardDataService } from '../cards/cardDataService';
import { generateId, createDefaultPackData } from '../../utils/dataUtils';
import type { Pack } from '../../models/pack';
import type { Card } from '../../models/card';
import { exportDataToJson, importDataFromJson } from '../../utils/genericJsonIO'; 

// 💡 修正: JSONファイルとしてエクスポートされる、単一Pack+Cardsのデータ構造
interface PackData {
    pack: Pack;
    cards: Card[];
}

// 💡 追加: 複数のPackとそのCardsを扱うためのトップレベル構造
interface PacksExportData {
    exports: PackData[];
}

// ----------------------------------------------------
// [1] Export (エクスポート)
// ----------------------------------------------------

/**
 * 💡 [個別エクスポート] 単一パックとその収録カードをJSON形式でエクスポートする
 * 複数エクスポート関数を呼び出すラッパー。
 * @param packId - エクスポート対象のパックID
 * @returns JSON形式の文字列
 */
export const exportPackToJson = async (packId: string): Promise<string> => {
    // 💡 複数エクスポート関数に委譲
    return exportPacksToJson([packId]);
};


/**
 * 💡 [一括エクスポート] 複数パックとその収録カードを一括でJSON形式でエクスポートする
 * @param packIds - エクスポート対象のパックIDの配列
 * @returns JSON形式の文字列
 */
export const exportPacksToJson = async (packIds: string[]): Promise<string> => {
    const exportItems: PackData[] = [];
    
    for (const packId of packIds) {
        const pack = await packService.getPackById(packId);
        
        if (!pack) {
            console.warn(`[packJsonIO] Pack ID ${packId} not found. Skipping export.`);
            continue;
        }
        
        // 関連するカードデータをすべて取得
        const cards = await cardSearchService.getCardsByPackId(packId);

        exportItems.push({
            pack,
            cards
        });
    }

    if (exportItems.length === 0) {
        throw new Error('エクスポート対象のパックデータが見つかりませんでした。');
    }
    
    const exportData: PacksExportData = { exports: exportItems };
    
    // genericJsonIOの関数を使ってJSON文字列を返す
    return exportDataToJson(exportData); 
};

// ----------------------------------------------------
// [2] Import (インポート)
// ----------------------------------------------------

/**
 * 💡 [個別インポート] JSON文字列から単一パックとその収録カードをインポートし、DBに新規登録する
 * 複数インポート関数を呼び出すラッパー。
 * @param jsonText - インポートするJSON文字列
 * @returns 新規作成されたパックのIDとインポートされたカードの総数
 */
export const importPackFromJson = async (jsonText: string): Promise<{ newPackId: string, importedCardCount: number }> => {
    // 💡 複数インポート関数に委譲
    const result = await importPacksFromJson(jsonText);

    // 単数インポートでは、結果は必ず1つのはず
    if (result.importedCount !== 1 || result.newPackIds.length !== 1) {
        throw new Error("単一パックのインポートに失敗しました。JSONファイルに複数のパックが含まれている可能性があります。");
    }
    
    return {
        newPackId: result.newPackIds[0],
        importedCardCount: result.importedCardCounts[0]
    };
};


/**
 * 💡 [一括インポート] JSON文字列から複数パックとその収録カードを一括でインポートし、DBに新規登録する
 * インポートされたパックIDとカードIDは、DBの既存データとの衝突を避けるため全て再採番されます。
 * @param jsonText - インポートするJSON文字列
 * @returns 新規作成されたパックのIDの配列と、それぞれのインポートされたカードの総数の配列
 */
export const importPacksFromJson = async (jsonText: string): Promise<{ importedCount: number, newPackIds: string[], importedCardCounts: number[] }> => {
    console.log("[packJsonIO] START bulk import.");
    
    // genericJsonIOの関数を使ってJSON文字列をパース
    const parsedData = importDataFromJson<PacksExportData>(jsonText); 
    
    if (!parsedData.exports || !Array.isArray(parsedData.exports)) {
        throw new Error('JSONの形式が正しくありません。exportsフィールド（配列）が必要です。');
    }
    
    const packsToSave: Pack[] = [];
    const cardsToSave: Card[] = [];
    const newPackIds: string[] = [];
    const importedCardCounts: number[] = [];

    for (const exportedItem of parsedData.exports) {
        if (!exportedItem.pack || !exportedItem.cards) {
            console.warn('[packJsonIO] Skipping malformed item in exports array.');
            continue;
        }

        // 1. 新しいPack IDを生成
        const newPackId = generateId();
        
        // 2. Packデータを準備 (IDと関連情報を更新)
        const newPack: Pack = {
            ...exportedItem.pack,
            packId: newPackId,        // 新しいIDを強制適用
            isOpened: false,          // 外部からのインポートなので、強制的に未開封状態にする
            totalCards: exportedItem.cards.length,
            // updatedAt/createdAt はインポート時の値を使用し、savePackでupdatedAtを上書きする
        };
        // 💡 修正: createDefaultPackData() が抜けていたため追加（既存のコードに合わせて修正）
        const newPackWithDefaults: Pack = { 
            ...createDefaultPackData(), 
            ...newPack 
        };
        
        packsToSave.push(newPackWithDefaults);
        newPackIds.push(newPackId);
        
        // 3. Cardデータを準備 (新しいPack IDとCard IDを再採番)
        const newCards: Card[] = exportedItem.cards.map(card => ({
            ...card,
            cardId: generateId(), // Card IDを再採番
            packId: newPackId,    // 新しいPack IDを適用
        }));
        cardsToSave.push(...newCards);
        importedCardCounts.push(newCards.length);
    }
    
    const importedCount = packsToSave.length;
    
    if (importedCount === 0) {
        return { importedCount: 0, newPackIds: [], importedCardCounts: [] };
    }

    // 4. DBへの保存（PackServiceのbulkPutPacksを利用して一括保存に修正）
    // 💡 修正: packService.bulkPutPacks が利用可能になったため、単数saveのループを削除し、一括保存に置き換える。
    await packService.bulkPutPacks(packsToSave);
    
    // 5. Cardの一括保存
    await cardDataService.bulkSaveCards(cardsToSave);

    console.log(`[packJsonIO] ✅ Bulk import complete. Imported ${importedCount} packs and ${cardsToSave.length} cards.`);

    return { 
        importedCount,
        newPackIds, 
        importedCardCounts
    };
};