/**
 * src/features/pack-management/hooks/useRarityEditor.ts
 * 
 * パックのレアリティ設定（rarityNameとprobabilityの配列）の編集ロジックと
 * 状態を管理するカスタムフック。
 * 確率の合計計算や、初期値が空の場合のデフォルト設定へのフォールバックも行う。
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
// RarityConfig型は '../../../models/pack' からインポートされると仮定
import type { RarityConfig } from '../../../models/pack'; 

const DEFAULT_PROBABILITY = 0.0001; // 新規追加時のデフォルト確率
const DEFAULT_RARITY_NAME = 'NewRarity';

/**
 * レアリティ設定の編集ロジックと状態を管理するカスタムフック
 * @param initialRarities - 編集対象の現在のレアリティ設定
 */
export const useRarityEditor = (initialRarities: RarityConfig[]) => {
    // 編集中のレアリティ設定のローカル状態
    const [editingRarities, setEditingRarities] = useState<RarityConfig[]>(initialRarities);

    // 外部からの初期値変更を監視し、状態をリセット
    useEffect(() => {
        // initialRaritiesが空の場合はデフォルト設定を使用
        const safeInitialRarities = initialRarities.length > 0 
            ? initialRarities 
            : [{ rarityName: 'Common', probability: 1.0 }]; 
        setEditingRarities(safeInitialRarities);
    }, [initialRarities]);

    // --- 計算ロジック ---

    /**
     * 全レアリティの確率を合計する
     */
    const totalProbability = useMemo(() => {
        return editingRarities.reduce((sum, r) => sum + (r.probability || 0), 0);
    }, [editingRarities]);

    /**
     * 合計確率が1.0から大きく乖離しているかチェック
     */
    const probabilityMismatch = useMemo(() => {
        // 許容誤差 0.000001 (1e-6) を設定
        return Math.abs(totalProbability - 1.0) > 1e-6; 
    }, [totalProbability]);

    // --- ハンドラ ---

    /**
     * 新しいレアリティを追加
     */
    const handleAddRarity = useCallback(() => {
        setEditingRarities(prev => [
            ...prev,
            {
                rarityName: `${DEFAULT_RARITY_NAME}_${prev.length + 1}`, 
                probability: DEFAULT_PROBABILITY,
            },
        ]);
    }, []);

    /**
     * 指定したインデックスのレアリティを削除
     */
    const handleRemoveRarity = useCallback((index: number) => {
        setEditingRarities(prev => prev.filter((_, i) => i !== index));
    }, []);

    /**
     * 指定したインデックスのレアリティ名または確率を変更
     * @param index - 変更対象のインデックス
     * @param field - 変更するフィールド名 ('rarityName' または 'probability')
     * @param value - 新しい値
     */
    const handleRarityChange = useCallback((index: number, field: keyof RarityConfig, value: string | number) => {
        setEditingRarities(prev => prev.map((rarity, i) => {
            if (i === index) {
                // fieldとvalueの型を明確に制御
                if (field === 'probability') {
                    // 数値に変換し、NaNや負の数の場合は0として扱う。上限は1.0
                    const numValue = Math.min(1.0, Math.max(0, parseFloat(value as string) || 0));
                    return { ...rarity, [field]: numValue };
                }
                
                // 'rarityName' の場合 (stringのみを許可)
                // valueがnumberで渡された場合もstringに変換してRarityConfigの型を維持
                return { ...rarity, [field]: String(value) };
            }
            return rarity;
        }));
    }, []);

    /**
     * 最終的に保存するレアリティ設定の配列を返す
     */
    const getFinalRarityConfig = useCallback((): RarityConfig[] => {
        // 確率が0のものは除外（ただし、空の配列にならないように呼び出し元で制御が必要）
        return editingRarities.filter(r => r.probability > 0);
    }, [editingRarities]);

    return {
        editingRarities,
        totalProbability,
        probabilityMismatch,
        handleAddRarity,
        handleRemoveRarity,
        handleRarityChange,
        getFinalRarityConfig,
    };
};