// src/models/card.ts
/**
 * 収録カードの情報に関する型定義
 */
export interface Card {
  cardId: string; // カードID (パック内でユニークな連番 + パックIDで一意)
  packId: string; // 収録されているパックID
  name: string;
  imageUrl: string; // カード画像の参照URL
  rarity: string; // 収録されているレアリティ名 (Pack.rarityConfig.rarityNameに対応)
  userCustom: Record<string, any>; // ユーザーカスタムデータ（属性、コスト、テキストなど）
}
