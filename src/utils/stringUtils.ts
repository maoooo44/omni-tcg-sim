/**
 * src/utils/stringUtils.ts
 * 文字列操作に関する汎用ユーティリティ関数
 */

// デフォルトの最大文字数
const DEFAULT_MAX_LENGTH = 20;

/**
 * 文字列を指定された最大文字数で切り詰め、超過した場合は三点リーダ (...) を付加します。
 *
 * @param text - 切り詰める文字列
 * @param maxLength - 最大文字数 (オプション, デフォルトは 20)
 * @returns 切り詰められた文字列
 */
export const truncateString = (
    text: string | null | undefined,
    maxLength: number = DEFAULT_MAX_LENGTH
): string => {
    if (!text) return '';

    // maxLength は 1 以上であることを想定
    const finalMaxLength = Math.max(1, maxLength);

    if (text.length > finalMaxLength) {
        return `${text.substring(0, finalMaxLength)}...`;
    }
    return text;
};