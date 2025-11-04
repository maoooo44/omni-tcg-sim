// src/features/decks/hooks/useKeyCardSelection.ts (修正全文)

import { useState, useCallback, useMemo, useEffect } from 'react';
import type { DeckListItem } from '../../../models/models';

// キーカードに設定できる最大数
const MAX_KEYCARDS = 3;

/**
 * デッキリスト内のカードのキーカード選択状態を管理するフック
 * @param initialCards 選択対象となる DeckListItem の初期リスト
 * @param initialKeyCardIds 既にキーカードとして設定されているカードIDの配列 (keycard_1, keycard_2, keycard_3 の値)
 * @returns 状態と操作関数
 */
export const useKeyCardSelection = (
    initialCards: DeckListItem[] = [],
    initialKeyCardIds: (string | undefined)[] = [],
) => {
    // 選択されたキーカードのカードIDをランク順 (1, 2, 3) で保持
    const [selectedKeyCardIds, setSelectedKeyCardIds] = useState<(string | undefined)[]>(initialKeyCardIds);
    
    // 🟢 修正: initialKeyCardIds が変更されたら state を同期
    useEffect(() => {
        console.log('🔍 useKeyCardSelection - initialKeyCardIds changed:', initialKeyCardIds);
        setSelectedKeyCardIds(initialKeyCardIds);
    }, [initialKeyCardIds]);

    /**
     * キーカードの選択/解除をトグルするハンドラ
     * @param cardId 対象のカードID
     */
    const toggleKeyCard = useCallback((cardId: string) => {
        setSelectedKeyCardIds(prevIds => {
            const index = prevIds.indexOf(cardId);
            
            if (index !== -1) {
                // 1. 既に選択されている場合（解除）
                // 該当のカードIDを配列から削除し、残りの要素を前に詰める (スライド)
                const newIds = [...prevIds];
                newIds.splice(index, 1);
                
                // keycard_1, keycard_2, keycard_3 の長さを保つために undefined で末尾を埋める
                while (newIds.length < MAX_KEYCARDS) {
                    newIds.push(undefined);
                }
                
                return newIds;
            } else {
                // 2. 未選択の場合（選択）
                // 未設定の最初のスロット (undefined) を見つける
                const nextIndex = prevIds.findIndex(id => id === undefined);

                if (nextIndex !== -1) {
                    // スロットがあれば、その位置にカードIDを設定
                    const newIds = [...prevIds];
                    newIds[nextIndex] = cardId;
                    return newIds;
                } else if (prevIds.filter(Boolean).length < MAX_KEYCARDS) {
                    // 3枚に満たない場合は、末尾に追加 (念のため)
                    const newIds = [...prevIds.filter(Boolean), cardId];
                    // 3枚になるように undefined でパディング（通常は起こらないロジック）
                    while (newIds.length < MAX_KEYCARDS) {
                        newIds.push(undefined);
                    }
                    return newIds;
                }
                
                // 3. 全て埋まっている場合は何もしない
                return prevIds;
            }
        });
    }, []);

    /**
     * UI表示用に keycardRank を付与した DeckListItem のリストを生成
     */
    const deckListWithRanks = useMemo(() => {
        // ID:ランクのマッピングを事前に作成
        const rankMap = new Map<string, 1 | 2 | 3>();
        selectedKeyCardIds.forEach((cardId, index) => {
            if (cardId) {
                // index 0 -> rank 1, index 1 -> rank 2, index 2 -> rank 3
                rankMap.set(cardId, (index + 1) as 1 | 2 | 3);
            }
        });

        return initialCards.map(item => ({
            ...item,
            // 💡 修正: item.cardId を参照して rank を結合する
            keycardRank: rankMap.get(item.cardId) as 1 | 2 | 3 | undefined,
        }));
    }, [initialCards, selectedKeyCardIds]);

    return {
        deckListWithRanks,
        selectedKeyCardIds,
        toggleKeyCard,
        hasReachedMaxKeycards: selectedKeyCardIds.filter(Boolean).length >= MAX_KEYCARDS,
    };
};