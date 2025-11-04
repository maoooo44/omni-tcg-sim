/**
 * src/configs/gridConfigs.ts
 *
 * * アプリケーション内の様々な画面で使用される、レスポンシブなアイテムグリッド表示の設定（列数、アスペクト比、間隔など）を定義するモジュール。
 *
 * * 責務:
 * 1. `GridSettings` 型に基づき、画面ごとのグリッド表示設定（`CardPoolGridSettings`, `PackListGridSettings` など）の具体的なインスタンスを静的データとして定義する。
 * 2. 設定オブジェクトは、最小/最大列数、ブレークポイントごとのデフォルト列数、アスペクト比、間隔情報を含む。
 */
import type { GridSettings } from '../models/grid';

// 共通のレスポンシブな列数設定
const COMMON_DEFAULT_COLUMNS = {
    xs: 2,
    sm: 3,
    md: 4,
    lg: 5,
    xl: 6,
};

// カードのアスペクト比 (一般的なTCGカードの縦横比)
const CARD_ASPECT_RATIO = 63 / 88;

// CardPoolの設定値
// カードプール画面（カード）
export const CardPoolGridSettings: GridSettings = {
    minColumns: 2,
    maxColumns: 20, // カードプールは多くのカードを表示するため最大値を大きく
    defaultColumns: COMMON_DEFAULT_COLUMNS,
    aspectRatio: CARD_ASPECT_RATIO,
    defaultSpacing: 8,
    baseColumns: 5,
};

// パックリスト画面（パック）
export const PackListGridSettings: GridSettings = {
    minColumns: 2,
    maxColumns: 10,
    defaultColumns: COMMON_DEFAULT_COLUMNS,
    aspectRatio: CARD_ASPECT_RATIO,
    defaultSpacing: 8,
    baseColumns: 5,
};

// パック編集画面（カード）
export const PackEditorCardGridSettings: GridSettings = {
    minColumns: 2,
    maxColumns: 10,
    defaultColumns: COMMON_DEFAULT_COLUMNS,
    aspectRatio: CARD_ASPECT_RATIO,
    defaultSpacing: 8,
    baseColumns: 5,
};

// デッキリスト画面（デッキ）
export const DeckListGridSettings: GridSettings = {
    minColumns: 2,
    maxColumns: 10,
    defaultColumns: COMMON_DEFAULT_COLUMNS,
    aspectRatio: CARD_ASPECT_RATIO,
    defaultSpacing: 8,
    baseColumns: 5,
};

// デッキ編集画面（カード）
export const DeckEditorCardGridSettings: GridSettings = {
    minColumns: 2,
    maxColumns: 10,
    defaultColumns: COMMON_DEFAULT_COLUMNS,
    aspectRatio: CARD_ASPECT_RATIO,
    defaultSpacing: 8,
    baseColumns: 5,
};

export const COMPACT_LIST_ROW_SETTINGS: GridSettings = {
    // 1行から4行
    minColumns: 1, 
    maxColumns: 3, 
    // デフォルトは2行
    defaultColumns: {
        xs: 2, sm: 2, md: 2, lg: 2, xl: 2
    },
    // コンパクトリスト内のカードのアスペクト比は固定
    aspectRatio: CARD_ASPECT_RATIO, 
    defaultSpacing: 2, // 基準となるスペーシング
    baseColumns: 2, // 基準となる行数（2行の時にdefaultSpacingが適用される）
};

// パック開封画面（カード）
export const PackOpenerGridSettings: GridSettings = {
    minColumns: 2,
    maxColumns: 10,
    defaultColumns: COMMON_DEFAULT_COLUMNS,
    aspectRatio: CARD_ASPECT_RATIO, // カードのアスペクト比
    defaultSpacing: 8,
    baseColumns: 5,
};

// アーカイブリスト画面（アーカイブ）
export const ArchiveListGridSettings: GridSettings = {
    minColumns: 2,
    maxColumns: 10,
    defaultColumns: COMMON_DEFAULT_COLUMNS,
    aspectRatio: CARD_ASPECT_RATIO,
    defaultSpacing: 8,
    baseColumns: 5,
};