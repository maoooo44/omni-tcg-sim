/**
 * src/services/pack-logic/packUtils.ts
 *
 * パックデータに関連するユーティリティ関数（ID生成、デフォルトパック作成、
 * カード総数計算（スタブ））を提供する。
 */
import { generateUUID } from '../../utils/uuidUtils'; 
import type { Pack } from "../../models/pack"; 

/**
 * ユニークなパックIDを生成する。
 * @returns {string} 生成されたユニークなパックID (UUID)
 */
export const generatePackId = (): string => {
    return generateUUID();
};


/**
 * パックデータに含まれる全てのユニークカード総数（Pack.totalCards）を計算する。（現状スタブ）
 * @param {Pack} _pack - 計算対象のパックオブジェクト
 * @returns {number} 総収録カード数
 */
export const calculateTotalCards = (_pack: Pack): number => {
    // フェーズ1後半またはフェーズ2で、DBから紐づくカードをカウントするロジックを実装します。
    return 0;
};

// パックの初期値を生成する関数（新規作成時用）
export const createDefaultPack = (): Pack => {
    const defaultPack: Pack = {
        packId: generatePackId(),
        name: '新規パック',
        series: '未定',
        packType: 'Booster', 
        cardsPerPack: 12, 
        rarityConfig: [ 
            { rarityName: 'Common', probability: 0.75 },
            { rarityName: 'Uncommon', probability: 0.20 },
            { rarityName: 'Rare', probability: 0.05 },
        ],
        totalCards: 0, // 総収録カード数は初期値0
        imageUrl: '',
        cardBackUrl: '',
        price: 300, 
        description: 'ブースターパックの説明をここに入力してください。', 
        releaseDate: new Date().toISOString().split('T')[0], 
        userCustom: {},
        isOpened: false, 
    };
    
    return defaultPack;
};