// src/components/common/EnhancedIconButton.tsx
import { type FC, type ReactNode } from 'react';
import { 
    Tooltip,
    IconButton, 
    type IconButtonProps, 
} from '@mui/material';

// IconButtonPropsを継承し、Tooltipに必要なプロパティを追加
interface EnhancedIconButtonProps extends IconButtonProps {
    /** 常に表示されるアイコン (IconButtonのchildrenとして使用) */
    icon: ReactNode; 

    /** ボタンのツールチップに表示するテキスト (必須) */
    tooltipText: string;
}

/**
 * Tooltip機能を標準で組み込んだ、強化版のIconButton。
 * disabled状態でもTooltipを表示できるように、MUIの推奨パターンで実装されている。
 */
const EnhancedIconButton: FC<EnhancedIconButtonProps> = ({
    icon,
    tooltipText,
    
    // disabledをpropsから分離
    disabled, 
    
    // IconButtonPropsから分離して受け取る
    children, // IconButtonのchildrenはicon propを使用するため無視
    ...props // その他のIconButtonProps (color, onClick, size, sxなど)
}) => {
    
    if (disabled) {
        // Disabled要素にTooltipを表示するための標準的なMUIパターン
        return (
            <Tooltip title={tooltipText}>
                {/* display: 'inline-block' を持つ spanでラップし、
                  IconButtonのpointer-eventsをnoneにしてイベントをspanに渡す
                */}
                <span style={{ display: 'inline-block' }}> 
                    <IconButton
                        {...props}
                        disabled={disabled}
                        style={{ pointerEvents: 'none' }} // イベントを親のspanに渡す
                    >
                        {icon}
                    </IconButton>
                </span>
            </Tooltip>
        );
    }
    
    // enabledの場合
    return (
        <Tooltip title={tooltipText}>
            <IconButton
                {...props}
                disabled={disabled} // ここで渡す
            >
                {icon}
            </IconButton>
        </Tooltip>
    );
};

export default EnhancedIconButton;