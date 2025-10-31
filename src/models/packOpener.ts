/**
 * src/models/packOpener.ts
 *
 * * パック開封機能（PackOpenerAnimationやOpenerCardなど）が使用する、アニメーション表示に特化したデータ構造を定義するモデル層モジュール。
 * この型定義は、コアモデルの Card とは異なり、アニメーション表示に必要な最小限のデータとユニークなインスタンスIDのみを含み、
 * UIコンポーネントとコアデータロジック間の責任を明確に分離します。
 *
 * * 責務:
 * 1. 開封されたカードのアニメーション表示に必要なデータ構造（OpenerCardData）を定義する。
 * 2. 開封シミュレーションの結果と警告情報を格納する構造（SimulationResult）を定義する。
 * 3. 開封履歴や状態管理に必要な結果の構造（OpenedResultState）を定義する。
 */

/**
 * PackOpenerAnimation および OpenerCard が使用する、
 * 開封されたカードのアニメーション表示用データ構造。
 */
export interface OpenerCardData {
    id: string;
    cardId: string;
    name: string;
    imageUrl: string;
    rarity: string;
    imageColor?: string;
    cardBackImageUrl?: string;
}

// 警告ロジック対応のため、新しいシミュレーション結果の型を定義
export interface SimulationResult {
    results: { cardId: string, count: number }[];
    simulationWarning: string | null;
}

// lastOpenedResults の型定義にユニークIDを含める
export interface OpenedResultState {
    id: string;
    results: { cardId: string, count: number }[];
}