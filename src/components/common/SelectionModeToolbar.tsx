/**
 * src/components/common/SelectionModeToolbar.tsx
 * 
 * アイテムリスト画面で使用する選択モード用のツールバーコンポーネント。
 * 選択モードの切り替え、全選択、選択数の表示、複数のアクションボタンを提供する。
 */
import React from 'react';
import { Badge, Box } from '@mui/material';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import SelectAllIcon from '@mui/icons-material/SelectAll';
import EnhancedIconButton from './EnhancedIconButton';

/** アクションボタンの定義 */
export interface SelectionAction {
    /** アクションのラベル（ツールチップテキスト） */
    label: string;
    /** アクションのアイコン */
    icon: React.ReactNode;
    /** アクションボタンをクリックした時のハンドラ */
    onClick: () => void;
    /** アクションボタンの色（デフォルト: default） */
    color?: 'error' | 'warning' | 'primary' | 'success' | 'default';
    /** アクションボタンの無効化状態（デフォルト: false） */
    disabled?: boolean;
}

/** 選択アイテムの型（アクションまたはカスタムコンポーネント） */
export type SelectionItem = SelectionAction | { component: React.ReactNode };

interface SelectionModeToolbarProps {
    /** 選択モードが有効かどうか */
    isSelectionMode: boolean;
    /** 選択モードを切り替えるハンドラ */
    onToggleSelectionMode: () => void;
    /** 選択されたアイテムのID配列 */
    selectedIds: string[];
    /** 表示中の全アイテム数 */
    totalDisplayedItems: number;
    /** 全選択/全解除を切り替えるハンドラ */
    onToggleAllSelection: () => void;
    /** 選択アイテムの配列（アクションボタンまたはカスタムコンポーネント） */
    items?: SelectionItem[];
}

const SelectionModeToolbar: React.FC<SelectionModeToolbarProps> = ({
    isSelectionMode,
    onToggleSelectionMode,
    selectedIds,
    totalDisplayedItems,
    onToggleAllSelection,
    items = [],
}) => {
    const allSelected = selectedIds.length === totalDisplayedItems && totalDisplayedItems > 0;

    // アクションかコンポーネントかを判定するヘルパー関数
    const isAction = (item: SelectionItem): item is SelectionAction => {
        return 'label' in item && 'icon' in item && 'onClick' in item;
    };

    return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {/* 選択モード切り替えボタン（選択数バッジ付き） */}
            <Badge
                badgeContent={isSelectionMode && selectedIds.length > 0 ? selectedIds.length : null}
                color="primary"
                max={999}
            >
                <EnhancedIconButton
                    color={isSelectionMode ? 'primary' : 'default'}
                    icon={isSelectionMode ? <CheckBoxIcon /> : <CheckBoxOutlineBlankIcon />}
                    tooltipText={isSelectionMode ? "選択モード終了" : "選択モード"}
                    onClick={onToggleSelectionMode}
                />
            </Badge>

            {/* 選択モード時の追加ボタン（右側に展開） */}
            {isSelectionMode && (
                <>
                    {/* 全選択/全解除ボタン */}
                    <EnhancedIconButton
                        color="default"
                        icon={<SelectAllIcon />}
                        tooltipText={allSelected ? "全て解除" : "全て選択"}
                        onClick={onToggleAllSelection}
                    />

                    {/* アイテムの配列をレンダリング */}
                    {items.map((item, index) => {
                        if (isAction(item)) {
                            // アクションボタン
                            return (
                                <EnhancedIconButton
                                    key={index}
                                    color={item.color || 'default'}
                                    icon={item.icon}
                                    tooltipText={item.label}
                                    onClick={item.onClick}
                                    disabled={item.disabled !== undefined ? item.disabled : selectedIds.length === 0}
                                />
                            );
                        } else {
                            // カスタムコンポーネント
                            return <React.Fragment key={index}>{item.component}</React.Fragment>;
                        }
                    })}
                </>
            )}
        </Box>
    );
};

export default SelectionModeToolbar;
