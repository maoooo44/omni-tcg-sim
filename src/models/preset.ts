/**
 * src/models/preset.ts
 *
 * パックやカードのカスタムフィールドなどの設定を一括で管理するためのプリセットデータ構造を定義します。
 * 汎用的な基本構造 (`BasePreset`) を拡張し、パック用 (`PackPreset`) とカードカスタム用 (`CardCustomPreset`)
 * の具体的な型を定義します。
 */

export interface BasePreset {
    id: string;
    name: string;
    createdAt: string;
    updatedAt: string;
}

/**
 * パック設定を保存するためのプリセットデータ構造です。
 * Packモデルから主要な設定項目（レアリティ設定、封入枚数など）を抽出します。
 */
export interface PackPreset extends BasePreset {
    series: string;
    cardsPerPack: number;
    packType: 'Booster' | 'ConstructedDeck' | 'Other';
    imageUrl: string;
    description: string;
    
    rarityConfig: {
        rarityName: string;
        probability: number;
    }[];
}

/**
 * カードのユーザーカスタムフィールドの構造を保存するためのプリセットデータ構造です。
 * カスタムフィールドのキーとそのデフォルト値（通常は空文字列）を定義します。
 */
export interface CardCustomPreset extends BasePreset {
    // userCustomのキーと値を保持（値は空文字列で保存し、フィールド定義用として扱う）
    customFields: Record<string, string>;
}

export type Preset = PackPreset | CardCustomPreset;