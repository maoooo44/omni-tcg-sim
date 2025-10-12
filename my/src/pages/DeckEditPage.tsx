// src/pages/DeckEditPage.tsx

import React from 'react';
import { useParams} from '@tanstack/react-router'; //useNavigateを削除
import { useShallow } from 'zustand/react/shallow';
import { Box, Alert } from '@mui/material';

// 💡 FeatureコンポーネントとHookをインポート
import DeckEditor from '../features/deck-management/DeckEditor'; 
import { useDeckEditor } from '../features/deck-management/hooks/useDeckEditor'; 

import { useDeckStore } from '../stores/deckStore';


const DeckEditPage: React.FC = () => {
    // 💡 URLパラメータからdeckIdを取得
    const { deckId } = useParams({ strict: false }) as { deckId: string | undefined };
    
    // 💡 useDeckEditor hookから全てのロジックとデータを取得
    const {
        isLoading,
        currentDeck,
        saveMessage,
        updateDeckInfo,
        handleSaveDeck,
        handleDeleteDeck,
    } = useDeckEditor(deckId || 'create'); // IDがない場合は新規作成モードとして扱う

    // 💡 storeから直接、カードの追加/削除アクションを取得 (DeckEditorに直接渡すため)
    const { addCardToDeck, removeCardFromDeck } = useDeckStore(
        useShallow(state => ({
            addCardToDeck: state.addCardToDeck,
            removeCardFromDeck: state.removeCardFromDeck,
        }))
    );

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
    
    // 💡 ロード後のエラーチェック
    if (!currentDeck || (!deckId && currentDeck.deckId === '')) {
         return (
            <Box sx={{ p: 3 }}>
                <Alert severity="error">
                    編集するデッキが見つかりません。
                </Alert>
            </Box>
         );
    }

    // 💡 Featureコンポーネントをレンダリング
    return (
        <Box sx={{ flexGrow: 1 }}>
            <DeckEditor
                deck={currentDeck}
                addCard={addCardToDeck} 
                removeCard={removeCardFromDeck} 
                onSave={handleSaveDeck} 
                onDelete={handleDeleteDeck} 
                updateDeckInfo={updateDeckInfo} 
                saveMessage={saveMessage}
            />
        </Box>
    );
};

export default DeckEditPage;