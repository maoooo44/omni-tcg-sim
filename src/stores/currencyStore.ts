/**
 * src/stores/currencyStore.ts
 *
 * * ユーザーの仮想通貨（コイン）の状態管理を行うZustandストア。
 * 責務は、現在のコイン残高（coins）を保持し、コイン残高の加算・減算・設定・リセットといった
 * トランザクション処理を実行することです。全ての処理は、サービス層（currencyService）を
 * 介してIndexedDBへ永続化されます。
 *
 * * 責務:
 * 1. コイン残高の状態（coins）を保持する。
 * 2. サービス層を介したDBからの初期ロード（fetchCurrency）を行う。DBが空の場合は初期値（INITIAL_COINS）を適用する。
 * 3. コインの増減（addCoins, spendCoins）および直接設定（setCoins）を処理し、トランザクション完了後にDBへ永続化する。
 * 4. コインのリセット（resetCurrency）機能を提供する。
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
        set(state => {
            const newCoins = state.coins + amount;
            // ゼロ以下にならないようにガード（ただし加算では通常不要）
            return { coins: Math.max(0, newCoins) };
        });

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
        // set関数内で最新の状態を参照するため、get().coinsの代わりにstate.coinsを使用
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