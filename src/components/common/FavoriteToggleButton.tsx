/**
 * src/components/controls/FavoriteToggleButton.tsx
 */

import React from 'react';
import { SvgIcon, CircularProgress } from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import { useTheme } from '@mui/material/styles';
import EnhancedIconButton from '../common/EnhancedIconButton'; 

// --- Propの型定義 ---

export interface FavoriteToggleButtonProps {
    /** 対象アイテムのID (単数形) */
    itemId?: string; // 単数ID
    /** 対象アイテムのID配列 (複数形) */
    itemIds?: string[]; // 複数ID
    /** 現在のお気に入り状態 (単数/複数の代表値) */
    isFavorite: boolean; 

    /** ⭐️ 修正点: 単数トグルハンドラ。オプショナルに変更。 */
    onToggle?: (itemId: string, newFavoriteState: boolean) => Promise<void>; 

    /** ⭐️ 修正点: バルクトグルハンドラ。オプショナルに変更。 */
    onToggleBulk?: (itemIds: string[], newFavoriteState: boolean) => Promise<void>; 

    /** ボタンのサイズ */
    size?: 'small' | 'medium' | 'large';
    /** 無効状態 */
    disabled?: boolean;
}

const FavoriteToggleButton: React.FC<FavoriteToggleButtonProps> = ({
    itemId,
    itemIds = [],
    isFavorite,
    onToggle, 
    onToggleBulk, 
    size = 'small',
    disabled = false,
    ...props 
}) => {
    const theme = useTheme();
    const [isToggling, setIsToggling] = React.useState(false);

    // どのIDリストに対して操作を行うかを決定するロジック
    const targetIds = React.useMemo(() => {
        // itemIdが渡されていればそれを優先
        if (itemId) return [itemId];
        // itemIdsが渡されていればそれを使用
        return itemIds;
    }, [itemId, itemIds]);
    
    // ⭐️ 修正ロジック ⭐️
    // 優先順位: 1. itemIds が渡されていれば BulkMode。2. itemId のみなら SingleMode。3. targetIdsの数 > 1 なら BulkMode。

    const isExplicitBulkMode = itemIds.length > 0;
    const isSingleMode = !!itemId && itemIds.length === 0;
    const isDynamicBulkMode = !isSingleMode && targetIds.length > 1;

    const isBulkMode = isExplicitBulkMode || isDynamicBulkMode;

    // 使用するハンドラの決定
    const handlerToUse = isBulkMode ? onToggleBulk : (isSingleMode ? onToggle : undefined);

    // 操作を実行できるかどうかの最終判定
    const actualDisabled = disabled || targetIds.length === 0 || !handlerToUse;

    const handleToggle = async () => {
        if (isToggling || actualDisabled || !handlerToUse) return;
        
        const newState = !isFavorite;
        
        setIsToggling(true);
        try {
            if (isBulkMode && onToggleBulk) {
                // 複数IDと onToggleBulk を使用
                await onToggleBulk(targetIds, newState);
            } else if (isSingleMode && itemId && onToggle) {
                // 単数IDと onToggle を使用
                await onToggle(itemId, newState); 
            }
        } catch (error) {
            console.error(`Failed to toggle favorite state for items:`, targetIds, error);
        } finally {
            setIsToggling(false);
        }
    };

    // --- (以下、IconColor, IconComponent, TooltipText のロジックは省略) ---
    
    const iconColor = React.useMemo(() => {
        if (actualDisabled || isToggling) {
            return theme.palette.action.disabled;
        }
        if (isFavorite) {
            return theme.palette.primary.main;
        } else {
            return theme.palette.primary.main;
        }
    }, [actualDisabled, isFavorite, isToggling, theme.palette.action.disabled, theme.palette.primary.main]);


    const IconComponent = React.useMemo(() => {
        if (isToggling) {
            return (
                <CircularProgress 
                    size={size === 'small' ? 20 : 24} 
                    color="inherit" 
                />
            );
        }
        return (
            <SvgIcon 
                component={isFavorite ? FavoriteIcon : FavoriteBorderIcon} 
                style={{ color: iconColor }}
                fontSize={size}
            />
        );
    }, [isFavorite, isToggling, iconColor, size]);
    
    
    let tooltipText: string;
    
    if (isBulkMode) {
        // 複数モードの場合
        tooltipText = isFavorite ? '一括でお気に入りを解除' : '一括でお気に入りに追加'; 
    } else {
        // 単数モードの場合
        tooltipText = isFavorite ? 'お気に入りを解除' : 'お気に入りに追加';
    }


    return (
        <EnhancedIconButton 
            onClick={handleToggle}
            size={size}
            disabled={actualDisabled || isToggling}
            icon={IconComponent}
            tooltipText={tooltipText} 
            aria-label={tooltipText}
            {...props}
        />
    );
};

export default FavoriteToggleButton;