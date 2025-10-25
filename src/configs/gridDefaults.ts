/**
 * src/configs/gridDefaults.ts
 * * GridSettingsの具体的なインスタンスを定義
 */
import type { GridSettings } from '../models/grid'; // (上記で定義済み)

// CardPoolの設定値
// カードプール画面（カード）
export const CardPoolGridSettings: GridSettings = {
  minColumns: 1,
  maxColumns: 20,
  defaultColumns: {
    xs: 2,
    sm: 3,
    md: 4,
    lg: 5,
    xl: 6,
  },
  aspectRatio: 63 / 88,
  defaultSpacing: 8, // 💡 基準列数（5列）のときの余白（px）
  baseColumns: 5,     // 💡 この列数のときにdefaultSpacing=16pxが適用される
};

// パックリスト画面（パック）
export const PackListGridSettings: GridSettings = {
  minColumns: 2,
  maxColumns: 10,
  defaultColumns: {
    xs: 2,
    sm: 3,
    md: 4,
    lg: 5,
    xl: 6,
  },
  aspectRatio: 63 / 88,
  defaultSpacing: 16,
  baseColumns: 5,
};

// パック編集画面（カード）
export const PackEditorCardGridSettings: GridSettings = {
  minColumns: 2,
  maxColumns: 20,
  defaultColumns: {
    xs: 2,
    sm: 3,
    md: 4,
    lg: 5,
    xl: 6,
  },
  aspectRatio: 63 / 88,
  defaultSpacing: 16,
  baseColumns: 5,
};

// デッキリスト画面（デッキ）
export const DeckListGridSettings: GridSettings = {
  minColumns: 2,
  maxColumns: 10,
  defaultColumns: {
    xs: 2,
    sm: 3,
    md: 4,
    lg: 5,
    xl: 6,
  },
  aspectRatio: 63 / 88,
  defaultSpacing: 16,
  baseColumns: 5,
};

// デッキ編集画面（カード）
export const DeckEditorCardGridSettings: GridSettings = {
  minColumns: 2,
  maxColumns: 20,
  defaultColumns: {
    xs: 2,
    sm: 3,
    md: 4,
    lg: 5,
    xl: 6,
  },
  aspectRatio: 63 / 88,
  defaultSpacing: 16,
  baseColumns: 5,
};

// パック開封画面（カード）
export const PackOpenerGridSettings: GridSettings = {
  minColumns: 2,
  maxColumns: 10,
  defaultColumns: {
    xs: 3,
    sm: 4,
    md: 5,
    lg: 5,
    xl: 5,
  },
  aspectRatio: 63 / 88, // カードのアスペクト比
  defaultSpacing: 16,
  baseColumns: 5,
};