/**
 * src/models/card.ts
 *
 * TCG Builderアプリケーションで使用される「収録カード」のデータ構造を定義する型です。
 * この型は、パックに収録され、ユーザーがデッキ構築やプール管理を行う対象となる
 * 個々のカードデータを表現します。
 */
export interface Card {
  cardId: string; // カードの一意な識別子
  packId: string; // 収録されているパックのID
  name: string; // カードの名称
  imageUrl: string; // カード画像の参照URL
  rarity: string; // 収録されているレアリティ名（Pack.rarityConfig.rarityNameに対応）
  userCustom: Record<string, any>; // ユーザーが定義できるカスタムデータ（属性、コスト、テキストなど）
  
  /**
   * 💡 追加: カードがパックに追加された際の連番（不変の登録順）
   * この順序がデフォルトの表示順として使用されます。
   */
  registrationSequence: number;
}