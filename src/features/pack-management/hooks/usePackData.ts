/**
 * src/features/pack-management/hooks/usePackData.ts
 * 
 * パック管理画面で必要なパックデータ（全リストと現在編集中のパック）
 * および、パックのロード、保存、削除ロジックを提供するカスタムフック。
 */

import { useState, useEffect } from 'react';
import type { Pack } from '../../../models/pack';
import { packService } from '../../../services/pack-logic/packService';
import { createDefaultPackData } from '../../../utils/dataUtils';

export const usePackData = (initialPackId?: string) => {
    const [packs, setPacks] = useState<Pack[]>([]);
    const [currentPack, setCurrentPack] = useState<Pack>(createDefaultPackData());
    const [isLoading, setIsLoading] = useState(true);

    // 全パックのリストをDBから取得する
    const fetchPacks = async () => {
        setIsLoading(true);
        const allPacks = await packService.getAllPacks();
        setPacks(allPacks);
        setIsLoading(false);
    };

    // 初期ロード時とID変更時にリストを取得し、編集対象をロードする
    useEffect(() => {
        fetchPacks();
        
        const loadInitialPack = async () => {
            if (initialPackId) {
                const pack = await packService.getPackById(initialPackId);
                if (pack) {
                    setCurrentPack(pack);
                } else {
                    // IDが無効な場合は新規作成モードへ
                    setCurrentPack(createDefaultPackData());
                }
            } else {
                // IDがない場合は新規作成モードへ
                setCurrentPack(createDefaultPackData());
            }
        };

        loadInitialPack();
    }, [initialPackId]);


    // パックの保存ロジック
    const handleSave = async (packToSave: Pack) => {
        const isNew = !packs.some(p => p.packId === packToSave.packId);
        
        try {
            if (isNew) {
                const newId = await packService.savePack(packToSave);
                setCurrentPack({ ...packToSave, packId: newId });
            } else {
                await packService.updatePack(packToSave.packId, packToSave);
            }
            // 保存後、リストを更新
            await fetchPacks();
            alert(`パックが正常に${isNew ? '作成' : '更新'}されました！`);
        } catch (e) {
            alert('保存中にエラーが発生しました。');
            throw e; // エラーを上位に伝播
        }
    };

    // パックの削除ロジック
    const handleDelete = async (packId: string) => {
        if (window.confirm('本当にこのパックを削除しますか？')) {
            await packService.deletePack(packId);
            await fetchPacks();
            // 削除したパックを編集していた場合は、新規モードに戻す
            if (currentPack.packId === packId) {
                setCurrentPack(createDefaultPackData());
            }
        }
    };

    return {
        packs,
        currentPack,
        setCurrentPack,
        isLoading,
        handleSave,
        handleDelete,
        handleNewPack: () => setCurrentPack(createDefaultPackData()), // 新規作成モードへの切り替え
        fetchPacks, // ★ 修正: リスト再取得関数を外部に公開
    };
};