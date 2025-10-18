/**
 * src/features/pack-opener/components/OpenerCard.tsx
 *
 * パック開封シミュレーション機能で使用される、カードのフリップアニメーションを伴うコンポーネントです。
 * CardFaceヘルパーを使用し、isRevealedとdelayに基づき、裏面から表面へカードが回転するアニメーションを表現します。
 * ★ 修正点: Paper から Material UI の Card コンポーネントに置き換えました。
 */

import React from 'react';
// ★ 修正: Paper を削除し、Card を MuiCard としてインポート
import { Box, Card as MuiCard, CardMedia } from '@mui/material';
import type { OpenerCardData } from '../../../models/pack-opener'; 

interface OpenerCardProps {
    cardData: OpenerCardData | null;
    cardBackUrl: string;       // パックの裏面画像
    isRevealed: boolean;       // カードが表になっているか (フリップ状態)
    delay: number;             // アニメーション遅延時間 (シーケンシャル開封用)
    onClick?: (card: OpenerCardData)  => void;
}

import { 
    DEFAULT_PACK_DECK_WIDTH as PACK_CARD_WIDTH,
    DEFAULT_PACK_DECK_HEIGHT as PACK_CARD_HEIGHT
} from '../../../utils/imageUtils'; 


// カードの表面・裏面を描画するヘルパーコンポーネント
interface CardFaceProps {
    imageUrl: string;
    isBack: boolean; // true: 裏面 (デフォルト180度回転), false: 表面 (デフォルト0度回転)
}

const CardFace: React.FC<CardFaceProps> = ({ imageUrl, isBack }) => (
    <Box
        sx={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            backfaceVisibility: 'hidden', // 裏面を見えなくする
            transform: isBack ? 'rotateY(180deg)' : 'rotateY(0deg)', // 裏面は初期状態で180度回転
            // ★ 修正: 親の Card が角丸を持つため、このコンポーネントから borderRadius を削除
            overflow: 'hidden',
        }}
    >
        <CardMedia
            component="img"
            image={imageUrl}
            alt={isBack ? 'Card Back' : 'Card Front'}
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
    cardBackUrl,
    isRevealed,
    delay,
    onClick
}) => {
    const frontImage = cardData?.imageUrl || cardBackUrl;
    const backImage = cardBackUrl; 


    // アニメーションスタイル
    const flipStyle = {
        // delayミリ秒後に0.5秒かけて回転
        transition: `transform 0.5s ease-out ${delay}ms`,
        // isRevealed=trueで0度 (表)、falseで180度 (裏)
        transform: isRevealed ? 'rotateY(0deg)' : 'rotateY(180deg)',
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
                // サイズを固定値に変更
                width: PACK_CARD_WIDTH, 
                height: PACK_CARD_HEIGHT,
                
                cursor: isRevealed && cardData ? 'pointer' : 'default',
            }}
            onClick={handleClick}
        >
            {/* ★ 修正: Paper を MuiCard に置き換え。Card はデフォルトで影と角丸を持つ。 */}
            <MuiCard
                // 3D回転アニメーションを適用するラッパー
                sx={{
                    width: '100%',
                    height: '100%',
                    position: 'relative',
                    transformStyle: 'preserve-3d', // 3D維持
                    ...flipStyle, // flipStyle を適用してアニメーション
                    // boxShadow: 3 は MuiCard がデフォルトで持つため省略可能だが、明示的に指定しても良い
                }}
            >
                {/* カード裏面 (初期表示) */}
                <CardFace
                    imageUrl={backImage}
                    isBack={true}
                />
                {/* カード表面 (回転後) */}
                <CardFace
                    imageUrl={frontImage}
                    isBack={false}
                />
            </MuiCard>
        </Box>
    );
};

export default OpenerCard;