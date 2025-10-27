/**
* src/features/pack-opener/PackOpener.tsx
*
* パック開封シミュレーション機能のメインコンポーネント。
* ユーザーインターフェース（UI）のレイアウト、状態表示、およびユーザー操作（パック選択、開封ボタン押下、God Mode時のゴールド編集）を担います。
* パックデータ、開封ロジック、通貨/モードの状態は `usePackOpener` カスタムフックから取得し、責務を分離しています。
* パックの選択状況、現在のモード（DTCG/FREE/GOD）、ゴールド残高、クールダウン時間を反映して、開封ボタンのテキストと有効/無効状態を制御します。
* 実際の開封アニメーションと結果表示は、子の `PackOpenerHandler` コンポーネントに委譲しています。
*/

import React, { useState, useMemo } from 'react'; 

// 必要なコンポーネントとフック、型をインポート 
import type { Pack } from '../../models/pack'; 
import { usePackOpener } from './hooks/usePackOpener'; 
// import type { CurrentDtcgMode } from '../../stores/userDataStore'; // コメントアウトを維持

import { 
    Box, Typography, Select, MenuItem, FormControl, InputLabel, 
    Button, Alert, TextField, Paper
} from '@mui/material';import type { SelectChangeEvent } from '@mui/material'; 
// 切り出したコンポーネントをインポート 
import PackOpenerHandler from './PackOpenerHandler';
import { useGridDisplay } from '../../hooks/useGridDisplay';
import { PackListGridSettings } from '../../configs/gridDefaults';
import GridColumnToggle from '../../components/controls/GridColumnToggle'; 

/*import { setLastOpenResults} from '../../models/pack-opener';*/


interface PackOpenerProps { 
    preselectedPackId?: string; 
} 

