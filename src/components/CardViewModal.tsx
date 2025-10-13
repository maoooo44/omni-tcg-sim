/**
 * src/components/CardViewModal.tsx
 *
 * どの画面からでも呼び出される、カード情報表示用のモーダル。
 * Zustandストア (useUIStore) から表示状態とカードIDを取得し、
 * 各ストアからデータをロードして表示する。
 */
import React from 'react';
import { 
    Dialog, 
    DialogContent, 
    Typography, 
    Box, 
    IconButton, 
    useTheme, 
    useMediaQuery, 
    Grid,
    Card as MuiCard,
    CardMedia,
    Chip,
    Alert
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useShallow } from 'zustand/react/shallow';

// 💡 修正: 依存関係を既存のストアファイルからインポート
import { useUIStore } from '../stores/uiStore'; 
import { useCardStore } from '../stores/cardStore';
import { usePackStore } from '../stores/packStore';
// 💡 修正: 既存の utils/imageUtils からインポート
import { getDisplayImageUrl, type ImageDisplayOptions } from '../utils/imageUtils';

// 💡 モデルは既存のパスからインポート
import type { Card } from '../models/card';
import type { Pack } from '../models/pack'; // PackはPackStoreから取得されるPack[]の要素型として使用

// プレースホルダーのデフォルトオプション (imageUtilsに存在するものと想定して、ここでは仮の定数を定義)
const PLACEHOLDER_OPTIONS_BASE: Omit<ImageDisplayOptions, 'text'> = {
    width: 400,
    height: 560,
    imgColorPresetKey: 'black', // 例としてデフォルト色を定義
};

// =========================================================================
// CardViewModal コンポーネント本体
// =========================================================================

const CardViewModal: React.FC = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    // 1. UIストアからモーダルの状態とカードIDを取得
    const { isCardViewModalOpen, selectedCardId, closeCardViewModal } = useUIStore(useShallow(state => ({
        isCardViewModalOpen: state.isCardViewModalOpen,
        selectedCardId: state.selectedCardId,
        closeCardViewModal: state.closeCardViewModal,
    })));

    // 2. カードストアから全カードデータを取得
    const allCards: Card[] = useCardStore(state => state.cards);
    
    // 3. パックストアからパック情報を取得
    const packs: Pack[] = usePackStore(state => state.packs);

    // 4. 表示対象のカードを計算
    const card: Card | undefined = allCards.find(c => c.cardId === selectedCardId);
    
    // 5. カードが所属するパック名を取得
    const pack: Pack | undefined = card ? packs.find(p => p.packId === card.packId) : undefined;
    const packName = pack ? pack.name : '不明なパック';

    // 💡 削除: cardDataReady = !!card; は不要

    // プレースホルダーオプションの調整
    const displayOptions: ImageDisplayOptions = {
        ...PLACEHOLDER_OPTIONS_BASE,
        width: isMobile ? 300 : 400,
        height: isMobile ? 420 : 560,
        text: card?.name || 'NO CARD', 
    }
    
    // Grid v7対応: itemを廃止し、xs/smでsizeを指定

    return (
        <Dialog
            open={isCardViewModalOpen}
            onClose={closeCardViewModal}
            maxWidth="md"
            fullScreen={isMobile}
            scroll="body"
            PaperProps={{
                sx: { borderRadius: isMobile ? 0 : 3, m: isMobile ? 0 : 3 }
            }}
        >
            <DialogContent sx={{ p: isMobile ? 2 : 4, minHeight: isMobile ? '100vh' : 'auto' }}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                    <IconButton onClick={closeCardViewModal} size="large">
                        <CloseIcon />
                    </IconButton>
                </Box>
                
                {/* 💡 修正: 条件分岐をシンプル化 */}
                {!card && selectedCardId ? (
                    <Alert severity="warning">
                        カードID: {selectedCardId} の詳細データをストアから**ロードできませんでした**。データストアの状態を確認してください。
                    </Alert>
                ) : !card && !selectedCardId ? (
                     <Alert severity="info">
                         表示するカードが選択されていません。
                     </Alert>
                ) : (
                    // card が存在する場合にのみ、詳細コンテンツを表示
                    <Grid container spacing={isMobile ? 2 : 4}>
                        {/* 左側: カード画像 */}
                        <Grid size={{xs:12, sm:5}}> 
                            <MuiCard elevation={4} sx={{ borderRadius: 2, overflow: 'hidden' }}>
                                <CardMedia
                                    component="img"
                                    image={getDisplayImageUrl(card!.imageUrl, displayOptions)} // card! は cardが存在することを確認済みのため使用
                                    alt={card!.name}
                                    sx={{ 
                                        width: '100%', 
                                        height: isMobile ? 420 : 560, 
                                        objectFit: 'cover' 
                                    }}
                                />
                            </MuiCard>
                        </Grid>

                        {/* 右側: カード詳細情報 */}
                        <Grid size={{xs:12, sm:7}}> 
                            <Box>
                                <Typography 
                                    variant={isMobile ? "h4" : "h3"} 
                                    component="h1" 
                                    fontWeight="bold"
                                    gutterBottom
                                >
                                    {card!.name}
                                </Typography>
                                
                                <Box sx={{ mb: 3, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                    
                                    {/* 💡 追記: 図鑑 No. (number) が存在する場合にチップを表示 */}
                                    {card!.number !== null && card!.number !== undefined && (
                                        <Chip 
                                            label={`図鑑 No.: ${card!.number}`} 
                                            color="info" 
                                            size="medium" 
                                            variant="filled"
                                            sx={{ fontWeight: 'bold' }} 
                                        />
                                    )}

                                    <Chip 
                                        label={`レアリティ: ${card!.rarity}`} 
                                        color="secondary" 
                                        size="medium" 
                                        sx={{ fontWeight: 'bold' }} 
                                    />
                                    <Chip 
                                        label={`収録パック: ${packName}`} 
                                        color="primary" 
                                        variant="outlined"
                                        size="medium"
                                    />
                                    <Chip 
                                        label={`カードID: ${card!.cardId.substring(0, 8)}...`} 
                                        size="small" 
                                    />
                                </Box>

                                {/* カスタムデータ表示 (userCustom) */}
                                {Object.keys(card!.userCustom).length > 0 && (
                                    <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                                        <Typography variant="h6" gutterBottom>
                                            カスタム情報
                                        </Typography>
                                        <Grid container spacing={1}>
                                            {Object.entries(card!.userCustom).map(([key, value]) => (
                                                <Grid size={{xs:12, sm:6}} key={key}> 
                                                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                                        {key}:
                                                    </Typography>
                                                    <Typography variant="body1">
                                                        {typeof value === 'object' && value !== null 
                                                            ? JSON.stringify(value)
                                                            : String(value)}
                                                    </Typography>
                                                </Grid>
                                            ))}
                                        </Grid>
                                    </Box>
                                )}

                                {/* カード詳細テキスト (ダミー) */}
                                <Box sx={{ mt: 3, p: 2, borderLeft: 4, borderColor: 'primary.main', bgcolor: 'background.paper', borderRadius: 1 }}>
                                    <Typography variant="body1" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
                                        このカードのテキストや効果、フレーバーテキストは、データベースから提供される予定です。
                                    </Typography>
                                </Box>
                                
                                {/* アクションボタンエリア (TODO) */}
                                <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
                                </Box>
                            </Box>
                        </Grid>
                    </Grid>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default CardViewModal;