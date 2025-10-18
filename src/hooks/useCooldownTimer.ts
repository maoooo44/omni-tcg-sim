/**
 * src/hooks/useCooldownTimer.ts
 * 
 * 指定された秒数のクールダウンタイマーを管理する汎用フック。
 * 最後にアクションが実行された時刻を基準に、残り時間を計算し、タイマーのドリフトを最小限に抑える。
 */
import { useState, useEffect, useCallback } from 'react';

/**
 * クールダウンタイマーを管理するカスタムフック
 * @param cooldownSeconds クールダウンが必要な秒数
 * @returns {secondsRemaining: number, startCooldown: () => void}
 */
export const useCooldownTimer = (cooldownSeconds: number) => {
    // 最後にクールダウンを開始した時刻 (ミリ秒のタイムスタンプ)
    const [lastActionTimestamp, setLastActionTimestamp] = useState<number>(0);
    // 次のアクションまで待つ必要がある秒数
    const [secondsRemaining, setSecondsRemaining] = useState<number>(0);


    /**
     * クールダウンを開始する関数。現在の時刻をアクション時刻として記録する。
     */
    const startCooldown = useCallback(() => {
        setLastActionTimestamp(Date.now());
    }, []);

    // タイマーのロジックを管理する useEffect
    useEffect(() => {
        // lastActionTimestampが0の場合はクールダウンタイマーを起動しない
        if (lastActionTimestamp === 0) return;

        let timerId: number; 

        /**
         * 残り時間を計算し、状態を更新する再帰関数
         */
        const calculateRemainingTime = () => {
            const timeElapsed = Date.now() - lastActionTimestamp; // 経過時間 (ms)
            
            // 残り時間を計算 (秒単位で切り上げ、最小値は0)
            const remainingTime = Math.max(0, cooldownSeconds - Math.ceil(timeElapsed / 1000));
            
            setSecondsRemaining(remainingTime);

            if (remainingTime > 0) {
                // 残り時間がある場合、1秒後に再計算
                timerId = window.setTimeout(calculateRemainingTime, 1000);
            }
        };
        
        // 初回実行
        calculateRemainingTime();

        // クリーンアップ: 次の実行前、またはアンマウント時にタイマーを停止する
        return () => window.clearTimeout(timerId);
    }, [lastActionTimestamp, cooldownSeconds]); // lastActionTimestampとcooldownSecondsの変更に反応

    return {
        secondsRemaining,
        startCooldown,
    };
};