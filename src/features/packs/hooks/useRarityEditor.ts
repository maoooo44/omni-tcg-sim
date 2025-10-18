/**
 * src/features/packs/hooks/useRarityEditor.ts
 *
 * パックのレアリティ設定（rarityName, probability, specialProbability, fixedValue）の編集ロジックと
 * 状態を管理するカスタムフック。
 * アドバンスドモードの切り替え、確率とスロット数の合計バリデーションを行う。
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import type { RarityConfig, AdvancedRarityConfig } from '../../../models/pack'; 
// Packの型定義は外部から渡されるため、AdvancedRarityConfig をベースに修正

const DEFAULT_PROBABILITY = 0.0001; 
const DEFAULT_SPECIAL_PROBABILITY = 0.0; // ★ NEW: 特殊確率のデフォルト
const DEFAULT_FIXED_VALUE = 0; // 確定枚数 (整数)
const DEFAULT_RARITY_NAME = 'NewRarity';
const DEFAULT_SPECIAL_PROBABILITY_SLOTS = 0; // ★ NEW: 特殊確率枠のデフォルト数

// 編集ロジックで使用する型として AdvancedRarityConfig をベースにする
type EditingRarity = AdvancedRarityConfig & { specialProbability: number }; 

const INITIAL_FALLBACK_RARITY: EditingRarity = { 
    rarityName: 'Common', 
    probability: 1.0, 
    specialProbability: 0.0, 
    fixedValue: 0 
}; 

// 許容誤差を定義（小数点以下の丸め込み誤差に対応）
const EPSILON = 1e-6; 

/**
 * レアリティ設定の編集ロジックと状態を管理するカスタムフック
 * @param initialRarities - 編集対象の現在のレアリティ設定 (AdvancedRarityConfig[] を想定)
 * @param initialIsAdvanced - 初期のアドバンスドモードの状態
 * @param initialSpecialProbabilitySlots - ★ NEW: 特殊確率枠数の初期値
 * @param cardsPerPack - ★ NEW: パックの封入枚数 (バリデーションに使用)
 */
