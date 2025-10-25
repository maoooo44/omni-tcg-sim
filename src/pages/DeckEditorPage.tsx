/**
 * src/pages/DeckEditorPage.tsx
 *
 * デッキの新規作成または編集を行うためのメインページコンポーネントです。
 * URLパラメータからIDを取得し、全てのロジックをuseDeckEditorカスタムフックに委譲します。
 */

import React from 'react';
import { useParams} from '@tanstack/react-router'; 
import { Box, Alert } from '@mui/material'; 
import DeckEditor from '../features/decks/DeckEditor'; 
import { useDeckEditor } from '../features/decks/hooks/useDeckEditor'; 
// useDeckEditor, DeckEditor, Card, Deck などの型定義インポートは省略

const DeckEditorPage: React.FC = () => {

    // 1. URLパラメータからdeckIdを取得
    const { deckId } = useParams({ strict: false }) as { deckId: string };
    // 2. DeckEditorContent コンポーネントをレンダリング
    // key={deckId} を設定することで、URLパラメータが変わった際にフックを強制リセット
    return (
        <DeckEditorContent key={deckId} deckId={deckId} />
    );
};

interface DeckEditorContentProps {
    deckId: string;
}

const DeckEditorContent: React.FC<DeckEditorContentProps> = ({ deckId }) => {
    
 
    // useDeckEditor hookから全てのロジックとデータを取得 (ビジネスロジックの分離)
    const {
        isLoading,
        currentDeck,
        saveMessage,
        updateDeckInfo,
        // 💡 修正: useDeckEditor の新しい戻り値名に合わせる
        onSave, // handlesaveCurrentDeck から onSave に変更
        onDelete, // handleDeleteDeck から onDelete に変更
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
    // データが見つからない場合のみエラー表示（新規作成は通す）
    if (!currentDeck) {
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
                // 💡 修正: 新しいプロパティ名で渡す
                onSave={onSave} 
                onDelete={onDelete} 
                // 💡 追加: DeckEditorPropsに必要な復元/物理削除アクションを渡す             
                updateDeckInfo={updateDeckInfo} 
                saveMessage={saveMessage} 
                allCards={allCards} 
                ownedCards={ownedCards} 
            />
        </Box>
    );
};

export default DeckEditorPage;