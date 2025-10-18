/**
 * src/features/card-pool/hooks/useCardPool.ts
 * 
 * カードプールZustandストアのコンテキストをアプリケーションルートで確立するためのカスタムHook。
 * このHookを呼び出すことで、ストアが初期化され、その状態がアプリケーション全体で利用可能になります。
 * データの初期ロードは useInitialLoad フックに、データの永続化は cardPoolStore のアクションに委譲されています。
 */

import { useCardPoolStore } from '../../../stores/cardPoolStore';
// 🚨 削除: useShallow は不要になりました

export const useCardPool = () => {
    
    // 💡 修正: useShallow を使用せず、直接 ownedCards の状態を取得
    const ownedCards = useCardPoolStore(state => state.ownedCards);
    
    // 💡 修正: useShallow のインポートも不要になる

    // 外部で利用される可能性があるため、ownedCards を返すのは維持
    return { ownedCards }; 
};