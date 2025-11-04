/**
 * src/models/itemDisplay.ts
 * 
 * アイテム表示コンポーネント (InteractiveItemContainer, ImagePreview等) で
 * 使用される共通の型定義を提供します。
 * 
 * 責務:
 * 1. グリッド表示されるアイテムの共通データ構造を定義
 * 2. アイテムのインタラクション (クリック、選択) に関する型を定義
 * 3. アイテムの表示オプション (画像スタイル、コンテナレイアウト) を定義
 * 4. カード固有の拡張オプションを定義
 */

import type { SxProps, Theme } from '@mui/material';
import type { ReactNode } from 'react';

// =========================================================================
// 共通アイテムデータ
// =========================================================================

/**
 * グリッド表示されるアイテムの最小共通データ。
 * Pack/Deck/Card/ArchiveItemなどの共通インターフェース。
 * 
 * InteractiveItemContainer が依存するのはこの型のみです。
 * ドメイン固有のプロパティ (packId, deckId, cardId等) は
 * インデックスシグネチャにより透過的に渡すことができます。
 */
export interface CommonItemData {
    /** アイテムの一意識別子 */
    id?: string;
    /** アイテム名 */
    name?: string;
    /** アイテム番号 */
    number?: number | null | undefined;
    /** 画像URL */
    imageUrl?: string;
    /** 画像の背景色 (プレースホルダー生成時に使用) */
    imageColor?: string;
    /** アーカイブメタデータなど追加情報 */
    metaData?: ReactNode;
    /** ドメイン固有のプロパティを許可 (packId, deckId, cardId等) */
    [key: string]: any;
}

// =========================================================================
// インタラクション関連
// =========================================================================

/**
 * 基本的なインタラクションハンドラ。
 * アイテムクリック時の動作を定義します。
 * 
 * 非選択モード時に使用されます。
 */
export interface InteractionHandlers {
    /** 非選択モード時のメインアクション (詳細表示、編集画面への遷移など) */
    onSelect: (id: string) => void;
}

/**
 * 選択機能のオプション。
 * 選択モード時に使用されます。
 * 
 * Item層からInteractiveItemContainer層へリレーされます。
 */
export interface SelectionOptions {
    /** 選択可能かどうか */
    isSelectable: boolean;
    /** 選択トグル時のハンドラ */
    onToggleSelection: (id: string) => void;
}

// =========================================================================
// 表示オプション
// =========================================================================

/**
 * ImagePreview 層の表示オプション。
 * 画像のスタイリングとホバー効果を制御します。
 * 
 * InteractiveItemContainer を経由して ImagePreview にリレーされます。
 */
export interface ItemImageOptions {
    /** trueの場合、カーソルをポインターに変更 (アニメーションは親に任せる) */
    enableHoverEffect?: boolean;
    /** <img> タグに適用するカスタム SxProps */
    imageSx?: SxProps<Theme>;
}

/**
 * InteractiveContainer 層の表示オプション。
 * コンテナのレイアウトと追加コンテンツを制御します。
 */
export interface ContainerDisplayOptions {
    /** trueの場合、テキストコンテンツを非表示にし画像エリアを100%に */
    noTextContent?: boolean;
    /** カード下部に表示する追加コンテンツのコンポーネント */
    AdditionalContent?: React.FC<{ item: CommonItemData }>;
}

// =========================================================================
// カード固有オプション (拡張例)
// =========================================================================

/**
 * Card アイテム固有の表示オプション。
 * 枚数チップやキーカードランクなどの表示を制御します。
 * 
 * CardItem 専用のオプションです。
 */
export interface CardDisplayOptions {
    /** 枚数チップを表示 (例: x3) */
    quantityChip?: boolean;
    /** 枚数増減コントロールを表示 */
    quantityControl?: boolean;
    /** キーカードランクを表示 */
    keycardRank?: boolean;
    /** 所持枚数が0の時にグレースケール化 */
    grayscaleWhenZero?: boolean;
}

/**
 * Card アイテム固有のインタラクションハンドラ。
 * 基本的なInteractionHandlersを拡張します。
 */
export interface CardInteractionHandlers extends InteractionHandlers {
    /** カードクリック時のハンドラ (カスタムロジック用) */
    onClick?: (card: any) => void; // 循環参照を避けるため any を使用
    /** キーカード選択トグルのハンドラ */
    onToggleKeycard?: (cardId: string) => void;
}

/**
 * Card アイテム固有の数量操作ハンドラ。
 * デッキ構築やパック編集時に使用されます。
 */
export interface CardQuantityHandlers {
    /** 追加ボタンのハンドラ */
    onAddQuantity?: (cardId: string) => void;
    /** 削除ボタンのハンドラ */
    onRemoveQuantity?: (cardId: string) => void;
}
