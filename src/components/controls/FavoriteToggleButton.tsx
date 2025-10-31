/**
 * src/components/controls/FavoriteToggleButton.tsx
 *
 * Pack, Card, Deck, ArchivePackBundle, ArchiveDeckなど、
 * お気に入り機能を持つすべてのアイテムで使用するための共通トグルボタン。
 *
 * 責務:
 * 1. 現在のお気に入り状態 (isFavorite) に基づいて、ハートアイコンの表示を切り替える。
 * 2. クリックイベントを捕捉し、親コンポーネントから注入された onToggle アクションを実行する。
 * 3. Material UIの IconButton を使用し、小さなコントロールボタンとして機能する。
 */

import React from 'react';
import { IconButton, SvgIcon, CircularProgress } from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import { useTheme } from '@mui/material/styles';

// --- Propの型定義 ---

export interface FavoriteToggleButtonProps {
    /** 対象アイテムのID (Pack ID, Card ID, Archive IDなど) */
    itemId: string; 
    /** 現在のお気に入り状態 */
    isFavorite: boolean; 
    /** トグル実行時に呼び出される非同期関数 (ストアロジックを注入する) */
    onToggle: (itemId: string, newFavoriteState: boolean) => Promise<void>; 
    /** ボタンのサイズ */
    size?: 'small' | 'medium' | 'large';
    /** 無効状態 */
    disabled?: boolean;
}

const FavoriteToggleButton: React.FC<FavoriteToggleButtonProps> = ({
    itemId,
    isFavorite,
    onToggle,
    size = 'small',
    disabled = false,
}) => {
    const theme = useTheme();
    const [isToggling, setIsToggling] = React.useState(false);

    const handleToggle = async () => {
        if (isToggling || disabled) return;

        const newState = !isFavorite;
        
        setIsToggling(true);
        try {
            await onToggle(itemId, newState);
        } catch (error) {
            console.error(`Failed to toggle favorite state for item ${itemId}:`, error);
            // エラー時のUIフィードバック（必要に応じてToast表示など）
        } finally {
            setIsToggling(false);
        }
    };

    const iconColor = isFavorite ? theme.palette.error.main : theme.palette.action.active;

    return (
        <IconButton 
            onClick={handleToggle}
            size={size}
            disabled={disabled || isToggling}
            aria-label={isFavorite ? 'お気に入りを解除' : 'お気に入りに追加'}
        >
            {isToggling ? (
                // トグル中はローディングを表示
                <CircularProgress size={size === 'small' ? 20 : 24} color="inherit" />
            ) : (
                // 状態に応じてアイコンを切り替え
                <SvgIcon 
                    component={isFavorite ? FavoriteIcon : FavoriteBorderIcon} 
                    style={{ color: iconColor }}
                    fontSize={size}
                />
            )}
        </IconButton>
    );
};

export default FavoriteToggleButton;