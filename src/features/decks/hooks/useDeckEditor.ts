/**
 * src/features/decks/hooks/useDeckEditor.ts
 *
 * * デッキ編集画面のコアロジックを統合したカスタムフック。
 * * 責務:
 * 1. URLパラメータのdeckIdに基づき、編集対象のデッキをロード/初期化し、ローカル状態（useState）で管理する。
 * 2. デッキの初期状態と現在の状態を比較し、**ダーティ状態（isDirty）** を追跡する。
 * 3. デッキの名称、属性、カード枚数など、あらゆる編集操作（updateDeckInfo, updateCardCount）のハンドラを提供する。
 * 4. デッキの保存（saveDeck）、ゴミ箱への移動（moveDeckToTrash）、復元、物理削除といった永続化アクションをDeckStore/Archive機能と連携して実行する。
 * 5. ローディング状態（isLoading）および保存メッセージ（saveMessage）のUIフィードバックを管理する。
 * 6. デッキ編集に必要な参照データ（全カードリスト、所有カード資産）を他のZustandストアから取得し、コンポーネントに提供する。
 */

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useDeckStore } from '../../../stores/deckStore';
import { useCardPoolStore } from '../../../stores/cardPoolStore';
import { useShallow } from 'zustand/react/shallow';
import { useNavigate } from '@tanstack/react-router';
import { useCardStore } from '../../../stores/cardStore';
import type { Deck } from '../../../models/deck';
import { createDefaultDeck } from '../../../utils/dataUtils';

import {
    createDeckArchive,
    type DeckArchiveDependencies
} from '../../../stores/utils/createDeckArchive';


// ----------------------------------------------------------------------
// Deckのダーティチェック用フィールド定義

/**
 * Deck オブジェクトから、編集/保存に関わるフィールドのみを抽出した型。
 */
type DeckCompareFields = Pick<Deck,
    'name' | 'number' | 'imageUrl' | 'imageColor' | 'ruleId' | 'deckType' | 'series' | 'description' |
    'keycard_1' | 'keycard_2' | 'keycard_3' | 'isLegal' | 'hasUnownedCards' | 'isFavorite' | 'mainDeck' | 'sideDeck' | 'extraDeck' |
    'num_1' | 'num_2' | 'num_3' | 'num_4' | 'str_1' | 'str_2' | 'str_3' | 'str_4' | 'fieldSettings' | 'tag' | 'searchText'>;

/**
 * Deckデータから、DeckCompareFieldsを生成するヘルパー関数。
 * Map型のゾーンはソートされた配列に変換され、比較可能性を確保する。
 */
const extractCompareFieldsFromDeck = (deck: Deck): DeckCompareFields => {
    // Map<cardId, count> を [cardId, count][] に変換し、cardIdでソート
    const mapToArrayAndSort = (map: Map<string, number>): [string, number][] =>
        Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));

    const deckFields: DeckCompareFields = {
        name: deck.name,
        number: deck.number || null,
        imageUrl: deck.imageUrl,
        imageColor: deck.imageColor,
        ruleId: deck.ruleId || undefined,
        deckType: deck.deckType,
        series: deck.series,
        description: deck.description,
        keycard_1: deck.keycard_1,
        keycard_2: deck.keycard_2,
        keycard_3: deck.keycard_3,
        isLegal: deck.isLegal,
        hasUnownedCards: deck.hasUnownedCards,
        isFavorite: deck.isFavorite,

        // Map型のゾーンを比較可能な配列に変換
        mainDeck: mapToArrayAndSort(deck.mainDeck) as any,
        sideDeck: mapToArrayAndSort(deck.sideDeck) as any,
        extraDeck: mapToArrayAndSort(deck.extraDeck) as any,

        // カスタムフィールド
        num_1: deck.num_1, num_2: deck.num_2, num_3: deck.num_3, num_4: deck.num_4,
        str_1: deck.str_1, str_2: deck.str_2, str_3: deck.str_3, str_4: deck.str_4,
        fieldSettings: deck.fieldSettings, tag: deck.tag, searchText: deck.searchText,
    };

    return deckFields;
};
// ----------------------------------------------------------------------


/**
 * デッキ編集画面のロジック、データロード、保存処理を統合する Hook
 */
