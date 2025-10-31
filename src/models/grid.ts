/**
 * src/models/grid.ts
 *
 * * UIのグリッド表示およびリスト表示設定に関連するデータ構造と型定義を格納するモデル層モジュール。
 * 画面サイズごとのブレークポイント、およびユーザーが設定可能なグリッド表示のパラメータ群（列数、アスペクト比、間隔など）を定義します。
 *
 * * 責務:
 * 1. 画面ブレークポイントの型（GridBreakpoints）を定義する。
 * 2. グリッド表示のカスタマイズ設定（GridSettings）のデータ構造を定義する。
 * 3. グリッドのレイアウト計算に必要なパラメータ（aspectRatio, defaultSpacing, baseColumns）を定義する。
 */
// GridBreakpointsの定義は、このファイルか、より汎用的な場所に移動
export type GridBreakpoints = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

/**
 * リスト表示設定の全体定定義
 */
export interface GridSettings {
  /** ユーザーが選択可能な列数の最小値 */
  minColumns: number;
  /** ユーザーが選択可能な列数の最大値 */
  maxColumns: number;
  /** 画面サイズに応じたアプリケーションデフォルト列数 (数値) */
  defaultColumns: Partial<Record<GridBreakpoints, number>>;
  /** アイテム（画像など）の推奨アスペクト比。CSSの aspect-ratio プロパティに使用。 */
  aspectRatio: number;
  /** 基準列数におけるアイテム間の余白（px単位）。列数に応じて比例的に調整される。 */
  defaultSpacing: number;
  /** defaultSpacingが適用される基準列数。この列数のときにdefaultSpacingの余白が使用される。 */
  baseColumns: number;
}