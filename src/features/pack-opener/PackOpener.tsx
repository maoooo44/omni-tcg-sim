/**
* src/features/pack-opener/PackOpener.tsx
*
* パック開封シミュレーション機能のメインコンポーネント。
* ユーザーインターフェース（UI）のレイアウト、状態表示、およびユーザー操作（パック選択、開封ボタン押下、God Mode時のコイン編集）を担います。
* パックデータ、開封ロジック、通貨/モードの状態は `usePackOpener` カスタムフックから取得し、責務を分離しています。
* パックの選択状況、現在のモード（DTCG/FREE/GOD）、コイン残高、クールダウン時間を反映して、開封ボタンのテキストと有効/無効状態を制御します。
* 実際の開封アニメーションと結果表示は、子の `PackOpeningHandler` コンポーネントに委譲しています。
*/

import React from 'react'; 

// 必要なコンポーネントとフック、型をインポート 
import type { Pack } from '../../models/pack'; 
import { usePackOpener } from './hooks/usePackOpener'; 
// import type { CurrentDtcgMode } from '../../stores/userDataStore'; // コメントアウトを維持

import { 
    Box, Typography, Select, MenuItem, FormControl, InputLabel, 
    Button, Alert, Grid, Divider, TextField // ★修正1: TextFieldをインポート
} from '@mui/material'; 

import type { SelectChangeEvent } from '@mui/material'; 
// 切り出したコンポーネントをインポート 
import PackOpeningHandler from './PackOpenerHandler'; 

/*import { setLastOpenResults} from '../../models/pack-opener';*/


interface PackOpenerProps { 
    preselectedPackId?: string; 
} 

const PackOpener: React.FC<PackOpenerProps> = ({ preselectedPackId }) => { 

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


    const packPrice = selectedPack?.price || 0; 
    const canAfford = coins >= packPrice; 
    const isDTCGMode = currentMode === 'dtcg';
    const isGodMode = currentMode === 'god';
    const isFreeMode = currentMode === 'free';
    
    // ★修正3: コイン入力変更ハンドラ (God Mode時のみ有効)
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
    } else if (isFreeMode) {
        buttonText = `${selectedPack.name} を無料開封 (FREE)`;
    } else if (isGodMode) {
        buttonText = `${selectedPack.name} を即時開封 (GOD)`;
    } else { // DTCG Mode
        buttonText = `${packPrice} G で ${selectedPack.name} を開封`;
    }
    
    // DTCGモード特有の無効化/警告
    if (selectedPack) {
        if (isDTCGMode) {
            if (secondsUntilNextOpen > 0) {
                buttonText = `待機中... (${secondsUntilNextOpen} 秒)`;
                buttonColor = 'secondary';
                buttonDisabled = true; 
            } else if (!canAfford) { 
                buttonText = `コイン不足: ${packPrice - coins} G 足りません`; 
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
            alert(`コインが不足しています。このパックを開封するには ${packPrice} G が必要です。`); 
            return; 
        } 

        setLastOpenedResults({ id: 'pre-open-reset', results: [] }); 
        await hookHandleOpenPack(); 
    }; 

    // ロード中/未選択の表示 (変更なし)
    if (isLoading) { 
        return <Typography>パックデータをロード中...</Typography>; 
    } 
    
    if (!selectedPack && !preselectedPackId) { 
        return <Typography>パックを選択してください。</Typography>; 
    } 

    return ( 
        <Box sx={{ p: 2 }}> 
            {/* 現在のモード表示 (変更なし) */}
            <Typography variant="subtitle1" sx={{ mb: 1, color: isDTCGMode ? 'primary.main' : 'text.secondary' }}>
                現在のモード: **{currentMode.toUpperCase()}**
            </Typography>

            <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}> 
                {/* ★修正4: コイン表示/編集 UI の分岐 - Grid sizeを統一 */}
                <Grid size={{xs:12,md:4}}> 
                    {isGodMode ? (
                        <TextField
                            label="所持コイン (GOD MODE)"
                            type="number"
                            variant="outlined"
                            size="small"
                            value={coins.toString()}
                            onChange={handleCoinChange}
                            InputProps={{
                                endAdornment: <Typography sx={{ mr: 1 }}>G</Typography>,
                            }}
                            sx={{ minWidth: 200 }}
                        />
                    ) : (
                        <Typography variant="h6" color={isDTCGMode ? 'text.primary' : 'text.secondary'}>
                            所持コイン: {coins} G
                        </Typography> 
                    )}
                </Grid> 

                {/* パック選択ドロップダウン (変更なし) - Grid sizeを統一 */} 
                <Grid size={{xs:12,md:8}}> 
                    <FormControl fullWidth> 
                        <InputLabel id="pack-select-label">開封するパック</InputLabel> 
                        <Select 
                            labelId="pack-select-label" 
                            value={selectedPack?.packId || ''} 
                            label="開封するパック" 
                            onChange={handlePackSelectChange} 
                        > 
                            {packs.map((pack: Pack) => ( 
                                <MenuItem key={pack.packId} value={pack.packId}> 
                                    {pack.name} 
                                    {isDTCGMode ? ` (${pack.cardsPerPack}枚封入, ${pack.price} G)` : ` (${pack.cardsPerPack}枚封入, FREE)`}
                                </MenuItem> 
                            ))} 
                        </Select> 
                    </FormControl> 
                </Grid> 

                {/* エラー/警告表示 (変更なし) - Grid sizeを統一 */} 
                {purchaseError && ( 
                    <Grid size={12}> 
                        <Alert severity="error">{purchaseError}</Alert> 
                    </Grid> 
                )} 
                {simulationWarning && ( 
                    <Grid size={12}> 
                        <Alert severity="warning">{simulationWarning}</Alert> 
                    </Grid> 
                )} 

                {/* 開封ボタン (変更なし) - Grid sizeを統一 */} 
                <Grid size={{xs:12,md:4}} sx={{ display: 'flex', justifyContent: { xs: 'center', md: 'flex-start' } }}> 
                    <Button 
                        variant="contained" 
                        color={buttonColor} 
                        size="large" 
                        onClick={handleOpenPack} 
                        disabled={buttonDisabled} 
                        sx={{ minWidth: 200 }} 
                    > 
                        {buttonText} 
                    </Button> 
                </Grid> 
            </Grid> 
            
            <Divider sx={{ mb: 3 }} /> 

            {/* PackOpeningHandler (変更なし) */} 
            <PackOpeningHandler  
                selectedPack={selectedPack}  
                lastOpenedResults={lastOpenedResults}  
                setLastOpenedResults={setLastOpenedResults} 
            /> 

        </Box> 
    ); 
}; 

export default PackOpener;