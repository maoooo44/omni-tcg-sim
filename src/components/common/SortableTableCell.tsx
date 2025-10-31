/**
* src/components/common/SortableTableCell.tsx
*
* 共通で使用されるソート機能付きテーブルヘッダーセル（MUI TableCell）コンポーネント。
* 主にテーブル一覧表示（例: DeckListManager, CardListManager）で使用される。
* ユーザーがセルをクリックすると、対応するデータフィールド (`field`) の昇順/降順ソートを外部ロジック経由で切り替える。
*
* * 責務:
* 1. ソートの状態 (`sortState`) に基づき、セルの背景色、フォントウェイト、カーソルスタイルを制御する。
* 2. 現在ソート対象のフィールドである場合、ソート順 (`asc` / `desc`) に対応するアイコンを表示する。
* 3. クリックイベントを捕捉し、現在のソート状態に応じて、ソートフィールドの切り替え、またはソート順序のトグル処理 (`setSortField` / `toggleSortOrder`) を実行する。
* 4. ジェネリクス `<T>` を使用することで、テーブルデータの型に依存しない汎用的なインターフェースを提供する。
*/
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

    // TableCellのalignプロパティに基づいてBoxのjustifyContentを決定するヘルパー
    const getJustifyContent = (align: 'left' | 'right' | 'center'): 'flex-start' | 'flex-end' | 'center' => {
        switch (align) {
            case 'right': return 'flex-end';
            case 'center': return 'center';
            case 'left':
            default: return 'flex-start';
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
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: getJustifyContent(align) }}>
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