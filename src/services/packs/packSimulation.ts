/**
 * src/services/packs/packSimulation.ts
 *
 * TCGパックの開封シミュレーションロジックを提供するユーティリティ関数群。
 * パックの設定に基づき、レアリティの確率抽選と、
 * cardSearchServiceを介したカードプールからのカード選択を非同期で行う。
 */

import type { Pack, AdvancedRarityConfig, RarityConfig } from '../../models/pack'; 
import type { Card } from '../../models/card'; 
import { selectWeightedItem, type WeightedItem } from '../../utils/randomUtils';
import { cardSearchService } from './../cards/cardSearchService'; 
// ★ エラー原因となっていた、再定義された関数はここでインポート
import { hasProbabilityMismatch } from '../../utils/validationUtils'; 

// 補助関数: DBからカードデータを取得し、IDの配列を返す (非同期)
const getCardIdsByPackAndRarity = async (packId: string, rarity: string): Promise<string[]> => {
    const availableCards: Card[] = await cardSearchService.getCardsByPackAndRarity(packId, rarity);
    return availableCards.map(card => card.cardId);
};

// 抽選結果を格納する型 (drawnRaritiesはレアリティ名の配列)
interface SimulationResult {
    drawnRarities: string[];
    simulationWarning: string | null;
}

// -----------------------------------------------------
// 高度な抽選ロジック (fixedValue/specialProbability/probability) を実行する補助関数
// -----------------------------------------------------
const simulateAdvancedOpening = (pack: Pack): SimulationResult => {
    const cardsPerPack = pack.cardsPerPack;
    const specialProbabilitySlots = pack.specialProbabilitySlots ?? 0; // 特殊確率枠数
    const drawnRarities: string[] = [];
    let simulationWarning: string | null = null;
    
    // 高度な設定が存在しない場合は処理をスキップ
    if (!pack.advancedRarityConfig || pack.advancedRarityConfig.length === 0) {
        return { drawnRarities: [], simulationWarning: "高度な設定が有効ですが、設定が見つかりません。" };
    }

    // AdvancedRarityConfig は `specialProbability` を持たないので、一時的に型キャストして使用
    type FullAdvancedConfig = AdvancedRarityConfig & { specialProbability: number };
    const fullConfigs = pack.advancedRarityConfig as FullAdvancedConfig[];

    // パックの残りスロットを追跡
    let remainingSlots = cardsPerPack;
    
    // ------------------------------------
    // 🎯 ステップ 1: 確定枚数 (fixedValue) の処理
    // ------------------------------------
    
    // 確定枚数の合計を計算
    const totalFixedValue = fullConfigs.reduce((sum, c) => sum + Math.round(c.fixedValue), 0);
    
    // 確定枚数による抽選
    for (let config of fullConfigs) {
        const count = Math.round(config.fixedValue); // 確定枚数は整数として扱う
        for (let i = 0; i < count && remainingSlots > 0; i++) {
            drawnRarities.push(config.rarityName);
            remainingSlots -= 1;
        }
    }
    
    if (totalFixedValue > cardsPerPack) {
        simulationWarning = `警告: 設定された確定枚数の合計 (${totalFixedValue}枚) がパック総枚数 (${cardsPerPack}枚) を超えています。超過分は無視されました。`;
    }
    
    // すでにパックが満たされている場合は、ここで終了
    if (remainingSlots === 0) {
        return { drawnRarities, simulationWarning };
    }


    // ------------------------------------
    // 🎯 ステップ 2: 特殊確率枠 (specialProbability) の抽選
    // ------------------------------------

    let specialDrawCount = Math.min(specialProbabilitySlots, remainingSlots);
    
    if (specialDrawCount > 0) {
        const specialWeightedRarities: WeightedItem[] = fullConfigs.map(config => ({
            key: config.rarityName,
            probability: config.specialProbability || 0 // specialProbabilityが未定義の場合は0
        }));

        // 確率チェック: 特殊確率の合計が 1.0 か確認
        if (hasProbabilityMismatch(fullConfigs as any, 'specialProbability', 1.0)) {
            const sum = fullConfigs.reduce((acc, c) => acc + (c.specialProbability || 0), 0);
            const warning = 
                `⚠️ 設定警告: 特殊確率 (specialProbability) の合計が100%になりません (合計: ${(sum * 100).toFixed(2)}%)。` +
                `抽選結果が歪む可能性があります。`;
            simulationWarning = (simulationWarning ? `${simulationWarning}\n` : '') + warning;
        }

        for (let i = 0; i < specialDrawCount; i++) {
            const drawnRarity = selectWeightedItem(specialWeightedRarities);
            drawnRarities.push(drawnRarity);
            remainingSlots -= 1;
        }
    }


    // ------------------------------------
    // 🎯 ステップ 3: 基本確率枠 (probability) の抽選
    // ------------------------------------

    if (remainingSlots > 0) {
        const residualWeightedRarities: WeightedItem[] = fullConfigs.map(config => ({
            key: config.rarityName,
            probability: config.probability
        }));

        // 確率チェック: 基本確率の合計が 1.0 か確認
        if (hasProbabilityMismatch(fullConfigs as any, 'probability', 1.0)) {
             const sum = fullConfigs.reduce((acc, c) => acc + c.probability, 0);
            const warning = 
                `⚠️ 設定警告: 基本確率 (probability) の合計が100%になりません (合計: ${(sum * 100).toFixed(2)}%)。` +
                `抽選結果が歪む可能性があります。`;
            simulationWarning = (simulationWarning ? `${simulationWarning}\n` : '') + warning;
        }

        for (let i = 0; i < remainingSlots; i++) {
            const drawnRarity = selectWeightedItem(residualWeightedRarities);
            drawnRarities.push(drawnRarity);
        }
    }

    return { drawnRarities, simulationWarning };
};

