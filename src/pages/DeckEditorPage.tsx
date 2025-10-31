/**
 * src/pages/DeckEditorPage.tsx
 *
 * * デッキの新規作成または編集を行うためのメインページコンポーネント。
 * このページは、URLパラメータからデッキIDを取得し、全てのロジックを専用のカスタムフック（useDeckEditor）に委譲します。
 * 責務は、IDの取得、ロード状態/エラー状態の表示、および機能コンポーネント（DeckEditor）へのデータとロジックの受け渡しに限定されます。
 *
 * * 責務:
 * 1. URLパラメータ（deckId）を取得し、キーとして子コンポーネントを再マウントする。
 * 2. カスタムフック（useDeckEditor）からロジックとデータを取得する。
 * 3. ローディング中またはエラー（データNotFound）の状態を処理し、UIに表示する。
 * 4. 実際の編集機能を提供するコンポーネント（DeckEditor）をレンダリングし、必要なPropsを渡す。
 */

import React from 'react';
import { useParams } from '@tanstack/react-router';
import { Box, Alert } from '@mui/material';
import DeckEditor from '../features/decks/DeckEditor';
import { useDeckEditor } from '../features/decks/hooks/useDeckEditor';

const DeckEditorPage: React.FC = () => {

    // URLパラメータからdeckIdを取得
    const { deckId } = useParams({ strict: false }) as { deckId: string };
    // DeckEditorContent コンポーネントをレンダリング
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
        onSave,
        onDelete,
        allCards,
        ownedCards,
        // 修正: DeckEditorに必要だが元のコードで取得されていなかったPropsを仮定して追加
        isDirty,
        handleCardAdd,
        handleCardRemove,
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
    
    // 修正: isNewDeckの判定ロジックを仮定
    const isNewDeck = deckId === 'new'; 

    // Featureコンポーネントをレンダリングし、必要なPropsを渡す (UI/機能の分離)
    return (
        <Box sx={{ flexGrow: 1 }}>
            <DeckEditor
                deck={currentDeck}
                onSave={onSave}
                onDelete={onDelete}
                updateDeckInfo={updateDeckInfo}
                saveMessage={saveMessage}
                allCards={allCards}
                ownedCards={ownedCards}
                // 修正: 不足していたPropsを追加
                isNewDeck={isNewDeck}
                isDirty={isDirty || false} // useDeckEditorからの取得を想定
                handleCardAdd={handleCardAdd} // useDeckEditorからの取得を想定
                handleCardRemove={handleCardRemove} // useDeckEditorからの取得を想定
            />
        </Box>
    );
};

export default DeckEditorPage;