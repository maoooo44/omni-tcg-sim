/**
 * src/models/pack.ts
 *
 * TCG Builderアプリケーションで使用される「パック」のデータ構造を定義する型です。
 * パック名、価格、封入枚数、レアリティ設定、画像URLなど、パック開封シミュレーションと
 * パック管理に必要なすべてのメタデータが含まれます。
 */

import type { Card } from "./card"; // Cardの型定義は別ファイルからインポート

export type PackType = 'Booster' | 'ConstructedDeck' | 'Other';

export interface RarityConfig {
    rarityName: string; // 例: 'Common', 'Rare'
    probability: number; // 封入確率 (0.0 から 1.0 の間)
}

// 確定枚数ロジック用の新しい設定
export interface AdvancedRarityConfig {
    rarityName: string;
    /**
     * @description [基本確率] 残り枠を埋めるために使用される確率 (合計 1.0)。
     * 従来のRarityConfig.probabilityと同じ役割。
     */
    probability: number; 
    
    /**
     * @description [特殊確率] 特殊抽選スロットで使用される確率 (合計 1.0)。
     */
    specialProbability: number; // ★ NEW: 特殊抽選用の確率

    /**
     * @description パック内のこのレアリティの確定枚数
     */
    fixedValue: number; // 確定枚数
}

export interface DisplaySetting {
    /** ユーザーフレンドリーな表示名 (例: 'マナコスト', '逃げるエネルギー') */
    displayName: string;
    /** 詳細画面などでこのフィールドを表示するかどうか */
    isVisible: boolean;
    /** 表示順序 (オプション) */
    order?: number; 
}

/** カードの標準フィールドの表示設定を定義する型 */
export interface PackFieldSettings {
    num_1: DisplaySetting;
    num_2: DisplaySetting;
    str_1: DisplaySetting;
    str_2: DisplaySetting;
}

/** カードの標準フィールドの表示設定を定義する型 */
export interface CardFieldSettings {
    num_1: DisplaySetting;
    num_2: DisplaySetting;
    num_3: DisplaySetting;
    num_4: DisplaySetting;
    num_5: DisplaySetting;
    num_6: DisplaySetting;
    str_1: DisplaySetting;
    str_2: DisplaySetting;
    str_3: DisplaySetting;
    str_4: DisplaySetting;
    str_5: DisplaySetting;
    str_6: DisplaySetting;
}

export interface Pack {
    packId: string; // パックID (ユニークID, 自動生成)
    name: string;
    number?: number | null;
    imageUrl: string; // 拡張パック画像の参照URL
    imageColor?: string; //プレースホルダーの色プリセットキー
    cardBackImageUrl: string; // カード裏面画像の参照URL
    price: number; // ゲーム内通貨での価格
    packType: PackType;
    cardsPerPack: number; // 1パックあたりの封入枚数
    totalCards: number; // 収録カード総数 (自動集計)
    series: string; // TCGシリーズ名
    description: string;
    isOpened: boolean; // 開封済みフラグ
    isFavorite: boolean;
    createdAt: string;
    updatedAt: string; // ISO 8601形式の最終更新日時

    //確率用
    rarityConfig: RarityConfig[]; // レアリティと封入確率の配列
    advancedRarityConfig?: AdvancedRarityConfig[]; // 高度な確定枚数を含むレアリティ設定
    specialProbabilitySlots: number;
    isAdvancedRulesEnabled: boolean;

    cardPresetId?: string;

    num_1?: number | null;
    num_2?: number | null; 
    str_1?: string;
    str_2?: string;

    packFieldSettings?: PackFieldSettings;
    cardFieldSettings?: CardFieldSettings;

    /** ユーザー定義のタグ/その他の属性。カスタムフィールドの代わり。 */
    tag?: Record<string, string>;
    /** 全文検索用の連結文字列（tagを結合） */
    searchText?: string;
}

export interface PackBundle {
    packData: Pack;     // パック本体のデータ（Pack型）
    cardsData: Card[];  // その時点の関連カードの配列（Card型）
}
