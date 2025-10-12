/**
 * src/features/pack-opening/hooks/usePackOpenerData.ts
 * * パック開封機能のロジックと状態管理を行うカスタムフック。
 * パック選択、コイン消費、パック開封シミュレーション (非同期)、
 * カードプールへの追加、エラー/警告メッセージの管理を行う。
 */

import { useState, useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow'; 

import type { Pack } from '../../../models/pack'; 

import { usePackStore } from '../../../stores/packStore'; 
import { simulatePackOpening } from '../../../services/pack-logic/simulationUtils'; 
import { useCardPoolStore } from '../../../stores/cardPoolStore'; 
import { useCurrencyStore } from '../../../stores/currencyStore'; 

// 🚨 修正1: 汎用フックのパスを修正
import { useCooldownTimer } from '../../../hooks/useCooldownTimer'; 


// 定数: 開封のクールダウン時間 (5秒)
const PACK_OPEN_COOLDOWN_SECONDS = 5;

// 警告ロジック対応のため、新しいシミュレーション結果の型を定義
export interface SimulationResult {
    results: { cardId: string, count: number }[];
    simulationWarning: string | null;
}

// lastOpenedResults の型定義にユニークIDを含める
export interface OpenedResultState {
    id: string; // 毎回ユニークなIDを持たせることで、ReactのuseEffectが確実に発火することを保証
    results: { cardId: string, count: number }[];
}


export const usePackOpenerData = (preselectedPackId?: string) => { 

    const packs = usePackStore(state => state.packs);
    const isLoading = packs.length === 0;

    const [selectedPack, setSelectedPack] = useState<Pack | null>(null);
    // lastOpenedResults の型を OpenedResultState に変更し、nullを許容しない
    const [lastOpenedResults, setLastOpenedResults] = useState<OpenedResultState>({ 
        id: 'initial', // 初期表示用のID
        results: [] 
    });
    
    const [purchaseError, setPurchaseError] = useState<string | null>(null); 
    const [simulationWarning, setSimulationWarning] = useState<string | null>(null); 

    // 🚨 修正2: クールダウンフックの利用
    const { 
        secondsRemaining: secondsUntilNextOpen, 
        startCooldown 
    } = useCooldownTimer(PACK_OPEN_COOLDOWN_SECONDS);

    // プロパティ名が 'addCards' のため、フック側もそれに合わせる
    const addCardsToPool = useCardPoolStore(state => state.addCards);

    const { coins, spendCoins } = useCurrencyStore(
        useShallow(state => ({
            coins: state.coins,
            spendCoins: state.spendCoins,
        }))
    );

    // 初期パック選択ロジック
    useEffect(() => { 
        if (packs.length > 0 && selectedPack === null) {
            let packToSelect: Pack | undefined = packs.find(p => p.packId === preselectedPackId);
            
            if (!packToSelect) {
                packToSelect = packs[0];
            }
            
            if (packToSelect) {
                setSelectedPack(packToSelect); 
                // 初回ロード時にダミー結果をリセット
                setLastOpenedResults({ id: 'initial-load', results: [] });
            }
        }
    }, [packs, preselectedPackId, selectedPack]); 

    
    const hookHandleOpenPack = async () => { 
        if (!selectedPack) {
            setPurchaseError('パックが選択されていません。');
            return;
        }
        
        // 🚨 修正3a: クールダウン中は処理をスキップ (警告表示はPackOpener側で行う)
        if (secondsUntilNextOpen > 0) {
            return;
        }

        setPurchaseError(null);
        setSimulationWarning(null);

        const packPrice = selectedPack.price || 0;
        
        // 🚨 コインチェックはPackOpener側で行うことになったため、ここでは実行しないが
        // 念のため、spendCoinsが失敗した場合の処理は残しておく

        const purchaseSuccessful = await spendCoins(packPrice); 

        if (!purchaseSuccessful) {
            setPurchaseError(`所持コインが不足しています。（必要: ${packPrice} / 所属: ${coins}）`); 
            return;
        }

        try {
            // simulatePackOpening が async になったため await を追加
            const simulationResult = await simulatePackOpening(selectedPack) as SimulationResult;
            const results = simulationResult.results;
            const warning = simulationResult.simulationWarning;
            
            if (warning) {
                setSimulationWarning(warning);
            }

            const cardsToAdd = results.map(r => ({
                cardId: r.cardId,
                count: r.count,
                packId: selectedPack.packId 
            }));

            // カードプールへの追加処理を実行 (非同期)
            await addCardsToPool(cardsToAdd);
            
            // 🚨 修正3b: 開封成功時にクールダウンを開始
            startCooldown();

            // 開封結果にユニークなIDを付けて状態を更新
            setLastOpenedResults({ 
                id: crypto.randomUUID(), 
                results: results 
            }); 

        } catch (error) {
            console.error('パック開封中にエラーが発生しました:', error); 
            setPurchaseError('パック抽選中に致命的なエラーが発生しました。詳細はコンソールを確認してください。'); 
        }
    };


    // --- 戻り値 ---
    return {
        packs, 
        selectedPack,
        // パックを変更したとき、lastOpenedResultsを初期表示状態にリセット
        setSelectedPack: (packId: string) => { 
            const pack = packs.find(p => p.packId === packId);
            setSelectedPack(pack || null); 
            setLastOpenedResults({ id: 'pack-change-reset', results: [] });
        },
        isLoading,
        handleOpenPack: hookHandleOpenPack, 
        lastOpenedResults,
        coins,
        purchaseError,
        setLastOpenedResults,
        simulationWarning,
        // 🚨 修正4: クールダウンの残り時間を公開
        secondsUntilNextOpen,
    };
};