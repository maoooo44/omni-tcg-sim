/**
 * src/features/card-pool/hooks/useCardPoolDisplay.ts
 *
 * 💡 修正: 
 * 1. 未使用の filterFunction を削除 (TS6133 エラー解消)。
 * 2. useSortAndFilter の設定から initialSearchTerm を削除 (TS2353 エラー解消)。
 * 3. 検索フィルタリングは finalFilteredAndSortedCards の計算時に適用するようロジックを修正。
 */

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useCardPoolStore, type CardPoolState } from '../../../stores/cardPoolStore'; 
import { useUserDataStore } from '../../../stores/userDataStore'; 
import { useCardStore } from '../../../stores/cardStore'; 
import { usePackStore } from '../../../stores/packStore'; 

import { useSortAndFilter } from '../../../hooks/useSortAndFilter'; 
import { type SortField } from '../../../utils/sortingUtils';
// import type { SortOption } from '../../../components/common/SortAndFilterControls'; 

import type { Card as CardType } from '../../../models/card'; 
import type { Pack } from '../../../models/pack'; 

export const CARD_GRID_COLUMNS = 6; 
export const CARDS_PER_PAGE = 30; 
export type ViewMode = 'list' | 'collection'; 

// --- 型定義 ---
export interface OwnedCardDisplay extends CardType {
    count: number;
    description: string; 
    packNumber: number | null; 
    packName: string;        
}

export interface CardPoolFilters {
    search: string | null;
    packId: string | null;
    rarity: string | null;
}

export interface ViewSettings {
    sortField: SortField; 
    sortOrder: 'asc' | 'desc';
    columns: number;
}


// =========================================================================
// 汎用ソート・アクセサ関数
// =========================================================================

const cardPoolFieldAccessor = (item: OwnedCardDisplay, field: SortField): string | number | null | undefined => {
    switch (field) {
        // 複合ソート: packNumber (パックのナンバー) と number (カードのナンバー) を使用
        case 'number':
            const packNumber = item.packNumber ?? 999999; 
            const cardNumber = item.number ?? 999999;
            // 複合ソート用の文字列/数値を作成 (例: 001005, 010010)
            return `${String(packNumber).padStart(6, '0')}${String(cardNumber).padStart(6, '0')}`;
        case 'packName':
            return item.packName; 
        case 'name':
            return item.name;
        case 'rarity':
            return item.rarity;
        case 'count':
            return item.count; 
        case 'cardId':
            return item.cardId;
        default:
            return (item as any)[field] ?? null; 
    }
};

// --- カスタムフック ---

