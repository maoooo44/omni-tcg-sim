// src/utils/imageUtils.ts (修正案)

// placeholderUtilsからプレースホルダー生成関数をインポート
import { createPlaceholderUrl } from './placeholderUtils'; 

// src/utils/imageUtils.ts に追加されている必要がある定数:
export const DEFAULT_CARD_PREVIEW_WIDTH = 300;
export const DEFAULT_CARD_PREVIEW_HEIGHT = 420;

/**
 * 画像表示に必要な情報をまとめた型
 */
export interface ImageDisplayOptions {
  width: number;           // 画像の幅 (px)
  height: number;          // 画像の高さ (px)
  text: string;            // プレースホルダーに表示するテキスト
  // 💡 修正: imgColorPresetKey を追加し、bgColor を削除
  imgColorPresetKey?: string; // プレースホルダーの色プリセットキー (例: 'red', 'blue')
}

// 共通で使うサイズ定数 (PackListPageで利用)
export const DEFAULT_PACK_DECK_WIDTH = 200;
export const DEFAULT_PACK_DECK_HEIGHT = 280;

/**
 * 指定された画像URLを取得します。URLがない場合は、カスタマイズ可能なプレースホルダーURLを返します。
 * * @param imageUrl - モデル（Card, Pack, Deckなど）に定義された画像URL
 * @param options - プレースホルダー生成に必要なオプション
 * @returns 実際の画像URL、またはプレースホルダーURL
 */
export const getDisplayImageUrl = (
  imageUrl: string | undefined | null,
  options: ImageDisplayOptions
): string => {
  
  // デバッグ用: 入力値の確認
  console.log(`[ImageUtils Debug] Input imageUrl: '${imageUrl}' (Type: ${typeof imageUrl})`);

  // 1. imageUrlが有効であればそれを返す
  // null/undefinedのチェック後、trim()して空文字列かチェック
  const isValidUrl = imageUrl && imageUrl.trim() !== '';
  
  // デバッグ用: 有効性の判定結果
  console.log(`[ImageUtils Debug] Is URL valid? ${isValidUrl}`);

  if (isValidUrl) {
    // デバッグ用: 有効なURLを返却
    console.log(`[ImageUtils Debug] Output: Original URL`);
    return imageUrl.trim(); // 念のためトリムして返す
  }

  // 2. 有効なURLがない場合、createPlaceholderUrlを呼び出す (責務の分離)
  const placeholderUrl = createPlaceholderUrl(
    options.width,
    options.height,
    options.text,
    options.imgColorPresetKey // 💡 修正: プリセットキーを渡す
  );
  
  // デバッグ用: プレースホルダーURLを返却
  console.log(`[ImageUtils Debug] Output: Placeholder URL -> ${placeholderUrl}`);
  
  return placeholderUrl;
};