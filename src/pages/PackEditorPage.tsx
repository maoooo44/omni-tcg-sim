/**
 * src/pages/PackEditorPage.tsx
 *
 * * パックの新規作成または編集を行うためのメインページコンポーネント。
 * このページは、URLパラメータからパックIDを取得し、全てのロジックを専用のカスタムフック（usePackEditor）に委譲します。
 * 責務は、IDの取得、カスタムフックの実行、未保存時のナビゲーションブロック、ロード状態の表示、および機能コンポーネントへのデータとロジックの受け渡しに限定されます。
 *
 * * 責務:
 * 1. URLパラメータ（packId）を取得する。
 * 2. カスタムフック（usePackEditor）からロジックとデータを取得する。
 * 3. 未保存の変更がある場合にナビゲーションをブロックするロジック（useBlocker）を実装する。
 * 4. ローディング中の状態を処理し、UIに表示する。
 * 5. 実際の編集機能を提供するコンポーネント（PackEditor）をレンダリングし、必要なPropsを渡す。
 */

import React, { useEffect } from 'react';
import {
    Box, Typography, CircularProgress,
} from '@mui/material';
import { useParams, useBlocker } from '@tanstack/react-router';
import PackEditor from '../features/packs/PackEditor';
import { usePackEditor } from '../features/packs/hooks/usePackEditor';

const PackEditorPage: React.FC = () => {

    // useParamsでpackIdを取得
    const { packId } = useParams({ strict: false }) as { packId: string };

    // usePackEditorからすべての状態とハンドラを取得
    const packEditorProps = usePackEditor(packId);

    // ナビゲーション制御に必要なプロパティをフックの戻り値から取得
    const { packData, isNewPack, isDirty } = packEditorProps;

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

    // 新規パックのアンマウント時のクリーンアップ処理
    useEffect(() => {
        return () => {
            if (isNewPack && isDirty) {
                // クリーンアップ処理は現在はコメントアウトされているためそのまま
            }
        };
    }, [isDirty, isNewPack, packId]);

    // ロード中またはデータがない場合
    if (!packData) {
        return (
            <Box sx={{ p: 3, textAlign: 'center' }}>
                <CircularProgress />
                <Typography sx={{ mt: 2 }}>データをロード中...</Typography>
            </Box>
        );
    }

    // PackEditorにpropsを渡す
    return <PackEditor {...packEditorProps} />
};

export default PackEditorPage;