/**
 * src/pages/DeckEditorPage.tsx
 *
 * * デッキの新規作成または編集を行うためのメインページコンポーネント。
 * このページは、URLパラメータからデッキIDを取得し、全てのロジックを専用のカスタムフック（useDeckEditor）に委譲します。
 * 責務は、IDの取得、カスタムフックの実行、未保存時のナビゲーションブロック、ロード状態の表示、および機能コンポーネントへのデータとロジックの受け渡しに限定されます。
 *
 * * 責務:
 * 1. URLパラメータ（deckId）を取得する。
 * 2. カスタムフック（useDeckEditor）からロジックとデータを取得する。
 * 3. 未保存の変更がある場合にナビゲーションをブロックするロジック（useBlocker）を実装する。
 * 4. ローディング中の状態を処理し、UIに表示する。
 * 5. 実際の編集機能を提供するコンポーネント（DeckEditor）をレンダリングし、必要なPropsを渡す。
 */

import React from 'react';
import {
    Box, Typography, CircularProgress,
} from '@mui/material';
import { useParams, useBlocker } from '@tanstack/react-router';
import DeckEditor from '../features/decks/DeckEditor';
import { useDeckEditor } from '../features/decks/hooks/useDeckEditor';


const DeckEditorPage: React.FC = () => {

    // useParamsでdeckIdを取得
    const { deckId } = useParams({ strict: false }) as { deckId: string };

    // useDeckEditorからすべての状態とハンドラを取得
    const deckEditorProps = useDeckEditor(deckId);

    // ナビゲーション制御に必要なプロパティをフックの戻り値から取得
    const { currentDeck, isDirty } = deckEditorProps;

    // useBlocker の実装: 未保存の変更がある場合のナビゲーションブロック
    useBlocker({
        shouldBlockFn: () => {

            if (!isDirty) {
                return false;
            }

            const confirmed = window.confirm(
                '変更が保存されていません。このまま移動すると、未保存の変更は破棄されます。続行しますか？'
            );

            return !confirmed;
        },

        enableBeforeUnload: isDirty,
    });

    // ロード中またはデータがない場合
    if (!currentDeck) {
        return (
            <Box sx={{ p: 3, textAlign: 'center' }}>
                <CircularProgress />
                <Typography sx={{ mt: 2 }}>データをロード中...</Typography>
            </Box>
        );
    }

    // DeckEditorにpropsを渡す
    return (
        <DeckEditor
            {...deckEditorProps}
        />
    );
};

export default DeckEditorPage;