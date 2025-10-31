/**
 * src/features/card-pool/cardpoolUtils.ts
 *
 * * カードプール管理フィーチャーで使用されるユーティリティ関数群。
 * * 責務:
 * 1. ソート処理のために、複合的なキー（packNumber + cardNumber）を生成するアクセサ関数（cardPoolFieldAccessor）を提供する。
 */


import { type SortField } from '../../utils/sortingUtils';
import type { OwnedCardDisplay } from './hooks/useCardPoolDisplay';

/**
 * OwnedCardDisplayオブジェクトから、useSortAndFilterフックがソートに使用するための
 * 対応するフィールド値を取得するアクセサ関数を提供します。
 * * @param item ソート対象のOwnedCardDisplayオブジェクト
 * @param field ソートに使用するフィールド名
 * @returns ソート用の値 (複合ソートの場合は文字列、それ以外は元の値)
 */
export const cardPoolFieldAccessor = (item: OwnedCardDisplay, field: SortField): string | number | null | undefined => {
    switch (field) {
        // 複合ソート: packNumber (パックのナンバー) と number (カードのナンバー) を使用
        case 'number':
            const packNumber = item.packNumber ?? 999999;
            const cardNumber = item.number ?? 999999;
            // 複合ソート用の文字列を作成 (例: 001005001010)。欠番は999999として処理。
            return `${String(packNumber).padStart(6, '0')}${String(cardNumber).padStart(6, '0')}`;
        default:
            return (item as any)[field] ?? null;
    }
};