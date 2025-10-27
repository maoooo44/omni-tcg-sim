/**
 * src/components/common/ReusableItemGrid.tsx
 *
 * 汎用的なアイテムグリッド表示コンポーネント
 * 💡 修正: spacing propを受け取り、Grid containerに適用。Grid itemはsxOverrideを適用。
 * 💡 修正: カスタムPropsを透過的に渡すため、ジェネリクス P を追加。
 */
import React from 'react';
import { Grid, type SxProps, type Theme } from '@mui/material';

// 汎用的なアイテムの型 (実際のアプリでは具体的な型を使用)
type ItemType = { id?: string | number; cardId?: string | number, [key: string]: any }; 

// アイテムコンポーネントのProps
// P: CustomProps (追加のプロパティ。デフォルトは空オブジェクト)
type ItemComponentProps<T, P extends object = {}> = {
    item: T;
    index?: number; // 💡 オプショナル: 必要な場合のみ使用（例: アニメーション遅延）
    aspectRatio: number;
    // P のプロパティを ItemComponentProps に追加
    [key: string]: any; // 元のコードのインデックスシグネチャを維持
} & P; // ★ カスタムProps P を結合

// ReusableItemGrid の Props 
// T: ItemType, P: ItemComponentに渡す追加のカスタムPropsの型
interface ReusableItemGridProps<T extends ItemType, P extends object = {}> {
    items: T[]; // 表示するアイテムの配列
    // ItemComponent の型も P を含むように変更
    ItemComponent: React.ComponentType<ItemComponentProps<T, P>>; 
    
    // 汎用性のために、itemProps は P のオプショナルな部分として扱う。
    // item, index, aspectRatio は ReusableItemGrid から渡すため除外（Pはこれらを含まないことが前提）
    itemProps?: P; 
    
    sxOverride: SxProps<Theme>;
    aspectRatio: number; // 現在のアスペクト比
    gap: number; // 💡 変更: px単位のgap値(小数点対応)
}

function ReusableItemGrid<T extends ItemType, P extends object = {}>({
    items,
    ItemComponent,
    itemProps = {} as P, // ★ itemProps をオプションに戻し、デフォルト値を設定
    sxOverride, 
    aspectRatio, 
    gap,
}: ReusableItemGridProps<T, P>): React.ReactElement {
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
                    // ★ 修正: size={12} を削除！ sxOverrideで幅を制御する
                    sx={sxOverride}
                >
                    <ItemComponent 
                        item={item}
                        {...itemProps} // ★ itemProps を展開して渡す
                        index={index}
                        aspectRatio={aspectRatio}
                    />
                </Grid>
            ))}
        </Grid>
    );
}

// ジェネリックなコンポーネントのエクスポート定義
// ★ P を追加
export default ReusableItemGrid as <T extends ItemType, P extends object = {}>(
    props: ReusableItemGridProps<T, P>,
) => React.ReactElement;