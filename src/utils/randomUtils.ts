/**
* src/utils/randomUtils.ts
* 
* ランダム抽選に関する汎用ユーティリティ関数。
*/

// 汎用的な設定型を定義（どのレアリティ設定でも使用できるよう Pack から切り離す）
export interface WeightedItem {
  key: string;      // 結果を識別するためのキー（例: レアリティ名）
  probability: number; // 抽選確率 (0.0 から 1.0 の間)
}

/**
* 累積確率法に基づき、重み付けされたアイテムのリストから一つを選択する。
* 汎用的なロジックであり、アプリケーション全体で再利用可能。
* @param weightedItems - 確率設定オブジェクトの配列（確率の合計は1.0であること）
* @returns 抽選によって決定されたアイテムのキー (string)
*/
export const selectWeightedItem = (weightedItems: WeightedItem[]): string => {
  // 0.0 以上 1.0 未満の乱数を生成
  const randomNumber = Math.random();
  let cumulativeProbability = 0;

  for (const item of weightedItems) {
    // 確率を加算 (累積)
    cumulativeProbability += item.probability;

    // 乱数が累積確率の閾値以下であれば、そのアイテムが当選
    if (randomNumber < cumulativeProbability) {
      return item.key;
    }
  }

  // 浮動小数点誤差対策として、最後のアイテムを返す
  return weightedItems[weightedItems.length - 1].key;
};