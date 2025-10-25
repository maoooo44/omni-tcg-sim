/**
* src/models/packOpener.ts
*
* PackOpenerAnimation や OpenerCard など、パック開封機能の各コンポーネントが使用する、
* 開封されたカードのアニメーション表示に特化したデータ構造を定義します。
* この型は、コアモデルの Card とは異なり、アニメーション表示に必要なユニークなインスタンスIDと
* 表示用の画像URLのみを含み、機能間の責任を分離しています。
*/

// import type { Card } from '../../models/card'; // Card型が直接利用されていないため削除

/**
 * PackOpenerAnimation および OpenerCard が使用する、
 * 開封されたカードのアニメーション表示用データ構造。
 * Cardモデルに基づきつつ、ユニークなインスタンスIDと表示用URLを含みます。
 */
export interface OpenerCardData {
    id: string; // ユニークな開封インスタンスID (複数の同一カードを区別)
    cardId: string; // カード定義ID (Card.cardIdに対応)
    name: string;
    imageUrl: string; // 表示用の最終的な画像URL (プレースホルダーに変換済みの場合もある)
    rarity: string;
    imageColor?: string; // プレースホルダー色情報を含める
    cardBackImageUrl?: string; // 💡 追加: パックの裏面画像URL
}// 他の開封機能関連の型もここに追加されることが期待されます。

// 警告ロジック対応のため、新しいシミュレーション結果の型を定義
export interface SimulationResult {
    results: { cardId: string, count: number }[];
    simulationWarning: string | null;
}

// lastOpenedResults の型定義にユニークIDを含める
export interface OpenedResultState {
    id: string; // 毎回ユニークなIDを持たせることで、ReactのuseEffectが確実に発火することを保証
    results: { cardId: string, count: number }[];
}
