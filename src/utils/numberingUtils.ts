/**
 * src/utils/numberingUtils.ts
 *
 * * アイテムの採番（連番）ロジック、汎用的な数値検証・制限（クランプ）処理、および配列内の最大値検索を提供するユーティリティモジュール。
 * このモジュールは、主に新規アイテム作成時の次の連番の計算や、ユーザー入力設定値の安全な検証・補正を担います。
 *
 * * 責務:
 * 1. 既存の最大値に基づき、次に割り当てるべき採番（number）を計算する（getNextNumber）。
 * 2. 数値を許容範囲内に制限（クランプ）し、不正な値の場合はデフォルト値を適用する（clampAndValidateNumber）。
 * 3. メモリ内のデータ配列から特定の数値フィールドの最大値を効率的に検索する（getMaxNumberFromCache）。
 */

/**
 * データベースから取得した既存の最大値に基づき、次に割り当てるべき number を計算します。
 * @param maxNumber 既存のアイテムの number の最大値（データがない場合は null/undefined）。
 * @param defaultStartNumber データが全く存在しない場合に割り当てる最初の番号。
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

// =========================================================================
// 数値検証・クランプユーティリティ
// =========================================================================

/**
 * 数値を許容範囲内にクランプ（制限）し、無効な値の場合はデフォルト値を返します。
 * @param value 入力値
 * @param min 最小値
 * @param max 最大値
 * @param defaultValue 安全なデフォルト値（valueが不正な場合に使用）
 * @param paramName ログ出力用のパラメータ名
 * @returns クランプされた安全な数値
 */
export const clampAndValidateNumber = (
    value: number | null | undefined, // null/undefinedも許容するように型を変更
    min: number,
    max: number,
    defaultValue: number,
    paramName: string
): number => {
    // NaN, null, undefined, 非数値、または 0 以下の場合はデフォルト値を返す (フォールバック)
    if (typeof value !== 'number' || isNaN(value) || value <= 0) {
        console.warn(`[NumberUtils:Clamp] Invalid value for ${paramName} (${value}). Falling back to default: ${defaultValue}.`);
        return defaultValue;
    }

    // 最小値チェック
    if (value < min) {
        console.warn(`[NumberUtils:Clamp] Value for ${paramName} (${value}) is below minimum (${min}). Clamping to min.`);
        return min;
    }

    // 最大値チェック
    if (value > max) {
        console.warn(`[NumberUtils:Clamp] Value for ${paramName} (${value}) is above maximum (${max}). Clamping to max.`);
        return max;
    }

    return Math.floor(value); // 整数化
};


// =========================================================================
// キャッシュユーティリティ
// =========================================================================

/**
 * メモリ内のデータ配列（Zustandストアなど）から、特定のフィールドの最大値（number）を同期的に取得します。
 * @param array - 最大値を検索する対象のデータ配列 (例: Pack[] または Card[])。
 * @param accessor - 配列の各要素から数値 (number) または null/undefined の値を取得する関数。例: (item) => item.number
 * @returns 配列内の 'number' フィールドの最大値。配列が空の場合や全て null/undefined の場合は 0 を返す。
 */
export const getMaxNumberFromCache = <T>(
    array: T[],
    accessor: (item: T) => number | null | undefined
): number => {
    if (!array || array.length === 0) {
        return 0;
    }

    // Array.prototype.reduce を使用して、配列を走査し、最大値を効率的に計算
    const maxNumber = array.reduce((max, currentItem) => {
        const currentValue = accessor(currentItem);

        // null, undefined, 非数値の場合は無視
        if (typeof currentValue !== 'number' || isNaN(currentValue)) {
            return max;
        }

        // 現在の最大値と比較して大きい方を採用
        return Math.max(max, currentValue);
    }, 0); // 初期値は 0

    return maxNumber;
};