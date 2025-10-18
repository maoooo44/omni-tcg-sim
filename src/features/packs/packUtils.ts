/**
 * src/features/packs/packUtils.ts
 *
 * パック管理フィーチャーで使用されるユーティリティ関数群。
 * 主に、Packオブジェクトに関連する純粋なデータ処理や、useSortAndFilterで使用されるアクセサ関数を提供する。
 */
import type { Pack, PackType } from '../../models/pack';
import { type SortField } from '../../utils/sortingUtils'; 
import { type SortOption } from '../../components/controls/SortAndFilterControls';
/**
 * Packオブジェクトから指定されたフィールドの値を取得するアクセサ関数
 */
export const packFieldAccessor = (item: Pack, field: SortField): string | number | null | undefined => {
    switch (field) {
        case 'number':
            return item.number;
        case 'name':
            return item.name;
        case 'packId':
            return item.packId;
        case 'series':
            return item.series;
        default:
            return (item as any)[field] ?? null;
    }
};


/**
 * パック管理フィーチャーで使用されるソートオプションを定義する。
 */
export const PACK_SORT_OPTIONS: SortOption[] = [
    { label: '図鑑 No. (デフォルト)', value: 'number' },
    { label: 'パック名', value: 'name' },
    { label: 'ID', value: 'packId' },
    { label: 'シリーズ', value: 'series' },
];

/**
 * パック種別 (PackType) の選択肢リスト
 * UIのドロップダウンメニューで使用される。
 */
export const PACK_TYPE_OPTIONS: PackType[] = ['Booster', 'ConstructedDeck', 'Other'];