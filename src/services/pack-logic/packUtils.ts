// src/services/pack-logic/packUtils.ts

/**
 * パックデータに関連するロジックを提供するユーティリティ関数群。
 * 主にパック固有のビジネスロジック（計算など）を扱う。
 */
import type { Pack } from "../../models/pack"; 
// 🚨 generatePackId は削除 (データ生成は汎用的な dataUtils の責務に含める)


/**
 * パックデータに含まれる全てのユニークカード総数（Pack.totalCards）を計算する。（現状スタブ）
 * @param {Pack} _pack - 計算対象のパックオブジェクト
 * @returns {number} 総収録カード数
 */
export const calculateTotalCards = (_pack: Pack): number => {
    // フェーズ1後半またはフェーズ2で、DBから紐づくカードをカウントするロジックを実装します。
    return 0;
};
// 🚨 createDefaultPack は削除 (dataUtils.tsに移行済み)

// 💡 備考: このファイルから generatePackId と createDefaultPack が削除されたことで、
// packUtils.ts がこの段階では calculateTotalCards のスタブのみを持つファイルになります。
// これは関心の分離ができた証拠です。