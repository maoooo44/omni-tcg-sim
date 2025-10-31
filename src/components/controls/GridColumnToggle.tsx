/**
* src/components/controls/GridColumnToggle.tsx
*
* ユーザーがグリッドの列数を直感的に設定・調整するためのコントロールコンポーネント。
* ボタンをクリックすると、その真下にスライダーおよびインクリメント/デクリメントボタンを含む設定パネル（MUI Popover）を展開する。
*
* * 責務:
* 1. 現在のグリッド列数 (`currentColumns`) を表示するトグルボタンを提供する。
* 2. ボタンの下に、列数の最小値/最大値 (`minColumns`/`maxColumns`) に制約されたスライダーUIを Popover で展開する。
* 3. スライダーおよびインクリメント/デクリメント操作を介して、列数の変更を外部ハンドラ (`setColumns`) に委譲する。
* 4. 最小値/最大値の境界で増減ボタンを無効化し、ユーザーの操作ミスを防ぐ。
*/
import React, { useState } from 'react';
import { Box, Typography, Button, IconButton, Slider, Popover, Paper } from '@mui/material';
import RemoveIcon from '@mui/icons-material/Remove';
import AddIcon from '@mui/icons-material/Add';
import TuneIcon from '@mui/icons-material/Tune'; // 設定アイコン

interface GridColumnToggleProps {
    /** 現在選択されている列数 */
    currentColumns: number;
    /** 列数（数値）を変更するためのハンドラ */
    setColumns: (newColumns: number) => void;
    /** 最小列数 */
    minColumns: number;
    /** 最大列数 */
    maxColumns: number;
    /** UIの表示ラベル (オプション) */
    label?: string;
    /** ★ 新規: 列ではなく行の調整モードで動作させるか */
    isRowMode?: boolean;
}

export const GridColumnToggle: React.FC<GridColumnToggleProps> = ({
    currentColumns,
    setColumns,
    minColumns,
    maxColumns,
    // ★ 修正: isRowModeが指定されない限り '列数:' を使用
    label,
    isRowMode = false,
}) => {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

    const handleClick = (event: React.MouseEvent<HTMLElement>) => {
        // ボタンのクリックで Popover の表示/非表示を切り替える
        setAnchorEl(anchorEl ? null : event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    // スライダー操作のハンドラ
    const handleSliderChange = (_event: Event, newValue: number | number[]) => {
        if (typeof newValue === 'number') {
            setColumns(newValue);
        }
    };

    // インクリメント操作のハンドラ
    const handleIncrement = () => {
        setColumns(Math.min(maxColumns, currentColumns + 1));
    };
    // デクリメント操作のハンドラ
    const handleDecrement = () => {
        setColumns(Math.max(minColumns, currentColumns - 1));
    };

    const open = Boolean(anchorEl);
    const id = open ? 'column-setting-popover' : undefined;

    // ★ 修正: モードに基づいてラベルとタイトルを決定
    const defaultLabel = isRowMode ? '行数:' : '列数:';
    const displayLabel = label ?? defaultLabel;
    const popoverTitle = isRowMode ? '表示行数の調整' : '表示列数の調整';
    const ariaLabelBase = isRowMode ? '行数' : '列数';

    return (
        <Box>
            {/* 1. トグルボタン (現在の列/行数を表示し、設定パネルを開く) */}
            <Button
                aria-describedby={id}
                variant="outlined"
                onClick={handleClick}
                size="small"
                startIcon={<TuneIcon />}
                sx={{ minWidth: 100 }}
            >
                {displayLabel} {currentColumns}
            </Button>

            {/* 2. スライダー/インクリメントパネル (トグルボタンの真下に展開) */}
            <Popover
                id={id}
                open={open}
                anchorEl={anchorEl}
                onClose={handleClose}
                // ボタンの真下に展開
                anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                sx={{ mt: 1 }}
            >
                <Paper elevation={3} sx={{ p: 2, minWidth: 250 }}>
                    <Typography variant="subtitle2" gutterBottom>
                        {/* ★ 修正: モードに応じてタイトルを変更 */}
                        {popoverTitle}
                    </Typography>

                    {/* スライダー */}
                    <Slider
                        value={currentColumns}
                        onChange={handleSliderChange}
                        min={minColumns}
                        max={maxColumns}
                        step={1}
                        marks
                        valueLabelDisplay="auto"
                        sx={{ mb: 2 }}
                    />

                    {/* インクリメント/デクリメントボタンと数値表示 */}
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                        <IconButton 
                            onClick={handleDecrement} 
                            disabled={currentColumns <= minColumns} 
                            size="small" 
                            // ★ 修正: モードに応じてaria-labelを変更
                            aria-label={`${ariaLabelBase}を減らす`}
                        >
                            <RemoveIcon />
                        </IconButton>
                        <Typography variant="h6" sx={{ minWidth: 30, textAlign: 'center' }}>
                            {currentColumns}
                        </Typography>
                        <IconButton 
                            onClick={handleIncrement} 
                            disabled={currentColumns >= maxColumns} 
                            size="small" 
                            // ★ 修正: モードに応じてaria-labelを変更
                            aria-label={`${ariaLabelBase}を増やす`}
                        >
                            <AddIcon />
                        </IconButton>
                    </Box>
                </Paper>
            </Popover>
        </Box>
    );
};

export default GridColumnToggle;