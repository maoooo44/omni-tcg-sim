/**
 * src/features/pack-opener/components/OpenerCard.tsx
 *
 * パック開封シミュレーションのカード表示とフリップアニメーションを担当するプレゼンテーションコンポーネント。
 * * 責務:
 * 1. 3D CSSプロパティ (`perspective`, `transformStyle: 'preserve-3d'`) を使用し、カードのフリップアニメーションを実装する。
 * 2. `isRevealed` (表裏状態) と `delay` (シーケンシャルアニメーションのための遅延) に基づき、回転状態とアニメーション実行を制御する。
 * 3. ユーティリティ関数を介してカード表面/裏面の画像URLを取得し、ヘルパーコンポーネント `CardFace` に描画を委譲する。
 * 4. `useFixedSize` プロパティによって、固定のパックカードサイズまたは親コンテナに合わせた可変サイズを適用する。
 * 5. カードが表になっている場合のみクリックイベント (`onClick`) を発火させる。
 */

import React from 'react';
import { Box, Paper, CardMedia } from '@mui/material';
import type { OpenerCardData } from '../../../models/packOpener';

interface OpenerCardProps {
    cardData: OpenerCardData | null;
    cardBackImageUrl: string;       // パックの裏面画像
    isRevealed: boolean;       // カードが表になっているか (フリップ状態)
    delay: number;             // アニメーション遅延時間 (シーケンシャル開封用)
    onClick?: (card: OpenerCardData) => void;
    useFixedSize?: boolean;
}

import {
    DEFAULT_PACK_DECK_WIDTH as PACK_CARD_WIDTH,
    DEFAULT_PACK_DECK_HEIGHT as PACK_CARD_HEIGHT,
    getDisplayImageUrl
} from '../../../utils/imageUtils';


// カードの表面・裏面を描画するヘルパーコンポーネント
interface CardFaceProps {
    imageUrl: string;
    isFront: boolean; // true: 表面, false: 裏面
}

const CardFace: React.FC<CardFaceProps> = ({ imageUrl, isFront }) => (
    <Box
        sx={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            backfaceVisibility: 'hidden', // 裏面を隠す
            // 表面は初期180度回転（裏向き）、裏面は初期0度（表向き）
            transform: isFront ? 'rotateY(180deg)' : 'rotateY(0deg)',
            overflow: 'hidden',
        }}
    >
        <CardMedia
            component="img"
            image={imageUrl}
            alt={isFront ? 'Card Front' : 'Card Back'}
            sx={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
            }}
        />
    </Box>
);


const OpenerCard: React.FC<OpenerCardProps> = ({
    cardData,
    cardBackImageUrl,
    isRevealed,
    delay,
    onClick,
    useFixedSize = true,
}) => {
    // 裏面画像: getDisplayImageUrlを使用してプレースホルダーまたは実際の画像URLを取得
    const backImage = getDisplayImageUrl(cardBackImageUrl, {
        width: PACK_CARD_WIDTH,
        height: PACK_CARD_HEIGHT,
        text: 'BACK',
    });

    // 表面画像: カードデータの画像URL、なければプレースホルダーを使用
    const frontImage = cardData?.imageUrl || getDisplayImageUrl(null, {
        width: PACK_CARD_WIDTH,
        height: PACK_CARD_HEIGHT,
        text: 'CARD',
    });

    // アニメーションスタイル
    const flipStyle = {
        // delayミリ秒後に0.5秒かけて回転
        transition: `transform 0.5s ease-out ${delay}ms`,
        // isRevealed=falseで0度 (裏面表示)、trueで180度 (表面表示)
        transform: isRevealed ? 'rotateY(180deg)' : 'rotateY(0deg)',
    };

    // クリックハンドラ
    const handleClick = () => {
        // カードが表になっており、データが存在する場合のみクリックを処理
        if (isRevealed && cardData && onClick) {
            onClick(cardData);
        }
    };

    return (
        <Box
            sx={{
                perspective: '1000px', // 3D効果の基点
                width: useFixedSize ? PACK_CARD_WIDTH : '100%',
                height: useFixedSize ? PACK_CARD_HEIGHT : 'auto',
                aspectRatio: useFixedSize ? undefined : '63 / 88', // 親サイズに合わせる場合はアスペクト比を使用

                cursor: isRevealed && cardData ? 'pointer' : 'default',
            }}
            onClick={handleClick}
        >
            <Paper
                elevation={3}
                sx={{
                    width: '100%',
                    height: '100%',
                    position: 'relative',
                    transformStyle: 'preserve-3d', // 3D維持
                    ...flipStyle, // flipStyle を適用してアニメーション
                    borderRadius: 2,
                }}
            >
                {/* カード表面 (初期180度、親が0度のとき裏向きで隠れる、親が180度のとき360度で表向きで見える) */}
                <CardFace
                    imageUrl={frontImage}
                    isFront={true}
                />
                {/* カード裏面 (初期0度、親が0度のとき表向きで見える) */}
                <CardFace
                    imageUrl={backImage}
                    isFront={false}
                />
            </Paper>
        </Box>
    );
};

export default OpenerCard;