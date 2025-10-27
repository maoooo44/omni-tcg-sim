/**
 * src/configs/filterDefaults.ts
 *
 * SortAndFilterControlsで使用するフィルタフィールド定義を一元管理するファイル。
 * 各エンティティ（Pack, Deck, Card）のフィルタリング可能なフィールドを定義する。
 */

import type { FilterField } from '../hooks/useSortAndFilter';
import type { SortOption } from '../components/controls/SortAndFilterControls';
import type { DefaultSortConfig } from '../hooks/useSortAndFilter';
export type { FilterField, SortOption };

/**
 * パックリスト用のフィルタフィールド定義
 */
export const PACK_FILTER_FIELDS: FilterField[] = [
    { field: 'name', label: 'パック名', type: 'text' },
    { field: 'series', label: 'シリーズ', type: 'text' },
    { field: 'packType', label: 'タイプ', type: 'select', options: ['Booster', 'ConstructedDeck', 'Other'] },
    { field: 'cardsPerPack', label: '封入枚数', type: 'number' },
    { field: 'totalCards', label: '収録カード数', type: 'number' },
    { field: 'price', label: '価格', type: 'number' },
    { field: 'isFavorite', label: 'お気に入り', type: 'boolean' },
    { field: 'isOpened', label: '開封済み', type: 'boolean' },
];

/**
 * デッキリスト用のフィルタフィールド定義
 */
export const DECK_FILTER_FIELDS: FilterField[] = [
    { field: 'name', label: 'デッキ名', type: 'text' },
    { field: 'series', label: 'シリーズ', type: 'text' },
    { field: 'deckType', label: 'タイプ', type: 'select', options: ['MainOnly', 'MainSide', 'MainSideExtra'] },
    { field: 'totalCards', label: '総枚数', type: 'number' },
    { field: 'isFavorite', label: 'お気に入り', type: 'boolean' },
    { field: 'isLegal', label: '有効なデッキ', type: 'boolean' },
    { field: 'hasUnownedCards', label: '未所有カード含む', type: 'boolean' },
];

/**
 * カードプール用のフィルタフィールド定義
 */
export const CARD_FILTER_FIELDS: FilterField[] = [
    { field: 'name', label: 'カード名', type: 'text' },
    { field: 'rarity', label: 'レアリティ', type: 'text' }, // selectにする場合は、レアリティのマスタデータが必要
    { field: 'number', label: '図鑑No', type: 'number' },
    { field: 'text', label: 'テキスト', type: 'text' },
    { field: 'subtext', label: 'サブテキスト', type: 'text' },
    { field: 'isFavorite', label: 'お気に入り', type: 'boolean' },
];

/**
 * パック編集画面のカードリスト用フィルタフィールド定義
 */
export const PACK_CARD_FILTER_FIELDS: FilterField[] = [
    { field: 'name', label: 'カード名', type: 'text' },
    { field: 'rarity', label: 'レアリティ', type: 'text' },
    { field: 'number', label: '図鑑No', type: 'number' },
    { field: 'text', label: 'テキスト', type: 'text' },
];

/**
 * パックリスト用のソートオプション
 */
export const PACK_SORT_OPTIONS: SortOption[] = [
    { label: '図鑑 No. (デフォルト)', value: 'number' },
    { label: 'パック名', value: 'name' },
    { label: 'ID', value: 'packId' },
    { label: 'シリーズ', value: 'series' },
];

/**
 * デッキリスト用のソートオプション
 */
export const DECK_SORT_OPTIONS: SortOption[] = [
    { label: '図鑑 No. (デフォルト)', value: 'number' },
    { label: 'デッキ名', value: 'name' },
    { label: 'カード枚数', value: 'cardCount' },
    { label: 'ID', value: 'deckId' },
];

export const CARD_SORT_OPTIONS: SortOption[] = [
    { label: 'No. (デフォルト)', value: 'number' },
    { label: 'カード名', value: 'name' },
    { label: 'レアリティ', value: 'rarity' },
    { label: 'ID', value: 'cardId' },
];

/**
 * カードプール用のソートオプション（リスト/図鑑モード共通）
 */
export const CARD_POOL_SORT_OPTIONS: SortOption[] = [
    { label: '図鑑/パック順', value: 'number' },
    { label: '名前', value: 'name' },
    { label: 'パック名', value: 'packName' },
    { label: 'レアリティ', value: 'rarity' },
];

/**
 * カードプール用のソートオプション（枚数を含む、DTCGリストモード限定）
 */
export const CARD_POOL_SORT_OPTIONS_WITH_COUNT: SortOption[] = [
    ...CARD_POOL_SORT_OPTIONS,
    { label: '枚数', value: 'count' },
];

// =========================================================================
// デフォルトソート設定
// =========================================================================

/**
 * パックリスト用のデフォルトソート設定
 */
export const PACK_DEFAULT_SORT: DefaultSortConfig = {
    defaultSortField: 'number',
    defaultSortOrder: 'asc',
};

/**
 * デッキリスト用のデフォルトソート設定
 */
export const DECK_DEFAULT_SORT: DefaultSortConfig = {
    defaultSortField: 'number',
    defaultSortOrder: 'asc',
};

/**
 * カード（パック編集画面）用のデフォルトソート設定
 */
export const CARD_DEFAULT_SORT: DefaultSortConfig = {
    defaultSortField: 'number',
    defaultSortOrder: 'asc',
};

/**
 * カードプール用のデフォルトソート設定
 */
export const CARD_POOL_DEFAULT_SORT: DefaultSortConfig = {
    defaultSortField: 'number',
    defaultSortOrder: 'asc',
};