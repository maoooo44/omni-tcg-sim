// src/models/pack.ts
/**
 * パックの情報に関する型定義
 */
export type PackType = 'Booster' | 'ConstructedDeck' | 'Other';

export interface RarityConfig {
  rarityName: string; // 例: 'Common', 'Rare'
  probability: number; // 封入確率 (0.0 から 1.0 の間)
}

export interface Pack {
  packId: string; // パックID (ユニークID, 自動生成)
  name: string;
  series: string; // TCGシリーズ名
  packType: PackType;
  cardsPerPack: number; // 1パックあたりの封入枚数
  rarityConfig: RarityConfig[]; // レアリティと封入確率の配列
  totalCards: number; // 収録カード総数 (自動集計)
  imageUrl: string; // 拡張パック画像の参照URL
  cardBackUrl: string; // カード裏面画像の参照URL
  price: number; // ゲーム内通貨での価格
  description: string;
  // 💡 新規追加: 開封済みフラグ
  isOpened: boolean;
  releaseDate: string; // ISO 8601形式の発売日
  userCustom: Record<string, any>; // ユーザーカスタムデータ（レギュレーションなど）
}