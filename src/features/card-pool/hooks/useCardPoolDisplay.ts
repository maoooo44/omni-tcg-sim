/**
 * src/features/card-pool/hooks/useCardPoolDisplay.ts
 * * カードコレクション画面（CardPoolManager）の表示ロジック、
 * フィルタリング、並び替え、ページネーション機能を提供するカスタムフック。
 * カードプールストア、カードストア、ユーザーデータストアの状態を統合して
 * 画面表示に必要な処理を行う。
 */

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useCardPoolStore, type CardPoolState } from '../../../stores/cardPoolStore'; 
import { useUserDataStore } from '../../../stores/userDataStore'; 
import { useCardStore } from '../../../stores/cardStore'; 

import type { Card as CardType } from '../../../models/card'; 
export const CARD_GRID_COLUMNS = 6; 
export const CARDS_PER_PAGE = 30; 
export type SortKey = 'name' | 'pack' | 'count' | 'registrationSequence'; 
export type ViewMode = 'list' | 'collection'; 

// --- 型定義 ---
// ... (OwnedCardDisplay, CardPoolFilters は変更なし)

export interface OwnedCardDisplay extends CardType {
    count: number;
    description: string; 
}

export interface CardPoolFilters {
    search: string | null;
    packId: string | null;
    rarity: string | null;
}

export interface ViewSettings {
    sortKey: SortKey; 
    sortOrder: 'asc' | 'desc';
    columns: number; // グリッド表示の列数
}

interface CardPoolDisplayState {
    isLoading: boolean; // 💡 修正: ロード状態をストアから取得
    error: Error | null;
    filteredCards: OwnedCardDisplay[];
    filter: CardPoolFilters;
    setFilter: (newFilter: Partial<CardPoolFilters>) => void;
    currentPage: number;
    totalPages: number;
    setCurrentPage: (page: number) => void;
    viewMode: ViewMode;
    setViewMode: (mode: ViewMode) => void;
    sortKey: SortKey; 
    setSortKey: (key: SortKey) => void;
    sortOrder: 'asc' | 'desc';
    setSortOrder: (order: 'asc' | 'desc') => void;
    columns: number;
    resetCollection: () => Promise<void>; 
    isDTCGEnabled: boolean;
}

// --- カスタムフック ---

