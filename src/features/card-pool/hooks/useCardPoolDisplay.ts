/**
 * src/features/card-pool/hooks/useCardPoolDisplay.ts
 *
 * * ユーザーのカードコレクション画面（CardPoolManager）の表示層に必要なすべてのデータとロジックを統合するカスタムフック。
 * * 責務:
 * 1. 複数のZustandストア（CardPoolStore, UserDataStore, CardStore, PackStore）から必要な状態とアクションを取得する。
 * 2. 取得した生データを、UI表示に適した複合データ型（OwnedCardDisplay）のリストに変換する。
 * 3. フィルタリング、ソート、ページネーションの状態管理およびロジック（useSortFilter）を提供する。
 * 4. リスト表示とコレクション表示のView設定を管理し、動的に切り替えるインターフェースを提供する。
 * 5. カードプール全体のリセット機能を提供する。
 */

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useCardPoolStore, type CardPoolState } from '../../../stores/cardPoolStore';
import { useUserDataStore } from '../../../stores/userDataStore';
import { useCardStore } from '../../../stores/cardStore';
import { usePackStore } from '../../../stores/packStore';

import { useSortFilter } from '../../../hooks/useSortFilter';
import type { SortField, Card as CardType, Pack } from '../../../models/models';

import { cardPoolFieldAccessor } from '../cardPoolUtils';
import { CARD_POOL_DEFAULT_SORT } from '../../../configs/configs';

export const CARD_GRID_COLUMNS = 6;
export const CARDS_PER_PAGE = 50;
export type ViewMode = 'list' | 'collection';

// --- 型定義 ---
export interface OwnedCardDisplay extends CardType {
    count: number;
    description: string;
    packNumber: number | null;
    packName: string;
}

export interface ViewSettings {
    sortField: SortField;
    sortOrder: 'asc' | 'desc';
    // 💡 修正: columns は CardPool の useGridDisplay に移譲したため削除 (このフックの責務外に)
    // columns: number;
}


// --- カスタムフック ---

export const useCardPoolDisplay = () => {

    // ストアからのデータ取得 (中略: 変更なし)
    const { ownedCards, isLoading, deleteCardPool } = useCardPoolStore(
        useShallow((state: CardPoolState) => ({
            ownedCards: state.ownedCards,
            isLoading: state.isLoading,
            deleteCardPool: state.deleteCardPool,
        }))
    );

    const isDTCGEnabled = useUserDataStore(useShallow(state => state.isDTCGEnabled));
    const allCards = useCardStore(useShallow(state => state.cards || []));
    const packs = usePackStore(state => state.packs);

    const [error, /*setError*/] = useState<Error | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [viewMode, setViewMode] = useState<ViewMode>('list');

    // 設定の初期化 
    const [_listSettings, setListSettings] = useState<ViewSettings>({
        sortField: 'number',
        sortOrder: 'asc',
        // 💡 修正: columns 削除
    });
    const [_collectionSettings, setCollectionSettings] = useState<ViewSettings>({
        sortField: 'number',
        sortOrder: 'asc',
        // 💡 修正: columns 削除
    });

    // 💡 修正: activeSettings から columns プロパティへの参照を削除
    // const activeSettings = viewMode === 'list' ? listSettings : collectionSettings;

    // setSetting の型推論を ViewSettings に基づいて修正
    const setSetting = useCallback(<K extends keyof ViewSettings>(key: K, value: ViewSettings[K]) => {
        if (viewMode === 'list') {
            setListSettings(prev => ({ ...prev, [key]: value }));
        } else {
            setCollectionSettings(prev => ({ ...prev, [key]: value }));
        }
    }, [viewMode]);

    // パック情報のマップを生成 (中略: 変更なし)
    const packMap = useMemo(() => {
        return new Map<string, Pick<Pack, 'name' | 'number'>>(
            packs
                .map(pack => [
                    pack.packId,
                    { name: pack.name, number: pack.number || null }
                ])
        );
    }, [packs]);

    // パックフィルター用に使用可能なパックリストを抽出 (中略: 変更なし)
    const availablePacks = useMemo(() => {
        return packs
            .map(pack => ({
                packId: pack.packId,
                name: pack.name,
                number: pack.number || null
            }))
            .sort((a, b) => (a.number || 999999) - (b.number || 999999));
    }, [packs]);


    // OwnedCardDisplay のリストを作成する際にパック情報を結合 (中略: 変更なし)
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


    // 汎用ソートフックの適用（FilterCondition[]を使用） (中略: 変更なし)
    const {
        sortedAndFilteredData: filteredCards,
        sortField: currentSortField,
        sortOrder: currentSortOrder,
        searchTerm,
        filters,
        setSortField: setSortFieldInternal,
        toggleSortOrder,
        setSearchTerm,
        setFilters,
    } = useSortFilter<OwnedCardDisplay>(
        ownedCardDisplayList,
        cardPoolFieldAccessor,
        CARD_POOL_DEFAULT_SORT
    );

    // 公開する setSortField (命名を統一) (中略: 変更なし)
    const setSortField = useCallback((field: SortField) => {
        setSetting('sortField', field);
        setSortFieldInternal(field);
        setCurrentPage(1);
    }, [setSetting, setSortFieldInternal]);

    const publicToggleSortOrder = useCallback(() => {
        setSetting('sortOrder', currentSortOrder === 'asc' ? 'desc' : 'asc');
        toggleSortOrder();
        setCurrentPage(1);
    }, [setSetting, currentSortOrder, toggleSortOrder]);

    // ページネーション、resetCollection (中略: 変更なし)
    const totalPages = useMemo(() => {
        return Math.max(1, Math.ceil(filteredCards.length / CARDS_PER_PAGE));
    }, [filteredCards.length]);

    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [currentPage, totalPages]);

    const resetCollection = useCallback(async () => {
        await deleteCardPool();
        setSearchTerm('');
        setFilters([]);
        setCurrentPage(1);
    }, [deleteCardPool, setSearchTerm, setFilters]);


    return {
        isLoading,
        error,
        filteredCards,
        searchTerm,
        filters,
        setSearchTerm,
        setFilters,
        currentPage,
        totalPages,
        setCurrentPage,
        viewMode,
        setViewMode,
        sortField: currentSortField,
        setSortField: setSortField,
        sortOrder: currentSortOrder,
        toggleSortOrder: publicToggleSortOrder,
        // 💡 修正: columns の戻り値を削除
        // columns: activeSettings.columns, 
        resetCollection,
        isDTCGEnabled,
        availablePacks,
    };
};