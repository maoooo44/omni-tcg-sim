// src/pages/PackOpenerPage.tsx (あなたが適用すべき最終コード)
// 💡 重要なのは、ここに ZUSTANDストアのインポートや useState/useEffect が一切ないことです。

import React from 'react';
import { useParams } from '@tanstack/react-router'; 
import { 
    Box, Typography, Divider
} from '@mui/material';
import PackOpener from '../features/pack-opening/PackOpener'; // これに全てのロジックを委譲

interface PackOpenerParams { 
    packId: string; 
}

const PackOpenerPage: React.FC = () => {
    const { packId } = useParams({ strict: false }) as PackOpenerParams;
    
    return (
        <Box sx={{ p: 2 }}>
            <Typography variant="h4" gutterBottom>
                パック開封シミュレータ
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <PackOpener preselectedPackId={packId} />
        </Box>
    );
};

export default PackOpenerPage;