// -----------------------------------------------------
// 従来の抽選ロジック 
// -----------------------------------------------------
const simulateClassicOpening = (pack: Pack): SimulationResult => {
    const cardsPerPack = pack.cardsPerPack;
    const drawnRarities: string[] = [];
    let simulationWarning: string | null = null;

    const rarityConfigs: RarityConfig[] = pack.rarityConfig; 
    
    if (hasProbabilityMismatch(rarityConfigs as any, 'probability', 1.0)) {
         const sum = rarityConfigs.reduce((acc, c) => acc + c.probability, 0);
        const warning = 
            `⚠️ 設定警告: 従来の確率 (rarityConfig) の合計が100%になりません (合計: ${(sum * 100).toFixed(2)}%)。` +
            `抽選結果が歪む可能性があります。`;
        simulationWarning = warning;
    }
    
    const weightedRarities: WeightedItem[] = rarityConfigs.map(config => ({
        key: config.rarityName,
        probability: config.probability,
    }));
    
    for (let i = 0; i < cardsPerPack; i++) {
        const drawnRarity = selectWeightedItem(weightedRarities);
        drawnRarities.push(drawnRarity);
    }
    
    return { drawnRarities, simulationWarning };
}


/**
 * 1パックを開封し、封入設定に基づいてカードのリストを生成する。
 */
export const simulatePackOpening = async (pack: Pack): Promise<{ 
    results: { cardId: string, count: number }[], 
    simulationWarning: string | null 
}> => { 
    const packId = pack.packId;
    const cardsPerPack = pack.cardsPerPack;
    let drawnRarities: string[] = [];
    let simulationWarning: string | null = null; 

    
    // ------------------------------------
    // 🎯 抽選ロジックの分岐 
    // ------------------------------------
    if (pack.isAdvancedRulesEnabled && pack.advancedRarityConfig && pack.advancedRarityConfig.length > 0) {
        // 高度なルールが有効な場合
        const advancedResult = simulateAdvancedOpening(pack);
        drawnRarities = advancedResult.drawnRarities;
        simulationWarning = advancedResult.simulationWarning;
    } else {
        // 従来の確率ルール、または高度な設定が無効/未設定の場合
        const classicResult = simulateClassicOpening(pack);
        drawnRarities = classicResult.drawnRarities;
        simulationWarning = classicResult.simulationWarning; 
    }

    
    // ------------------------------------
    // 🎯 カードIDの取得と結果の集計 (共通ロジック)
    // ------------------------------------
    const drawnCardsMap = new Map<string, number>();
    let failedDrawCount = 0;
    let failedRarities: { rarityName: string; count: number }[] = []; 

    for (let i = 0; i < drawnRarities.length; i++) {
        const drawnRarity = drawnRarities[i];
        
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
    
    const results = Array.from(drawnCardsMap.entries()).map(([cardId, count]) => ({
        cardId,
        count
    }));

    if (failedDrawCount > 0) {
        const failedDetails = failedRarities
            .map(r => `${r.rarityName} (${r.count}回)`)
            .join(', ');
            
        const cardWarning = 
            `⚠️ 警告: ${failedDrawCount}枚の抽選が失敗しました。` +
            `収録カードがないレアリティが抽選されました: **${failedDetails}**。` +
            `パックにカードが登録されているか、収録カードの [Pack ID / Rarity] の紐付けを確認してください。`;
            
        simulationWarning = simulationWarning ? `${simulationWarning}\n${cardWarning}` : cardWarning;
    }

    if (drawnRarities.length !== cardsPerPack) {
        const countWarning = `🛑 重大警告: パックの総枚数 (${cardsPerPack}枚) と抽選された枚数 (${drawnRarities.length}枚) が一致しません。ロジックを確認してください。`;
        simulationWarning = simulationWarning ? `${simulationWarning}\n${countWarning}` : countWarning;
    }

    return { results, simulationWarning };
};
// ★ ここより下の不要なコードブロックを削除しました。