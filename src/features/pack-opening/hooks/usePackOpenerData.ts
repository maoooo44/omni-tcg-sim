/**
 * src/features/pack-opening/hooks/usePackOpenerData.ts
 * * パック開封機能のロジックと状態管理を行うカスタムフック。
 * ...
 */

import { useState, useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow'; 

import type { Pack } from '../../../models/pack'; 

import { usePackStore } from '../../../stores/packStore'; 
import { simulatePackOpening } from '../../../services/pack-logic/simulationUtils'; 
import { useCardPoolStore } from '../../../stores/cardPoolStore'; 
import { useCurrencyStore } from '../../../stores/currencyStore'; 
import { useUserDataStore } from '../../../stores/userDataStore'; 
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
    const [lastOpenedResults, setLastOpenedResults] = useState<OpenedResultState>({ 
        id: 'initial', // 初期表示用のID
        results: [] 
    });
    
    const [purchaseError, setPurchaseError] = useState<string | null>(null); 
    const [simulationWarning, setSimulationWarning] = useState<string | null>(null); 

    // 🚨 モード取得
    const currentMode = useUserDataStore(state => state.getCurrentMode());
    const isDTCGMode = currentMode === 'dtcg';
    //const isGodMode = currentMode === 'god';

    // クールダウンフックの利用
    const { 
        secondsRemaining: secondsUntilNextOpen, 
        startCooldown 
    } = useCooldownTimer(PACK_OPEN_COOLDOWN_SECONDS);

    // プロパティ名が 'addCards' のため、フック側もそれに合わせる
    const addCardsToPool = useCardPoolStore(state => state.addCards);

    // ★修正1: useCurrencyStore から spendCoins に加えて setCoins を取得する
    const { coins, spendCoins, setCoins } = useCurrencyStore(
        useShallow(state => ({
            coins: state.coins,
            spendCoins: state.spendCoins,
            setCoins: state.setCoins, // ★ setCoins を追加
        }))
    );

    // 初期パック選択ロジック (変更なし)
    useEffect(() => { 
        if (packs.length > 0 && selectedPack === null) {
            let packToSelect: Pack | undefined = packs.find(p => p.packId === preselectedPackId);
            
            if (!packToSelect) {
                packToSelect = packs[0];
            }
            
            if (packToSelect) {
                setSelectedPack(packToSelect); 
                setLastOpenedResults({ id: 'initial-load', results: [] });
            }
        }
    }, [packs, preselectedPackId, selectedPack]); 

    
    const hookHandleOpenPack = async () => { 
        if (!selectedPack) {
            setPurchaseError('パックが選択されていません。');
            return;
        }
        
        // 🚨 修正2a: DTCGモード以外（FREE/GOD）はクールダウンを完全に無視
        if (isDTCGMode && secondsUntilNextOpen > 0) {
            return;
        }

        setPurchaseError(null);
        setSimulationWarning(null);

        const packPrice = selectedPack.price || 0;
        let purchaseSuccessful = true; 
        
        // 🚨 修正2b: DTCGモードの場合のみ通貨を消費 (GOD/FREEモードではスキップ)
        if (isDTCGMode) {
            purchaseSuccessful = await spendCoins(packPrice); 
        }

        if (!purchaseSuccessful) {
            // DTCGモードで通貨消費に失敗した場合のみエラーを設定
            setPurchaseError(`所持コインが不足しています。（必要: ${packPrice} / 所属: ${coins}）`); 
            return;
        }

        try {
            // simulatePackOpening の実行
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
            
            // 🚨 修正2c: DTCGモードの場合のみクールダウンを開始
            if (isDTCGMode) {
                startCooldown();
            }

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
        secondsUntilNextOpen,
        currentMode, 
        setCoins, // ★修正3: setCoins アクションを公開
    };
};