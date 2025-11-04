import type { Pack, RarityConfig, AdvancedRarityConfig } from '../models/pack';

/**
 * Pricing utilities for packs/cards.
 *
 * Main exported function:
 * - calculateCardPrice(pack, rarityName): returns the price per card for the specified rarity
 *
 * Pricing model for boosters:
 * - Let X = pack.price, Y = cardsPerPack, n = number of rarity buckets
 * - E_i = expected number of cards of rarity i per pack
 * - We adopt the constraint V_i * P_i = K (value inversely proportional to probability)
 * - This implies E_i * V_i = X / n (each rarity contributes equally to pack price on expectation)
 *
 * For constructed decks:
 * - Simple division: price / totalCards
 */

/** Internal: Rarity value calculation result */
interface RarityValue {
    rarityName: string;
    probability: number;
    expectedCount: number;
    valuePerCard: number;
}

/** Internal: Slot breakdown for advanced rarity calculation */
interface SlotBreakdown {
    fixedSlots: number;
    specialSlots: number;
    basicSlots: number;
}

// ============================================================================
// Internal Helper Functions
// ============================================================================

/**
 * Calculate slot breakdown for advanced rarity configuration.
 * - fixedSlots: sum of all fixedValue (確定枚数の合計)
 * - specialSlots: specialProbabilitySlots (特殊確率スロット)
 * - basicSlots: remaining slots (基本確率スロット)
 */
const calculateSlotBreakdown = (pack: Pack): SlotBreakdown => {
    const cardsPerPack = pack.cardsPerPack ?? 0;
    
    if (!pack.isAdvancedRulesEnabled || !pack.advancedRarityConfig) {
        return {
            fixedSlots: 0,
            specialSlots: 0,
            basicSlots: cardsPerPack,
        };
    }

    const fixedSlots = pack.advancedRarityConfig.reduce((sum, cfg) => sum + (cfg.fixedValue || 0), 0);
    const specialSlots = pack.specialProbabilitySlots || 0;
    const basicSlots = Math.max(0, cardsPerPack - fixedSlots - specialSlots);

    return { fixedSlots, specialSlots, basicSlots };
};

/**
 * Convert fixedValue configuration to special probability slot format.
 * Example: [Common: fixedValue=4, Rare: fixedValue=1]
 *   → [Common: 0.8, Rare: 0.2] (as a special slot group)
 */
const convertFixedValueToSpecialSlot = (advancedConfig: AdvancedRarityConfig[]): Map<string, number> => {
    const fixedTotal = advancedConfig.reduce((sum, cfg) => sum + (cfg.fixedValue || 0), 0);
    const result = new Map<string, number>();

    if (fixedTotal === 0) return result;

    advancedConfig.forEach(cfg => {
        if (cfg.fixedValue > 0) {
            result.set(cfg.rarityName, cfg.fixedValue / fixedTotal);
        }
    });

    return result;
};

/**
 * Calculate expected counts for simple rarity configuration.
 * All slots use the same probability distribution.
 */
const calculateExpectedCountsSimple = (rarityConfig: RarityConfig[], cardsPerPack: number): RarityValue[] => {
    return rarityConfig.map(cfg => ({
        rarityName: cfg.rarityName,
        probability: cfg.probability,
        expectedCount: cardsPerPack * cfg.probability,
        valuePerCard: 0, // to be calculated later
    }));
};

/**
 * Calculate expected counts for advanced rarity configuration.
 * Considers three types of slots:
 * 1. Fixed slots (確定スロット) - converted to special slot format
 * 2. Special probability slots (特殊確率スロット)
 * 3. Basic probability slots (基本確率スロット)
 */
