/**
 * src/components/common/GridDisplay.tsx
 *
 * 任意のアイテムリストと、アイテムごとの表示コンポーネントを受け取り、アイテムをグリッド状に効率的にレンダリングする汎用コンポーネント。
 * MUIのGridコンポーネントを基盤としつつ、CSSの`gap`プロパティを利用して小数点を含むカスタムの余白幅を実現する。
 *
 * * 責務:
 * 1. アイテムの配列 (`items`) をマップし、指定された `ItemComponent` を各アイテムに適用する。
 * 2. アイテムコンポーネントに渡す追加のプロパティ (`itemProps`) をジェネリクス (`P`) を用いて型安全に透過させる。
 * 3. コンテナ全体にカスタムのギャップ (`gap`) を適用する。
 * 4. アイテムコンポーネントをラップする Grid Item に、外部から渡されたスタイル (`sxOverride`) を適用し、各アイテムの幅の制御を委譲する。
 * 5. アイテムの一意性を保証するため、`key` プロパティを適切に設定する。
 * 💡 修正: sxContainerOverride プロパティを追加し、Gridコンテナ自体のスタイルを上書きできるようにする。
 */
import React from 'react';
import { Grid, type SxProps, type Theme } from '@mui/material';
import type { GridRenderUnit } from '../../models/models'; // 仮のインポート元

// 汎用的なアイテムの型 (実際のアプリでは具体的な型を使用)
type ItemType = { id?: string | number; cardId?: string | number, [key: string]: any };

// アイテムコンポーネントのProps
// P: CustomProps (追加のプロパティ。デフォルトは空オブジェクト)
type ItemComponentProps<T, P extends object = {}> = {
    item: T;
    index?: number;
    aspectRatio: number;
    // P のプロパティを ItemComponentProps に追加
    [key: string]: any; // 元のコードのインデックスシグネチャを維持
} & P; // カスタムProps P を結合

// GridDisplay の Props 
// T: ItemType, P: ItemComponentに渡す追加のカスタムPropsの型
// ⭐ [修正] GridRenderUnit を継承 (extends) し、トップレベルでプロパティを受け取るようにする
interface GridDisplayProps<T extends ItemType, P extends object = {}> extends GridRenderUnit {
    items: T[]; // 表示するアイテムの配列
    // ItemComponent の型も P を含むように変更
    ItemComponent: React.ComponentType<ItemComponentProps<T, P>>;

    // 汎用性のために、itemProps は P のオプショナルな部分として扱う。
    // item, index, aspectRatio は GridDisplay から渡すため除外（Pはこれらを含まないことが前提）
    itemProps?: P;
    
    // ★ [削除] gridRenderUnit の組み込みは不要（継承したため）
    // gridRenderUnit?: GridRenderUnit; 
    
    // ★ [追加] Gridコンテナ（外側）のスタイルを上書きするためのプロパティ
    sxContainerOverride?: SxProps<Theme>; 
}

function GridDisplay<T extends ItemType, P extends object = {}>({
    items,
    ItemComponent,
    itemProps = {} as P,
    // ⭐ [修正] GridRenderUnit のプロパティ（sxOverride, aspectRatio, gap）をトップレベルで直接受け取る
    sxOverride,
    aspectRatio,
    gap,
    // その他のプロパティ
    sxContainerOverride = {}, 
}: GridDisplayProps<T, P>): React.ReactElement {
    
    // ★ [削除] gridRenderUnit の分解は不要
    // const { sxOverride, aspectRatio, gap } = gridRenderUnit;
    
    console.log('🎨 GridDisplay rendering');
    console.log('items count:', items.length);
    console.log('first item:', items[0]);
    console.log('itemProps:', itemProps);
    console.log('itemProps.isKeyCardSelectable:', (itemProps as any).isKeyCardSelectable);
    console.log('itemProps.onKeyCardToggle:', (itemProps as any).onKeyCardToggle);

    return (
        <Grid container
            sx={{
                gap: `${gap}px`, // CSSのgapプロパティで小数点の余白を実現
                display: 'flex',
                flexWrap: 'wrap',
                // ★ [修正] sxContainerOverride を適用
                ...sxContainerOverride, 
            }}
        >
            {items.map((item, index) => (
                <Grid
                    key={item.id || item.cardId || index}
                    sx={{
                        padding: 0, // MUI Gridのパディングを上書き
                        margin: 0, // MUI Gridの margin-top/bottom を上書き
                        ...sxOverride, // トップレベルで受け取った sxOverride を使用
                    }}
                >
                    <ItemComponent
                        item={item}
                        {...itemProps}
                        index={index}
                        aspectRatio={aspectRatio} // トップレベルで受け取った aspectRatio を使用
                    />
                </Grid>
            ))}
        </Grid>
    );
}

// ジェネリックなコンポーネントのエクスポート定義
export default GridDisplay as <T extends ItemType, P extends object = {}>(
    props: GridDisplayProps<T, P>,
) => React.ReactElement;