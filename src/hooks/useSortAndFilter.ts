/**
 * src/hooks/useSortAndFilter.ts
 *
 * 汎用的なソートとフィルタリングのロジックをカプセル化するカスタムフック。
 * 外部のデータとアクセサー関数を利用し、UIの状態（ソート、検索、詳細フィルタ）に基づいて
 * パフォーマンスに配慮したデータ加工結果を提供する。
 */
import { useState, useMemo, useCallback } from 'react';
import { sortData, type SortField, type SortOrder } from '../utils/sortingUtils';

// フィルタフィールドの型定義
export type FilterFieldType = 'text' | 'number' | 'select' | 'boolean';

export interface FilterField {
    field: string;
    label: string;
    type: FilterFieldType;
    options?: string[]; // select用のオプション
    caseSensitive?: boolean; // text用の大文字小文字区別（デフォルト: false）
}

// フィルタ条件の型
export interface FilterCondition {
    field: string;
    value: string | number | boolean;
}

// フックが扱うソート/フィルタリングの状態型
export interface SortFilterState {
    sortField: SortField;
    sortOrder: SortOrder;
    searchTerm: string;
    filters: FilterCondition[];
}

// ユーザー定義のデフォルト設定
export interface DefaultSortConfig {
    defaultSortField: SortField;
    defaultSortOrder: SortOrder;
}

// フックの戻り値型
export interface UseSortAndFilterResult<T> extends SortFilterState {
    sortedAndFilteredData: T[];
    setSortField: (field: SortField) => void;
    setSortOrder: (order: SortOrder) => void;
    toggleSortOrder: () => void;
    setSearchTerm: (term: string) => void;
    setFilters: (filters: FilterCondition[]) => void;
}


/**
 * 汎用的なソートとフィルタリングのロジックを提供するカスタムフック
 * @param data - ソートとフィルタリングの対象となる元のデータ配列
 * @param fieldAccessor - データアイテムから指定されたフィールドの値を取得する関数（オプション。省略時はデフォルトアクセサを使用）
 * @param config - デフォルトのソート設定 (デフォルトは number/asc)
 * @returns ソートとフィルタリングの状態、データ、および操作関数
 */
export const useSortAndFilter = <T>(
    data: T[],
    fieldAccessor?: (item: T, field: SortField) => string | number | null | undefined,
    config: DefaultSortConfig = { defaultSortField: 'number', defaultSortOrder: 'asc' }
): UseSortAndFilterResult<T> => {
    
    // デフォルトアクセサ: オブジェクトのプロパティに直接アクセス
    const defaultAccessor = (item: T, field: SortField): string | number | null | undefined => {
        return (item as any)[field] ?? null;
    };
    
    // 渡されたアクセサまたはデフォルトアクセサを使用
    const accessor = fieldAccessor ?? defaultAccessor;
    
    // 状態管理
    const [sortField, setSortField] = useState<SortField>(config.defaultSortField);
    const [sortOrder, setSortOrder] = useState<SortOrder>(config.defaultSortOrder);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [filters, setFilters] = useState<FilterCondition[]>([]);
    
    
    // ソート順のトグル関数 (useCallbackで安定化)
    const toggleSortOrder = useCallback(() => {
        setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    }, []);

    // メインロジック: フィルタリングとソートの適用 (useMemoでパフォーマンス最適化)
    const sortedAndFilteredData = useMemo(() => {
        
        if (!data) return [];
        
        let processedData = data;

        // 1. フィルタリング (検索) 処理
        if (searchTerm.trim() !== '') {
            const lowerCaseSearchTerm = searchTerm.trim().toLowerCase();
            
            // フィルタリング対象フィールドを定義
            // fieldAccessor が各モデルの ID (cardId, packId, deckId) を解決することを期待
            const filterFields: SortField[] = [
                'name', 
                'number', 
                'cardId', 'packId', 'deckId', 'rarity' 
            ];
            
            processedData = processedData.filter(item => {
                return filterFields.some(field => {
                    const value = accessor(item, field);
                    if (value === null || value === undefined) return false;
                    
                    // 値を文字列に変換して、検索語が含まれているかチェック
                    return String(value).toLowerCase().includes(lowerCaseSearchTerm);
                });
            });
        }
        
        // 2. 詳細フィルタリング処理 (FilterCondition[])
        if (filters.length > 0) {
            processedData = processedData.filter(item => {
                return filters.every(filter => {
                    const value = accessor(item, filter.field as SortField);
                    
                    // テキストフィールド: 部分一致（大文字小文字区別なし）
                    if (typeof filter.value === 'string' && typeof value === 'string') {
                        return value.toLowerCase().includes(filter.value.toLowerCase());
                    }
                    
                    // 数値フィールド: 範囲検索対応
                    if (typeof filter.value === 'string' && filter.value.includes('-')) {
                        const [min, max] = filter.value.split('-').map(Number);
                        const numValue = Number(value);
                        return !isNaN(numValue) && numValue >= min && numValue <= max;
                    }
                    
                    // 数値フィールド: 完全一致
                    if (typeof filter.value === 'number') {
                        return Number(value) === filter.value;
                    }
                    
                    // boolean フィールド: 完全一致
                    if (typeof filter.value === 'boolean') {
                        return Boolean(value) === filter.value;
                    }
                    
                    // その他: 完全一致
                    return value === filter.value;
                });
            });
        }
        
        // 3. ソート処理 (sortingUtils.ts に委譲)
        return sortData(processedData, sortField, sortOrder, accessor);
        
    }, [data, searchTerm, filters, sortField, sortOrder, accessor]);

    return {
        sortField,
        sortOrder,
        searchTerm,
        filters,
        sortedAndFilteredData,
        // Setter関数
        setSortField: setSortField,
        setSortOrder: setSortOrder,
        toggleSortOrder,
        setSearchTerm,
        setFilters,
    };
};