const PackOpener: React.FC<PackOpenerProps> = ({ preselectedPackId }) => { 

    // 検索・フィルタ用のローカルstate
    const [searchTerm, setSearchTerm] = useState('');

    // グリッド表示設定
    const gridDisplayProps = useGridDisplay({
        settings: PackListGridSettings,
        storageKey: 'packOpener',
        userGlobalDefault: {
            isUserDefaultEnabled: false,
            globalColumns: null,
            advancedResponsive: {
                isEnabled: false,
                columns: {},
            }
        },
    });

    // Hookからすべての状態とロジックを取得
    const { 
        packs, 
        selectedPack, 
        setSelectedPack, 
        isLoading, 
        handleOpenPack: hookHandleOpenPack, 
        lastOpenedResults,  
        setLastOpenedResults,  
        coins, 
        purchaseError, 
        simulationWarning, 
        secondsUntilNextOpen, 
        currentMode, 
        setCoins, // ★修正2: setCoinsを取得 (usePackOpener側の修正が必要)
    } = usePackOpener(preselectedPackId);

    // パックをフィルタリング
    const filteredPacks = useMemo(() => {
        if (!searchTerm) return packs;
        const lowerSearch = searchTerm.toLowerCase();
        return packs.filter(pack => 
            pack.name.toLowerCase().includes(lowerSearch) ||
            (pack.series && pack.series.toLowerCase().includes(lowerSearch))
        );
    }, [packs, searchTerm]);
    const packPrice = selectedPack?.price || 0; 
    const canAfford = coins >= packPrice; 
    const isDTCGMode = currentMode === 'dtcg';
    const isGodMode = currentMode === 'god';
    const isFreeMode = currentMode === 'free';
    
    // ★修正3: ゴールド入力変更ハンドラ (God Mode時のみ有効)
    const handleCoinChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(event.target.value, 10);
        
        // ゴッドモードであり、かつ有効な数値の場合のみ更新
        if (isGodMode && !isNaN(value)) {
            // setCoins は usePackOpener 経由で useCurrencyStore のアクションを呼び出す
            setCoins(value);
        }
    };


    // 🚨 ボタンの表示と無効化ロジック (変更なし)
    let buttonText: string; 
    let buttonColor: 'primary' | 'error' | 'secondary' = 'primary'; 
    let buttonDisabled = !selectedPack; 
    
    // モード別のボタンテキスト設定
    if (!selectedPack) {
        buttonText = 'パックを選択';
    } else if (isFreeMode || isGodMode) {
        buttonText = `0 G でパックを開封`;
    } else { // DTCG Mode
        buttonText = `${packPrice} G でパックを開封`;
    }
    
    // DTCGモード特有の無効化/警告
    if (selectedPack) {
        if (isDTCGMode) {
            if (secondsUntilNextOpen > 0) {
                buttonText = `待機中... (${secondsUntilNextOpen} 秒)`;
                buttonColor = 'secondary';
                buttonDisabled = true; 
            } else if (!canAfford) { 
                buttonText = `ゴールド不足: ${packPrice - coins} G 足りません`; 
                buttonColor = 'error'; 
                buttonDisabled = false; 
            }
        }
    }
    
    // パック選択のハンドラ (変更なし)
    const handlePackSelectChange = (event: SelectChangeEvent<string>) => { 
        setLastOpenedResults({ id: 'pack-change-reset', results: [] });  
        setSelectedPack(event.target.value); 
    }; 

    // 開封ボタン押下時のカスタムハンドラ (変更なし)
    const handleOpenPack = async () => { 
        if (!selectedPack) return; 
        
        if (isDTCGMode && secondsUntilNextOpen > 0) { 
            alert(`連続開封はできません。あと ${secondsUntilNextOpen} 秒待ってください。`); 
            return; 
        } 

        if (isDTCGMode && !canAfford) { 
            alert(`ゴールドが不足しています。このパックを開封するには ${packPrice} G が必要です。`); 
            return; 
        } 

        setLastOpenedResults({ id: 'pre-open-reset', results: [] }); 
        await hookHandleOpenPack(); 
    }; 

    // ロード中/未選択の表示
    if (isLoading) { 
        return <Typography>パックデータをロード中...</Typography>; 
    } 
    
    if (!selectedPack && !preselectedPackId) { 
        return <Typography>パックを選択してください。</Typography>; 
    } 

    return ( 
        <Box sx={{ flexGrow: 1, p: 2 }}> 
            {/* モードと所持ゴールド（横並び） */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle1" sx={{ color: isDTCGMode ? 'primary.main' : 'text.secondary' }}>
                    現在のモード: <strong>{currentMode.toUpperCase()}</strong>
                </Typography>
                {isGodMode ? (
        <TextField
            label="所持ゴールド (GOD MODE)"
            type="number"
            variant="outlined"
            size="small" // Smallの内部パディングは維持しつつ、外側の高さを強制
            value={coins.toString()}
            onChange={handleCoinChange}
            InputProps={{
                endAdornment: <Typography sx={{ mr: 1 }}>G</Typography>,
            }}
            // ★ 修正: TextFieldのコンテナ高さを36pxに固定
            sx={{ width: 200, height: 32 }} 
        />
    ) : (
        <Typography 
            variant="h6" 
            color={isDTCGMode ? 'text.primary' : 'text.secondary'}
            sx={{
                // ★ 修正: Typographyのコンテナ高さを36pxに固定
                display: 'flex',
                height: 32, 
                alignItems: 'center', // 垂直中央揃え
                color: isDTCGMode ? 'text.primary' : 'text.secondary',
            }}
        >
            所持ゴールド: {coins} G
        </Typography>
                )}
            </Box>

            {/* パック選択フィルタエリア */}
            <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-end' }}>
                    <TextField
                        label="パック名で検索"
                        variant="outlined"
                        size="small"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        sx={{ flex: 1 }}
                    />
                    <FormControl sx={{ flex: 2 }} size="small"> 
                        <InputLabel id="pack-select-label">開封するパック</InputLabel> 
                        <Select 
                            labelId="pack-select-label" 
                            value={selectedPack?.packId || ''} 
                            label="開封するパック" 
                            onChange={handlePackSelectChange} 
                        > 
                            {filteredPacks.map((pack: Pack) => ( 
                                <MenuItem key={pack.packId} value={pack.packId}> 
                                    {pack.name} 
                                    {isDTCGMode ? ` (${pack.cardsPerPack}枚封入, ${pack.price} G)` : ` (${pack.cardsPerPack}枚封入, FREE)`}
                                </MenuItem> 
                            ))} 
                        </Select> 
                    </FormControl>
                </Box>
            </Paper>

            {/* エラー/警告表示 */} 
            {purchaseError && <Alert severity="error" sx={{ mb: 2 }}>{purchaseError}</Alert>} 
            {simulationWarning && <Alert severity="warning" sx={{ mb: 2 }}>{simulationWarning}</Alert>}

            {/* 収録枚数・列数・開封ボタン（横並び） */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6">
                    {selectedPack ? `収録枚数: ${selectedPack.cardsPerPack}枚` : 'パックを選択してください'}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <GridColumnToggle
                        currentColumns={gridDisplayProps.columns}
                        setColumns={gridDisplayProps.setColumns}
                        minColumns={gridDisplayProps.minColumns}
                        maxColumns={gridDisplayProps.maxColumns}
                        label="列数:"
                    />
                    <Button 
                        variant="contained" 
                        color={buttonColor} 
                        onClick={handleOpenPack} 
                        disabled={buttonDisabled} 
                        sx={{ width: '200px' }}
                    > 
                        {buttonText} 
                    </Button>
                </Box>
            </Box>            {/* PackOpenerHandler (変更なし) */} 
            <PackOpenerHandler  
                selectedPack={selectedPack}  
                lastOpenedResults={lastOpenedResults}  
                setLastOpenedResults={setLastOpenedResults}
                sxOverride={gridDisplayProps.sxOverride}
                aspectRatio={gridDisplayProps.aspectRatio}
                gap={gridDisplayProps.gap}
            />        </Box> 
    ); 
}; 

export default PackOpener;