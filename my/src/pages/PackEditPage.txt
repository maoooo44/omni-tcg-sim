// src/pages/PackEditPage.tsx

import React, { useState, useEffect } from 'react';
// 標準のGridをインポート (v7ではこれが新しいGrid)
import { Button, TextField, Box, Typography, Select, MenuItem, InputLabel, FormControl, Alert, Paper, Divider, Grid } from '@mui/material'; 
// ✅ 修正: useParamsを追加してインポート
import { useNavigate, useParams } from '@tanstack/react-router'; 
import { useShallow } from 'zustand/react/shallow';
import { usePackStore } from '../stores/packStore'; 
import type { PackType, Pack } from '../models/pack'; 
// ✅ 新規インポート
import PackCardList from '../components/PackCardList';
import type { Card as CardType } from '../models/card';
import CardEditModal from '../components/CardEditModal';
// 💡 RarityEditModalをインポート
import RarityEditModal from '../components/RarityEditModal';


const DEFAULT_RARITY_CONFIG = [{ rarityName: 'Common', probability: 1.0 }];
const packTypes: PackType[] = ['Booster', 'ConstructedDeck', 'Other']; 

const PackEditPage: React.FC = () => {
    
    const { packId } = useParams({ strict: false }) as { packId: string };
    
    if (!packId) {
        return <Alert severity="error">パックIDが指定されていません。</Alert>;
    }
    
    const navigate = useNavigate(); 
    const { packs, createPack, updatePack, deletePack } = usePackStore(useShallow(state => ({
        packs: state.packs,
        createPack: state.createPack,
        updatePack: state.updatePack,
        deletePack: state.deletePack,
    })));

    const existingPack = packs.find(p => p.packId === packId);
    
    const isNewPack = !existingPack; 
    const isEditingExisting = !!existingPack;

    const [isEditable, setIsEditable] = useState(isNewPack); 

    // ✅ カード編集モーダルの状態管理
    const [isCardModalOpen, setIsCardModalOpen] = useState(false);
    const [editingCard, setEditingCard] = useState<CardType | null>(null);

    // 💡 新規追加: レアリティ編集モーダルの状態管理
    const [isRarityModalOpen, setIsRarityModalOpen] = useState(false);

    const [packName, setPackName] = useState('');
    const [series, setSeries] = useState('');
    const [packType, setPackType] = useState<PackType>('Booster');
    const [cardsPerPack, setCardsPerPack] = useState(5);
    const [price, setPrice] = useState(0);
    const [description, setDescription] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [cardBackUrl, setCardBackUrl] = useState('');

    useEffect(() => {
        // packIdが変更されるたびに実行される
        if (isEditingExisting && existingPack) {
            setPackName(existingPack.name);
            setSeries(existingPack.series);
            setPackType(existingPack.packType);
            setCardsPerPack(existingPack.cardsPerPack);
            setPrice(existingPack.price);
            setDescription(existingPack.description);
            setImageUrl(existingPack.imageUrl);
            setCardBackUrl(existingPack.cardBackUrl);
            setIsEditable(false); 
        } else if (isNewPack) {
            setPackName('');
            setSeries('');
            setPackType('Booster');
            setCardsPerPack(5);
            setPrice(0);
            setDescription('');
            setImageUrl('');
            setCardBackUrl('');
            setIsEditable(true); 
        }
    }, [packId, isEditingExisting, existingPack, isNewPack]);

    const isDisabled = !isEditable;

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (!isEditable) return; 
        
        if (!packName || cardsPerPack <= 0 || !series) {
            alert('パック名、シリーズ名、収録枚数は必須です。');
            return;
        }
        
        const baseData = {
            name: packName,
            series: series,
            packType: packType,
            cardsPerPack: cardsPerPack,
            imageUrl: imageUrl,
            cardBackUrl: cardBackUrl,
            price: price,
            description: description,
            rarityConfig: existingPack?.rarityConfig || DEFAULT_RARITY_CONFIG,
            releaseDate: existingPack?.releaseDate || new Date().toISOString().split('T')[0],
            userCustom: existingPack?.userCustom || {},
            packId: packId, // ✅ 修正: フックから取得したpackIdを使用
        };

        if (isEditingExisting) {
            updatePack({ ...existingPack!, ...baseData } as Pack);
            alert(`パック "${packName}" を更新しました。`);
        } else {
            createPack(baseData as Pack); 
            alert(`新規パック "${packName}" を作成しました。`);
        }
        setIsEditable(false); 
    };

    const handleCancel = () => {
        if (isEditingExisting) {
            setIsEditable(false); 
            if (existingPack) {
                setPackName(existingPack.name);
                setSeries(existingPack.series);
                setPackType(existingPack.packType);
                setCardsPerPack(existingPack.cardsPerPack);
                setPrice(existingPack.price);
                setDescription(existingPack.description);
                setImageUrl(existingPack.imageUrl);
                setCardBackUrl(existingPack.cardBackUrl);
            }
        } else {
            navigate({ to: '/data/packs' }); 
        }
    };

    const handleBackToList = () => {
        navigate({ to: '/data/packs' }); 
    };

    const handleDelete = () => {
        if(window.confirm(`パック "${existingPack?.name}" を削除しますか？`)) {
            deletePack(packId); 
            navigate({ to: '/data/packs' }); 
            alert('削除しました。');
        }
    };

    const handleOpenOpener = () => {
        if (!isEditingExisting && isNewPack) {
            alert('パックを開封するには、まずパックを保存してください。');
            return;
        }
        navigate({ to: '/user/open', search: { packId: packId } }); 
    };
    
    // カード編集モーダルを開く処理
    const handleOpenCardEditModal = (card: CardType | null) => {
        setEditingCard(card);
        setIsCardModalOpen(true);
    };

    // カード編集モーダルを閉じる処理
    const handleCloseCardEditModal = () => {
        setIsCardModalOpen(false);
        setEditingCard(null);
    };

    // 💡 レアリティ編集モーダルを開く処理
    const handleOpenRarityEditModal = (e: React.MouseEvent) => {
        e.preventDefault();
        if (isEditable) {
            setIsRarityModalOpen(true);
        }
    };

    // 💡 レアリティ編集モーダルを閉じる処理
    const handleCloseRarityEditModal = () => {
        setIsRarityModalOpen(false);
    };
    
    if (isEditingExisting && !existingPack) {
        return (
            <Alert severity="warning">パックデータをロード中か、存在しません。ID: {packId}</Alert>
        );
    }

    return (
        <Box sx={{ flexGrow: 1, p: 1 }}>
            <Typography variant="h4" gutterBottom>
                {isNewPack ? '新規パックの作成' : `パック編集: ${packName || 'ロード中...'}`}
            </Typography>
            
            <Grid container spacing={3}>
                
                {/* A. 左側: パック情報フォーム (サブ) */}
                <Grid size={{ xs: 12, md: 4 }}>
                    <Paper elevation={3} sx={{ p: 4 }}>
                        <Typography variant="h5" gutterBottom>基本情報</Typography>
                        
                        <Box sx={{ my: 2, display: 'flex', gap: 1 }}>
                            
                            {/* 非編集時 - 編集開始 & 一覧に戻るボタン */}
                            {isEditingExisting && !isEditable && (
                                <>
                                    <Button variant="contained" onClick={() => setIsEditable(true)}>
                                        編集を開始
                                    </Button>
                                    <Button variant="outlined" onClick={handleBackToList}> 
                                        一覧に戻る
                                    </Button>
                                </>
                            )}
                            
                            {/* 編集時/新規作成時 - 保存/作成 & キャンセルボタン */}
                            {isEditable && (
                                <>
                                    <Button 
                                        variant="contained" 
                                        color="primary"
                                        onClick={handleSave}
                                    >
                                        {isNewPack ? 'パックを作成' : '変更を保存'}
                                    </Button>
                                    <Button 
                                        variant="outlined" 
                                        onClick={handleCancel}
                                    >
                                        キャンセル
                                    </Button>
                                </>
                            )}
                        </Box>

                        <Divider sx={{ my: 2 }} />
                        
                        <form onSubmit={handleSave}>
                            <TextField label="パック名" fullWidth margin="normal" value={packName} onChange={(e) => setPackName(e.target.value)} required disabled={isDisabled} />
                            <TextField label="シリーズ名" fullWidth margin="normal" value={series} onChange={(e) => setSeries(e.target.value)} required disabled={isDisabled} />
                            
                            <FormControl fullWidth margin="normal" required disabled={isDisabled}>
                                <InputLabel id="pack-type-label">パック種別</InputLabel>
                                <Select labelId="pack-type-label" value={packType} label="パック種別" onChange={(e) => setPackType(e.target.value as PackType)}>
                                    {packTypes.map(type => (<MenuItem key={type} value={type}>{type}</MenuItem>))}
                                </Select>
                            </FormControl>

                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <TextField label="収録枚数" type="number" fullWidth margin="normal" value={cardsPerPack} onChange={(e) => setCardsPerPack(Math.max(1, Number(e.target.value)))} inputProps={{ min: 1 }} required disabled={isDisabled} />
                                <TextField label="価格 (¥)" type="number" fullWidth margin="normal" value={price} onChange={(e) => setPrice(Math.max(0, Number(e.target.value)))} inputProps={{ min: 0 }} required disabled={isDisabled} />
                            </Box>
                            
                            <TextField label="概要・説明文" fullWidth margin="normal" multiline rows={3} value={description} onChange={(e) => setDescription(e.target.value)} disabled={isDisabled} />
                            <TextField label="パック画像URL (imageUrl)" fullWidth margin="normal" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} disabled={isDisabled} />
                            <TextField label="カード裏面画像URL (cardBackUrl)" fullWidth margin="normal" value={cardBackUrl} onChange={(e) => setCardBackUrl(e.target.value)} disabled={isDisabled} />

                            <Box sx={{ mt: 3, display: 'flex', gap: 2, flexDirection: 'column' }}>
                            
                            {isEditingExisting && (
                                <Button variant="contained" color="secondary" onClick={handleOpenOpener} disabled={isDisabled} >
                                    当該パックを開封シミュレータへ
                                </Button>
                            )}

                            <Button variant="outlined" disabled={isDisabled} onClick={handleOpenRarityEditModal}> {/* 💡 ハンドラを更新 */}
                                レアリティ設定を編集
                            </Button>

                            {isEditingExisting && (
                                <Button variant="outlined" color="error" onClick={handleDelete} disabled={isDisabled} >
                                    パックを削除
                                </Button>
                            )}
                            </Box>
                        </form>
                    </Paper>
                </Grid>

                {/* B. 右側: カード登録枠エリア (メイン) */}
                <Grid size={{ xs: 12, md: 8 }}>
                    <Paper elevation={3} sx={{ p: 4, height: '100%' }}>
                        {/* 収録カードリストコンポーネントを配置 */}
                        <PackCardList 
                            packId={packId}
                            isEditable={isEditable}
                            onOpenEditModal={handleOpenCardEditModal} // モーダル開閉ハンドラを渡す
                        />
                    </Paper>
                </Grid>
            </Grid>
            
            {/* カード編集モーダルを画面の最上層に配置 */}
            <CardEditModal 
                open={isCardModalOpen}
                onClose={handleCloseCardEditModal}
                card={editingCard}
            />

            {/* 💡 レアリティ編集モーダルを画面の最上層に配置 */}
            <RarityEditModal
                open={isRarityModalOpen}
                onClose={handleCloseRarityEditModal}
                packId={packId}
            />
        </Box>
    );
};

export default PackEditPage;