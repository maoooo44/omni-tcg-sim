// src/services/data-import-export/packJsonIO.ts

import { packService } from '../pack-logic/packService';
import { getCardsByPackId } from '../pack-logic/packDataService';
import { cardDataService } from '../pack-logic/CardDataService';
import { generatePackId, createDefaultPack } from '../pack-logic/packUtils';
import { generateUUID } from '../../utils/uuidUtils';
import type { Pack } from '../../models/pack';
import type { Card } from '../../models/card';
// 💡 追加: 汎用JSON I/Oユーティリティをインポート
import { exportDataToJson, importDataFromJson } from './genericJsonIO'; 

// JSONファイルとしてエクスポートされるデータの構造
interface PackExportData {
    pack: Pack;
    cards: Card[];
}

/**
 * 単一パックとその収録カードをJSON形式でエクスポートする
 * @param packId - エクスポート対象のパックID
 * @returns JSON形式の文字列
 */
export const exportPackToJson = async (packId: string): Promise<string> => {
    const pack = await packService.getPackById(packId);
    if (!pack) {
        throw new Error('指定されたパックIDのデータが見つかりません。');
    }
    
    // 関連するカードデータをすべて取得
    const cards = await getCardsByPackId(packId);

    const exportData: PackExportData = {
        pack,
        cards
    };

    // 💡 修正: genericJsonIOの関数を使ってJSON文字列を返す
    // PackExportDataはMap構造を含まないため、serializerは不要
    return exportDataToJson(exportData); 
};

/**
 * JSON文字列からパックとその収録カードをインポートし、DBに新規登録する
 * 💡 インポートされたパックIDとカードIDは、DBの既存データとの衝突を避けるため全て再採番されます。
 * @param jsonText - インポートするJSON文字列
 * @returns 新規作成されたパックのIDとインポートされたカードの総数
 */
export const importPackFromJson = async (jsonText: string): Promise<{ newPackId: string, importedCardCount: number }> => {
    // 💡 修正: genericJsonIOの関数を使ってJSON文字列をパース
    const parsedData = importDataFromJson<PackExportData>(jsonText); 
    
    if (!parsedData.pack || !parsedData.cards) {
        // パース後のデータ形式検証 (ビジネスロジックとして維持)
        throw new Error('JSONの形式が正しくありません。packおよびcardsフィールドが必要です。');
    }

    // 1. 新しいPack IDを生成
    const newPackId = generatePackId();
    
    // 2. Packデータを準備 (IDと関連情報を更新)
    const newPack: Pack = {
        ...createDefaultPack(), // デフォルト値をベースに
        ...parsedData.pack,
        packId: newPackId, // 新しいIDを強制適用
        isOpened: false, // 外部からのインポートなので、強制的に未開封状態にする
        totalCards: parsedData.cards.length,
    };

    // 3. Cardデータを準備 (新しいPack IDとCard IDを再採番)
    const newCards: Card[] = parsedData.cards.map(card => ({
        ...card,
        cardId: generateUUID(), // Card IDを再採番
        packId: newPackId,      // 新しいPack IDを適用
    }));

    // 4. DBへの保存
    await packService.savePack(newPack);
    await cardDataService.bulkPutCards(newCards);

    return { 
        newPackId, 
        importedCardCount: newCards.length 
    };
};