const calculateExpectedCountsAdvanced = (pack: Pack): RarityValue[] => {
    const advancedConfig = pack.advancedRarityConfig!;
    const slots = calculateSlotBreakdown(pack);
    
    // Initialize expected counts
    const expectedCounts = new Map<string, number>();
    advancedConfig.forEach(cfg => {
        expectedCounts.set(cfg.rarityName, 0);
    });

    // 1. Add fixed slots (as special slot type)
    const fixedSlotProbs = convertFixedValueToSpecialSlot(advancedConfig);
    fixedSlotProbs.forEach((prob, rarityName) => {
        const current = expectedCounts.get(rarityName) || 0;
        expectedCounts.set(rarityName, current + slots.fixedSlots * prob);
    });

    // 2. Add special probability slots
    if (slots.specialSlots > 0) {
        advancedConfig.forEach(cfg => {
            const prob = cfg.specialProbability || 0;
            const current = expectedCounts.get(cfg.rarityName) || 0;
            expectedCounts.set(cfg.rarityName, current + slots.specialSlots * prob);
        });
    }

    // 3. Add basic probability slots
    if (slots.basicSlots > 0) {
        advancedConfig.forEach(cfg => {
            const prob = cfg.probability || 0;
            const current = expectedCounts.get(cfg.rarityName) || 0;
            expectedCounts.set(cfg.rarityName, current + slots.basicSlots * prob);
        });
    }

    const cardsPerPack = pack.cardsPerPack ?? 0;
    return advancedConfig.map(cfg => ({
        rarityName: cfg.rarityName,
        probability: cardsPerPack > 0 ? (expectedCounts.get(cfg.rarityName) || 0) / cardsPerPack : 0,
        expectedCount: expectedCounts.get(cfg.rarityName) || 0,
        valuePerCard: 0, // to be calculated later
    }));
};

/**
 * Calculate per-rarity card values for a booster pack.
 * Uses the constraint: V_i * P_i = K and Σ(E_i * V_i) = price
 */
const calculateBoosterRarityValues = (pack: Pack): RarityValue[] => {
    const cardsPerPack = pack.cardsPerPack ?? 0;
    if (cardsPerPack <= 0) return [];

    // Calculate expected counts based on configuration type
    let rarityValues: RarityValue[];
    if (pack.isAdvancedRulesEnabled && pack.advancedRarityConfig && pack.advancedRarityConfig.length > 0) {
        rarityValues = calculateExpectedCountsAdvanced(pack);
    } else {
        rarityValues = calculateExpectedCountsSimple(pack.rarityConfig, cardsPerPack);
    }

    if (rarityValues.length === 0) return [];

    // Calculate K and values: V_i * P_i = K, Σ(E_i * V_i) = price
    // => K = price / (n * cardsPerPack)
    const n = rarityValues.length;
    const K = pack.price / (n * cardsPerPack);

    // Calculate V_i for each rarity
    rarityValues.forEach(rv => {
        rv.valuePerCard = rv.probability > 0 ? K / rv.probability : 0;
    });

    return rarityValues;
};

/**
 * Calculate price per card for a constructed deck.
 * Simple division: price / totalCards
 */
const calculateConstructedDeckPrice = (pack: Pack): number => {
    const totalCards = pack.totalCards ?? 0;
    if (totalCards <= 0) return 0;
    return pack.price / totalCards;
};

// ============================================================================
// Public API
// ============================================================================

/**
 * Calculate the price per card for a specific rarity in the given pack.
 * Automatically detects pack type and applies the appropriate pricing logic.
 *
 * @param pack - The pack to calculate pricing for
 * @param rarityName - The name of the rarity to get the price for
 * @returns The price per card for the specified rarity, or 0 if not found/invalid
 */
export const calculateCardPrice = (pack: Pack, rarityName: string): number => {
    // For constructed decks, all cards have the same price
    if (pack.packType === 'ConstructedDeck') {
        return calculateConstructedDeckPrice(pack);
    }

    // For boosters, calculate per-rarity values
    const rarityValues = calculateBoosterRarityValues(pack);
    const rarity = rarityValues.find(rv => rv.rarityName === rarityName);
    
    return rarity?.valuePerCard ?? 0;
};
