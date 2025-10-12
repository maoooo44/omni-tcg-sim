/**
 * src/services/pack-logic/simulationUtils.ts
 *
 * パックの開封シミュレーションロジックを提供する。
 * パックの設定とDB連携（packDataService）に基づき、
 * レアリティ確率抽選とカードプールからのカード選択を非同期で行う。
 */

import type { Pack} from '../../models/pack';
import type { Card } from '../../models/card'; 
import { selectWeightedItem, type WeightedItem } from '../../utils/randomUtils';
// 💡 修正: cardDataServiceのインポートを削除
import { getCardsByPackAndRarity } from './packDataService'; // 💡 修正: packDataService から必要な関数をインポート

// 補助関数: DBからカードデータを取得し、IDの配列を返す (非同期)
const getCardIdsByPackAndRarity = async (packId: string, rarity: string): Promise<string[]> => {
    // 💡 修正: getCardsByPackAndRarity の呼び出し元を修正
    const availableCards: Card[] = await getCardsByPackAndRarity(packId, rarity);

    return availableCards.map(card => card.cardId);
};


/**
 * [非同期再修正] 1パックを開封し、封入設定に基づいてカードのリストを生成する。
 */
export const simulatePackOpening = async (pack: Pack): Promise<{ 
    results: { cardId: string, count: number }[], 
    simulationWarning: string | null 
}> => { 
    const drawnCardsMap = new Map<string, number>();
    const packId = pack.packId;
    const cardsPerPack = pack.cardsPerPack;

    const weightedRarities: WeightedItem[] = pack.rarityConfig.map(config => ({
        key: config.rarityName,
        probability: config.probability,
    }));

    let failedDrawCount = 0;
    let failedRarities: { rarityName: string; count: number }[] = []; 
    
    // ------------------------------------
    // 🎯 デバッグ強化: 抽選前のパック情報ロギング (非同期化)
    // ------------------------------------
    console.log('--------------------------------------------------');
    console.log(`[OmniTCGSim DEBUG] Pack Opening Simulation Start`);
    console.log(`- Pack Name: ${pack.name} (ID: ${packId})`);
    console.log(`- Cards Per Pack: ${cardsPerPack}枚`);
    
    // 非同期処理で登録枚数を取得して表示 (await 必須)
    const debugRarityInfo: string[] = [];
    for (const config of pack.rarityConfig) {
        const availableCount = (await getCardIdsByPackAndRarity(packId, config.rarityName)).length;
        debugRarityInfo.push(
            `  > ${config.rarityName} (確率: ${config.probability * 100}%) - 登録枚数: ${availableCount}枚`
        );
    }

    console.log('--- Rarity Configuration & Card Count ---');
    console.log(debugRarityInfo.join('\n'));
    console.log('--------------------------------------------------');
    // ------------------------------------

    // 1パックの総枚数分、抽選を繰り返す
    for (let i = 0; i < cardsPerPack; i++) {
        const drawnRarity = selectWeightedItem(weightedRarities);
        
        // 修正: await を追加し、DBからのデータ取得完了を待つ
        const availableCardIds = await getCardIdsByPackAndRarity(packId, drawnRarity); 

        let cardId = ''; 

        if (availableCardIds.length > 0) { 
            const randomIndex = Math.floor(Math.random() * availableCardIds.length); 
            cardId = availableCardIds[randomIndex]; 
        } else {
            console.warn(`[WARNING] Draw #${i + 1}: No cards found for Rarity: ${drawnRarity}. Skipping.`);
            failedDrawCount++; 
            const existingRarity = failedRarities.find(r => r.rarityName === drawnRarity);
            if (existingRarity) {
                existingRarity.count++;
            } else {
                failedRarities.push({ rarityName: drawnRarity, count: 1 });
            }
            continue; 
        }

        const currentCount = drawnCardsMap.get(cardId) || 0; 
        drawnCardsMap.set(cardId, currentCount + 1); 
    }
    
    // ... (後略：結果の構築と警告メッセージ生成)

    const results = Array.from(drawnCardsMap.entries()).map(([cardId, count]) => ({
        cardId,
        count
    }));

    let simulationWarning = null;
    if (failedDrawCount > 0) {
        const failedDetails = failedRarities
            .map(r => `${r.rarityName} (${r.count}回)`)
            .join(', ');
            
        simulationWarning = 
            `⚠️ 警告: ${failedDrawCount}枚の抽選が失敗しました。` +
            `収録カードがないレアリティが抽選されました: **${failedDetails}**。` +
            `パックにカードが登録されているか、収録カードの [Pack ID / Rarity] の紐付けを確認してください。`;
    }

    return { results, simulationWarning };
};