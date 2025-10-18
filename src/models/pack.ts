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
    releaseDate: string; // ISO 8601形式の発売日
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

    // ⬇️ ★ 修正: 統一されたカスタムインデックス30枠を追加（アプリケーションモデル）
    // DBへの永続化と高速なフィルタリング・ソートのために利用されるフィールド

    // ブール値カスタムインデックス (10枠)
    custom_1_bool?: boolean;
    custom_2_bool?: boolean;
    custom_3_bool?: boolean;
    custom_4_bool?: boolean;
    custom_5_bool?: boolean;
    custom_6_bool?: boolean;
    custom_7_bool?: boolean;
    custom_8_bool?: boolean;
    custom_9_bool?: boolean;
    custom_10_bool?: boolean;
    
    // 数値カスタムインデックス (10枠)
    custom_1_num?: number;
    custom_2_num?: number;
    custom_3_num?: number;
    custom_4_num?: number;
    custom_5_num?: number;
    custom_6_num?: number;
    custom_7_num?: number;
    custom_8_num?: number;
    custom_9_num?: number;
    custom_10_num?: number;

    // 文字列カスタムインデックス (10枠)
    custom_1_str?: string;
    custom_2_str?: string;
    custom_3_str?: string;
    custom_4_str?: string;
    custom_5_str?: string;
    custom_6_str?: string;
    custom_7_str?: string;
    custom_8_str?: string;
    custom_9_str?: string;
    custom_10_str?: string;

}

export interface PackBundle {
    packData: Pack;     // パック本体のデータ（Pack型）
    cardsData: Card[];  // その時点の関連カードの配列（Card型）
}
