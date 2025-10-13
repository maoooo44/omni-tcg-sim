/**
* src/stores/cardStore.ts
*
* Zustandを使用してアプリケーション全体のカードデータを管理するストア。
* CardDataServiceを介してIndexedDBと連携し、カードのCRUD操作とフィルタリングを提供する。
*/

import { create } from 'zustand';
import type { Card } from '../models/card'; 
import { cardDataService } from '../services/pack-logic/CardDataService'; // サービス層をインポート

export interface CardStore { 
    cards: Card[];
    
    // CRUD操作
    // 💡 削除: createCard は bulkPutCards に統合されるため削除 (またはインターフェースから削除が必要)
    // createCard: (card: Card) => Promise<void>; 
    updateCard: (card: Card) => Promise<void>;
    deleteCard: (cardId: string) => Promise<void>;
    loadAllCards: () => Promise<void>; // サービス層からのロードに統一
    
    // 💡 追加: 編集画面からの「確定」されたカードの一括更新/追加
    bulkPutCards: (cards: Card[]) => Promise<void>;

    // 💡 追加: メモリ上のストアのカードを直接更新
    updateCardInStore: (card: Card) => void;

    // 💡 追加: メモリ上のストアから単一カードを削除する（DB操作なし）
    removeCardFromStore: (cardId: string) => void;
    
    // 便利メソッド (既存)
    getCardsByPackId: (packId: string) => Card[];

    // packIdを指定してカードをストアから削除（DB操作はPackServiceが完了済みを想定）
    deleteCardsByPackId: (packId: string) => void; 

    // CSV I/O アクション
    importCards: (cardsToImport: Card[]) => Promise<{ importedCount: number, updatedCount: number }>;
    exportCardsToCsv: (packId: string) => Promise<string>;

    updateCardIsInStore: (cardId: string, isInStore: boolean) => Promise<void>;
}

