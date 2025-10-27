// src/pages/PackEditorPage.tsx

import React, { useEffect } from 'react'; // useCallback, CardType は不要になったため削除
import { 
    Box, Typography, CircularProgress,
} from '@mui/material'; 
import { useParams, useBlocker } from '@tanstack/react-router'; 
import PackEditor from '../features/packs/PackEditor'; 
import { usePackEditor } from '../features/packs/hooks/usePackEditor'; 
// ❌ useUIStore のインポートを削除
// import { useUIStore, type UIStore } from '../stores/uiStore'; 


const PackEditorPage: React.FC = () => {
    
    // useParamsでpackIdを取得
    const { packId } = useParams({ strict: false }) as { packId: string };
    
    // usePackEditorからすべての状態とハンドラを取得
    const packEditorProps = usePackEditor(packId);
    
    // ナビゲーション制御に必要なプロパティをフックの戻り値から取得
    const { packData, isNewPack, isDirty } = packEditorProps; // removePackFromStore も不要

    // ★ useBlocker の実装: 未保存の変更がある場合のナビゲーションブロック (変更なし)
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
    
    // 新規パックのアンマウント時のクリーンアップ処理 (変更なし)
    useEffect(() => {
        return () => {
            if (isNewPack && isDirty) {
                // クリーンアップ処理は現在はコメントアウトされているためそのまま
            }
        };
    }, [isDirty, isNewPack, packId]); 
    
    // ❌ グローバルストアからモーダルを開く関数を取得するロジックを削除
    // const openGlobalCardViewModal = useUIStore((state: UIStore) => state.openCardViewModal);
    // const handleOpenCardViewModal = useCallback((card: CardType) => { openGlobalCardViewModal(card.cardId); }, [openGlobalCardViewModal]);

    // ロード中またはデータがない場合
    if (!packData) {
        return (
            <Box sx={{ p: 3, textAlign: 'center' }}>
                <CircularProgress />
                <Typography sx={{ mt: 2 }}>データをロード中...</Typography>
            </Box>
        );
    }
    
    // PackEditorにpropsを渡す (handleOpenCardViewModal の受け渡しを削除)
    return (
        <PackEditor
            packId={packId}
            {...packEditorProps}
            // ❌ handleOpenCardViewModal の受け渡しを削除
        />
    );
};

export default PackEditorPage;