export const useRarityEditor = (
    initialRarities: EditingRarity[], 
    initialIsAdvanced: boolean,
    initialSpecialProbabilitySlots: number,
    cardsPerPack: number
) => {
    
    const [isAdvancedEnabled, setIsAdvancedEnabled] = useState(initialIsAdvanced);
    // ★ 状態: 特殊確率枠数
    const [specialProbabilitySlots, setSpecialProbabilitySlots] = useState(initialSpecialProbabilitySlots); 

    // initialRaritiesが空の場合はデフォルト設定を使用するロジックを分離
    const getSafeInitialRarities = useCallback((rarities: EditingRarity[]): EditingRarity[] => {
        const safeRarities = rarities.map(r => ({
            ...r,
            fixedValue: Math.round(r.fixedValue ?? 0), // 確定枚数は整数として扱う
            specialProbability: r.specialProbability ?? 0.0, // specialProbabilityを保証
        }));
        return safeRarities.length > 0 ? safeRarities : [INITIAL_FALLBACK_RARITY];
    }, []);

    const [editingRarities, setEditingRarities] = useState<EditingRarity[]>(
        getSafeInitialRarities(initialRarities)
    );

    // 外部からの初期値変更を監視し、状態をリセット
    useEffect(() => {
        setEditingRarities(getSafeInitialRarities(initialRarities));
        setIsAdvancedEnabled(initialIsAdvanced);
        setSpecialProbabilitySlots(initialSpecialProbabilitySlots);
    }, [initialRarities, initialIsAdvanced, initialSpecialProbabilitySlots, getSafeInitialRarities]); 

    // --- 計算ロジック ---

    /**
     * 全レアリティの基本確率 (probability) を合計する
     */
    const totalProbability = useMemo(() => {
        return editingRarities.reduce((sum, r) => sum + (r.probability || 0), 0);
    }, [editingRarities]);

    /**
     * 合計基本確率が1.0から大きく乖離しているかチェック
     */
    const probabilityMismatch = useMemo(() => {
        return Math.abs(totalProbability - 1.0) > EPSILON; 
    }, [totalProbability]);

    /**
     * ★ NEW: 全レアリティの特殊確率 (specialProbability) を合計する
     */
    const totalSpecialProbability = useMemo(() => {
        return editingRarities.reduce((sum, r) => sum + (r.specialProbability || 0), 0);
    }, [editingRarities]);

    /**
     * ★ NEW: 合計特殊確率が1.0から大きく乖離しているかチェック
     */
    const specialProbabilityMismatch = useMemo(() => {
        if (!isAdvancedEnabled) return false;
        return Math.abs(totalSpecialProbability - 1.0) > EPSILON; 
    }, [totalSpecialProbability, isAdvancedEnabled]);

    /**
     * 全レアリティの確定数 (fixedValue) を合計する
     */
    const totalFixedValue = useMemo(() => {
        // fixedValueはハンドラで既に整数化されていることを前提とする
        return editingRarities.reduce((sum, r) => sum + (r.fixedValue || 0), 0);
    }, [editingRarities]);

    /**
     * ★ NEW: 基本抽選枠数（残りスロット数）を計算
     */
    const baseDrawSlots = useMemo(() => {
        if (!isAdvancedEnabled) {
            // クラシックモードでは全スロットが基本抽選枠
            return cardsPerPack; 
        }
        // 基本抽選枠 = 全スロット - 確定枠合計 - 特殊確率枠
        return cardsPerPack - totalFixedValue - specialProbabilitySlots;
    }, [isAdvancedEnabled, cardsPerPack, totalFixedValue, specialProbabilitySlots]);

    /**
     * ★ NEW: 基本抽選枠数が0未満になっていないかチェック
     */
    const baseDrawSlotsNegative = useMemo(() => {
        if (!isAdvancedEnabled) return false;
        return baseDrawSlots < 0;
    }, [isAdvancedEnabled, baseDrawSlots]);

    /**
     * ★ REMOVED: fixedValueMismatch は handleFixedValueChange で整数化を強制するため削除。
     * 念のため、totalFixedValue が整数であるかどうかのチェックは残すが、UIバリデーションとしては使用しない。
     */
    /*onst isTotalFixedValueInteger = useMemo(() => {
         return Math.abs(totalFixedValue - Math.round(totalFixedValue)) < EPSILON; 
    }, [totalFixedValue]);*/


    // --- ハンドラ ---

    /**
     * アドバンスドモードのトグル
     */
    const handleAdvancedToggle = useCallback((newEnabledState: boolean) => {
        setIsAdvancedEnabled(newEnabledState);
        
        if (!newEnabledState) {
            // クラシックモードに戻る場合、特殊抽選枠をデフォルトにリセット
            setSpecialProbabilitySlots(DEFAULT_SPECIAL_PROBABILITY_SLOTS);
        }
    }, []);
    
    /**
     * ★ NEW: 特殊確率枠数の変更 (整数のみ)
     */
    const handleSpecialProbabilitySlotsChange = useCallback((value: string | number) => {
        let numValue = parseInt(String(value), 10);
        if (isNaN(numValue) || numValue < 0) numValue = 0;
        
        // 封入枚数を超える値を設定しようとした場合、最大値にクランプする
        numValue = Math.min(numValue, cardsPerPack); 

        setSpecialProbabilitySlots(numValue);
    }, [cardsPerPack]);


    /**
     * 新しいレアリティを追加
     */
    const handleAddRarity = useCallback(() => {
        setEditingRarities(prev => [
            ...prev,
            {
                rarityName: `${DEFAULT_RARITY_NAME}_${prev.length + 1}`, 
                probability: DEFAULT_PROBABILITY,
                specialProbability: DEFAULT_SPECIAL_PROBABILITY, // ★ 追加
                fixedValue: DEFAULT_FIXED_VALUE,
            } as EditingRarity,
        ]);
    }, []);

    /**
     * 指定したインデックスのレアリティ名または確率を変更
     * @param field - 変更するフィールド名 ('rarityName', 'probability', 'specialProbability')
     */
    const handleRarityChange = useCallback((index: number, field: keyof EditingRarity, value: string | number) => {
        setEditingRarities(prev => prev.map((rarity, i) => {
            if (i === index) {
                if (field === 'probability' || field === 'specialProbability') { 
                    // 数値に変換。NaN、負の数の場合は0、上限は1.0 
                    const numValue = Math.min(1.0, Math.max(0, parseFloat(value as string) || 0));
                    return { ...rarity, [field]: numValue };
                }
                
                // 'rarityName' の場合 (stringのみを許可)
                return { ...rarity, [field]: String(value) };
            }
            return rarity;
        }));
    }, []);
    
    /**
     * 確定枚数 (fixedValue) を変更 (整数のみに強制)
     */
    const handleFixedValueChange = useCallback((index: number, value: string | number) => {
        setEditingRarities(prev => prev.map((rarity, i) => {
            if (i === index) {
                // ★ 修正: 整数に強制変換。NaN、負の数の場合は0
                let numValue = parseInt(String(value), 10);
                if (isNaN(numValue) || numValue < 0) numValue = 0;
                
                return { ...rarity, fixedValue: numValue };
            }
            return rarity;
        }));
    }, []);


    /**
     * 最終的に保存するレアリティ設定の配列を返す
     */
    const getFinalRarityConfig = useCallback((isAdvancedMode: boolean) => {
        // 確率、特殊確率、固定数のすべてが0のものは除外
        const filteredRarities = editingRarities.filter(r => r.probability > 0 || r.specialProbability > 0 || r.fixedValue > 0);

        if (isAdvancedMode) {
            // AdvancedRarityConfig[] を返す
            return filteredRarities as AdvancedRarityConfig[];
        } else {
            // RarityConfig[] を返す (fixedValue, specialProbability を除外)
            return filteredRarities.map(r => ({
                rarityName: r.rarityName,
                probability: r.probability
            })) as RarityConfig[];
        }
    }, [editingRarities]);

    const handleRemoveRarity = useCallback((index: number) => {
        setEditingRarities(prev => {
            if (prev.length <= 1) {
                console.warn('少なくとも1つのレアリティが必要です。');
                return prev;
            }
            return prev.filter((_, i) => i !== index);
        });
    }, []);

    return {
        editingRarities,
        isAdvancedEnabled,
        specialProbabilitySlots, 
        totalProbability,
        probabilityMismatch,
        totalSpecialProbability, 
        specialProbabilityMismatch, // ★ NEW
        totalFixedValue, 
        baseDrawSlots, // ★ NEW
        baseDrawSlotsNegative, // ★ NEW: バリデーションフラグ
        // fixedValueMismatch は削除
        handleAdvancedToggle,
        handleSpecialProbabilitySlotsChange, // ★ NEW
        handleFixedValueChange,
        handleAddRarity,
        handleRemoveRarity,
        handleRarityChange,
        getFinalRarityConfig,
        // 保存時にPack全体を更新するための情報
        getFinalPackDetails: useCallback(() => ({
            isAdvancedRulesEnabled: isAdvancedEnabled,
            specialProbabilitySlots: specialProbabilitySlots,
        }), [isAdvancedEnabled, specialProbabilitySlots])
    };
};