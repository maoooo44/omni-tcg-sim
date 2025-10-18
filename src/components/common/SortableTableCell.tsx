/**
* src/components/common/SortableTableCell.tsx
*
* 共通で使用されるソート機能付きテーブルヘッダーセル（TableCell）コンポーネントです。
* テーブル一覧表示（DeckListManager, CardListManagerなど）で使用され、
* ユーザーがセルをクリックすることで、対応するフィールド（field）でのデータの昇順/降順ソートを切り替えます。
* ソートの状態管理は、外部の useSortAndFilter フックから受け取った状態とアクション（sortState）に依存します。
*/

//import React from 'react';
import { TableCell, Box } from '@mui/material';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import { type UseSortAndFilterResult } from '../../hooks/useSortAndFilter';
import { type SortField } from '../../utils/sortingUtils';

interface SortableTableCellProps<T> {
    field: SortField; // ソートキーの型をジェネリクス T に基づいて定義
    label: string;
    align: 'left' | 'right' | 'center';
    sortState: Pick<UseSortAndFilterResult<T>, 'sortField' | 'sortOrder' | 'setSortField' | 'toggleSortOrder'>;
}

export const SortableTableCell = <T extends unknown>({ field, label, align, sortState }: SortableTableCellProps<T>) => {
    // ソートフィールドの比較では field の型が合うことを保証
    const isSorted = sortState.sortField === field;
    const isAsc = sortState.sortOrder === 'asc';

    const handleClick = () => {
        if (isSorted) {
            // 既にソートされている場合は、順序を切り替える
            sortState.toggleSortOrder();
        } else {
            // 新しいフィールドが選択された場合、setSortFieldに責務を委譲
            sortState.setSortField(field);
        }
    };

    return (
        <TableCell 
            align={align} 
            onClick={handleClick}
            sx={{ 
                cursor: 'pointer', 
                whiteSpace: 'nowrap',
                fontWeight: isSorted ? 'bold' : 'normal',
                '&:hover': { bgcolor: 'action.hover' }
            }}
        >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: align === 'right' ? 'flex-end' : align === 'center' ? 'center' : 'flex-start' }}>
                {label}
                {isSorted && (
                    <Box component="span" sx={{ p: 0.5, ml: 0.5, color: 'primary.main', display: 'flex' }}>
                        {isAsc ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />}
                    </Box>
                )}
            </Box>
        </TableCell>
    );
};