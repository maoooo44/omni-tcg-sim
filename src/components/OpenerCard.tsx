/**

 * src/components/OpenerCard.tsx

 *

 * パック開封シミュレーションで使用される、カードのフリップアニメーションを伴うコンポーネントです。

 */



import React from 'react';

import { Box, Paper, CardMedia } from '@mui/material'; // 💡 修正: CardMedia を追加

import type { Card as CardType } from '../models/card';



interface OpenerCardProps {

    cardData: CardType | null; // 開封後に表示するカードデータ

    cardBackUrl: string;       // パックの裏面画像

    isRevealed: boolean;       // カードが表になっているか (フリップ状態)

    delay: number;             // アニメーション遅延時間 (シーケンシャル開封用)

    onClick?: (card: CardType) => void; // カードが表になった時のクリックハンドラ

}



const DEFAULT_BACK_URL = 'https://via.placeholder.com/300x420?text=Card+Back';

const DEFAULT_FRONT_URL = 'https://via.placeholder.com/300x420?text=Card+Front';



// 💡 追加: カードの表面・裏面を描画するヘルパーコンポーネント

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

            borderRadius: 1,

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

    onClick // 💡 使用: onClick が関数として使用されます

}) => {



    // カードのフロント画像 💡 使用: frontImage

    const frontImage = cardData?.imageUrl || DEFAULT_FRONT_URL;

    // カードのバック画像 💡 使用: backImage

    const backImage = cardBackUrl || DEFAULT_BACK_URL;



    // アニメーションスタイル 💡 使用: flipStyle

    const flipStyle = {

        // delayミリ秒後に0.5秒かけて回転

        transition: `transform 0.5s ease-out ${delay}ms`,

        // isRevealed=trueで0度 (表)、falseで180度 (裏)

        transform: isRevealed ? 'rotateY(0deg)' : 'rotateY(180deg)',

    };



    // 💡 追加: クリックハンドラ

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

                width: '100%',

                maxWidth: 200,

                aspectRatio: '3 / 4.2', // 標準的なカードのアスペクト比

                cursor: isRevealed && cardData ? 'pointer' : 'default',

            }}

            onClick={handleClick}

        >

            <Paper

                // 3D回転アニメーションを適用するラッパー

                sx={{

                    width: '100%',

                    height: '100%',

                    position: 'relative',

                    transformStyle: 'preserve-3d', // 3D維持

                    ...flipStyle, // 💡 修正: flipStyle を適用してアニメーション

                    boxShadow: 3,

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

            </Paper>

        </Box>

    );

};



export default OpenerCard;