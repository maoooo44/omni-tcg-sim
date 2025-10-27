/**
 * src/features/card-pool/cardpoolUtils.ts
 *
 * カードプール管理フィーチャーで使用されるユーティリティ関数群。
 */


import { type SortField } from '../../utils/sortingUtils';
import type { OwnedCardDisplay } from './hooks/useCardPoolDisplay'; // useCardPoolDisplayから型をインポート

/**
 * OwnedCardDisplayオブジェクトから、useSortAndFilterフックがソートに使用するための
 * 対応するフィールド値を取得するアクセサ関数を提供します。
 * 
 * 💡 注意: このアクセサは 'number' フィールドの複合ソート（packNumber + cardNumber）を実装するために必要です。
 * 他のフィールドはデフォルトアクセサで処理可能ですが、複合ソートのため全体を保持しています。
 */
export const cardPoolFieldAccessor = (item: OwnedCardDisplay, field: SortField): string | number | null | undefined => {
    switch (field) {
        // 複合ソート: packNumber (パックのナンバー) と number (カードのナンバー) を使用
        case 'number':
            const packNumber = item.packNumber ?? 999999; 
            const cardNumber = item.number ?? 999999;
            // 複合ソート用の文字列/数値を作成 (例: 001005001010)
            return `${String(packNumber).padStart(6, '0')}${String(cardNumber).padStart(6, '0')}`;
        default:
            return (item as any)[field] ?? null; 
    }
};