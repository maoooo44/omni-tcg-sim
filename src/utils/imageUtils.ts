/**
 * src/utils/imageUtils.ts
 * 
 * 画像表示に関する汎用ユーティリティ関数群。
 * プレースホルダー生成ロジックは placeholderUtils.ts に委譲し、ここでは最終的な表示URLの決定を担う。
 */

// placeholderUtilsからプレースホルダー生成関数をインポート
import { createPlaceholderUrl } from './placeholderUtils'; 

// 共通で使うサイズ定数
export const DEFAULT_CARD_PREVIEW_WIDTH = 300;
export const DEFAULT_CARD_PREVIEW_HEIGHT = 420;
export const DEFAULT_PACK_DECK_WIDTH = 200;
export const DEFAULT_PACK_DECK_HEIGHT = 280;

/**
 * 画像表示に必要な情報をまとめた型
 */
export interface ImageDisplayOptions {
    width: number;           // 画像の幅 (px)
    height: number;          // 画像の高さ (px)
    text: string;            // プレースホルダーに表示するテキスト
    imageColor?: string; // プレースホルダーの色プリセットキー
}


/**
 * 指定された画像URLを取得します。URLがない場合は、カスタマイズ可能なプレースホルダーURLを返します。
 * @param imageUrl - モデル（Card, Pack, Deckなど）に定義された画像URL
 * @param options - プレースホルダー生成に必要なオプション
 * @returns 実際の画像URL、またはプレースホルダーURL
 */
export const getDisplayImageUrl = (
    imageUrl: string | undefined | null,
    options: ImageDisplayOptions
): string => {
    
    // 1. imageUrlが有効であればそれを返す
    // null/undefinedのチェック後、trim()して空文字列かチェック
    const isValidUrl = imageUrl && imageUrl.trim() !== '';
    
    if (isValidUrl) {
        return imageUrl.trim(); // 念のためトリムして返す
    }

    // 2. 有効なURLがない場合、createPlaceholderUrlを呼び出す (責務の分離)
    const placeholderUrl = createPlaceholderUrl(
        options.width,
        options.height,
        options.text,
        options.imageColor // 💡 修正2: options.imgColorPresetKey から options.imageColor に変更
    );
    
    return placeholderUrl;
};