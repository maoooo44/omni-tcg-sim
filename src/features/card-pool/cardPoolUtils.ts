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
 */
export const cardPoolFieldAccessor = (item: OwnedCardDisplay, field: SortField): string | number | null | undefined => {
    switch (field) {
        // 複合ソート: packNumber (パックのナンバー) と number (カードのナンバー) を使用
        case 'number':
            const packNumber = item.packNumber ?? 999999; 
            const cardNumber = item.number ?? 999999;
            // 複合ソート用の文字列/数値を作成 (例: 001005001010)
            return `${String(packNumber).padStart(6, '0')}${String(cardNumber).padStart(6, '0')}`;
        case 'packName':
            return item.packName; 
        case 'name':
            return item.name;
        case 'rarity':
            return item.rarity;
        case 'count':
            return item.count; 
        case 'cardId':
            return item.cardId;
        default:
            return (item as any)[field] ?? null; 
    }
};