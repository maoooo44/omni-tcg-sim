/**
 * src/pages/DeckEditPage.tsx
 *
 * デッキの新規作成または編集を行うためのメインページコンポーネントです。
 */

import React from 'react';
import { useParams} from '@tanstack/react-router'; 
import { Box, Alert } from '@mui/material'; 

import DeckEditor from '../features/deck-management/DeckEditor'; 
import { useDeckEditor } from '../features/deck-management/hooks/useDeckEditor'; 


const DeckEditPage: React.FC = () => {

    // 🚨 LOG M: コンポーネント実行の開始
    console.log(`[DeckEditPage] M. Component Execution Start.`); // ★ NEW LOG

    // 1. URLパラメータからdeckIdを取得 
    /*const { deckId } = useParams({ 
        from: '/user/decks/$deckId',
        strict: true 
    }) as { deckId: string };*/

    // useParamsでdeckIdを取得
    const { deckId } = useParams({ strict: false }) as { deckId: string };
    
    // 🚨 LOG N: useParams 実行成功
    console.log(`[DeckEditPage] N. useParams succeeded for ID: ${deckId}`); // ★ NEW LOG

    // 2. DeckEditContent コンポーネントをレンダリング
    // key={deckId} の効果を確認
    return (
        <DeckEditContent key={deckId} deckId={deckId} />
    );
};

interface DeckEditContentProps {
    deckId: string;
}

const DeckEditContent: React.FC<DeckEditContentProps> = ({ deckId }) => {
    console.log(`[DeckEditContent] 2. Content Component Rendered for Prop ID: ${deckId}`); // ★ LOG
    
    // useDeckEditor hookから全てのロジックとデータを取得
    const {
        isLoading,
        currentDeck,
        saveMessage,
        updateDeckInfo,
        handleSaveDeck,
        handleDeleteDeck,
        addCard, 
        removeCard,
        allCards,
        ownedCards,
    } = useDeckEditor(deckId); 

    // ロード中表示
    if (isLoading) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="info">
                    デッキデータをロード中...
                </Alert>
            </Box>
        );
    }
    
    if (!currentDeck || currentDeck.deckId === '') {
         return (
            <Box sx={{ p: 3 }}>
                <Alert severity="error">
                    編集するデッキデータがありません。無効なURLにアクセスした可能性があります。
                </Alert>
            </Box>
         );
    }

    // Featureコンポーネントをレンダリング
    return (
        <Box sx={{ flexGrow: 1 }}>
            <DeckEditor
                deck={currentDeck} 
                addCard={addCard} 
                removeCard={removeCard} 
                onSave={handleSaveDeck} 
                onDelete={handleDeleteDeck} 
                updateDeckInfo={updateDeckInfo} 
                saveMessage={saveMessage} 
                allCards={allCards} 
                ownedCards={ownedCards} 
            />
        </Box>
    );
};

export default DeckEditPage;