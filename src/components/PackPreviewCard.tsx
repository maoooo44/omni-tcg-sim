/**
 * src/components/PackPreviewCard.tsx
 *
 * パックのプレビュー画像を表示するコンポーネントです。
 * 共通の画像ユーティリティを使用して、画像URLがない場合に指定されたサイズと色で
 * パック名を含むプレースホルダー画像を生成・表示します。
 */

import React from 'react';
import { Box } from '@mui/material';
import type { Pack } from '../models/pack';
import {
    getDisplayImageUrl,
    DEFAULT_PACK_DECK_WIDTH as PACK_PREVIEW_W,
    DEFAULT_PACK_DECK_HEIGHT as PACK_PREVIEW_H
} from '../utils/imageUtils';

interface PackPreviewCardProps {
    pack: Pack | null; // PackDataのnullチェックは利用側で制御すべきだが、安全のため許容
}

// 画像プレースホルダーオプションをコンポーネント内部で定義（UIの責務）
const PACK_PLACEHOLDER_OPTIONS = {
    width: PACK_PREVIEW_W,
    height: PACK_PREVIEW_H,
    bgColor: '3498db', // パック編集画面用の色
};

const PackPreviewCard: React.FC<PackPreviewCardProps> = ({ pack }) => {
    if (!pack) return null;

    const imageUrl = getDisplayImageUrl(pack.imageUrl, {
        ...PACK_PLACEHOLDER_OPTIONS,
        text: pack.name // パック名をプレースホルダーテキストに利用
    });

    return (
        <Box sx={{ mb: 2, textAlign: 'center' }}>
            <img
                src={imageUrl}
                alt={`${pack.name} パック画像`}
                style={{
                    width: PACK_PREVIEW_W,
                    height: PACK_PREVIEW_H,
                    objectFit: 'cover',
                    borderRadius: 4,
                    border: '1px solid #ddd'
                }}
            />
        </Box>
    );
};

export default PackPreviewCard;