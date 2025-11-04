/**
 * src/stores/utils/deckStoreUtils.ts
 *
 * * DeckStoreに関連する、他のStore（主にCardPoolStore）への依存を含むビジネスロジックを分離・カプセル化するユーティリティモジュール。
 * * 責務:
 * 1. Deckに含まれるカードが、ユーザーのカードプールに十分な数存在するかどうか（未所持カードの存在）をチェックする（checkHasUnownedCards）。
 * 2. 依存するStoreから必要な状態を直接取得することで、DeckStoreアクションからの呼び出しを簡潔にする。
 */
import type { Deck } from '../../models/models';
import { useCardPoolStore } from '../cardPoolStore';

/**
 * デッキに含まれるカードが、ユーザーのカードプールに十分な数存在するかをチェックする。
 * (必要な枚数に対し、所有数が不足しているカードがあれば true を返す)
 * @param deck チェック対象のDeckオブジェクト
 * @returns 1枚でも必要な枚数に対して所有数が不足しているカードがあれば true
 */
export const checkHasUnownedCards = (
    deck: Deck
): boolean => {

    // 関数内部で useCardPoolStore から所有カードリストを取得
    const ownedCards = useCardPoolStore.getState().ownedCards;

    // mainDeck, sideDeck, extraDeck のすべてのカードと枚数を取得
    const allDeckCardEntries = [
        ...deck.mainDeck.entries(),
        ...deck.sideDeck.entries(),
        ...deck.extraDeck.entries(),
    ];

    for (const [cardId, requiredCount] of allDeckCardEntries) {
        // 必要な枚数が 0 より大きく、かつ所有枚数が不足している場合
        // ownedCards.get(cardId) は undefined の場合があるため、|| 0 で安全に処理
        if (requiredCount > 0 && (ownedCards.get(cardId) || 0) < requiredCount) {
            return true; // 不足カードが見つかった (未所持を含む)
        }
    }
    return false; // 全てのカードが十分な数所有されている
};