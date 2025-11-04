// src/features/decks/components/KeyCardSelectModal.tsx (修正全文)

import React, { useMemo, useState, useCallback } from 'react';
import { 
    Dialog, DialogTitle, DialogContent, DialogActions, Button,
} from '@mui/material';
import { useKeyCardSelection } from '../hooks/useKeyCardSelection';
//import DeckCardListDisplay from './DeckCardListDisplay'; // 💡 削除
//import DeckCardListControls from './DeckCardListControls'; // 💡 削除
// ⭐ 修正: configs からインポート
// ⭐ 修正: models から型定義をインポート
import type { Deck, DeckListItem, DeckArea, Card } from '../../../models/models';
import { mapToDeckCardList } from '../deckUtils'; // リスト生成用
import { MODAL_WIDTH, MODAL_HEIGHT } from '../../../configs/configs';

// ✅ 追加: 統合された DeckCardList をインポート
import DeckCardList from './DeckCardList';


// キーカードのランク情報を含む DeckListItem の拡張型を定義
// area の追加は、フィルタリングのために維持
type KeyCardDeckListItem = DeckListItem & {
    keycardRank: 1 | 2 | 3 | undefined;
    area: DeckArea; 
}


interface KeyCardSelectModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentDeck: Deck;
    allCards: Card[];
    ownedCards: Map<string, number>;
    onSaveKeyCards: (keyCardIds: (string | undefined)[]) => void;
}

const KeyCardSelectModal: React.FC<KeyCardSelectModalProps> = ({
    isOpen,
    onClose,
    currentDeck,
    allCards, 
    ownedCards, 
    onSaveKeyCards,
}) => {
    // ゾーンの状態を内部で持つ
    const [selectedArea, setSelectedArea] = useState<DeckArea>('mainDeck');


    // ----------------------------------------------------
    // ⭐ データ生成ロジック: deckCardIdを削除し、cardIdを中心に使用
    // ----------------------------------------------------
    // NOTE: この処理は KeyCardSelectModal のロジック上、全カードを一度生成する必要があるため維持
    const allDeckListItems = useMemo(() => {
        console.log('🔍 KeyCardSelectModal - データ生成開始');
        
        if (!allCards || !currentDeck) {
            console.log('⚠️ allCards または currentDeck が undefined');
            return [];
        }

        const allList: KeyCardDeckListItem[] = [];
        const areas: DeckArea[] = ['mainDeck', 'sideDeck', 'extraDeck'];

        areas.forEach(area => {
            const cardsMap = currentDeck[area] || new Map<string, number>();
            
            if (!(cardsMap instanceof Map)) return;

            const deckCards = mapToDeckCardList(cardsMap);

            deckCards.forEach(deckCard => {
                const card = allCards.find(c => c.cardId === deckCard.cardId);
                if (!card) {
                    console.log(`⚠️ Card not found: ${deckCard.cardId}`);
                    return;
                }
                
                const ownedCount = ownedCards.get(card.cardId) || 0;
                const deckCount = deckCard.count;
                const isOverOwned = deckCount > ownedCount;
                
                // DeckListItem にマッピングし、area を付与
                allList.push({
                    ...card,
                    deckCount: deckCount,
                    ownedCount: ownedCount,
                    isOverOwned: isOverOwned,
                    // 🔴 修正: deckCardId の設定を削除
                    keycardRank: undefined, // 初期値
                    area: area,
                } as KeyCardDeckListItem); 
            });
        });
        
        console.log('✅ KeyCardSelectModal - 生成されたアイテム数:', allList.length);
        return allList;
    }, [currentDeck, allCards, ownedCards]);


    
    // 1. キーカードの初期状態を Deck から抽出
    const initialKeyCardIds = useMemo(() => ([
        currentDeck.keycard_1, 
        currentDeck.keycard_2, 
        currentDeck.keycard_3
    ]), [currentDeck]);


    // 2. カスタムフックで選択ロジックを管理
    const {
        selectedKeyCardIds,
        toggleKeyCard,
    } = useKeyCardSelection(allDeckListItems, initialKeyCardIds); 


    // 3. ゾーン切り替えハンドラ
    // KeyCardSelectModal の内部状態を更新
    const handleAreaChange = useCallback((newArea: DeckArea) => {
        setSelectedArea(newArea);
    }, []);

    // 4. グリッド設定 - KeyCardSelectModal では KeyCardSelectModal 専用のグリッド設定を使用
    // NOTE: useGridDisplay は KeyCardSelectModal のレイアウトには影響しないが、DeckCardListに渡すため保持 
    
    // 7. ハンドラ
    const handleSave = () => {
        onSaveKeyCards(selectedKeyCardIds);
        onClose();
    };

    // DeckCardList の onCardClick に渡すハンドラ (カードを選択/解除する)
    const handleCardSelectionToggle = useCallback((card: Card) => {
        toggleKeyCard(card.cardId);
    }, [toggleKeyCard]);

    // ダミーハンドラ: KeyCardSelectModal は枚数増減操作を許可しない
    const dummyAdd = () => {};
    const dummyRemove = () => {};

    // デバッグ: モーダルが開いたときにログ出力 (省略)

    return (
        <Dialog
            open={isOpen}
            onClose={onClose}
            sx={{
                '& .MuiDialog-paper': { // PaperComponent のスタイルを上書き
                    width: MODAL_WIDTH,
                    maxWidth: MODAL_WIDTH, // 念のため maxWidth も設定
                    height: MODAL_HEIGHT,
                    maxHeight: MODAL_HEIGHT, // 念のため maxHeight も設定
                }
            }}
        >
            <DialogTitle>キーカード設定</DialogTitle>
            <DialogContent 
                dividers 
                sx={{ 
                    p: 2,
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column'
                }}
            >
                {/* ✅ 修正: 統合された DeckCardList コンポーネントを使用 */}
                <DeckCardList
                    deck={currentDeck} // 現在のDeck全体を渡す
                    allCards={allCards}
                    ownedCards={ownedCards}
                    
                    selectedDeckArea={selectedArea} // 内部状態のエリアを渡す
                    onAreaChange={handleAreaChange} // 内部状態を更新するハンドラを渡す
                    
                    // KeyCardSelectModal のための特別な設定
                    onCardClick={handleCardSelectionToggle} // クリックでキーカード選択をトグル
                    isEditorMode={false} // 枚数増減コントロールは表示しない
                    onCardAdd={dummyAdd} // ダミー
                    onCardRemove={dummyRemove} // ダミー
                    
                    // 🚨 DeckCardList の内部でグリッド設定を管理させるため、
                    // KeyCardSelectModal で設定したグリッドの Props は渡さない (DeckCardList の責務)
                    // ただし、キーカードのランク情報を表示するため、isKeyCardSelectable と keyCardRanks を渡す
                    
                    // KeyCardSelectModal 専用の Props
                    isKeyCardSelectable={true}
                    // useKeyCardSelection の結果を KeyCardList に渡すために必要な Props
                    /*keyCardRanks={deckListWithRanks.map(item => ({
                        cardId: item.cardId,
                        keycardRank: item.keycardRank,
                    }))}*/
                />

                {/* NOTE: DeckCardList 統合により、個別の Box ラッパーは不要 */}
            </DialogContent>
            
            <DialogActions>
                <Button onClick={onClose} >キャンセル</Button>
                <Button 
                    onClick={handleSave} 
                    color="primary" 
                    variant="contained"
                    disabled={selectedKeyCardIds.filter(id => id).length === 0} // 1枚も選択されていない場合は保存不可
                >
                    保存
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default KeyCardSelectModal;