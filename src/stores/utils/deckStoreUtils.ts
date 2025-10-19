/**
 * src/stores/utils/deckStoreUtils.ts
 * * DeckStoreに関連する、他のStoreへの依存を含むビジネスロジックを分離。
 * 主にDeckの有効性チェック（カードの所有状況など）を行う。
 */
import type { Deck } from '../../models/deck';
// 💡 追加: カード所有情報を取得するため useCardPoolStore をインポート
import { useCardPoolStore } from '../cardPoolStore'; 

/**
 * デッキに含まれるカードが、ユーザーのカードプールに十分な数存在するかをチェックする。
 * (必要な枚数に対し、所有数が不足しているカードがあれば true を返す)
 * @param deck チェック対象のDeckオブジェクト
 * @returns 1枚でも必要な枚数に対して所有数が不足しているカードがあれば true
 */
export const checkHasUnownedCards = ( // 💡 修正: ownedCards 引数を削除
    deck: Deck 
): boolean => { 
    
    // 💡 修正: 関数内部で useCardPoolStore から所有カードリストを取得
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