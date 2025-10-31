/**
 * src/components/controls/ColorSelector.tsx
 *
 * プレースホルダーの色プリセットから、正円のスウォッチで色を選択するためのコンポーネント。
 *
 * * 責務:
 * 1. 現在選択されている色のみをスウォッチボタンとして表示する。
 * 2. スウォッチボタンクリック時に Popover を表示し、全ての色スウォッチグリッドを展開する。
 * 3. 色が選択された際に、対応するキー (例: 'red') を親コンポーネントに通知する。
 * 4. 編集不可モード (disabled) に対応する。
 */
import React, { useMemo, useState, useCallback } from 'react';
import {
    Box, Typography, IconButton, Tooltip, Grid,
    Popover, Paper
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
// 色プリセット定義をインポート
import { PLACEHOLDER_COLOR_PRESETS } from '../../utils/placeholderUtils';
//import type { PlaceholderColor } from '../../utils/placeholderUtils'; // 型もインポート

// Propsの定義
export interface ColorSelectorProps {
    /** 現在選択されている色のプリセットキー (例: 'default', 'red') */
    currentKey: string;
    /** 色が選択されたときに呼び出されるハンドラ */
    onColorSelect: (key: string) => void;
    /** 編集不可モードかどうか */
    disabled?: boolean;
    /** ラベルまたはタイトルとして表示するテキスト (現在はTooltipに統合) */
    label?: string;
    /** 表示する色のキーを限定する場合の配列 (省略時は全て表示) */
    availableKeys?: string[];
}

const ColorSelector: React.FC<ColorSelectorProps> = ({
    currentKey,
    onColorSelect,
    disabled = false,
    availableKeys,
}) => {

    // Popover の状態管理
    const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

    const handleClick = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
        if (!disabled) {
            setAnchorEl(event.currentTarget);
        }
    }, [disabled]);

    const handleClose = useCallback(() => {
        setAnchorEl(null);
    }, []);

    const handleColorClick = useCallback((key: string) => {
        onColorSelect(key);
        handleClose(); // 色選択後、ポップオーバーを閉じる
    }, [onColorSelect, handleClose]);

    const open = Boolean(anchorEl);
    const id = open ? 'color-popover' : undefined;

    // 表示する色オプションをフィルタリング
    const colorOptions = useMemo(() => {
        const entries = Object.entries(PLACEHOLDER_COLOR_PRESETS);

        if (availableKeys) {
            return entries
                .filter(([key]) => availableKeys.includes(key))
                .map(([key, config]) => ({ key, config }));
        }

        return entries.map(([key, config]) => ({ key, config }));

    }, [availableKeys]);

    // 選択中の色の設定を取得
    const selectedColorConfig = PLACEHOLDER_COLOR_PRESETS[currentKey as keyof typeof PLACEHOLDER_COLOR_PRESETS] || PLACEHOLDER_COLOR_PRESETS.default;

    // 選択中の色の名前をキャメルケースからスペース区切りに変換
    const currentName = currentKey.charAt(0).toUpperCase() + currentKey.slice(1);

    // スウォッチサイズを定数化
    const SWATCH_SIZE = 30;

    // 現在選択されているスウォッチボタンの描画ロジック
    const renderCurrentSwatch = () => {
        const checkColor = selectedColorConfig.textColor === '000000' ? 'black' : 'white';

        return (
            // Tooltip に現在の色名を表示
            <Tooltip title={`現在の色: ${currentName} (クリックで変更)`} arrow>
                <IconButton
                    aria-describedby={id}
                    onClick={handleClick}
                    disabled={disabled}
                    sx={{
                        p: 0,
                        width: SWATCH_SIZE,
                        height: SWATCH_SIZE,
                        borderRadius: '50%', // 正円
                        backgroundColor: `#${selectedColorConfig.bgColor}`,
                        border: '3px solid', // 常に縁を強調
                        borderColor: disabled ? 'grey.400' : 'primary.main',
                        boxShadow: '0 0 0 1px #fff inset', // 白の縁を内側に
                        transition: 'all 0.1s ease-out',
                        cursor: disabled ? 'default' : 'pointer',
                        '&:hover': {
                            backgroundColor: `#${selectedColorConfig.bgColor}`,
                            opacity: disabled ? 1 : 0.8,
                            borderColor: disabled ? 'grey.400' : 'secondary.main',
                        },
                    }}
                >
                    <CheckIcon
                        sx={{
                            color: checkColor,
                            fontSize: 18,
                            // 視認性向上のためのドロップシャドウ
                            filter: checkColor === 'white' ? 'drop-shadow(0 0 2px rgba(0,0,0,0.8))' : 'drop-shadow(0 0 2px rgba(255,255,255,0.8))',
                        }}
                    />
                </IconButton>
            </Tooltip>
        );
    };

    return (
        // 中央揃えにして、単一のボタンとして配置
        <Box sx={{ display: 'flex', alignItems: 'center', minHeight: SWATCH_SIZE, justifyContent: 'center' }}>
            {/* 1. 現在の色スウォッチボタン */}
            {renderCurrentSwatch()}

            {/* 2. Popover (色選択グリッド) */}
            <Popover
                id={id}
                open={open}
                anchorEl={anchorEl}
                onClose={handleClose}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'left',
                }}
            >
                <Paper elevation={3} sx={{ p: 1.5 }}>
                    <Typography variant="subtitle2" gutterBottom sx={{ pl: 0.5 }}>
                        色を選択
                    </Typography>
                    {/* 色スウォッチのコンテナ */}
                    <Grid container spacing={1} justifyContent="flex-start" sx={{ maxWidth: '200px' }}>
                        {colorOptions.map(({ key, config }) => {
                            const isSelected = key === currentKey;
                            const checkColor = config.textColor === '000000' ? 'black' : 'white';

                            return (
                                <Grid key={key}>
                                    <Tooltip title={key.charAt(0).toUpperCase() + key.slice(1)} arrow>
                                        <IconButton
                                            onClick={() => handleColorClick(key)} // 選択ハンドラ
                                            sx={{
                                                p: 0,
                                                width: SWATCH_SIZE,
                                                height: SWATCH_SIZE,
                                                borderRadius: '50%',
                                                backgroundColor: `#${config.bgColor}`,
                                                border: isSelected ? '3px solid' : '1px solid',
                                                borderColor: isSelected ? 'primary.main' : 'transparent',
                                                boxShadow: isSelected ? '0 0 0 1px #fff inset' : 'none',
                                                transition: 'all 0.1s ease-out',
                                                cursor: 'pointer',
                                                '&:hover': {
                                                    backgroundColor: `#${config.bgColor}`,
                                                    opacity: 0.8,
                                                    border: isSelected ? '3px solid' : '1px solid',
                                                    borderColor: isSelected ? 'primary.main' : 'grey.500',
                                                },
                                            }}
                                        >
                                            {isSelected && (
                                                <CheckIcon
                                                    sx={{
                                                        color: checkColor,
                                                        fontSize: 18,
                                                        filter: checkColor === 'white' ? 'drop-shadow(0 0 2px rgba(0,0,0,0.8))' : 'drop-shadow(0 0 2px rgba(255,255,255,0.8))',
                                                    }}
                                                />
                                            )}
                                        </IconButton>
                                    </Tooltip>
                                </Grid>
                            );
                        })}
                    </Grid>
                </Paper>
            </Popover>
        </Box>
    );
};

export default ColorSelector;