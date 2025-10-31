/**
 * src/utils/imageUtils.ts
 *
 * * 画像表示に関する汎用ユーティリティモジュール。
 * 主な責務は、モデルに設定された画像URLの有効性をチェックし、有効な場合はそのURLを、
 * 無効な場合はカスタマイズされたプレースホルダー画像を生成するためのURLを返すことです。
 * プレースホルダー生成の具体的なロジック（URLの構成）は、外部モジュール（placeholderUtils）に委譲しています。
 *
 * * 責務:
 * 1. カード、パック、デッキのプレビューに使用する共通の寸法定数を定義する。
 * 2. 最終的に表示すべき画像URLを決定する（getDisplayImageUrl）。
 * 3. 画像URLがnull/undefined/空文字列の場合に、プレースホルダー生成モジュールを呼び出す。
 */

// placeholderUtilsからプレースホルダー生成関数をインポート
import { createPlaceholderUrl } from './placeholderUtils';

// 共通で使うサイズ定数
export const DEFAULT_CARD_PREVIEW_WIDTH = 378;
export const DEFAULT_CARD_PREVIEW_HEIGHT = 528;
export const DEFAULT_PACK_DECK_WIDTH = 200;
export const DEFAULT_PACK_DECK_HEIGHT = 280;

/**
 * 画像表示に必要な情報をまとめた型
 * 【修正点】widthとheightをオプショナル(?)に変更
 */
export interface ImageDisplayOptions {
    width?: number;          // 画像の幅 (px) - オプショナルに変更
    height?: number;         // 画像の高さ (px) - オプショナルに変更
    text: string;            // プレースホルダーに表示するテキスト
    imageColor?: string;     // プレースホルダーの色プリセットキー
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

    // 【追加ロジック】幅と高さがオプションで渡されなかった場合、デフォルト値を使用する
    // ただし、このユーティリティがCard/Pack/Deckのどれに使われるか不明なため、
    // ここではCard Previewのデフォルト値をフォールバックとして使用します。
    // ※ PackCardItemで使用する場合は、Pack/Deckのデフォルト値を適用するために、
    // 呼び出し側で width/height を渡すか、この関数に type 引数を追加する必要がありますが、
    // 今回は CardModal での利用を考慮して Card Preview のデフォルトを適用します。
    // PackCardItem側で width/height を渡す前提を崩さないため、ここではオプション処理のみに留めます。

    const finalWidth = options.width ?? DEFAULT_CARD_PREVIEW_WIDTH;
    const finalHeight = options.height ?? DEFAULT_CARD_PREVIEW_HEIGHT;

    // 2. 有効なURLがない場合、createPlaceholderUrlを呼び出す (責務の分離)
    const placeholderUrl = createPlaceholderUrl(
        finalWidth,   // デフォルト値または渡された値
        finalHeight,  // デフォルト値または渡された値
        options.text,
        options.imageColor
    );

    return placeholderUrl;
};