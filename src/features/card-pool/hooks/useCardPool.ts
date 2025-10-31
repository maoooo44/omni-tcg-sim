/**
 * src/features/card-pool/hooks/useCardPool.ts
 *
 * * CardPoolStoreのZustandストアから特定の状態（ownedCards）を取得し、UIコンポーネントに提供するためのカスタムフック。
 * * 責務:
 * 1. CardPoolStoreの初期化とコンテキストの確立（useCardPoolStoreの呼び出しによる）。
 * 2. 状態（ownedCards）をフックとしてエクスポートし、UI層とStore層の間のアダプターとして機能する。
 * 3. 状態のセレクターとして機能し、コンポーネントの再レンダリングを最適化する。
 */

import { useCardPoolStore } from '../../../stores/cardPoolStore';

export const useCardPool = () => {

    const ownedCards = useCardPoolStore(state => state.ownedCards);

    return { ownedCards };
};