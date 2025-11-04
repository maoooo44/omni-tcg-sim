/**
 * src/hooks/useBulkOperations.ts
 *
 * 一括操作パターンの共通ロジックを提供するカスタムフック。
 * 選択されたアイテムに対する一括削除、一括編集、一括お気に入りトグルなどの
 * 共通パターンを抽象化する。
 *
 * 責務:
 * 1. 選択IDのチェック（選択がない場合は何もしない）
 * 2. ストアアクションの実行
 * 3. 操作後の選択状態クリア
 */

import { useCallback } from 'react';

interface UseBulkOperationsOptions<T = string> {
    selectedIds: T[];
    clearSelection: () => void;
}

interface BulkHandlerOptions {
    /** 操作完了後に選択をクリアするかどうか（デフォルト: false） */
    clearSelectionAfter?: boolean;
}

interface UseBulkOperationsReturn {
    createBulkHandler: <TArgs extends any[]>(
        storeAction: (...args: TArgs) => void | Promise<void>,
        options?: BulkHandlerOptions
    ) => (...args: TArgs) => Promise<void>;
}

/**
 * 一括操作ハンドラ生成フック
 * @template T - アイテムIDの型（デフォルトはstring）
 * @param options - 選択IDと選択クリア関数
 * @returns 一括操作ハンドラを生成する関数
 *
 * @example
 * const { createBulkHandler } = useBulkOperations({ selectedIds, clearSelection });
 * // 編集は選択を保持（デフォルト動作）
 * const handleBulkEdit = createBulkHandler(packStore.bulkUpdatePacks);
 * // 削除は選択をクリア
 * const handleBulkDelete = createBulkHandler(packStore.bulkDeletePacks, { clearSelectionAfter: true });
 */
export function useBulkOperations<T = string>(
    options: UseBulkOperationsOptions<T>
): UseBulkOperationsReturn {
    const { selectedIds, clearSelection } = options;

    /**
     * 一括操作ハンドラを生成する
     * @param storeAction - ストアの一括操作アクション
     * @param options - ハンドラのオプション
     * @returns 一括操作ハンドラ
     */
    const createBulkHandler = useCallback(
        <TArgs extends any[]>(
            storeAction: (...args: TArgs) => void | Promise<void>,
            options?: BulkHandlerOptions
        ) => {
            return async (...args: TArgs) => {
                // 選択IDがない場合は何もしない
                if (selectedIds.length === 0) {
                    console.warn('一括操作: 選択されたアイテムがありません');
                    return;
                }

                const { clearSelectionAfter = false } = options || {};

                try {
                    // ストアアクションを実行
                    await storeAction(...args);
                    
                    // 操作完了後、オプションに応じて選択状態をクリア
                    if (clearSelectionAfter) {
                        clearSelection();
                    }
                } catch (error) {
                    console.error('一括操作エラー:', error);
                    // エラーが発生しても選択状態はクリアしない
                    // （ユーザーが再試行できるようにするため）
                    throw error;
                }
            };
        },
        [selectedIds, clearSelection]
    );

    return {
        createBulkHandler,
    };
}
