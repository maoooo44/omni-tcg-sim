/**
 * src/utils/placeholderUtils.ts
 * 
 * 画像URLがない場合に表示するプレースホルダーURLを生成するユーティリティ。
 * 外部サービス (placehold.jp) のURL形式管理と、汎用的な色プリセットを提供する。
 */

// 1. カラープリセットの型定義
export interface PlaceholderColor {
    bgColor: string;   // 背景色 (6桁のHEXコード, 例: "ff4444")
    textColor: string; // 文字色 (6桁のHEXコード, 例: "ffffff")
}

// 2. カラープリセットの定義
// Card, Pack, Deckのカスタムデータに保存するキーに対応します。
export const PLACEHOLDER_COLOR_PRESETS: Record<string, PlaceholderColor> = {
    // デフォルト: 明るいグレー (cccccc)
    'default': { bgColor: 'cccccc', textColor: '000000' }, 
    
    // 一般的な色名
    'red': { bgColor: 'e74c3c', textColor: 'ffffff' },      
    'blue': { bgColor: '3498db', textColor: 'ffffff' },     
    'green': { bgColor: '2ecc71', textColor: 'ffffff' },    
    'yellow': { bgColor: 'f1c40f', textColor: '000000' },   
    'purple': { bgColor: '8e44ad', textColor: 'ffffff' },   
    'black': { bgColor: '34495e', textColor: 'ffffff' },    
    'white': { bgColor: 'ecf0f1', textColor: '000000' },    
};

/**
 * 画像URLがない場合に表示するプレースホルダーのURLを生成します。
 * placehold.jp サービスを利用します。
 * @param width - 画像の幅 (px)
 * @param height - 画像の高さ (px)
 * @param text - 画像に表示するテキスト (例: "No Image")
 * @param presetKey - 使用する色のプリセットキー (PLACEHOLDER_COLOR_PRESETSのキー。未指定時は'default')
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
    
    // 形式: https://placehold.jp/{幅}x{高さ}.png?text={テキスト}&bg={背景色}&fg={文字色}
    const url = `https://placehold.jp/${width}x${height}.png?text=${encodedText}&bg=${colorConfig.bgColor}&fg=${colorConfig.textColor}`;
    
    return url;
};