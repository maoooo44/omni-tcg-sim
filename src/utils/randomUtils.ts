/**
 * src/utils/randomUtils.ts
 *
 * * ランダム抽選に関する汎用ユーティリティモジュール。
 * 主な責務は、アプリケーションのドメイン（パック、カードなど）に依存しない、
 * 確率計算ロジック（累積確率法による重み付け抽選）を提供することです。
 *
 * * 責務:
 * 1. 重み付け抽選に使用するアイテムの型定義（WeightedItem）を提供する。
 * 2. 累積確率法に基づき、重み付けされたアイテムのリストから一つを選択する汎用関数を提供する（selectWeightedItem）。
 * 3. 浮動小数点誤差に対応した、堅牢な抽選ロジックを実装する。
 */

// 汎用的な設定型を定義
export interface WeightedItem {
    key: string;           // 結果を識別するためのキー（例: レアリティ名）
    probability: number;   // 抽選確率 (0.0 から 1.0 の間)
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
    // (確率の合計が 1.0 に満たない、またはわずかに超過した場合でも必ず何かを返す)
    return weightedItems[weightedItems.length - 1].key;
};