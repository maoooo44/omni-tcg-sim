/**
 * src/features/packs/components/PackPreviewCard.tsx
 *
 * パック編集画面などの、パック管理機能内で使用されるプレビュー画像コンポーネントです。
 * Packモデルデータを受け取り、パック画像（またはプレースホルダー画像）と指定されたサイズで表示します。
 * 画像URLがない場合は、パック名とPack Management機能に合わせた特定の色（'3498db'）でプレースホルダー画像を生成します。
 */

import React from 'react';
import { Box } from '@mui/material';
import type { Pack } from '../../../models/pack'; // パス修正
import {
    getDisplayImageUrl,
    DEFAULT_PACK_DECK_WIDTH as PACK_PREVIEW_W,
    DEFAULT_PACK_DECK_HEIGHT as PACK_PREVIEW_H
} from '../../../utils/imageUtils'; // パス修正

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