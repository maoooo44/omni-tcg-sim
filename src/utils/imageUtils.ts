/**
 * src/utils/imageUtils.ts (最終統合版)
 *
 * * 画像表示、プレースホルダー生成、画像合成、共通サイズ定数に関する全てのユーティリティモジュール。
 */
import type { Card } from '../models/models'; // Card型がimageCompositorから必要

// =================================================================
// I. 共通サイズ定数
// =================================================================

export const DEFAULT_CARD_PREVIEW_WIDTH = 378;
export const DEFAULT_CARD_PREVIEW_HEIGHT = 528;
export const DEFAULT_PACK_DECK_WIDTH = 189;
export const DEFAULT_PACK_DECK_HEIGHT = 264;

// 画像の種別を定義
export type ImageType = 'card' | 'pack_deck';

// =================================================================
// II. プレースホルダー関連のロジック
// =================================================================

// (PlaceholderColor, PLACEHOLDER_COLOR_PRESETS の定義は省略 - 前回の回答を参照)
export interface PlaceholderColor { bgColor: string; textColor: string; }
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
}


/**
 * 画像URLがない場合に表示するプレースホルダーのURLを生成します。
 */
const createPlaceholderUrl = (
    width: number,
    height: number,
    text: string = 'No Image',
    presetKey: string = 'default'
): string => {
    // (ロジックは省略 - 前回の回答を参照)
    const normalizedKey = presetKey.toLowerCase();
    const colorConfig = PLACEHOLDER_COLOR_PRESETS[normalizedKey] || PLACEHOLDER_COLOR_PRESETS['default'];
    const encodedText = encodeURIComponent(text);
    return `https://placehold.jp/48/${colorConfig.bgColor}/${colorConfig.textColor}/${width}x${height}.png?text=${encodedText}`;
};

// =================================================================
// III. 最終表示画像URLの決定ロジック (getDisplayImageUrl)
// =================================================================

export interface ImageDisplayOptions {
    text: string;           
    imageColor?: string;    
    width?: number;         
    height?: number;        
    type?: ImageType;       
}

export const getDisplayImageUrl = (
    imageUrl: string | undefined | null,
    options: ImageDisplayOptions
): string => {
    const isValidUrl = imageUrl && imageUrl.trim() !== '';
    if (isValidUrl) {
        return imageUrl.trim();
    }
    
    // type に基づいてデフォルトの幅と高さを決定 (ロジックは省略)
    let defaultW: number;
    let defaultH: number;
    switch (options.type) {
        case 'pack_deck':
            defaultW = DEFAULT_PACK_DECK_WIDTH;
            defaultH = DEFAULT_PACK_DECK_HEIGHT;
            break;
        case 'card':
        default:
            defaultW = DEFAULT_CARD_PREVIEW_WIDTH;
            defaultH = DEFAULT_CARD_PREVIEW_HEIGHT;
            break;
    }

    const finalWidth = options.width ?? defaultW;
    const finalHeight = options.height ?? defaultH;

    // 💡 修正箇所: options.imageColor が undefined/null の場合は 'default' をフォールバックとして渡す
    const colorPresetKey = options.imageColor || 'default';

    return createPlaceholderUrl(finalWidth, finalHeight, options.text, colorPresetKey);
};


// =================================================================
// IV. 画像合成ロジック (旧 imageCompositor.ts)
// =================================================================

export interface CompositeImageOptions {
    /** キャンバスの幅 */
    width: number;
    /** キャンバスの高さ */
    height: number;
    /** サブ画像の幅 */
    subWidth: number;
    /** サブ画像の高さ */
    subHeight: number;
    /** サブ画像間の隙間 */
    subGap: number;
    /** 画像端からのマージン */
    subMargin: number;
    /** フォールバック用の画像色 */
    fallbackImageColor?: string;
    /** フォールバック用のテキスト */
    fallbackText?: string;
}

/**
 * メイン画像とサブ画像を合成する
 */
export const createCompositeImage = async (
    mainCard: Card | undefined,
    subCards: (Card | undefined)[],
    options: CompositeImageOptions
): Promise<string> => {
    const {
        width, height, subWidth, subHeight, subGap, subMargin,
        fallbackImageColor, fallbackText = '画像未設定'
    } = options;

    // メインカードがない場合はプレースホルダーを返す (type: 'pack_deck' を使用)
    if (!mainCard) {
        return getDisplayImageUrl(undefined, {
            imageColor: fallbackImageColor,
            text: fallbackText,
            type: 'pack_deck' 
        });
    }

    // Canvas APIを使って合成画像を生成
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
        // Canvas未サポート時はメインカードのURLを返す (type: 'pack_deck' を使用)
        return getDisplayImageUrl(mainCard.imageUrl, {
            imageColor: mainCard.imageColor,
            text: mainCard.name,
            type: 'pack_deck'
        });
    }

    return new Promise<string>((resolve) => {
        const mainImg = new Image();
        mainImg.crossOrigin = 'anonymous';

        // メイン画像URLの生成 (type: 'pack_deck' を使用)
        const mainImageUrl = getDisplayImageUrl(mainCard.imageUrl, {
            imageColor: mainCard.imageColor,
            text: mainCard.name,
            type: 'pack_deck'
        });

        mainImg.onload = () => {
            ctx.drawImage(mainImg, 0, 0, width, height);

            const subBottom = height - subMargin;
            const subRight = width - subMargin;
            const validSubCards = subCards.filter((card): card is Card => card !== undefined);

            if (validSubCards.length === 0) {
                resolve(canvas.toDataURL());
                return;
            }

            // ... (サブ画像の配置計算ロジックは省略) ...
            const subImagePositions: { card: Card; x: number; y: number }[] = [];
            // ... (配置計算ロジックを実装) ...
            if (validSubCards.length === 1) {
                subImagePositions.push({ card: validSubCards[0], x: subRight - subWidth, y: subBottom - subHeight });
            } else {
                 validSubCards.forEach((card, index) => {
                     const reverseIndex = validSubCards.length - 1 - index;
                     subImagePositions.push({
                         card,
                         x: subRight - subWidth * (reverseIndex + 1) - subGap * reverseIndex,
                         y: subBottom - subHeight
                     });
                 });
             }
            // ...

            let loadedCount = 0;
            const totalSubs = subImagePositions.length;

            subImagePositions.forEach(({ card, x, y }) => {
                const subImg = new Image();
                subImg.crossOrigin = 'anonymous';

                // サブ画像URLの生成 (type: 'card' を使用)
                const subImageUrl = getDisplayImageUrl(card.imageUrl, {
                    imageColor: card.imageColor,
                    text: card.name,
                    type: 'card' // 💡 サブカードはCardのデフォルトサイズを使用
                });

                subImg.onload = () => {
                    ctx.strokeStyle = '#ffffff';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(x, y, subWidth, subHeight);
                    ctx.drawImage(subImg, x, y, subWidth, subHeight);
                    loadedCount++;
                    if (loadedCount === totalSubs) resolve(canvas.toDataURL());
                };

                subImg.onerror = () => {
                    loadedCount++;
                    if (loadedCount === totalSubs) resolve(canvas.toDataURL());
                };

                subImg.src = subImageUrl;
            });
        };

        mainImg.onerror = () => {
            // メイン画像のロード失敗時はプレースホルダーを返す (type: 'pack_deck' を使用)
            const errorUrl = getDisplayImageUrl(undefined, {
                imageColor: fallbackImageColor,
                text: '画像読み込みエラー',
                type: 'pack_deck'
            });
            resolve(errorUrl);
        };

        mainImg.src = mainImageUrl;
    });
};