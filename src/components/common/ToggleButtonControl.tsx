/**
 * src/components/common/ToggleButtonControl.tsx
 *
 * 汎用的なトグルボタングループコンポーネント。
 * カードプールの所持/全画面トグル、デッキエリアトグル、アーカイブタイプトグルなどに使用。
 *
 * 責務:
 * 1. ToggleButtonGroupのラッパーとして統一されたインターフェースを提供
 * 2. アイコン、ラベル、ツールチップの表示オプション
 * 3. サイズ、高さ、色のカスタマイズ
 */

import React from 'react';
import { ToggleButton, ToggleButtonGroup, Tooltip, Box } from '@mui/material';
import type { SxProps, Theme } from '@mui/material';

/**
 * トグルボタンの各オプション定義
 */
export interface ToggleOption<T = string> {
    /** オプションの値 */
    value: T;
    /** 表示ラベル（オプション） */
    label?: string;
    /** アイコン（オプション） */
    icon?: React.ReactNode;
    /** ツールチップテキスト（オプション） */
    tooltip?: string;
    /** aria-label */
    ariaLabel?: string;
}

/**
 * ToggleButtonControlのProps
 */
export interface ToggleButtonControlProps<T = string> {
    /** 現在選択されている値 */
    value: T;
    /** 値変更時のハンドラ */
    onChange: (event: React.MouseEvent<HTMLElement>, newValue: T | null) => void;
    /** トグルオプションの配列 */
    options: ToggleOption<T>[];
    /** ボタンのサイズ */
    size?: 'small' | 'medium' | 'large';
    /** ボタンの高さ（デフォルト: 36.5px） */
    height?: string | number;
    /** ボタンの色 */
    color?: 'standard' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';
    /** 無効状態 */
    disabled?: boolean;
    /** 排他的選択（デフォルト: true） */
    exclusive?: boolean;
    /** カスタムスタイル */
    sx?: SxProps<Theme>;
    /** aria-label */
    ariaLabel?: string;
}

/**
 * 汎用トグルボタングループコンポーネント
 */
const ToggleButtonControl = <T extends string = string>({
    value,
    onChange,
    options,
    size = 'small',
    height = '36.5px',
    color = 'primary',
    disabled = false,
    exclusive = true,
    sx,
    ariaLabel,
}: ToggleButtonControlProps<T>) => {
    const buttonSx: SxProps<Theme> = {
        height: height,
        flex: 1,
    };

    return (
        <Box sx={sx}>
            <ToggleButtonGroup
                value={value}
                exclusive={exclusive}
                onChange={onChange}
                size={size}
                color={color}
                disabled={disabled}
                aria-label={ariaLabel}
            >
                {options.map((option) => {
                    const button = (
                        <ToggleButton
                            key={String(option.value)}
                            value={option.value}
                            aria-label={option.ariaLabel || String(option.value)}
                            sx={buttonSx}
                        >
                            {option.icon && option.label ? (
                                // アイコンとラベル両方ある場合
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    {option.icon}
                                    {option.label}
                                </Box>
                            ) : option.icon ? (
                                // アイコンのみ
                                option.icon
                            ) : (
                                // ラベルのみ
                                option.label
                            )}
                        </ToggleButton>
                    );

                    // ツールチップがある場合はラップ
                    if (option.tooltip) {
                        return (
                            <Tooltip key={String(option.value)} title={option.tooltip}>
                                {button}
                            </Tooltip>
                        );
                    }

                    return button;
                })}
            </ToggleButtonGroup>
        </Box>
    );
};

export default ToggleButtonControl;
