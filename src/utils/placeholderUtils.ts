/**
 * src/utils/placeholderUtils.ts
 *
 * * 画像URLがない場合に表示するプレースホルダーURLを生成するユーティリティモジュール。
 * 主な責務は、外部サービス（placehold.jp）のURL形式を管理し、サイズ、表示テキスト、色情報に基づいて
 * 適切なプレースホルダー画像URLを生成することです。また、プレースホルダーの色プリセット定義を提供します。
 *
 * * 責務:
 * 1. プレースホルダーに使用する色プリセットの型定義（PlaceholderColor）と実際の定義（PLACEHOLDER_COLOR_PRESETS）を提供する。
 * 2. プレースホルダーの生成に必要な情報（幅、高さ、テキスト、色キー）を受け取り、外部サービスのURL形式に変換して返す（createPlaceholderUrl）。
 * 3. 存在しない色キーが渡された場合に、安全にデフォルト色にフォールバックするロジックを提供する。
 */

// 1. カラープリセットの型定義
export interface PlaceholderColor {
    bgColor: string;   // 背景色 (6桁のHEXコード, 例: "ff4444")
    textColor: string; // 文字色 (6桁のHEXコード, 例: "ffffff")
}

// 2. カラープリセットの定義
// 背景色よりも濃い同系色を文字色に設定します。
export const PLACEHOLDER_COLOR_PRESETS: Record<string, PlaceholderColor> = {
    // デフォルト: 明るいグレー (変更なし)
    'default': { bgColor: 'cccccc', textColor: '888888' },

    // 一般的な色名 (文字色を同系色の濃い色に修正)
    'red': { bgColor: 'e74c3c', textColor: 'c0392b' },       // 赤系
    'blue': { bgColor: '3498db', textColor: '2980b9' },      // 青系
    'green': { bgColor: '2ecc71', textColor: '27ae60' },     // 緑系
    'yellow': { bgColor: 'f1c40f', textColor: 'd4ac0d' },    // 黄色系
    'purple': { bgColor: '9b59b6', textColor: '8e44ad' },    // 紫系
    'black': { bgColor: '34495e', textColor: '2c3e50' },     // 濃い灰色系
    'white': { bgColor: 'ecf0f1', textColor: 'bdc3c7' },     // 明るい灰色系

    // 🌟 追加色
    'brown': { bgColor: 'a0522d', textColor: '8b4513' },     // 茶色系
    'pink': { bgColor: 'ff9ff3', textColor: 'f368e0' },      // ピンク系
};

/**
 * 画像URLがない場合に表示するプレースホルダーのURLを生成します。
 * placehold.jp サービスを利用します。
 * @param width - 画像の幅 (px)
 * @param height - 画像の高さ (px)
 * @param text - 画像に表示するテキスト
 * @param presetKey - 使用する色のプリセットキー (未指定時は'default')
 * @returns 生成されたプレースホルダーURL
 */
export const createPlaceholderUrl = (
    width: number,
    height: number,
    text: string = 'No Image',
    presetKey: string = 'default'
): string => {

    // プリセットから色を取得。キーが存在しない場合は 'default' を使用
    const normalizedKey = presetKey.toLowerCase();
    const colorConfig = PLACEHOLDER_COLOR_PRESETS[normalizedKey] || PLACEHOLDER_COLOR_PRESETS['default'];

    const encodedText = encodeURIComponent(text);

    // 形式: https://placehold.jp/{文字サイズ}/{背景色}/{文字色}/{幅}x{高さ}.png?text={テキスト}
    const url = `https://placehold.jp/48/${colorConfig.bgColor}/${colorConfig.textColor}/${width}x${height}.png?text=${encodedText}`;

    return url;
};