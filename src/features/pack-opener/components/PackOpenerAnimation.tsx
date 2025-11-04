/**
 * src/features/pack-opener/components/PackOpenerAnimation.tsx
 *
 * パック開封シミュレーションの結果表示領域全体と、カードの連続フリップアニメーションを制御するコンポーネント。
 * * 責務:
 * 1. 汎用グリッドコンポーネント (GridDisplay) の代わりに CardList を利用して、開封されたカードリスト (openedCards) を整列表示する。
 * 2. CardListがアイテムの配列を処理する際に、OpenerCardにアニメーション遅延 (delay) を与えるためのラッパーコンポーネント (OpenerCardWrapper) を提供する。
 * 3. 開封状態 (isRevealed) に応じて、カードをクリック可能にするか、結果のサマリーメッセージを表示するかを制御する。
 * 4. グリッドの表示スタイル (aspectRatio, gap, sxOverride, columns) を親コンポーネントから受け取り、CardListに渡す。
 */

import React from 'react';
import { Box, Typography } from '@mui/material';

// OpenerCard (CardFaceを使用する採用版) をインポート
import OpenerCard from './OpenerCard';
// 💡 修正: GridDisplay を CardList に変更
import CardList from '../../cards/components/CardList';
import type { CardListProps } from '../../cards/components/CardList';
import type { OpenerCardData } from '../../../models/models'; // OpenerCardData は CardType と互換性がある想定

interface PackOpenerAnimationProps {
    openedCards: OpenerCardData[]; // 封入されたカードのリスト
    isRevealed: boolean; // フリップ状態 (PackOpenerから受け取る)
    cardBackImageUrl: string; // 裏面画像URL (PackOpenerから受け取る)
    onCardClick: (card: OpenerCardData) => void;
    
    // 💡 CardList に合わせるため、GridDisplay の Props を展開
    sxOverride: CardListProps['gridRenderUnit']['sxOverride'];
    aspectRatio: CardListProps['gridRenderUnit']['aspectRatio'];
    gap: CardListProps['gridRenderUnit']['gap'];
}

const FLIP_DELAY_MS = 100; // カード1枚あたりのフリップ開始遅延

// OpenerCard用のラッパーコンポーネント（コンポーネント外で定義してメモ化）
// 💡 CardListの ItemComponent として渡されるProps構造に合わせる
interface OpenerCardWrapperProps {
    // CardListから渡されるアイテムは CardType の拡張または互換性がある必要があります
    item: OpenerCardData & { index: number }; // index は CardList の GridDisplay が自動で付与する
    index?: number; // OpenerCardWrapperProps では OpenerCardWrapper 内部の index (Props) を使うため、item.index 以外に index も受け取る
    // CardList の extraItemProps として渡された Props
    isRevealed: boolean;
    cardBackImageUrl: string;
    onCardClick: (card: OpenerCardData) => void;
    // itemProps の中に aspectRatio が含まれていないため削除
    // aspectRatio: number; 
}

const OpenerCardWrapper: React.FC<OpenerCardWrapperProps> = React.memo(({ 
    item, 
    index = 0, 
    isRevealed, 
    cardBackImageUrl, 
    onCardClick 
}) => {
    // GridDisplayから渡されるindexを優先的に使用し、遅延時間を計算
    const finalIndex = item.index ?? index;
    
    return (
        <OpenerCard
            cardData={item} // item は OpenerCardData と互換性がある
            isRevealed={isRevealed}
            cardBackImageUrl={item.cardBackImageUrl || cardBackImageUrl}
            delay={finalIndex * FLIP_DELAY_MS} // 💡 index を使用
            onClick={onCardClick}
            useFixedSize={false} // 親コンテナサイズに合わせる
        />
    );
});


const PackOpenerAnimation: React.FC<PackOpenerAnimationProps> = ({
    openedCards,
    isRevealed,
    cardBackImageUrl,
    onCardClick,
    sxOverride,
    aspectRatio,
    gap,
}) => {
    // 💡 CardListに渡すための GridProps を構築
    const gridRenderUnit: CardListProps['gridRenderUnit'] = {
        sxOverride,
        aspectRatio,
        gap,
    };
    
    // 💡 CardListに渡すための extraItemProps (OpenerCardWrapperのProps) を構築
    const extraItemProps: CardListProps['extraItemProps'] = {
        isRevealed,
        cardBackImageUrl,
        onCardClick,
    };

    // 💡 totalCardCount, isFilterActive, searchTerm は PackOpener では通常不要だが、CardListの必須Propsのためダミーを渡す
    const dummyRequiredProps = {
        totalCardCount: openedCards.length,
        isFilterActive: false,
        searchTerm: '',
    };
    
    // CardList は CardType[] を期待するが、OpenerCardData が互換性を持つためそのまま渡す
    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>

            {/* 2. カード表示グリッドを CardList に置き換え */}
            <CardList
                cards={openedCards as any} // CardType[] と互換性がある OpenerCardData[] を渡す
                context="pack-opener"
                
                // 必須Props
                {...dummyRequiredProps}
                
                // グリッド設定
                gridRenderUnit={ gridRenderUnit }
                
                // 💡 修正: アイテムコンポーネントを OpenerCardWrapper に置き換える
                itemComponentOverride={OpenerCardWrapper as any}
                // 💡 修正: OpenerCardWrapper が必要とするPropsを extraItemProps として渡す
                extraItemProps={extraItemProps}
                
                // CardList のデフォルトの onCardClick は OpenerCardWrapper の onCardClick と機能が重複するため、ここでは渡さない

                // OpenerCardWrapper 側で onCardClick を利用しているため、CardList の onCardClick は不要だが、
                // OpenerCardWrapper の onCardClick は CardList が ItemComponent に渡す itemProps の一部として渡される
                // OpenerCardWrapper の itemProps の定義を修正し、extraItemProps を経由
            />

            {/* 3. 結果のサマリー (開封後に表示) */}
            {isRevealed && (
                <Box sx={{ mt: 4, textAlign: 'center' }}>
                    <Typography variant="h6" color="success.main">
                        開封結果が表示されました！
                    </Typography>
                </Box>
            )}
        </Box>
    );
};

export default PackOpenerAnimation;