/**
 * src/components/controls/ItemQuantityControl.tsx
 *
 * デッキ、パック、アイテムリストなどで使用する、アイテムの個数増減ボタンを提供する汎用コンポーネント。
 * 💡 修正: minCount をオプショナルで追加し、デフォルト値を 0 と設定。
 */
import React from 'react';
import { Box, IconButton, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';

interface ItemQuantityControlProps {
    itemId: string; // 💡 増減対象のアイテムを一意に特定するID
    currentCount: number;
    maxCount?: number; // 最大枚数制限（任意）
    // 💡 追加: 最小枚数制限（任意）
    minCount?: number; 
    onAdd: (itemId: string) => void;
    onRemove: (itemId: string) => void;
    size?: 'small' | 'medium'; // ボタンのサイズ
    // 💡 オプション：現在の枚数表示を非表示にする
    hideCountDisplay?: boolean; 
}

const ItemQuantityControl: React.FC<ItemQuantityControlProps> = ({
    itemId,
    currentCount,
    maxCount = 99, // デフォルトでは十分大きな値を設定
    // 💡 追加: minCount を受け取り、デフォルト値を 0 に設定
    minCount = 0,
    onAdd,
    onRemove,
    size = 'small',
    hideCountDisplay = false,
}) => {
    // 💡 修正: isMinCount の判定を minCount に基づいて行う
    const isMinCount = currentCount <= minCount;
    const isMaxCount = currentCount >= maxCount;
    const iconSize = size === 'small' ? 'small' : 'medium';

    const handleAdd = (e: React.MouseEvent) => {
        e.stopPropagation(); // 親要素へのクリック伝播を防ぐ
        if (!isMaxCount) {
            onAdd(itemId);
        }
    };

    const handleRemove = (e: React.MouseEvent) => {
        e.stopPropagation(); // 親要素へのクリック伝播を防ぐ
        // 💡 修正: isMinCount に基づいて onRemove の実行を制御
        if (!isMinCount) {
            onRemove(itemId);
        }
    };

    return (
        <Box
            sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'rgba(255, 255, 255, 0.9)', // 背景を白くして視認性向上
                borderRadius: 1,
                p: 0.2,
                boxShadow: 2,
            }}
        >
            <IconButton
                size={size}
                onClick={handleRemove}
                disabled={isMinCount} // 💡 最小枚数に達したら無効化
                color="primary"
                sx={{ p: size === 'small' ? 0.5 : 1 }}
            >
                <RemoveIcon fontSize={iconSize} />
            </IconButton>

            {!hideCountDisplay && (
                <Typography variant="body2" sx={{ mx: 0.5, fontWeight: 'bold' }}>
                    {currentCount}
                </Typography>
            )}

            <IconButton
                size={size}
                onClick={handleAdd}
                disabled={isMaxCount} // 💡 最大枚数に達したら無効化
                color="primary"
                sx={{ p: size === 'small' ? 0.5 : 1 }}
            >
                <AddIcon fontSize={iconSize} />
            </IconButton>
        </Box>
    );
};

export default ItemQuantityControl;