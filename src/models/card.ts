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
    name: string; // 
    number?: number | null;  // 図鑑ナンバー/ソート順として使用
    imageUrl: string; // カード画像の参照URL
    imageColor?: string; //プレースホルダーの色プリセットキー
    rarity: string; // 収録されているレアリティ名（Pack.rarityConfig.rarityNameに対応）
    isFavorite: boolean;
    createdAt: string; // ISO 8601形式の作成日時
    updatedAt: string; // ISO 8601形式の最終更新日時

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