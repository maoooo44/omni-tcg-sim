/**
 * src/utils/valueResolver.ts
 *
 * * 値の解決（フォールバック）に関する汎用ユーティリティモジュール。
 * 主な責務は、プライマリな入力値（例: ユーザー設定）が undefined, null, または無効な値（NaN, Infinityなど）
 * である場合に、型チェックと有効性チェックを行いながら、安全にデフォルト値へフォールバックすることです。
 *
 * * 責務:
 * 1. 値が有限かつNaNではない有効な数値であるかをチェックする型ガードを提供する（isValidNumber）。
 * 2. プライマリな数値が有効でない場合にデフォルト値を返すフォールバック関数を提供する（resolveNumberWithFallback）。
 */

/**
 * ユーザー設定値が有効な数値であるかをチェックする型ガード。
 * @param value チェックする値
 * @returns 値がNaNではない有限な数値 (number) であれば true
 */
const isValidNumber = (value: unknown): value is number => {
    return typeof value === 'number' && isFinite(value) && !isNaN(value);
};

/**
 * プライマリな数値が有効でない場合にデフォルト値を返す関数。
 * * プライマリ値が undefined, null, または無効な数値 (NaN/Infinity) の場合に、
 * デフォルト値を返します。
 * @param primaryValue プライマリとして使用したい値 (number | undefined | null)
 * @param fallbackValue プライマリ値が無効な場合の代替値（デフォルト値） (number)
 * @returns 解決された最終的な設定値 (number)
 */
export const resolveNumberWithFallback = (
    primaryValue: number | undefined | null,
    fallbackValue: number
): number => {
    // isValidNumber を使用して、プライマリ値が有効な数値であるかをチェック
    if (isValidNumber(primaryValue)) {
        return primaryValue;
    }

    // プライマリ値が無効な場合は代替値を返す
    return fallbackValue;
};