export const useDeckEditor = (deckId: string) => {
    const [deckData, setDeckData] = useState<Deck | null>(null);
    const [originalDeckData, setOriginalDeckData] = useState<DeckCompareFields | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [saveMessage, setSaveMessage] = useState<string | null>(null);
    const navigate = useNavigate();

    // DeckStoreから必要なアクションと状態を取得
    const {
        fetchDeckById,
        saveDeck,
        decks,
    } = useDeckStore(useShallow(state => ({
        fetchDeckById: state.fetchDeckById,
        saveDeck: state.saveDeck,
        decks: state.decks,
    })));

    // CardPoolStoreから所有カード資産を取得
    const ownedCards = useCardPoolStore(state => state.ownedCards);

    // CardStoreから全カードリストを取得
    const allCards = useCardStore(useShallow(state => state.cards));


    // --- 派生状態 ---
    // DB/Storeに存在しなければ新規作成とみなす
    const isNewDeck = useMemo(() => {
        return deckId && !decks.some(d => d.deckId === deckId);
    }, [deckId, decks]);

    /**
     * ダーティチェックロジック
     */
    const isDirty = useMemo(() => {
        if (!deckData) return false;

        const currentFields = extractCompareFieldsFromDeck(deckData);
        const currentJson = JSON.stringify(currentFields);

        if (isNewDeck) {
            // 新規作成時: デフォルト状態と比較
            const defaultDeck = createDefaultDeck(deckData.deckId);
            const defaultFields = extractCompareFieldsFromDeck(defaultDeck);
            return currentJson !== JSON.stringify(defaultFields);
        }

        // 既存デッキ: 初期ロード時のスナップショットと比較
        if (!originalDeckData) return false;

        return currentJson !== JSON.stringify(originalDeckData);
    }, [deckData, originalDeckData, isNewDeck]);


    // --- データロードと初期化 ---

    /**
     * ローカルステートを一括で更新し、ダーティチェックのベースラインを設定
     */
    const updateLocalState = useCallback((deck: Deck) => {
        setDeckData(deck);
        setOriginalDeckData(extractCompareFieldsFromDeck(deck));
        setIsLoading(false);
        // console.log(`[useDeckEditor] ✅ Local state set for Deck ID: ${deck.deckId}`);
    }, []);


    // 1. 初期ロード / デッキ切り替えロジック
    useEffect(() => {
        const loadDeck = async () => {
            setIsLoading(true);
            // DB/Storeに存在しなければ新規作成
            if (isNewDeck && deckId) {
                const newDeck = createDefaultDeck(deckId);
                updateLocalState(newDeck);
                return;
            }
            const deck = await fetchDeckById(deckId);
            if (deck) {
                updateLocalState(deck);
            } else {
                console.error(`[useDeckEditor] ❌ Deck ID ${deckId} not found.`);
                setDeckData(null);
                setOriginalDeckData(null);
                setIsLoading(false);
            }
        };
        // URLのdeckIdとローカルの状態が一致しない場合のみロードを実行
        if (!deckData || deckData.deckId !== deckId) {
            loadDeck();
        }
    }, [deckId, fetchDeckById, isNewDeck, updateLocalState, deckData]);

    // --- UI/データ更新ハンドラ ---

    /**
     * デッキ情報（名称、画像URLなど、Map以外のフィールド）を更新
     */
    const updateDeckInfo = useCallback((info: Partial<Omit<Deck, 'mainDeck' | 'sideDeck' | 'extraDeck' | 'totalCards'>>) => {
        setDeckData(prev => prev ? ({ ...prev, ...info }) : null);
    }, []);

    /**
     * 指定されたゾーンのカード枚数を更新（追加/削除/変更）
     */
    const updateCardCount = useCallback((zone: keyof Pick<Deck, 'mainDeck' | 'sideDeck' | 'extraDeck'>, cardId: string, count: number) => {
        setDeckData(prev => {
            if (!prev) return null;

            // 既存のMapをコピー
            const newMap = new Map(prev[zone]);

            if (count > 0) {
                newMap.set(cardId, count);
            } else {
                newMap.delete(cardId);
            }

            // totalCardsを再計算 (Mapの更新後に実行)
            const mainTotal = Array.from(prev.mainDeck.values()).reduce((a, b) => a + b, 0);
            const sideTotal = Array.from(prev.sideDeck.values()).reduce((a, b) => a + b, 0);
            const extraTotal = Array.from(prev.extraDeck.values()).reduce((a, b) => a + b, 0);
            const newTotalCards = mainTotal + sideTotal + extraTotal;
            
            // 更新後のオブジェクトを生成
            return {
                ...prev,
                [zone]: newMap, // 更新されたゾーンのMap
                totalCards: newTotalCards, // 更新された合計枚数
            };
        });
    }, []);

    // ----------------------------------------------------------------------
    // 修正: DeckEditorPage.tsx が期待する handleCardAdd/Remove のラッパー関数
    // ----------------------------------------------------------------------

    /**
     * カードを1枚追加
     */
    const handleCardAdd = useCallback((cardId: string, deckArea: 'mainDeck' | 'sideDeck' | 'extraDeck') => {
        const currentCount = deckData ? deckData[deckArea].get(cardId) || 0 : 0;
        updateCardCount(deckArea, cardId, currentCount + 1);
    }, [deckData, updateCardCount]);

    /**
     * カードを1枚削除
     */
    const handleCardRemove = useCallback((cardId: string, deckArea: 'mainDeck' | 'sideDeck' | 'extraDeck') => {
        const currentCount = deckData ? deckData[deckArea].get(cardId) || 0 : 0;
        updateCardCount(deckArea, cardId, currentCount - 1);
    }, [deckData, updateCardCount]);


    // ArchiveDependencies の構築
    const deckArchiveDependencies: DeckArchiveDependencies = {
        // DeckStore の getState を get として渡す 
        get: useDeckStore.getState,
    };

    // createDeckArchive を使用してアクションを取得
    const {
        moveDeckToTrash,
        restoreDeckFromTrash,
        deleteDeckFromTrash: physicalDeleteDeck,
    } = createDeckArchive(deckArchiveDependencies);


    // 3. デッキ保存ロジック
    const handleSaveDeck = useCallback(async () => {
        if (!deckData?.name?.trim()) {
            setSaveMessage('❌ デッキ名を入力してください。');
            setTimeout(() => setSaveMessage(null), 3000);
            return;
        }

        if (!isDirty) {
            setSaveMessage('✅ 変更がありません。');
            setTimeout(() => setSaveMessage(null), 3000);
            return;
        }

        try {
            const savedDeck = await saveDeck(deckData);

            if (isNewDeck) {
                // 新規作成の場合、URLを置換してリダイレクト
                navigate({ to: '/decks/$deckId', params: { deckId: savedDeck.deckId }, replace: true });
            } else {
                // 既存デッキの場合、ローカルの状態を保存後の状態に更新
                updateLocalState(savedDeck);
                setSaveMessage('✅ デッキを保存しました！');
                setTimeout(() => setSaveMessage(null), 3000);
            }
        } catch (error) {
            setSaveMessage('❌ 保存に失敗しました。');
            console.error('Save failed:', error);
            setTimeout(() => setSaveMessage(null), 3000);
        }
    }, [deckData, saveDeck, isNewDeck, navigate, updateLocalState, isDirty]);


    // 4. デッキ削除 (メインDBから削除しゴミ箱に移動) ロジック
    const handleDeleteDeck = useCallback(async () => {
        if (!deckData) return;

        if (!window.confirm(`デッキ「${deckData.name}」をゴミ箱に移動しますか？\n（この操作はいつでも復元可能です）`)) {
            return;
        }

        try {
            await moveDeckToTrash(deckData.deckId);
            setSaveMessage('✅ デッキをゴミ箱に移動しました。');
            navigate({ to: '/decks' });
        } catch (error) {
            setSaveMessage('❌ デッキのゴミ箱への移動に失敗しました。');
            console.error(error);
        }
    }, [deckData, moveDeckToTrash, navigate]);


    // 5. デッキ復元 (ゴミ箱から復元) ロジック
    const handleRestoreDeck = useCallback(async (archiveId: string) => {
        if (!window.confirm(`デッキを一覧に復元しますか？`)) {
            return;
        }

        try {
            await restoreDeckFromTrash(archiveId);
            setSaveMessage('✅ デッキを一覧に復元しました。');
            navigate({ to: '/decks' });

        } catch (error) {
            setSaveMessage('❌ 復元に失敗しました。');
            console.error(error);
        }
    }, [restoreDeckFromTrash, navigate]);


    // 6. 物理削除ロジック (ゴミ箱からの完全削除)
    const handlePhysicalDelete = useCallback(async (archiveId: string) => {
        if (!window.confirm(`【警告】デッキをDBから完全に物理削除しますか？\nこの操作は元に戻せません。`)) {
            return;
        }

        try {
            await physicalDeleteDeck(archiveId);
            setSaveMessage('✅ デッキを物理削除しました。');
            navigate({ to: '/decks' });
        } catch (error) {
            setSaveMessage('❌ デッキの物理削除に失敗しました。');
            console.error(error);
        }
    }, [physicalDeleteDeck, navigate]);


    // 公開する値とアクション
    return {
        deckId,
        isLoading,
        isDirty,
        saveMessage,
        currentDeck: deckData,
        isNewDeck,

        // デッキ編集アクション
        onSave: handleSaveDeck,
        onDelete: handleDeleteDeck,
        onRestore: handleRestoreDeck,
        onPhysicalDelete: handlePhysicalDelete,

        // データ更新ハンドラ
        updateDeckInfo,
        updateCardCount,
        // 修正: DeckEditorPage.tsxで期待されていたプロパティを追加
        handleCardAdd,
        handleCardRemove,

        // 参照データ
        allCards: allCards,
        ownedCards: ownedCards,
    };
};