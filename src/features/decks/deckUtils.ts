/**
 * src/features/decks/deckUtils.ts
 *
 * デッキ管理フィーチャー（DeckEditor、DeckListManagerなど）で使用されるユーティリティ関数群。
 * 主に、デッキオブジェクト（Deck型）に関連する純粋なデータ処理や変換ロジックを提供する。
 * 責務：
 * 1. カードIDと枚数のMap形式をUI表示用のリスト形式に変換・ソート（mapToDeckCardList）。
 * 2. デッキに含まれるカードの総枚数を計算（calculateTotalCards）。
 * 3. ソート機能がDeckオブジェクトの特定のフィールド値を取得するためのアクセサ機能を提供（deckFieldAccessor）。
 */
import type { Deck, DeckCard } from '../../models/deck';
import { type SortField } from '../../utils/sortingUtils';

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
 * DeckListManagerで一覧に合計枚数を表示する際や、deckFieldAccessorで使用される。
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

/**
 * 💡 新規追加: Deckオブジェクトから指定されたフィールドの値を取得するアクセサ関数。
 * useSortAndFilterフックのソートキー抽出ロジックとして使用される。
 *
 * @param item - 対象のDeckオブジェクト
 * @param field - ソートに使用するフィールド名 ('number', 'name', 'cardCount' など)
 * @returns ソート対象となる値 (string | number)
 */
export const deckFieldAccessor = (item: Deck, field: SortField): string | number | null | undefined => {
    switch (field) {
        case 'number':
            return item.number;
        case 'name':
            return item.name;
        case 'deckId':
            return item.deckId;
        case 'cardCount': 
            // 統一された計算関数を利用して合計枚数を返す
            return calculateTotalCards(item);
        default:
            return (item as any)[field] ?? null;
    }
};