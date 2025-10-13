/**
 * src/features/pack-management/PackManager.tsx
 * * パックデータの一覧表示、新規作成、削除を管理するコンポーネント。
 * usePackStoreからリストとアクションを取得し、編集画面へのナビゲーションを提供する。
 * 💡 修正点: usePackData hookを削除し、編集ロジック（フォーム）を削除してList Managerに特化させた。
 */

import React from 'react';
import { usePackStore } from '../../stores/packStore'; 
import { useShallow } from 'zustand/react/shallow';
import { useNavigate, Link } from '@tanstack/react-router'; 
// import type { Pack } from '../../models/pack'; // 不要
// import DeleteIcon from '@mui/icons-material/Delete'; // 削除ボタン用にインポートを仮定

// initialPackId propはリスト専用になるため不要
// interface PackManagerProps {
//     initialPackId?: string; 
// }

const PackManager: React.FC = () => {
    const navigate = useNavigate();

    // 💡 修正 1: usePackStoreから必要な状態とアクションを取得
    // initializeNewPackEditing を追加
    const { packs, deletePack, initializeNewPackEditing } = usePackStore(useShallow(state => ({
        packs: state.packs,
        deletePack: state.deletePack, // storeのdeletePackアクションを使用
        initializeNewPackEditing: state.initializeNewPackEditing, // ★ 追加
    })));

    // 削除ロジックの修正
    const handleDeletePack = (packId: string, packName: string) => {
        if (!window.confirm(`パック「${packName}」と関連するすべてのカードを完全に削除しますか？`)) {
            return;
        }
        try {
            // storeのアクションを呼び出し、DB操作とストアの更新を委譲
            deletePack(packId); 
            console.log(`Pack ${packId} deleted.`);
        } catch (error) {
            alert('パックの削除に失敗しました。');
            console.error(error);
        }
    };
    
    // 💡 修正 2: 新規パック作成は即時ID生成＆即時遷移に変更
    // 💡 修正 1: 関数を async に変更
    const handleNewPack = async () => {
        // 1. Storeで新規パックを初期化し、UUIDを取得
        // 💡 修正 2: await を追加
        const newPackId = await initializeNewPackEditing(); 
        
        // 2. 取得したUUIDで編集ページに即時遷移
        navigate({ to: '/data/packs/$packId', params: { packId: newPackId } });
    };

    // 💡 修正 3: 編集ボタンは既存パックIDを持つ編集ページへのナビゲーションに統一
    const handleEditPack = (packId: string) => {
        navigate({ to: '/data/packs/$packId', params: { packId } });
    };

    
    // --- レンダリング (リスト部分のみ残す) ---
    
    return (
        <div style={{ padding: '20px' }}>
            
            {/* 1. パック一覧エリア */}
            <div style={{ minWidth: '300px' }}>
                <h2 style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    📦 パック一覧 ({packs.length}件)
                    <button onClick={handleNewPack}>
                        + 新規パックを作成
                    </button>
                </h2>
                
                <ul style={{ listStyle: 'none', padding: 0 }}>
                    {packs.map(pack => (
                        <li key={pack.packId} style={{ 
                            border: '1px solid #eee', 
                            padding: '10px', 
                            margin: '5px 0' 
                        }}>
                            <h4 style={{ margin: '0 0 5px 0' }}>{pack.name} ({pack.series})</h4>
                            <p style={{ margin: 0, fontSize: 'small' }}>
                                封入 {pack.cardsPerPack}枚 | 総収録 {pack.totalCards}種
                            </p>
                            <div style={{ marginTop: '5px' }}>
                                <button 
                                    onClick={() => handleEditPack(pack.packId)} 
                                    style={{ marginRight: '10px' }}
                                >
                                    編集
                                </button>
                                <button 
                                    onClick={() => handleDeletePack(pack.packId, pack.name)} 
                                    style={{ color: 'red' }}
                                >
                                    削除
                                </button>
                                
                                {/* 開封ページへの遷移 */}
                                <Link 
                                    to="/user/open" 
                                    search={{ packId: pack.packId }}
                                    style={{ marginLeft: '10px', textDecoration: 'none' }}
                                >
                                    🃏 開封
                                </Link>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
            
            {/* 💡 修正 4: パック編集エリアは完全に削除されました */}

        </div>
    );
};

export default PackManager;