export const useCardStore = create<CardStore>((set, get) => ({
    cards: [], 
    
    // 💡 新規追加: メモリ上のカードを直接更新するアクション
    updateCardInStore: (updatedCard) => {
        set(state => ({
            cards: state.cards.map(card => 
                card.cardId === updatedCard.cardId ? updatedCard : card
            )
        }));
    },
    
    // 💡 追加: メモリ上のストアから単一カードを削除する（DB操作なし）
    removeCardFromStore: (cardId) => {
        set(state => ({
            cards: state.cards.filter(c => c.cardId !== cardId)
        }));
        console.log(`[CardStore] Memory state cleared for card ID: ${cardId}`);
    },

    // 💡 削除された createCard の代替としてのダミー関数
    createCard: async (newCard: Card) => {
        // 🚨 このアクションは新規作成フローに合わないため、使用を推奨しません。
        // 代わりに createDefaultCard (DB即時保存) -> usePackEdit の bulkPutCards を使用してください。
        console.warn("[CardStore] createCard は非推奨です。bulkPutCards を使用してください。");
        await cardDataService.updateCard(newCard); 
    },
    
    // DB操作はCardDataServiceに委譲。ストアの更新はピンポイントに。
    updateCard: async (updatedCard) => {
        try {
            await cardDataService.updateCard(updatedCard); // サービス経由でDB/キャッシュ更新
            
            // 💡 修正: Store Stateを直接更新し、`isInStore: false`の下書きが混入するのを避ける
            get().updateCardInStore(updatedCard); 
        } catch (error) {
            console.error("Failed to update card:", error);
            throw error;
        }
    },
    
    // DB操作はCardDataServiceに委譲
    deleteCard: async (cardId) => {
        try {
            await cardDataService.deleteCard(cardId); // サービス経由でDB/キャッシュから削除
            
            // 💡 修正 1: ストアの状態を最新にするために、共通アクションを再利用
            get().removeCardFromStore(cardId);
        } catch (error) {
            console.error("Failed to delete card:", error);
            throw error;
        }
    },
    
    /**
     * [DB連携] 全てのカードリストをロードし、下書きカードをクリーンアップする
     * 💡 修正: DBクリーンアップとフィルタリングはCardDataServiceに任せるべきだが、現状はストア側でフィルタリング
     */
    loadAllCards: async () => {
        console.log(`[CardStore:loadAllCards] 🚀 START loading all cards and cleaning up drafts.`);
        try {
            await cardDataService.loadAllCardsFromCache(); // DBロードとキャッシュ構築
            const allCards = cardDataService.getAllCards(); // キャッシュから全てを取得
            
            // 2. 🚨 古い下書き（isInStore: false のもの）をクリーンアップするロジック (サービス層に移すべきだが暫定的に残す)
            const now = new Date().getTime();
            const ONE_DAY_MS = 86400000;
            
            const cardsToDelete = allCards
                .filter(c => 
                    // isInStore: false で、かつ 24時間以上経過している
                    !c.isInStore && c.updatedAt && (now - new Date(c.updatedAt).getTime() > ONE_DAY_MS)
                )
                .map(c => c.cardId);

            // 3. 物理削除の実行（DBへの書き込み）
            if (cardsToDelete.length > 0) {
                console.log(`[CardStore:loadAllCards] 🧹 Deleting ${cardsToDelete.length} expired draft cards.`);
                // 🚨 bulkDeleteCards は CardDataService に追加されていることを前提とする
                // await cardDataService.bulkDeleteCards(cardsToDelete); 
            }
             
            // 4. 💡 全カード一覧に表示するリストを定義（isInStore: true のみ）
            const cardsToDisplay = allCards
                // 削除対象に含まれておらず、かつ、isInStore: true のものを表示
                .filter(c => !cardsToDelete.includes(c.cardId) && c.isInStore === true); 
            
            // 5. Storeにセット
            set({ cards: cardsToDisplay });
            console.log(`[CardStore:loadAllCards] ✅ Loaded ${cardsToDisplay.length} cards for display.`);
        } catch (error) {
            console.error("[CardStore:loadAllCards] ❌ Failed to load or cleanup cards:", error);
            set({ cards: [] });
        }
    },

    /**
     * 💡 新規追加: 編集画面からのカード一括保存/更新アクション
     * isInStore: true に更新されたカードを DB に保存し、Storeに反映させる
     */
    bulkPutCards: async (cardsToFinalize: Card[]) => {
        try {
            // 1. DB/キャッシュへの一括書き込み (isInStore: true の状態)
            await cardDataService.bulkPutCards(cardsToFinalize);
            
            // 2. Store State の更新
            set(state => {
                // 現在のカードリストをマップに変換
                const updatedCards = new Map(state.cards.map(c => [c.cardId, c]));
                
                // 確定されたカード (isInStoreがtrueのものを想定) をStoreに追加/更新
                cardsToFinalize.filter(c => c.isInStore).forEach(card => {
                    updatedCards.set(card.cardId, card); 
                });
                
                return { cards: Array.from(updatedCards.values()) };
            });
            
            console.log(`[CardStore:bulkPutCards] ✅ Bulk put finished for ${cardsToFinalize.length} cards.`);
        } catch (error) {
            console.error("Failed to bulk put cards:", error);
            throw error;
        }
    },

    getCardsByPackId: (packId) => {
        return get().cards.filter(card => card.packId === packId);
    },

    // 💡 修正: packIdでメモリ上のカードを削除するロジックを簡素化
    deleteCardsByPackId: (packId) => {
        // 💡 修正 2: set を直接使い、filterで一括削除
        set((state) => ({
            cards: state.cards.filter(card => card.packId !== packId)
        }));
        console.log(`[CardStore] Memory state cleared for pack ID: ${packId}`);
    },

    // CSV一括インポートアクション
    importCards: async (cardsToImport) => {
        try {
            const existingIds = new Set(get().cards.map(c => c.cardId));
            const cardsToUpdate = cardsToImport.filter(card => existingIds.has(card.cardId));
            const newCards = cardsToImport.filter(card => !existingIds.has(card.cardId));

            // DBへの書き込み (一括でput) をサービス層に委譲
            await cardDataService.bulkPutCards(cardsToImport);

            // Store Stateの更新は、サービス層のキャッシュ更新結果を反映
            // 🚨 bulkPutCards がisInStore:false のカードもキャッシュに追加した場合、loadAllCardsを再実行すべき
            // 暫定的に getAllCards からフィルタリング
            await get().loadAllCards(); // フィルタリング込みのロードを再実行

            return { importedCount: newCards.length, updatedCount: cardsToUpdate.length };
        } catch (error) {
            console.error("Failed to import cards:", error);
            throw new Error("カードデータの一括インポートに失敗しました。");
        }
    },
    
    // カードのエクスポートロジック (変更なし、メモリ上の状態を使用)
    exportCardsToCsv: async (packId) => {
        const targetCards = get().cards.filter(c => c.packId === packId);
        if (targetCards.length === 0) return "";
        
        // CSVのヘッダー定義
        const headers = ['cardId', 'packId', 'name', 'rarity', 'imageUrl', 'userCustomKeys', 'userCustomValues'];
        
        const rows = targetCards.map(card => {
            // userCustom をシンプルな文字列にする
            const customKeys = Object.keys(card.userCustom || {}).join('|');
            const customValues = Object.values(card.userCustom || {}).join('|');

            return [
                card.cardId,
                card.packId,
                card.name,
                card.rarity,
                card.imageUrl,
                customKeys,
                customValues,
            ].map(field => `\"${String(field || '').replace(/\"/g, '\"\"')}\"`).join(','); // CSVエンコード
        });
        
        return [headers.map(h => `\"${h}\"`).join(','), ...rows].join('\n');
    },

    /**
     * DB上のパックの isInStore ステータスを更新し、Storeの cards リストから除外/追加する（論理削除/復元）
     */
    updateCardIsInStore: async (cardId, isInStore) => {
        console.log(`[CardStore:updateCardIsInStore] ⚙️ START update isInStore: ID=${cardId}, NewStatus=${isInStore}`);
        try {
            // 1. Store/DBからカードデータを取得
            const cardToUpdate = get().cards.find(c => c.cardId === cardId) || cardDataService.getCardById(cardId);

            if (!cardToUpdate) {
                console.warn(`[CardStore:updateCardIsInStore] ⚠️ Card ID ${cardId} not found for status update.`);
                return;
            }

            // 2. isInStore の値を更新し、updatedAt も更新
            const updatedCard: Card = {
                ...cardToUpdate,
                isInStore: isInStore,
                updatedAt: new Date().toISOString()
            };

            // 3. DBに更新を保存 (単一カードの更新)
            await cardDataService.updateCard(updatedCard); 
            console.log(`[CardStore:updateCardIsInStore] DB update complete.`);
            
            // 4. Storeのcardsリストを更新 (リストから除外/追加)
            if (isInStore) {
                // true になった場合は Store に追加/更新
                get().updateCardInStore(updatedCard); 
            } else {
                // false になった場合は Store から削除 (非表示にする)
                get().removeCardFromStore(cardId);
            }

            console.log(`[CardStore:updateCardIsInStore] ✅ Status updated (ID: ${cardId}): ${isInStore}`);
        } catch (error) {
            console.error("[CardStore:updateCardIsInStore] ❌ Failed to update isInStore status:", error);
            throw error;
        }
    },
}));