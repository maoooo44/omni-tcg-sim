import React from 'react';
import { Box } from '@mui/material';

/**
 * 論理削除済みのアイテムなどを薄く表示するためのラッパーコンポーネント。
 * 薄さの度合いを opacity プロパティで調整できます。
 */

// デフォルトの薄さ（opacity: 40%）
export const DEFAULT_FADED_OPACITY = 0.4;

interface FadedOverlayProps {
    /**
     * 薄さを適用する要素。
     */
    children: React.ReactNode;
    /**
     * 透明度 (0.0 から 1.0)。デフォルトは DEFAULT_FADED_OPACITY。
     */
    opacity?: number;
}

export const FadedOverlay: React.FC<FadedOverlayProps> = ({ children, opacity = DEFAULT_FADED_OPACITY }) => {
    return (
        // Boxに直接opacityを適用することで、中の要素全体を薄く表示する
        <Box sx={{ opacity: opacity }}>
            {children}
        </Box>
    );
};