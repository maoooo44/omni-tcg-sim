/**
 * src/components/common/ReusableItemGrid.tsx
 *
 * 汎用的なアイテムグリッド表示コンポーネント
 * 💡 修正: spacing propを受け取り、Grid containerに適用。Grid itemはsxOverrideを適用。
 */
import React from 'react';
import { Grid, type SxProps, type Theme } from '@mui/material';

// 汎用的なアイテムの型 (実際のアプリでは具体的な型を使用)
type ItemType = { id?: string | number; cardId?: string | number, [key: string]: any }; 

// アイテムコンポーネントのProps
type ItemComponentProps<T> = {
    item: T;
    index?: number; // 💡 オプショナル: 必要な場合のみ使用（例: アニメーション遅延）
    // ItemComponentに渡したい追加のprops (例: aspectRatio)
    aspectRatio: number;
    [key: string]: any; 
};

// ReusableItemGrid の Props (フックからの結果を受け取るように変更)
interface ReusableItemGridProps<T extends ItemType> {
    items: T[]; // 表示するアイテムの配列
    ItemComponent: React.ComponentType<ItemComponentProps<T>>; // 個々のアイテムを描画するコンポーネント
    itemProps?: Omit<ItemComponentProps<T>, 'item' | 'index' | 'aspectRatio'>; // item, index, aspectRatio は ReusableItemGrid から渡すため除外
    
    sxOverride: SxProps<Theme>;
    aspectRatio: number; // 現在のアスペクト比
    gap: number; // 💡 変更: px単位のgap値(小数点対応)
}

function ReusableItemGrid<T extends ItemType>({
    items,
    ItemComponent,
    itemProps = {},
    sxOverride, 
    aspectRatio, 
    gap,
}: ReusableItemGridProps<T>): React.ReactElement {
    // 💡 修正: MUIのspacing propではなく、CSSのgapプロパティを使用（小数点対応）
    
    return (
        <Grid container 
            sx={{ 
                gap: `${gap}px`, // CSSのgapプロパティで小数点の余白を実現
                display: 'flex',
                flexWrap: 'wrap',
            }}
        >
            {items.map((item, index) => (
                <Grid
                    key={item.id || item.cardId || index}
                    size={12}
                    sx={sxOverride}
                >
                    <ItemComponent 
                        item={item}
                        {...itemProps}
                        index={index}
                        aspectRatio={aspectRatio}
                    />
                </Grid>
            ))}
        </Grid>
    );
}

// ジェネリックなコンポーネントのエクスポート定義
export default ReusableItemGrid as <T extends ItemType>(
    props: ReusableItemGridProps<T>,
) => React.ReactElement;