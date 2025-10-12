/**
* src/utils/validationUtils.ts
* 
* データ検証に関する汎用ユーティリティ関数群。
*/

// 浮動小数点数計算の許容誤差
const EPSILON = 0.0001;

/**
* 確率設定の合計値が期待値と一致しない場合に true を返す汎用関数。
* @param config - 各要素に probability: number を持つオブジェクトの配列
* @param expectedTotal - 期待される合計値 (例: 1.0, Pack.cardsPerPackなど)
* @returns 合計が期待値と一致しない場合に true
*/
export const hasProbabilityMismatch = (
    config: Array<{ probability: number }>,
    expectedTotal: number
): boolean => {
    // 確率を合計し、小数点以下の精度を考慮してチェック
    const totalProbability = config.reduce((sum, item) => sum + item.probability, 0);
    
    // 許容誤差範囲内で比較
    return Math.abs(totalProbability - expectedTotal) > EPSILON;
};

// ----------------------------------------------------
// デッキ枚数チェック用のヘルパー関数 (デッキ枚数チェックに流用可能)
// ----------------------------------------------------

/**
* Mapで管理されているカードの総枚数を計算する。
* @param deckMap - Map<string, number> (cardId: count)
* @returns 総枚数
*/
export const calculateMapTotalCount = (deckMap: Map<string, number>): number => {
    // Mapのvaluesを合計
    return Array.from(deckMap.values()).reduce((sum, count) => sum + count, 0);
};

/**
* デッキの枚数が指定された範囲内にあるかをチェックする汎用関数。
* @param deckMap - メインデッキやサイドデッキの Map<cardId, count>
* @param min - 最小枚数
* @param max - 最大枚数
* @returns バリデーションエラーメッセージ | null
*/
export const validateDeckCount = (
    deckMap: Map<string, number>,
    min: number,
    max: number
): string | null => {
    const totalCards = calculateMapTotalCount(deckMap);
    
    if (totalCards < min) {
        return `枚数が不足しています (${totalCards} / 最小 ${min} 枚)。`;
    }
    
    if (totalCards > max) {
        return `枚数が超過しています (${totalCards} / 最大 ${max} 枚)。`;
    }
    
    return null;
};