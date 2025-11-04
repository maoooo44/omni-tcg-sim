// src/models/sortFilter.ts

// --- useSortFilter.ts から移動する型定義 ---

/**
 * フィルタフィールドの型定義
 * SortFilterButton.tsx で使用
 */
export type FilterFieldType = 'text' | 'number' | 'select' | 'boolean';

export interface FilterField {
    field: string;
    label: string;
    type: FilterFieldType;
    options?: string[]; // select用のオプション
    caseSensitive?: boolean; // text用の大文字小文字区別（デフォルト: false）
}

/**
 * フィルタ条件の型
 * useSortFilter.ts, SortFilterButton.tsx で使用
 */
export interface FilterCondition {
    field: string;
    // NOTE: number 型の範囲検索 ("10-20") は useSortFilter 側で文字列として扱うため、
    // ここでは string | number | boolean の union 型とする。
    value: string | number | boolean; 
}

/**
 * フックが扱うソート/フィルタリングの状態型
 * useSortFilter.ts, SortFilterButton.tsx で使用
 */
export interface SortFilterState {
    sortField: SortField;
    sortOrder: SortOrder;
    searchTerm: string;
    filters: FilterCondition[];
}

/**
 * ユーザー定義のデフォルト設定
 * useSortFilter.ts で使用
 */
export interface DefaultSortConfig {
    defaultSortField: SortField;
    defaultSortOrder: SortOrder;
}

/**
 * useSortFilter フックの戻り値型
 * useSortFilter.ts で使用
 */
export interface UseSortFilterResult<T> extends SortFilterState {
    sortedAndFilteredData: T[];
    setSortField: (field: SortField) => void;
    setSortOrder: (order: SortOrder) => void;
    toggleSortOrder: () => void;
    setSearchTerm: (term: string) => void;
    setFilters: (filters: FilterCondition[]) => void;
}

// --- SortFilterButton.tsx から移動する型定義 ---

/**
 * 汎用的なソートオプションの型 (表示名とフィールドキー)
 * SortFilterButton.tsx で使用
 */
export interface SortOption {
    label: string;
    value: SortField;
}

/**
 * 汎用的なソートフィールドの型
 */
export type SortField = 'number' | 'name' | 'cardId' | 'rarity' | string;

/**
 * ソート順の型
 */
export type SortOrder = 'asc' | 'desc';



// 3. ソート・フィルターのProps
export interface SortFilterProps {
    /** ラベルプレフィックス（例: "カード"） */
    labelPrefix?: string;
    /** ソートオプション配列 */
    sortOptions: Array<{ value: SortField; label: string }>; // 必須化
    /** 現在のソートフィールド */
    sortField: SortField; // 必須化
    /** 現在のソート順 */
    sortOrder: 'asc' | 'desc'; // 必須化
    /** ソートフィールド変更ハンドラ */
    setSortField: (field: SortField) => void; // 必須化
    /** ソート順切り替えハンドラ */
    toggleSortOrder: () => void; // 必須化
    /** 検索テキスト */
    searchTerm?: string;
    /** 検索テキスト変更ハンドラ */
    setSearchTerm?: (term: string) => void;
    /** フィルター条件配列 */
    filters?: FilterCondition[];
    /** フィルター条件変更ハンドラ */
    setFilters?: (filters: FilterCondition[]) => void;
    /** フィルターフィールド定義 */
    filterFields?: FilterField[];
}