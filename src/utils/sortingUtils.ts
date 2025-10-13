// src/utils/sortingUtils.ts

/**
 * 汎用的なソートフィールドの型
 * Pack, Deck, Card のいずれも持つフィールドを想定
 * number (ソート順), name (名前), cardId (ID) など
 */
export type SortField = 'number' | 'name' | 'cardId' | 'rarity' | string;

/**
 * ソート順の型
 */
export type SortOrder = 'asc' | 'desc';

/**
 * number (図鑑 No. / ソート順) による比較関数
 * @param a - 比較対象 A
 * @param b - 比較対象 B
 * @param order - ソート順 ('asc' または 'desc')
 * @param accessor - ソート対象のフィールドにアクセスする関数
 * @returns 比較結果 (負: A < B, 正: A > B, 0: A = B)
 * * 💡 numberがnullの場合は、数値を持つ要素よりも後にソートされるように扱う。
 */
export const compareByNumber = <T>(
    a: T,
    b: T,
    order: SortOrder,
    accessor: (item: T) => number | null | undefined
): number => {
    const numA = accessor(a) ?? null;
    const numB = accessor(b) ?? null;

    // 両方 null/undefined の場合、順序は等しい
    if (numA === null && numB === null) return 0;
    // Aがnull/undefinedの場合、Bが数値を持つなら A > B (Aを後回し)
    if (numA === null) return 1;
    // Bがnull/undefinedの場合、Aが数値を持つなら A < B (Bを後回し)
    if (numB === null) return -1;
    
    // 両方数値の場合
    const comparison = numA - numB;

    return order === 'asc' ? comparison : -comparison;
};


/**
 * 文字列 (name, cardId, rarityなど) による比較関数
 * @param a - 比較対象 A
 * @param b - 比較対象 B
 * @param order - ソート順 ('asc' または 'desc')
 * @param accessor - ソート対象のフィールドにアクセスする関数
 * @returns 比較結果
 */
export const compareByString = <T>(
    a: T,
    b: T,
    order: SortOrder,
    accessor: (item: T) => string
): number => {
    const strA = accessor(a).toLowerCase();
    const strB = accessor(b).toLowerCase();

    const comparison = strA.localeCompare(strB);

    return order === 'asc' ? comparison : -comparison;
};


/**
 * 汎用ソート関数
 * @param data - ソート対象の配列
 * @param field - ソートフィールド
 * @param order - ソート順
 * @param fieldAccessor - データからソートフィールドの値を取得する関数
 * @returns ソートされた配列
 * * 💡 numberによるソートがデフォルト/優先ソートとなるようロジックを実装
 */
export const sortData = <T>(
    data: T[],
    field: SortField,
    order: SortOrder,
    fieldAccessor: (item: T, field: SortField) => string | number | null | undefined
): T[] => {
    
    // データがない場合はそのまま返す
    if (!data || data.length === 0) return [];
    
    // 浅いコピーを作成してソート
    return [...data].sort((a, b) => {
        // 1. number フィールドによるソート (最優先のデフォルトソート)
        if (field === 'number') {
            return compareByNumber(
                a, 
                b, 
                order, 
                (item) => fieldAccessor(item, 'number') as (number | null | undefined)
            );
        }
        
        // 文字列として比較
        return compareByString(
            a, 
            b, 
            order, 
            (item) => String(fieldAccessor(item, field) ?? '') // null/undefined は空文字列として扱う
        );
    });
};