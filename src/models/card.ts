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
    text: string;
    subtext: string;
    isFavorite: boolean;
    createdAt: string; // ISO 8601形式の作成日時
    updatedAt: string; // ISO 8601形式の最終更新日時

    num_1?: number | null; 
    num_2?: number | null;
    num_3?: number | null; 
    num_4?: number | null; 
    num_5?: number | null; 
    num_6?: number | null; 
    str_1?: string; 
    str_2?: string; 
    str_3?: string; 
    str_4?: string; 
    str_5?: string;
    str_6?: string;
    
    /** ユーザー定義のタグ/その他の属性。カスタムフィールドの代わり。 */
    tag?: Record<string, string>;
    /** 全文検索用の連結文字列（tagを結合） */
    searchText?: string;
}
