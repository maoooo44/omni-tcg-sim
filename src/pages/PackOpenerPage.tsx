/**
* src/pages/PackOpenerPage.tsx
*
* パック開封シミュレータのページコンポーネント。
* URLパラメータからpackIdを取得し、PackOpener Featureコンポーネントにロジックを委譲する。
* このページ自体には状態管理ロジックを含まない。
*/
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