/**
 * src/pages/DeckEditorPage.tsx
 *
 * デッキの新規作成または編集を行うためのメインページコンポーネントです。
 * URLパラメータからIDを取得し、全てのロジックをuseDeckEditorカスタムフックに委譲します。
 */

import React from 'react';
import { useParams} from '@tanstack/react-router'; 
import { Box, Alert } from '@mui/material'; 
// ★ 追加: useShallowをインポート
import { useShallow } from 'zustand/react/shallow'; 

import DeckEditor from '../features/decks/DeckEditor'; 
import { useDeckEditor } from '../features/decks/hooks/useDeckEditor'; 
// ★ 追加: useUserDataStoreをインポート（パスは仮定）
import { useUserDataStore } from '../stores/userDataStore'; 
// useDeckEditor, DeckEditor, Card, Deck などの型定義インポートは省略

const DeckEditorPage: React.FC = () => {

    // 1. URLパラメータからdeckIdを取得 
    // 💡 useParamsの戻り値の型を明示（ここでは、useDeckEditorに渡すためのstringとして扱う）
    const { deckId } = useParams({ strict: false }) as { deckId: string };
    
    // 2. DeckEditorContent コンポーネントをレンダリング
    // key={deckId} を設定することで、URLパラメータが変わった際にフックを強制リセット
    return (
        <DeckEditorContent key={deckId} deckId={deckId || 'new'} /> // 💡 新規作成時は'new'を渡すように修正
    );
};

interface DeckEditorContentProps {
    deckId: string;
}

const DeckEditorContent: React.FC<DeckEditorContentProps> = ({ deckId }) => {
    
    // ★ 修正: useUserDataStoreから isAllViewMode を取得
    const isAllViewMode = useUserDataStore(useShallow(state => state.isAllViewMode)); 

    // useDeckEditor hookから全てのロジックとデータを取得 (ビジネスロジックの分離)
    const {
        isLoading,
        currentDeck,
        saveMessage,
        updateDeckInfo,
        // 💡 修正: useDeckEditor の新しい戻り値名に合わせる
        onSave, // handlesaveCurrentDeck から onSave に変更
        onDelete, // handleDeleteDeck から onDelete に変更
        onRestore, // 💡 追加: 新しい復元アクション
        onPhysicalDelete, // 💡 追加: 新しい物理削除アクション
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
    
    // データが見つからない場合のエラー表示
    if (!currentDeck || currentDeck.deckId === '') {
             return (
                 <Box sx={{ p: 3 }}>
                     <Alert severity="error">
                         編集するデッキデータがありません。無効なURLにアクセスした可能性があります。
                     </Alert>
                 </Box>
             );
    }

    // Featureコンポーネントをレンダリングし、必要なPropsを渡す (UI/機能の分離)
    return (
        <Box sx={{ flexGrow: 1 }}>
            <DeckEditor
                deck={currentDeck} 
                addCard={addCard} 
                removeCard={removeCard} 
                // 💡 修正: 新しいプロパティ名で渡す
                onSave={onSave} 
                onDelete={onDelete} 
                // 💡 追加: DeckEditorPropsに必要な復元/物理削除アクションを渡す
                onRestore={onRestore}
                onPhysicalDelete={onPhysicalDelete}
                
                updateDeckInfo={updateDeckInfo} 
                saveMessage={saveMessage} 
                allCards={allCards} 
                ownedCards={ownedCards} 
                // ★ 修正: isAllViewModeを渡す
                isAllViewMode={isAllViewMode} 
            />
        </Box>
    );
};

export default DeckEditorPage;