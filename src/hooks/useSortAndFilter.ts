// src/hooks/useSortAndFilter.ts

import { useState, useMemo, useCallback } from 'react';
import { sortData, type SortField, type SortOrder } from '../utils/sortingUtils';

// フックが扱うソート/フィルタリングの状態型
export interface SortFilterState {
    sortField: SortField;
    sortOrder: SortOrder;
    searchTerm: string;
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
}


/**
 * 汎用的なソートとフィルタリングのロジックを提供するカスタムフック
 * @param data - ソートとフィルタリングの対象となる元のデータ配列
 * @param fieldAccessor - データアイテムから指定されたフィールドの値を取得する関数
 * @param config - デフォルトのソート設定
 * @returns ソートとフィルタリングの状態、データ、および操作関数
 */
export const useSortAndFilter = <T>(
    data: T[],
    fieldAccessor: (item: T, field: SortField) => string | number | null | undefined,
    config: DefaultSortConfig = { defaultSortField: 'number', defaultSortOrder: 'asc' }
): UseSortAndFilterResult<T> => {
    
    // 💡 状態管理
    const [sortField, setSortField] = useState<SortField>(config.defaultSortField);
    const [sortOrder, setSortOrder] = useState<SortOrder>(config.defaultSortOrder);
    const [searchTerm, setSearchTerm] = useState<string>('');
    
    
    // 💡 ソート順のトグル関数
    const toggleSortOrder = useCallback(() => {
        setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    }, []);

    // 💡 メインロジック: フィルタリングとソートの適用
    const sortedAndFilteredData = useMemo(() => {
        
        if (!data) return [];
        
        let processedData = data;

        // 1. フィルタリング (検索) 処理
        if (searchTerm.trim() !== '') {
            const lowerCaseSearchTerm = searchTerm.trim().toLowerCase();
            
            // フィルタリングロジック:
            // fieldAccessorで取得できる任意のフィールドの値に検索語が含まれるかチェック
            processedData = processedData.filter(item => {
                // 💡 Pack, Deck, Cardの共通フィールド（name, number, cardId/packId/deckId）で検索
                // フィルタリング対象フィールドを決定
                const filterFields: SortField[] = [
                    'name', 
                    // numberも文字列として検索対象に含める (例: "001"で検索したい場合)
                    'number', 
                    // IDは Pack/Deck/Card でキーが異なるが、fieldAccessorが吸収することを期待
                    'cardId', 'packId', 'deckId', 'rarity' 
                ];
                
                return filterFields.some(field => {
                    const value = fieldAccessor(item, field);
                    if (value === null || value === undefined) return false;
                    
                    // 値を文字列に変換して検索
                    return String(value).toLowerCase().includes(lowerCaseSearchTerm);
                });
            });
        }
        
        // 2. ソート処理
        return sortData(processedData, sortField, sortOrder, fieldAccessor);
        
    }, [data, searchTerm, sortField, sortOrder, fieldAccessor]);

    return {
        sortField,
        sortOrder,
        searchTerm,
        sortedAndFilteredData,
        setSortField,
        setSortOrder,
        toggleSortOrder,
        setSearchTerm,
    };
};