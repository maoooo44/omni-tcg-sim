/**
 * src/hooks/useSelection.ts
 *
 * 選択状態管理の共通ロジックを提供するカスタムフック。
 * Pack、Deck、Card、Archive など任意のアイテム一覧で使用可能。
 *
 * 責務:
 * 1. 選択されたアイテムIDの配列を管理する
 * 2. 個別アイテムの選択/選択解除をトグルする
 * 3. 全アイテムの選択/選択解除をトグルする
 * 4. 選択状態をクリアする
 */

import { useState, useCallback } from 'react';

interface UseSelectionOptions<T = string> {
    initialSelectedIds?: T[];
}

interface UseSelectionReturn<T = string> {
    selectedIds: T[];
    toggleSelection: (id: T) => void;
    toggleAllSelection: (allIds: T[]) => void;
    clearSelection: () => void;
    setSelectedIds: React.Dispatch<React.SetStateAction<T[]>>;
}

/**
 * 選択状態管理フック
 * @template T - アイテムIDの型（デフォルトはstring）
 * @param options - 初期選択IDの配列（オプション）
 * @returns 選択状態と操作ハンドラ
 */
export function useSelection<T = string>(
    options: UseSelectionOptions<T> = {}
): UseSelectionReturn<T> {
    const { initialSelectedIds = [] } = options;
    const [selectedIds, setSelectedIds] = useState<T[]>(initialSelectedIds);

    /**
     * 個別アイテムの選択/選択解除をトグル
     */
    const toggleSelection = useCallback((id: T) => {
        setSelectedIds(prev =>
            prev.includes(id)
                ? prev.filter(selectedId => selectedId !== id)
                : [...prev, id]
        );
    }, []);

    /**
     * 全アイテムの選択/選択解除をトグル
     * - 全選択状態の場合: 全て選択解除
     * - 一部または未選択の場合: 全て選択
     */
    const toggleAllSelection = useCallback((allIds: T[]) => {
        setSelectedIds(prev =>
            prev.length === allIds.length ? [] : [...allIds]
        );
    }, []);

    /**
     * 選択状態をクリア
     */
    const clearSelection = useCallback(() => {
        setSelectedIds([]);
    }, []);

    return {
        selectedIds,
        toggleSelection,
        toggleAllSelection,
        clearSelection,
        setSelectedIds,
    };
}