export const useCardPoolDisplay = () => {
    
    // ストアからのデータ取得 (変更なし)
    const { ownedCards, isLoading, resetPool } = useCardPoolStore(
        useShallow((state: CardPoolState) => ({ 
            ownedCards: state.ownedCards, 
            isLoading: state.isLoading,
            resetPool: state.resetPool,
        }))
    );

    const isDTCGEnabled = useUserDataStore(useShallow(state => state.isDTCGEnabled));
    const allCards = useCardStore(useShallow(state => state.cards || []));
    const packs = usePackStore(state => state.packs); 

    const [error, /*setError*/] = useState<Error | null>(null);
    const [filter, setInternalFilter] = useState<CardPoolFilters>({
        search: null,
        packId: null,
        rarity: null,
    });
    const [currentPage, setCurrentPage] = useState(1);
    const [viewMode, setViewMode] = useState<ViewMode>('list');
    
    // 設定の初期化 (変更なし)
    const [listSettings, setListSettings] = useState<any>({
        sortField: 'number',
        sortOrder: 'asc',
        columns: 4, 
    });
    const [collectionSettings, setCollectionSettings] = useState<any>({
        sortField: 'number', 
        sortOrder: 'asc',
        columns: CARD_GRID_COLUMNS,
    });

    const activeSettings = viewMode === 'list' ? listSettings : collectionSettings;
    
    const setSetting = useCallback(<K extends keyof any>(key: K, value: any[K]) => {
        if (viewMode === 'list') {
            setListSettings((prev: any) => ({ ...prev, [key]: value }));
        } else {
            setCollectionSettings((prev: any) => ({ ...prev, [key]: value }));
        }
    }, [viewMode]);

    // 外部に公開する setFilter ラッパー関数
    const setFilter = useCallback((newFilter: Partial<CardPoolFilters>) => {
        setInternalFilter(prev => ({ ...prev, ...newFilter }));
    }, []);
    
    // パック情報のマップを生成 (変更なし)
    const packMap = useMemo(() => {
        return new Map<string, Pick<Pack, 'name' | 'number'>>(
            packs
                .filter(pack => pack.isInStore) 
                .map(pack => [
                    pack.packId, 
                    { name: pack.name, number: pack.number || null }
                ])
        );
    }, [packs]);
    
    // パックフィルター用に使用可能なパックリストを抽出 (変更なし)
    const availablePacks = useMemo(() => {
        return packs
            .filter(p => p.isInStore)
            .map(pack => ({ 
                packId: pack.packId, 
                name: pack.name, 
                number: pack.number || null
            }))
            .sort((a, b) => (a.number || 999999) - (b.number || 999999));
    }, [packs]);


    // OwnedCardDisplay のリストを作成する際にパック情報を結合 (変更なし)
    const ownedCardDisplayList = useMemo((): OwnedCardDisplay[] => {
        const cardMap = new Map<string, CardType>(allCards.map(card => [card.cardId, card]));
        const ownedList: OwnedCardDisplay[] = [];
        
        const processCard = (card: CardType, count: number): OwnedCardDisplay | null => {
            const packInfo = packMap.get(card.packId);
            if (!packInfo) {
                return null;
            }
            return {
                ...card,
                count: count,
                description: (card as any).description || '',
                packNumber: packInfo.number || null, 
                packName: packInfo.name,
            };
        };

        if (viewMode === 'list') {
            ownedCards.forEach((count, cardId: string) => { 
                const card = cardMap.get(cardId);
                if (card && (count > 0 || !isDTCGEnabled)) { 
                    const displayCard = processCard(card, count);
                    if (displayCard) ownedList.push(displayCard);
                }
            });
        } else {
            allCards.forEach(card => {
                const count = ownedCards.get(card.cardId) || 0;
                const displayCard = processCard(card, count);
                if (displayCard) ownedList.push(displayCard);
            });
        }
        return ownedList;
    }, [ownedCards, allCards, isDTCGEnabled, viewMode, packMap]); 


    // 🚨 削除: 未使用のため filterFunction の定義を削除 (TS6133 エラー解消)
    // const filterFunction = useCallback((card: OwnedCardDisplay) => {
    //     ...
    // }, [filter]); 

    
    // 汎用ソートフックの適用
    const {
        sortedAndFilteredData: sortedCards, // 💡 検索はフックの外で適用するため、名称を sortedCards に変更
        sortField: currentSortField,
        sortOrder: currentSortOrder,
        setSortField: setSortFieldInternal,
        toggleSortOrder,
    } = useSortAndFilter<OwnedCardDisplay>(ownedCardDisplayList, cardPoolFieldAccessor, {
        defaultSortField: activeSettings.sortField,
        defaultSortOrder: activeSettings.sortOrder,
        // 🚨 削除: initialSearchTerm を削除 (TS2353 エラー解消)
    });


    // 💡 修正: ソートされたリストに対して、全てのフィルターを適用する
    const finalFilteredAndSortedCards = useMemo(() => {
        
        return sortedCards.filter(card => {
            let pass = true;

            // 1. 検索ワードによるフィルタリング
            if (filter.search) {
                const searchLower = filter.search.toLowerCase();
                pass = pass && (
                    card.name.toLowerCase().includes(searchLower) ||
                    (card.description?.toLowerCase() || '').includes(searchLower) 
                );
            }
            
            // 2. パックIDによるフィルタリング
            if (filter.packId) {
                pass = pass && card.packId === filter.packId;
            }
            
            // 3. レアリティによるフィルタリング
            if (filter.rarity) {
                pass = pass && card.rarity === filter.rarity;
            }

            return pass;
        });
    }, [sortedCards, filter.search, filter.packId, filter.rarity]);


    // 公開する setSortKey / toggleSortOrder (変更なし)
    const setSortKey = useCallback((key: SortField) => {
        setSetting('sortField', key);
        setSortFieldInternal(key); 
        setCurrentPage(1);
    }, [setSetting, setSortFieldInternal]);
    
    const publicToggleSortOrder = useCallback(() => {
        setSetting('sortOrder', currentSortOrder === 'asc' ? 'desc' : 'asc');
        toggleSortOrder();
        setCurrentPage(1);
    }, [setSetting, currentSortOrder, toggleSortOrder]);

    // ... (ページネーション、resetCollection は変更なし)
    const totalPages = useMemo(() => {
        return Math.max(1, Math.ceil(finalFilteredAndSortedCards.length / CARDS_PER_PAGE));
    }, [finalFilteredAndSortedCards.length]);

    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [currentPage, totalPages]);
    
    const resetCollection = useCallback(async () => {
        await resetPool();
        setInternalFilter({ search: null, packId: null, rarity: null });
        setCurrentPage(1);
    }, [resetPool]);


    return {
        isLoading,
        error,
        filteredCards: finalFilteredAndSortedCards, 
        filter,
        setFilter: setFilter, 
        currentPage,
        totalPages,
        setCurrentPage,
        viewMode,
        setViewMode,
        sortField: currentSortField, 
        setSortField: setSortKey,
        sortOrder: currentSortOrder, 
        toggleSortOrder: publicToggleSortOrder,
        columns: activeSettings.columns,
        resetCollection,
        isDTCGEnabled,
        availablePacks,
    };
};