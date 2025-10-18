/**
 * src/utils/validationUtils.ts
 * * データ検証に関する汎用ユーティリティ関数群。
 * 浮動小数点誤差を考慮した確率の検証や、Map形式データの枚数チェックなど、ドメインを問わない検証ロジックを担う。
 */

// 浮動小数点数計算の許容誤差
const EPSILON = 0.0001;

/**
 * 確率設定の合計値が期待値と一致しない場合に true を返す汎用関数。
 * 任意の数値プロパティの合計をチェックできるように汎用化。
 * 浮動小数点誤差を許容範囲内で処理する。
 * * @param config - チェック対象のオブジェクトの配列
 * @param propertyName - チェック対象の数値プロパティ名 (例: 'probability', 'fixedValue')
 * @param expectedTotal - 期待される合計値 (例: 1.0, 5.0など)
 * @returns 合計が期待値と一致しない場合に true
 */
export const hasProbabilityMismatch = (
    // オブジェクトのキーをTKeyに限定し、値がnumberであることを保証
    config: Array<Record<string, number>>, 
    propertyName: string, // ★ チェック対象のプロパティ名を指定
    expectedTotal: number
): boolean => {
    // 確率を合計し、小数点以下の精度を考慮してチェック
    // propertyNameに基づき合計を計算
    const totalValue = config.reduce((sum, item) => {
        const value = item[propertyName];
        // プロパティが存在しない、または数値でない場合は 0 として扱う（エラー回避）
        return sum + (typeof value === 'number' ? value : 0);
    }, 0);
    
    // 許容誤差範囲内で比較
    return Math.abs(totalValue - expectedTotal) > EPSILON;
};

// ----------------------------------------------------
// デッキ枚数チェック用のヘルパー関数 (変更なし)
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