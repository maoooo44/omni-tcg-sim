import { type FC, type ReactNode, useMemo } from 'react';
import { 
    Button, 
    type ButtonProps, 
    Tooltip,
    useTheme, 
    Box, // ⭐ Boxをインポート
} from '@mui/material';
import type{SxProps, Theme} from '@mui/material/styles'; 

// ButtonPropsを継承することで、color, variant, onClick, disabledなど全て受け取る
interface ResponsiveButtonProps extends ButtonProps {
    /** 常に表示されるアイコン (ButtonPropsのstartIconと競合するため、別名で定義) */
    icon: ReactNode; // startIconの代わりに必須化
    /** 大画面でのみ表示するボタンテキスト */
    text: string;
    /** ボタンのツールチップに表示するテキスト */
    tooltipText: string;
    /** レスポンシブ切り替えのブレークポイント (例: 'sm' や 'md')。
     * このブレークポイント「より大きい」画面幅でテキストが表示される。
     */
    breakpoint?: 'sm' | 'md' | 'lg' | 'xl';
}

/**
 * 画面幅に応じてテキストを非表示にし、アイコンとツールチップのみにするレスポンシブなボタン。
 * （テキストは[breakpoint]より大きい画面幅でのみ表示）
 */
const ResponsiveButton: FC<ResponsiveButtonProps> = ({
    icon,
    text,
    tooltipText,
    breakpoint = 'sm', 
    // ButtonPropsから分離して受け取る
    sx, // 既存のsxを保持
    startIcon, // ButtonPropsのstartIconは無視する
    children, // ButtonPropsのchildrenは無視する
    ...props // その他のButtonProps
}) => {
    
    const theme = useTheme<Theme>();

    // 1. アイコンの間隔調整のみを finalSx に残す
    const finalSx: SxProps<Theme> = useMemo(() => {
        
        const baseResponsiveStyle = {
            // テキスト非表示時の最小幅を設定
            minWidth: theme.spacing(5), 
            
            // アイコンとテキストの間隔の制御のみ
            [`& .MuiButton-startIcon`]: {
                marginRight: 0, // アイコンのみの場合はマージンをゼロに
                
                // [breakpoint]以上の画面幅 (テキスト表示時) は標準のマージンを適用
                [theme.breakpoints.up(breakpoint)]: {
                    marginRight: theme.spacing(1), 
                },
            },
            
            // テキストの非表示処理はBoxコンポーネントに任せるため、ここでは不要
        };

        // 既存のsxとレスポンシブスタイルをマージ 
        return Array.isArray(sx) ? [...sx, baseResponsiveStyle] : [sx, baseResponsiveStyle];

    }, [sx, theme, breakpoint]);

    // 2. Boxのdisplay propを使ってテキストの表示/非表示を直接制御
    const textDisplaySx: SxProps<Theme> = {
        // [breakpoint]以下の画面幅で非表示 (display: 'none')
        [theme.breakpoints.down(breakpoint)]: {
            display: 'none',
        },
        // [breakpoint]以上の画面幅では表示 (display: 'block'または'inline'など、デフォルトを維持)
        [theme.breakpoints.up(breakpoint)]: {
            display: 'block',
        }
    };

    return (
        <Tooltip title={tooltipText}>
            <Button
                {...props}
                startIcon={icon} // icon propをstartIconとして使用
                sx={finalSx} 
            >
                {/* ⭐ 修正: textをBoxでラップし、Boxにレスポンシブなdisplayを適用する */}
                <Box component="span" sx={textDisplaySx}>
                    {text}
                </Box>
            </Button>
        </Tooltip>
    );
};

export default ResponsiveButton;