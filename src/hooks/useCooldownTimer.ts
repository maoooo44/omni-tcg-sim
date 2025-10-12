/**
 * src/features/pack-opening/hooks/useCooldownTimer.ts
 * 指定された秒数のクールダウンタイマーを管理する汎用フック。
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


    // クールダウンを開始する関数
    const startCooldown = useCallback(() => {
        setLastActionTimestamp(Date.now());
    }, []);

    // タイマーのロジックを管理する useEffect
    useEffect(() => {
        if (lastActionTimestamp === 0) return;

        let timerId: number; 

        const calculateRemainingTime = () => {
            const timeElapsed = Date.now() - lastActionTimestamp;
            const remainingTime = Math.max(0, cooldownSeconds - Math.ceil(timeElapsed / 1000));
            
            setSecondsRemaining(remainingTime);

            if (remainingTime > 0) {
                // 残り時間がある場合、1秒後に再計算
                timerId = window.setTimeout(calculateRemainingTime, 1000);
            }
        };
        
        // 初回実行
        calculateRemainingTime();

        // クリーンアップ
        return () => window.clearTimeout(timerId);
    }, [lastActionTimestamp, cooldownSeconds]); // cooldownSeconds も依存関係に入れる

    return {
        secondsRemaining,
        startCooldown,
    };
};