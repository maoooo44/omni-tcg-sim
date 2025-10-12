/** 

  * src/features/pack-opening/PackOpener.tsx 

  */ 

 import React from 'react'; 



 // 必要なコンポーネントとフック、型をインポート 

 import type { Pack } from '../../models/pack';  

 import { usePackOpenerData } from './hooks/usePackOpenerData'; 

 // 🚨 OpenedResultState は PackOpener.tsx では直接使用しないため、インポートを削除 

 // import type { OpenedResultState } from './hooks/usePackOpenerData';  



 import { 

     Box, Typography, Select, MenuItem, FormControl, InputLabel, 

     Button, Alert, Grid, Divider 

 } from '@mui/material'; 



 import type { SelectChangeEvent } from '@mui/material'; 

 // 切り出したコンポーネントをインポート 

 import PackOpeningHandler from './PackOpeningHandler';  





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

     } = usePackOpenerData(preselectedPackId); 





     const packPrice = selectedPack?.price || 0; 

     const canAfford = coins >= packPrice; 



     // 🚨 修正1: ボタンの無効化ロジック、結果確認中ロジック、待機中ロジックを削除 

     let buttonText = selectedPack ? `${packPrice} G で ${selectedPack.name} を開封` : 'パックを選択'; 

     let buttonColor: 'primary' | 'error' | 'secondary' = 'primary'; 

     let buttonDisabled = !selectedPack; // パックが未選択の場合のみ無効化 



     if (!selectedPack) { 

         // buttonDisabled = true のまま 

     }  

     // 🚨 lastOpenedResults.results.length > 0 のチェックを削除 

     // 🚨 secondsUntilNextOpen > 0 のチェックを削除 

     else if (!canAfford) { 

         // コイン不足時はボタンの色とテキストを変更するが、無効にはしない 

         buttonText = `コイン不足: ${packPrice - coins} G 足りません`; 

         buttonColor = 'error'; 

         buttonDisabled = false; 

     } 

      

      

     // パック選択のハンドラ 

     const handlePackSelectChange = (event: SelectChangeEvent<string>) => { 

         // setLastOpenedResults の引数に `{ id: string, results: [] }` を直接渡す 

         setLastOpenedResults({ id: 'pack-change-reset', results: [] });  

         setSelectedPack(event.target.value); 

     }; 



     // 開封ボタン押下時のカスタムハンドラ 

     const handleOpenPack = async () => { 

         if (!selectedPack) return; 

          

         // 🚨 修正2: クールダウンチェックをここに残し、ポップアップで警告 

         if (secondsUntilNextOpen > 0) { 

             alert(`連続開封はできません。あと ${secondsUntilNextOpen} 秒待ってください。`); 

             return; // 処理を中断 

         } 



         // コイン不足チェックとポップアップ 

         if (!canAfford) { 

             alert(`コインが不足しています。このパックを開封するには ${packPrice} G が必要です。`); 

             return; 

         } 



         // disabledを解除するため、まず結果を初期状態に戻す 

         setLastOpenedResults({ id: 'pre-open-reset', results: [] }); 

          

         // 開封処理の実行 

         await hookHandleOpenPack(); 

     }; 



     // ロード中/未選択の表示 (省略) 

     if (isLoading) { 

         return <Typography>パックデータをロード中...</Typography>; 

     } 

      

     if (!selectedPack && !preselectedPackId) { 

         return <Typography>パックを選択してください。</Typography>; 

     } 



     return ( 

         <Box sx={{ p: 2 }}> 

             <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}> 

                 {/* コイン表示 */} 

                 <Grid size={{xs:12,md:4}}> 

                     <Typography variant="h6">所持コイン: {coins} G</Typography> 

                 </Grid> 



                 {/* パック選択ドロップダウン (省略) */} 

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

                                     {pack.name} ({pack.cardsPerPack}枚封入, {pack.price} G) 

                                 </MenuItem> 

                             ))} 

                         </Select> 

                     </FormControl> 

                 </Grid> 



                 {/* エラー/警告表示 (省略) */} 

                 {purchaseError && ( 

                     <Grid size={{xs:12}}> 

                         <Alert severity="error">{purchaseError}</Alert> 

                     </Grid> 

                 )} 

                 {simulationWarning && ( 

                     <Grid size={{xs:12}}> 

                         <Alert severity="warning">{simulationWarning}</Alert> 

                     </Grid> 

                 )} 



                 {/* 開封ボタン */} 

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



             {/* PackOpeningHandlerに状態とセッターを渡す */} 

             <PackOpeningHandler  

                 selectedPack={selectedPack}  

                 lastOpenedResults={lastOpenedResults}  

                 setLastOpenedResults={setLastOpenedResults} 

             /> 



         </Box> 

     ); 

 }; 



 export default PackOpener;