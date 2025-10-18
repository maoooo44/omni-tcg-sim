/**
 * src/pages/PackEditorPage.tsx
 *
 * パックデータ（基本情報、レアリティ設定、収録カード）の作成・編集を行うページ。
 * このコンポーネントはページラッパーとして、usePackEditorカスタムフックから状態とロジックを取得し、
 * PackEditorコンポーネントにプロパティを渡す。
 * 主要な責務として、未保存の変更がある場合にルーティングをブロックする機能（useBlocker）を実装する。
 */
import React, { useEffect, useCallback } from 'react'; 
import { 
    Box, Typography, CircularProgress,
} from '@mui/material'; 
import { useParams, useBlocker } from '@tanstack/react-router'; 
// ★ 修正1: useShallowをインポート
import { useShallow } from 'zustand/react/shallow';

import PackEditor from '../features/packs/PackEditor'; 
import { usePackEditor } from '../features/packs/hooks/usePackEditor'; 
import type { Card as CardType } from '../models/card'; 
import { useUIStore, type UIStore } from '../stores/uiStore'; 
// ★ 修正2: useUserDataStoreをインポート
import { useUserDataStore } from '../stores/userDataStore';

const PackEditorPage: React.FC = () => {
    
    // useParamsでpackIdを取得
    const { packId } = useParams({ strict: false }) as { packId: string };
    
    // usePackEditorからすべての状態とハンドラを取得
    const packEditorProps = usePackEditor(packId);
    
    // ★ 修正3: useUserDataStoreから isAllViewMode を取得
    const isAllViewMode = useUserDataStore(useShallow(state => state.isAllViewMode)); 

    // ナビゲーション制御に必要なプロパティをフックの戻り値から取得
    const { packData, isNewPack, isDirty, removePackFromStore } = packEditorProps;

    // ★ useBlocker の実装: 未保存の変更がある場合のナビゲーションブロック
    useBlocker({
        shouldBlockFn: () => {
            
            if (!isDirty) {
                // 変更がない場合は、ナビゲーションを許可 (ブロックしない)
                return false;
            }

            // isDirty が true の場合、確認ダイアログを表示し、ユーザーの選択に従う
            const confirmed = window.confirm(
                '変更が保存されていません。このまま移動すると、未保存の変更は破棄されます。続行しますか？'
            );
            
            return !confirmed; // 続行しない（false）場合はブロック（true）を返す
        },
        
        // F5/タブを閉じるなどのブラウザ離脱警告を isDirty に基づいて有効化
        enableBeforeUnload: isDirty, 
    });
    
    // 新規パックのアンマウント時のクリーンアップ処理
    useEffect(() => {
        return () => {
            // 新規パックの場合、かつ変更がある場合、アンマウント時にストアの状態をクリーンアップ
            if (isNewPack && isDirty) {
                removePackFromStore(packId); 
            }
        };
    }, [isDirty, isNewPack, packId, removePackFromStore]); 
    
    // グローバルストアからモーダルを開く関数を取得
    const openGlobalCardViewModal = useUIStore((state: UIStore) => state.openCardViewModal);

    // グローバルストアの関数を呼び出すハンドラ（CardTypeを引数に取る）
    const handleOpenCardViewModal = useCallback((card: CardType) => {
        // カードのIDを渡してグローバルモーダルを開く
        openGlobalCardViewModal(card.cardId); 
    }, [openGlobalCardViewModal]);

    // ロード中またはデータがない場合
    if (!packData) {
        return (
            <Box sx={{ p: 3, textAlign: 'center' }}>
                <CircularProgress />
                <Typography sx={{ mt: 2 }}>データをロード中...</Typography>
            </Box>
        );
    }
    
    // PackEditorに全てのpropsと追加のハンドラを渡す
    return (
        <PackEditor
            packId={packId}
            {...packEditorProps}
            handleOpenCardViewModal={handleOpenCardViewModal}
            // ★ 修正4: isAllViewModeを渡す
            isAllViewMode={isAllViewMode} 
        />
    );
};

export default PackEditorPage;