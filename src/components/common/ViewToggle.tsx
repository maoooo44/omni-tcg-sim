/**
 * src/components/common/ViewToggle.tsx
 *
 * 汎用的なトグルボタングループコンポーネント。
 * カードプールの所持/全画面トグル、デッキエリアトグル、アーカイブタイプトグルなど、
 * 様々な場面で使用できる統一されたトグルUIを提供します。
 *
 * 責務:
 * 1. ToggleButtonGroupのラッパーとして、統一されたスタイルを提供
 * 2. アイコン、ラベル、ツールチップの表示をサポート
 * 3. オプショナルな高さ設定（デフォルト: 36.5px）
 */

import React from 'react';
import { ToggleButton, ToggleButtonGroup, Tooltip } from '@mui/material';

/**
 * トグルオプションの定義
 */
export interface ToggleOption<T extends string = string> {
    /** オプションの値 */
    value: T;
    /** 表示ラベル（アイコンのみの場合は省略可） */
    label?: string;
    /** アイコン（オプション） */
    icon?: React.ReactNode;
    /** ツールチップテキスト（オプション） */
    tooltip?: string;
    /** aria-label（アクセシビリティ用） */
    ariaLabel?: string;
}

/**
 * ViewToggleのProps
 */
export interface ViewToggleProps<T extends string = string> {
    /** 現在選択されている値 */
    value: T;
    /** 値変更時のハンドラ */
    onChange: (event: React.MouseEvent<HTMLElement>, newValue: T | null) => void;
    /** トグルオプションの配列 */
    options: ToggleOption<T>[];
    /** サイズ（デフォルト: 'small'） */
    size?: 'small' | 'medium' | 'large';
    /** カラー（デフォルト: 'standard'） */
    color?: 'standard' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';
    /** 高さ（デフォルト: '36.5px'） */
    height?: string;
    /** 無効状態 */
    disabled?: boolean;
    /** aria-label（グループ全体） */
    ariaLabel?: string;
}

/**
 * ViewToggle - 汎用トグルボタングループコンポーネント
 */
const ViewToggle = <T extends string = string>({
    value,
    onChange,
    options,
    size = 'small',
    color = 'standard',
    height = '36.5px',
    disabled = false,
    ariaLabel,
}: ViewToggleProps<T>) => {
    return (
        <ToggleButtonGroup
            value={value}
            exclusive
            onChange={onChange}
            size={size}
            color={color}
            disabled={disabled}
            aria-label={ariaLabel}
        >
            {options.map((option) => {
                const button = (
                    <ToggleButton
                        key={option.value}
                        value={option.value}
                        aria-label={option.ariaLabel || option.label}
                        sx={{
                            height: height,
                            flex: 1,
                            minWidth: option.icon && !option.label ? '40px' : undefined,
                        }}
                    >
                        {option.icon && option.label ? (
                            // アイコンとラベル両方
                            <>
                                {option.icon}
                                <span style={{ marginLeft: '4px' }}>{option.label}</span>
                            </>
                        ) : option.icon ? (
                            // アイコンのみ
                            option.icon
                        ) : (
                            // ラベルのみ
                            option.label
                        )}
                    </ToggleButton>
                );

                // ツールチップがある場合はTooltipでラップ
                return option.tooltip ? (
                    <Tooltip key={option.value} title={option.tooltip}>
                        {button}
                    </Tooltip>
                ) : (
                    button
                );
            })}
        </ToggleButtonGroup>
    );
};

export default ViewToggle;
