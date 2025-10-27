/**
 * src/features/decks/deckUtils.ts
 *
 * デッキ管理フィーチャー（DeckEditor、DeckListManagerなど）で使用されるユーティリティ関数群。
 * 主に、デッキオブジェクト（Deck型）に関連する純粋なデータ処理や変換ロジックを提供する。
 * 責務：
 * 1. カードIDと枚数のMap形式をUI表示用のリスト形式に変換・ソート（mapToDeckCardList）。
 * 2. デッキに含まれるカードの総枚数を計算（calculateTotalCards）。
 * 
 * 💡 注意: deckFieldAccessorは削除されました。
 * useSortAndFilterがデフォルトアクセサを提供するため、特殊なロジックが不要な場合は
 * アクセサ関数を渡す必要はありません。
 */
import type { Deck, DeckCard } from '../../models/deck';

/**
 * カードIDと枚数のMap形式のデッキデータを、UI表示用のDeckCard[]に変換し、枚数が多い順にソートする。
 * この関数は、DeckEditorのメイン/サイド/エクストラデッキリストのレンダリングに使用される。
 *
 * @param cardMap - Deck.mainDeck, Deck.sideDeck, または Deck.extraDeck の Map<cardId, count>
 * @returns 枚数の降順でソートされた DeckCard[] のリスト
 */
export const mapToDeckCardList = (cardMap: Map<string, number>): DeckCard[] => {
    if (!cardMap) return [];
    
    // Mapのエントリ ([cardId, count]) を DeckCard { cardId, count } オブジェクトの配列に変換
    const list = Array.from(cardMap.entries())
        .map(([cardId, count]) => ({ cardId, count }));
        
    // 枚数 (count) の降順でソート
    return list.sort((a, b) => b.count - a.count);
};


/**
 * 💡 新規追加: デッキ（メイン、サイド、エクストラ）に含まれるカードの総枚数を計算する純粋関数。
 * DeckListManagerで一覧に合計枚数を表示する際に使用される。
 *
 * @param deck - 総枚数を計算したいDeckオブジェクト
 * @returns デッキに含まれるすべてのカードの合計枚数
 */
export const calculateTotalCards = (deck: Deck): number => {
    const main = Array.from(deck.mainDeck.values()).reduce((s, c) => s + c, 0);
    const side = Array.from(deck.sideDeck.values()).reduce((s, c) => s + c, 0);
    const extra = Array.from(deck.extraDeck.values()).reduce((s, c) => s + c, 0);
    return main + side + extra;
};