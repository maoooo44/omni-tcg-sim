/**
 * src/stores/currencyStore.ts
 *
 * Zustandを使用してユーザーの仮想通貨（コイン）を管理するストア。
 * IndexedDB（currencyService）と連携し、通貨のロード、加算、減算、リセット、
 * およびDBへの永続化を処理する。
 */

import { create } from 'zustand';
import { currencyService } from '../services/currency/currencyService'; 

export interface CurrencyState {
    coins: number;
    
    // --- アクション ---
    /** DBから通貨をロードし、ストアを初期化する */
    fetchCurrency: () => Promise<void>;
    /** 通貨の加算 */
    addCoins: (amount: number) => Promise<void>;
    /** 通貨の減算（購入処理）。成功/失敗を返す */
    spendCoins: (amount: number) => Promise<boolean>; 
    /** デバッグ用リセット */
    resetCurrency: () => Promise<void>; 
    /** コインを直接設定する（デバッグ/ゴッドモード用） */
    setCoins: (amount: number) => Promise<void>; 
}

const INITIAL_COINS = 5000; // 初期所持金
const DEFAULT_CURRENCY_STATE = { coins: INITIAL_COINS };

export const useCurrencyStore = create<CurrencyState>((set, get) => ({
    coins: INITIAL_COINS,
    
    // DBから通貨をロードし、ストアを初期化
    fetchCurrency: async () => {
        try {
            // currencyService.loadCoins() からデータを取得
            const coins = await currencyService.loadCoins();
            // DBが空の場合はデフォルト値を適用
            const loadedCoins = coins !== undefined ? coins : INITIAL_COINS;
            
            set({ coins: loadedCoins });
            console.log(`✅ [CurrencyStore] Loaded ${loadedCoins} coins.`);
        } catch (error) {
            console.error('Failed to load currency:', error);
        }
    },
    
    // 通貨の加算とDB保存
    addCoins: async (amount) => {
        // ストアを更新
        set(state => ({ coins: state.coins + amount }));
        
        // DBに保存
        await currencyService.saveCoins(get().coins);
        console.log(`+${amount} coins added. New balance: ${get().coins}`);
    },

    // 通貨の減算とDB保存
    spendCoins: async (amount) => {
        const currentCoins = get().coins;
        
        if (currentCoins < amount) {
            return false; // 失敗
        }
        
        // 1. ストアを更新
        set(state => ({ coins: state.coins - amount }));
        
        // 2. DBに保存
        await currencyService.saveCoins(get().coins);

        console.log(`-${amount} coins spent. New balance: ${get().coins}`);
        return true; // 成功
    },
    
    // コインを直接設定するアクション
    setCoins: async (amount) => {
        // マイナスを許可しない
        const validatedAmount = Math.max(0, amount); 
        
        // 1. ストアを更新
        set({ coins: validatedAmount });
        
        // 2. DBに保存
        await currencyService.saveCoins(validatedAmount);
        console.log(`Coins set directly to ${validatedAmount}.`);
    },

    // リセットとDB保存
    resetCurrency: async () => {
        // 1. DBに初期値を保存（リセット）
        await currencyService.saveCoins(INITIAL_COINS);
        // 2. ストアをリセット
        set(DEFAULT_CURRENCY_STATE); 
        console.log('Currency reset to default.');
    },
}));