export const useCardPoolDisplay = (): CardPoolDisplayState => {
    
    // 💡 修正: storeから ownedCards と isLoading を取得
    const { ownedCards, isLoading, resetPool } = useCardPoolStore(
        useShallow((state: CardPoolState) => ({ 
            ownedCards: state.ownedCards, 
            isLoading: state.isLoading, // 💡 追加
            resetPool: state.resetPool,
        }))
    );

    const isDTCGEnabled = useUserDataStore(useShallow(state => state.isDTCGEnabled));
    const allCards = useCardStore(useShallow(state => state.cards || []));

    // 💡 削除: ローカルの loading 状態は削除
    // const [loading, setLoading] = useState(false); 
    const [error, /*setError*/] = useState<Error | null>(null); // ロードエラーは store 側で処理されるため、一旦維持
    const [filter, setInternalFilter] = useState<CardPoolFilters>({
        search: null,
        packId: null,
        rarity: null,
    });
    const [currentPage, setCurrentPage] = useState(1);
    
    // 💡 追加/修正: 表示モードの状態管理
    const [viewMode, setViewMode] = useState<ViewMode>('list'); // デフォルトはリスト表示
    
    // 💡 追加: モードごとの設定を保持
    const [listSettings, setListSettings] = useState<ViewSettings>({
        sortKey: 'name',
        sortOrder: 'asc',
        columns: 4, // リスト表示時の列数
    });
    const [collectionSettings, setCollectionSettings] = useState<ViewSettings>({
        sortKey: 'registrationSequence', // 図鑑モードのデフォルトソート
        sortOrder: 'asc',
        columns: CARD_GRID_COLUMNS, // 図鑑表示時の列数
    });

    // 💡 修正: 現在のアクティブな設定を取得
    const { sortKey, sortOrder, columns } = viewMode === 'list' 
        ? listSettings 
        : collectionSettings;
    
    // 💡 修正: 現在のアクティブな設定を更新するヘルパー関数
    const setSetting = useCallback(<K extends keyof ViewSettings>(key: K, value: ViewSettings[K]) => {
        if (viewMode === 'list') {
            setListSettings(prev => ({ ...prev, [key]: value }));
        } else {
            setCollectionSettings(prev => ({ ...prev, [key]: value }));
        }
    }, [viewMode]);
    
    // 💡 公開するsetters
    const setSortKey = useCallback((key: SortKey) => setSetting('sortKey', key), [setSetting]);
    const setSortOrder = useCallback((order: 'asc' | 'desc') => setSetting('sortOrder', order), [setSetting]);
    
    /*// 初期ロード
    useEffect(() => {
        const initialize = async () => {
            try {
                setLoading(true);
                await loadCardPool();
            } catch (err) {
                setError(err as Error);
            } finally {
                setLoading(false);
            }
        };
        // 💡 既存の初期ロードロジックを維持
        // initialize();
    }, [loadCardPool]);*/

    // フィルター状態を更新するヘルパー関数
    const setFilter = useCallback((newFilter: Partial<CardPoolFilters>) => {
        setInternalFilter(prev => ({ ...prev, ...newFilter }));
        setCurrentPage(1); // フィルター変更時は1ページ目に戻す
    }, []);

    // OwnedCardDisplay のリストを作成
    const ownedCardDisplayList = useMemo((): OwnedCardDisplay[] => {
        const cardMap = new Map<string, CardType>(allCards.map(card => [card.cardId, card]));
        const ownedList: OwnedCardDisplay[] = [];
        
        // 💡 修正: モードに応じて処理を分岐
        if (viewMode === 'list') {
            // **リストモード**: 所有カードのみを表示
            ownedCards.forEach((count, cardId: string) => { 
                const card = cardMap.get(cardId);
                if (card) {
                    ownedList.push({
                        ...card,
                        count: count,
                        description: (card as any).description || '', 
                    });
                }
            });
            // DTCGモードが有効な場合は count > 0 のカードのみ表示 (既に上記でフィルタされているため不要だが、念のためロジックを維持)
            return ownedList.filter(card => isDTCGEnabled ? card.count > 0 : true);

        } else {
            // **図鑑モード**: 全カードを表示し、ownedCardsから枚数を取得
            allCards.forEach(card => {
                const count = ownedCards.get(card.cardId) || 0;
                ownedList.push({
                    ...card,
                    count: count,
                    description: (card as any).description || '', 
                });
            });
            // 図鑑モードでは全カードを表示するため、ここでフィルタリングはしない
            return ownedList;
        }

    }, [ownedCards, allCards, isDTCGEnabled, viewMode]); // 💡 viewModeを依存に追加

    // フィルターとソートのロジック
    const filteredAndSortedCards = useMemo(() => {
        let list = ownedCardDisplayList;

        // 1. フィルタリング (ロジックは変更なし)
        list = list.filter(card => {
            let pass = true;
            
            // 検索フィルター
            if (filter.search) {
                const searchLower = filter.search.toLowerCase();
                pass = pass && (
                    card.name.toLowerCase().includes(searchLower) ||
                    card.description.toLowerCase().includes(searchLower) 
                );
            }

            // パックフィルター
            if (filter.packId) {
                pass = pass && card.packId === filter.packId;
            }

            // レアリティフィルター
            if (filter.rarity) {
                pass = pass && card.rarity === filter.rarity;
            }
            
            return pass;
        });

        // 2. ソート
        list.sort((a, b) => {
            let comparison = 0;
            
            switch (sortKey) {
                case 'name':
                    comparison = a.name.localeCompare(b.name);
                    break;
                case 'pack':
                    comparison = a.packId.localeCompare(b.packId);
                    break;
                case 'count':
                    // 💡 修正: countソートはリストモードでのみ有効なことが多いが、図鑑モードでも実装しておく
                    comparison = (a.count || 0) - (b.count || 0);
                    break;
                case 'registrationSequence': // 💡 追加: 登録順ソート
                    comparison = (a.registrationSequence || 0) - (b.registrationSequence || 0);
                    break;
                default:
                    comparison = 0; // 未定義のソートキーの場合
            }

            return sortOrder === 'asc' ? comparison : -comparison;
        });
        
        return list;
    }, [ownedCardDisplayList, filter, sortKey, sortOrder]);
    
    // ページネーションの計算
    const totalPages = useMemo(() => {
        return Math.max(1, Math.ceil(filteredAndSortedCards.length / CARDS_PER_PAGE));
    }, [filteredAndSortedCards.length]);

    // ページ番号のバリデーション
    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [currentPage, totalPages]);
    
    // ストアのリセットアクション
    const resetCollection = useCallback(async () => {
        await resetPool();
        setInternalFilter({ search: null, packId: null, rarity: null });
        setCurrentPage(1);
    }, [resetPool]);


    return {
        isLoading, // 💡 修正: store から取得した isLoading を返す
        error,
        filteredCards: filteredAndSortedCards,
        filter,
        setFilter,
        currentPage,
        totalPages,
        setCurrentPage,
        viewMode,
        setViewMode,
        sortKey,
        setSortKey,
        sortOrder,
        setSortOrder,
        columns,
        resetCollection,
        isDTCGEnabled,
    };
};