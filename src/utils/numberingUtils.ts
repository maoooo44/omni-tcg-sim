/**
 * src/utils/numberingUtils.ts
 * * アイテムの採番ロジックを管理するユーティリティ。
 */

/**
 * データベースから取得した既存の最大値に基づき、次に割り当てるべき number を計算します。
 * * @param maxNumber 既存のアイテムの number の最大値（データがない場合は null/undefined）。
 * @param defaultStartNumber データが全く存在しない場合に割り当てる最初の番号。
 * デフォルトは TCG の慣例に合わせて 1 とします。
 * @returns 割り当てるべき新しい number。
 */
export const getNextNumber = (
    maxNumber: number | null | undefined, 
    defaultStartNumber: number = 1
): number => {
    // 既存の最大値がない（データが空）場合は、デフォルトの開始番号を返す
    if (maxNumber === null || maxNumber === undefined) {
        return defaultStartNumber;
    }
    
    // データが存在する場合は、最大値に 1 を加えた値を返す
    return maxNumber + 1;
};