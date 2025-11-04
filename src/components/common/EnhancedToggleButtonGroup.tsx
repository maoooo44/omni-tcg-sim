/**
 * src/components/common/EnhancedToggleButtonGroup.tsx
 *
 * 汎用的なトグルボタングループコンポーネント。
 * アイコン、ツールチップ、様々なスタイルオプションをサポート。
 *
 * 使用例:
 * - カードプールのビューモード切り替え（リスト/図鑑）
 * - デッキエリア切り替え（メイン/サイド/エクストラ）
 * - アーカイブタイプ切り替え（パック/デッキ）
 */

import React from 'react';
import { ToggleButtonGroup, ToggleButton, Tooltip } from '@mui/material';

/**
 * トグルボタンの各オプション定義
 */
export interface ToggleOption<T extends string = string> {
    /** オプションの値 */
    value: T;
    /** 表示ラベル（テキスト） */
    label?: string;
    /** アイコン（ReactNode） */
    icon?: React.ReactNode;
    /** ツールチップテキスト */
    tooltip?: string;
    /** aria-label */
    ariaLabel?: string;
    /** このオプションを非表示にするか（条件付きレンダリング用） */
    hidden?: boolean;
}

/**
 * EnhancedToggleButtonGroupのProps
 */
export interface EnhancedToggleButtonGroupProps<T extends string = string> {
    /** 現在選択されている値 */
    value: T;
    /** 値が変更されたときのハンドラ */
    onChange: (event: React.MouseEvent<HTMLElement>, newValue: T | null) => void;
    /** トグルオプションの配列 */
    options: ToggleOption<T>[];
    
    /** ボタングループのサイズ（デフォルト: 'small'） */
    size?: 'small' | 'medium' | 'large';
    /** ボタンの高さ（デフォルト: '36.5px'） */
    height?: string;
    /** color（デフォルト: 'standard'） */
    color?: 'standard' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';
    /** aria-label */
    ariaLabel?: string;
    /** 排他的選択かどうか（デフォルト: true） */
    exclusive?: boolean;
    /** 無効状態 */
    disabled?: boolean;
    /** カスタムスタイル */
    sx?: any;
}

/**
 * EnhancedToggleButtonGroup
 * 
 * アイコンやツールチップ付きの汎用トグルボタングループ。
 * デフォルト値により、最小限のpropsで使用可能。
 */
function EnhancedToggleButtonGroup<T extends string = string>({
    value,
    onChange,
    options,
    size = 'small',
    height = '36.5px',
    color = 'standard',
    ariaLabel,
    exclusive = true,
    disabled = false,
    sx,
}: EnhancedToggleButtonGroupProps<T>) {
    // 非表示でないオプションのみをフィルタリング
    const visibleOptions = options.filter(option => !option.hidden);

    return (
        <ToggleButtonGroup
            value={value}
            exclusive={exclusive}
            onChange={onChange}
            size={size}
            color={color}
            aria-label={ariaLabel}
            disabled={disabled}
            sx={sx}
        >
            {visibleOptions.map((option) => {
                const button = (
                    <ToggleButton
                        key={option.value}
                        value={option.value}
                        aria-label={option.ariaLabel || option.value}
                        sx={{ 
                            height: height, 
                            flex: 1,
                            ...(option.icon && !option.label ? {} : { minWidth: 'fit-content' })
                        }}
                    >
                        {option.icon}
                        {option.label && (
                            <span style={{ marginLeft: option.icon ? '8px' : '0' }}>
                                {option.label}
                            </span>
                        )}
                    </ToggleButton>
                );

                // ツールチップがある場合はTooltipでラップ
                if (option.tooltip) {
                    return (
                        <Tooltip key={option.value} title={option.tooltip}>
                            {button}
                        </Tooltip>
                    );
                }

                return button;
            })}
        </ToggleButtonGroup>
    );
}

export default EnhancedToggleButtonGroup;
