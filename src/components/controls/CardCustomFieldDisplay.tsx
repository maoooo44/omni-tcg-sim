/**
 * src/components/controls/CardCustomFieldDisplay.tsx
 *
 * Card.userCustom オブジェクトを受け取り、それを Key-Value のリストとして
 * 整形して表示する役割を持つコンポーネント。カスタムデータの表示ロジックを分離する。
 */
import React from 'react';
import { Box, Typography, Grid } from '@mui/material';

interface CardCustomDataDisplayProps {
    userCustom: Record<string, any>;
    isMobile: boolean;
}

const CardCustomDataDisplay: React.FC<CardCustomDataDisplayProps> = ({ userCustom, isMobile }) => {
    const customEntries = Object.entries(userCustom);

    if (customEntries.length === 0) {
        return null;
    }

    // Grid v7対応
    const sizeProps = isMobile ? { xs: 12 } : { xs: 12, sm: 6 };

    return (
        <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom>
                カスタム情報
            </Typography>
            <Grid container spacing={1}>
                {customEntries.map(([key, value]) => (
                    <Grid size={sizeProps} key={key}> 
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            {key}:
                        </Typography>
                        <Typography variant="body1">
                            {/* 値がオブジェクトの場合はJSON文字列に変換して表示、それ以外は文字列化 */}
                            {typeof value === 'object' && value !== null 
                                ? JSON.stringify(value)
                                : String(value)}
                        </Typography>
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
};

export default CardCustomDataDisplay;