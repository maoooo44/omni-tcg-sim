/**
 * src/features/pack-opener/PackOpener.tsx
 *
 * パック開封シミュレーション機能のメインコンポーネント。
 * * 責務:
 * 1. UIのレイアウト、状態表示、およびユーザー操作（パック選択、開封ボタン押下、God Mode時のゴールド編集）を担う。
 * 2. `usePackOpener` カスタムフックから、パックデータ、開封ロジック、通貨/モードの状態を取得し、責務を分離する。
 * 3. ローカルの検索状態 (`searchTerm`) を管理し、パックリストをフィルタリングする。
 * 4. `useGridDisplay` フックを使用して、開封結果を表示するグリッドの列数設定を管理し、UIコントロールを提供する。
 * 5. パックの選択状況、現在のモード（DTCG/FREE/GOD）、ゴールド残高、クールダウン時間を反映して、開封ボタンのテキストと有効/無効状態を制御する。
 * 6. 実際の開封アニメーションと結果表示は、子の `PackOpenerHandler` コンポーネントに委譲する。
 */

import React, { useState, useMemo } from 'react';

// 必要なコンポーネントとフック、型をインポート 
import type { Pack } from '../../models/models';
import { usePackOpener } from './hooks/usePackOpener';

import {
    Box, Typography, Select, MenuItem, FormControl, InputLabel,
    Alert, TextField, Paper
} from '@mui/material'; 
import type { SelectChangeEvent } from '@mui/material';

// 切り出したコンポーネントをインポート 
import PackOpenerHandler from './PackOpenerHandler';
import {  useGridDisplay } from '../../hooks/useGridDisplay';
import { PAGE_PADDING, PAGE_FLEX_GROW, PAGE_TITLE_VARIANT, PackListGridSettings } from '../../configs/configs';

// ControlBar と Props のインポート
import ControlBar from '../../components/common/ControlBar';
import type { ControlBarProps } from '../../models/models'; 
import OpenInNewIcon from '@mui/icons-material/OpenInNew';


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
        setCoins,
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

    // ゴールド入力変更ハンドラ (God Mode時のみ有効)
    const handleCoinChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(event.target.value, 10);

        if (isGodMode && !isNaN(value)) {
            setCoins(value);
        }
    };


    // ControlBar に渡すためのボタン無効化/ツールチップロジックを定義
    let tooltipText = "パックを開封";
    let buttonDisabled = !selectedPack; 
    let buttonColor: 'primary' | 'error' | 'secondary' = 'primary';
    const buttonIcon = <OpenInNewIcon />;

    // 無効化とツールチップテキストの設定
    if (!selectedPack) {
        buttonDisabled = true;
        tooltipText = '開封するパックを選択してください';
    } else if (isDTCGMode) {
        if (secondsUntilNextOpen > 0) {
            buttonDisabled = true;
            tooltipText = `連続開封はできません。あと ${secondsUntilNextOpen} 秒待ってください。`;
            buttonColor = 'secondary';
        } else if (!canAfford) {
            buttonDisabled = true; 
            tooltipText = `ゴールド不足: ${packPrice - coins} G 足りません (パック価格: ${packPrice} G)`;
            buttonColor = 'error';
        }
    } else { // FREE Mode or GOD Mode
        tooltipText = 'パックを開封 (無料)';
    }

    // パック選択のハンドラ
    const handlePackSelectChange = (event: SelectChangeEvent<string>) => {
        setLastOpenedResults({ id: 'pack-change-reset', results: [] });
        setSelectedPack(event.target.value);
    };

    // 開封ボタン押下時のカスタムハンドラ
    const handleOpenPack = async () => {
        if (buttonDisabled) return;

        setLastOpenedResults({ id: 'pre-open-reset', results: [] });
        await hookHandleOpenPack();
    };

    // ロード中/未選択の表示
    if (isLoading) {
        return <Typography>パックデータをロード中...</Typography>;
    }


    // ⭐️ ControlBar に渡す Props を構築 ⭐️
    const packOpenerControlProps: ControlBarProps = useMemo(() => {
        
        // 💡 修正: openPackButton の型を明示せず、リテラルオブジェクトとして定義し直す
        // TypeScriptが自動的に ControlBarProps['actionButtons'][number] に推論してくれる
        const openPackButton = {
            icon: buttonIcon,
            tooltip: tooltipText,
            onClick: handleOpenPack,
            color: buttonColor, // 'primary' | 'error' | 'secondary' は許容範囲内
        };

        return {
            // タイトル: 収録枚数と選択状態
            title: selectedPack ? `収録枚数: ${selectedPack.cardsPerPack}枚` : 'パックを選択してください',
            showTitle: true,

            // 列数トグルのProps
            gridToggleProps: {
                columns: gridDisplayProps.columns,
                setColumns: gridDisplayProps.setColumns,
                minColumns: gridDisplayProps.minColumns,
                maxColumns: gridDisplayProps.maxColumns,
            },

            // 開封ボタンをアクションとして追加
            actionButtons: [openPackButton],
        };
    }, [
        selectedPack, 
        gridDisplayProps.columns, 
        gridDisplayProps.setColumns,
        gridDisplayProps.minColumns,
        gridDisplayProps.maxColumns,
        handleOpenPack,
        tooltipText,
        buttonColor,
        buttonIcon,
    ]);


    return (
        <Box sx={{ p: PAGE_PADDING, flexGrow: PAGE_FLEX_GROW }}>
            <Typography variant={PAGE_TITLE_VARIANT} gutterBottom>パック開封</Typography>

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
                            size="small"
                            value={coins.toString()}
                            onChange={handleCoinChange}
                            InputProps={{
                                endAdornment: <Typography sx={{ mr: 1 }}>G</Typography>,
                            }}
                            sx={{ width: 200, height: 32 }}
                        />
                    ) : (
                        <Typography
                            variant="h6"
                            color={isDTCGMode ? 'text.primary' : 'text.secondary'}
                            sx={{
                                display: 'flex',
                                height: 32,
                                alignItems: 'center',
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

                {/* ⭐️ ControlBar で収録枚数・列数・開封ボタンを統合 ⭐️ */}
                <Box sx={{ mb: 3 }}>
                    <ControlBar 
                        {...packOpenerControlProps}
                    />
                </Box>

                {/* PackOpenerHandler */}
                <PackOpenerHandler
                    selectedPack={selectedPack}
                    lastOpenedResults={lastOpenedResults}
                    setLastOpenedResults={setLastOpenedResults}
                    {...gridDisplayProps.gridRenderUnit}
                />
            </Box>
        </Box>
    );
};

export default PackOpener;