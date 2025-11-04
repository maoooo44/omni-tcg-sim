// src/models/props.ts

import type { SortField, FilterCondition, FilterField,ToggleOption, CustomActionButton } from './models'; // 既存の型をインポート

// 1. 選択モードのProps
export interface SelectionProps {
    /** 選択モードが有効かどうか */
    isSelectionMode: boolean;
    /** 選択されたアイテムのID配列 */
    selectedIds: string[]; // 必須化
    /** 表示中のアイテム総数 */
    totalDisplayedItems: number; // 必須化
    /** 選択モード切り替えハンドラ */
    onToggleSelectionMode: () => void; // 必須化
    /** 全選択/全解除ハンドラ */
    onToggleAllSelection: () => void; // 必須化
    
    // 選択ツールバーの標準アクション
    bulkDelete?: {
        show?: boolean;
        onDelete?: () => void;
        disabled?: boolean;
        label?: string;
        icon?: React.ReactNode;
    };
    bulkEdit?: {
        show?: boolean;
        onEdit?: () => void;
        disabled?: boolean;
        label?: string;
        icon?: React.ReactNode;
    };
    bulkFavorite?: {
        show?: boolean;
        selectedIds?: string[];
        isFavorite?: boolean;
        onToggle?: (itemIds: string[], newState: boolean) => Promise<void>;
        disabled?: boolean;
    };
    
    /** 追加のカスタムボタン（左端に配置） */
    customSelectionActions?: CustomActionButton[];
    /** 追加のカスタムコンポーネント（左端に配置） */
    customSelectionComponents?: React.ReactNode[];
}

// 2. 列数トグルのProps
export interface GridToggleProps {
    /** 現在の列数 */
    columns: number; // 必須化
    /** 列数変更ハンドラ */
    setColumns: (columns: number) => void; // 必須化
    /** 最小列数 */
    minColumns?: number;
    /** 最大列数 */
    maxColumns?: number;
}

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

// 4. トグルボタンのProps
export interface ToggleGroupProps {
    /** 現在のトグル値 */
    toggleValue: string; // 必須化
    /** トグル変更ハンドラ */
    onToggleChange: (event: React.MouseEvent<HTMLElement>, newValue: string | null) => void; // 必須化
    /** トグルオプション配列 */
    toggleOptions: ToggleOption<string>[]; // 必須化
    /** トグルのサイズ */
    toggleSize?: 'small' | 'medium' | 'large';
    /** トグルのcolor */
    toggleColor?: 'standard' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';
}

// ControlBar全体のProps (トップレベルで機能ごとに集約)
export interface ControlBarProps {
    // --- タイトル表示 ---
    title?: string;
    showTitle?: boolean;
    itemCount?: number;
    itemLabel?: string;

    // --- 構造化されたコントロール群 ---
    /** 選択モードの Props。渡された場合のみ SelectionModeToolbar を表示。 */
    selectionProps?: SelectionProps;

    /** 列数トグルの Props。渡された場合のみ GridColumnToggle を表示。 */
    gridToggleProps?: GridToggleProps;

    /** ソート・フィルターの Props。渡された場合のみ SortAndFilterButton を表示。 */
    sortFilterProps?: SortFilterProps;

    /** 表示切り替えトグルの Props。渡された場合のみ EnhancedToggleButtonGroup を表示。 */
    toggleGroupProps?: ToggleGroupProps;

    // --- 追加ボタン（EnhancedIconButton） ---
    actionButtons?: Array<{
        icon: React.ReactNode;
        tooltip: string;
        onClick: () => void;
        color?: 'inherit' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';
    }>;
}