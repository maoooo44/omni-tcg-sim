/**
 * src/models/grid.ts (型定義ファイル)
 * * Grid表示に関する型定義
 */
// GridBreakpointsの定義は、このファイルか、より汎用的な場所に移動
export type GridBreakpoints = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

/**
 * @description リスト表示設定の全体定定義
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
  /** 💡 基準列数におけるアイテム間の余白（px単位）。列数に応じて比例的に調整される。 */
  defaultSpacing: number;
  /** 💡 defaultSpacingが適用される基準列数。この列数のときにdefaultSpacingの余白が使用される。 */
  baseColumns: number;
}