/**
 * src/features/decks/DeckList.tsx
 *
 * ユーザーが作成したデッキの一覧を表示し、新規作成、編集、削除の操作を提供するコンポーネント。
 * useDeckListフックからデータを取得し、useSortAndFilterフックでソート・フィルタリングを適用する。
 * グリッド表示UI（ReusableItemGrid、DeckItem）に専念する。
 */
import React, { useCallback } from 'react';
import { useDeckList } from './hooks/useDeckList';
import { useNavigate } from '@tanstack/react-router'; 
import { 
    Box, Typography, Button, Alert, 
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';


// 💡 追加: グリッド表示関連のインポート
import { useGridDisplay } from '../../hooks/useGridDisplay'; 
import ReusableItemGrid from '../../components/common/ReusableItemGrid';
import DeckItem from './components/DeckItem'; // DeckItemを使用する (PackItemと互換)

// import { useSortAndFilter } from '../../hooks/useSortAndFilter'; // useDeckList内で処理される前提
import SortAndFilterControls from '../../components/controls/SortAndFilterControls'; 

// 💡 修正: calculateTotalCards のインポートを削除
// import { deckFieldAccessor } from './deckUtils'; // useDeckList内で処理される前提
import { createDefaultDeck } from '../../utils/dataUtils';
import { DeckListGridSettings } from '../../configs/gridDefaults'; // グリッド設定のインポート
// 💡 追加/修正: フィルタフィールド定義をインポート
import { DECK_SORT_OPTIONS, DECK_FILTER_FIELDS } from '../../configs/sortAndFilterDefaults'; 
const DECK_EDIT_PATH_PREFIX = '/user/decks'; 


// =========================================================================
// 3. コンポーネント本体
// =========================================================================

const DeckList: React.FC = () => {
    
    // 1. データ取得とアクション
    // 💡 修正: usePackList.ts の返り値と同様に、必要な状態とハンドラを useDeckList から取得する想定に変更
    const {
        decks,
        // 💡 追加: useDeckListから取得する想定のプロパティ
        displayedDecks, // ★ 高度なフィルタリング適用後のリスト
        sortField,
        sortOrder,
        searchTerm,
        setSortField,
        toggleSortOrder,
        setSearchTerm,
        handleFilterChange, // ★ 高度なフィルタリングのハンドラ
        // 既存プロパティ
        isLoading,
        handlemoveDeckToTrash, 
    } = useDeckList();
    
    const navigate = useNavigate(); 
    
    // 💡 削除: useSortAndFilter は useDeckList の内部で処理されることを前提とする
    // const {
    //     sortedAndFilteredData: displayedDecks,
    //     sortField,
    //     sortOrder,
    //     searchTerm,
    //     setSortField,
    //     setSearchTerm,
    //     toggleSortOrder,
    // } = useSortAndFilter<Deck>(decks, deckFieldAccessor, {
    //     defaultSortField: 'number', 
    //     defaultSortOrder: 'asc'
    // });
    
    // 2. グリッド表示フックの適用 (変更なし)
    const gridDisplayProps = useGridDisplay({
        settings: DeckListGridSettings, 
        storageKey: 'deckList', 
        userGlobalDefault: {
            isUserDefaultEnabled: false,
            globalColumns: null,
            advancedResponsive: {
                isEnabled: false,
                columns: {},
            }
        },
    });

    // 3. 新規デッキ作成ハンドラ (変更なし)
    const handleCreateNewDeck = useCallback(() => {
        const newDeck = createDefaultDeck(); 
        const newDeckId = newDeck.deckId; 
        
        navigate({ 
            to: `${DECK_EDIT_PATH_PREFIX}/$deckId`, 
            params: { deckId: newDeckId } 
        }); 
    }, [navigate]);
    
    // 4. アイテムクリック時の編集画面遷移ハンドラ (変更なし)
    const handleSelectDeck = useCallback((deckId: string) => {
        navigate({ 
            to: `${DECK_EDIT_PATH_PREFIX}/$deckId`, 
            params: { deckId: deckId } 
        }); 
    }, [navigate]);

    const hasDecks = decks.length > 0;
    const isFilteredButEmpty = hasDecks && displayedDecks.length === 0; // searchTermだけでなく高度なフィルタによる空も含む
    const isTotallyEmpty = !hasDecks && !isLoading; // デッキがゼロ件で、ロード完了している状態

    if (isLoading) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="info">デッキデータをロード中...</Alert>
            </Box>
        );
    }
    
    if (isTotallyEmpty) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="info" action={
                    <Button color="inherit" size="small" startIcon={<AddIcon />} onClick={handleCreateNewDeck}>
                        新規作成
                    </Button>
                }>
                    まだデッキが作成されていません。
                </Alert>
            </Box>
        );
    }
    
    // const hasFilteredResults = displayedDecks.length > 0; // isFilteredButEmptyで代替

    return (
        <Box sx={{ p: 3 }}>
            
            {/* ソート・フィルタリングUIの配置 */}
            {/* ★ 修正: filterFields と onFilterChange を追加 */}
            <SortAndFilterControls
                labelPrefix="デッキ"
                sortOptions={DECK_SORT_OPTIONS}
                sortField={sortField}
                sortOrder={sortOrder}
                searchTerm={searchTerm}
                setSortField={setSortField}
                toggleSortOrder={toggleSortOrder}
                setSearchTerm={setSearchTerm}
                filterFields={DECK_FILTER_FIELDS} // ★ DECK用のフィルタフィールド定義
                onFilterChange={handleFilterChange} // ★ useDeckListから取得したハンドラ
            />

            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h5">デッキ一覧 ({displayedDecks.length}件)</Typography>
                <Button
                    variant="contained"
                    color="primary"
                    startIcon={<AddIcon />}
                    onClick={handleCreateNewDeck}
                >
                    新規デッキを作成
                </Button>
            </Box>

            {/* 検索結果がゼロの場合のAlert (高度なフィルタリング結果も含む) */}
            {isFilteredButEmpty ? (
                <Alert severity="info" sx={{ mt: 2 }}>
                    選択された条件に一致するデッキが見つかりませんでした。
                </Alert>
            ) : (
                <Box sx={{ mt: 2 }}>
                    <ReusableItemGrid
                        items={displayedDecks as any} 
                        ItemComponent={DeckItem as any} 
                        itemProps={{
                            onSelectDeck: handleSelectDeck, 
                            onDeleteDeck: handlemoveDeckToTrash, 
                        }}
                        {...gridDisplayProps}
                    />
                </Box>
            )}
        </Box>
    );
};

export default DeckList;