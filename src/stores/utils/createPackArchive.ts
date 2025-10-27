// src/stores/utils/createPackArchive.ts

import { archiveService } from '../../services/archive/archiveService';
import { packService } from '../../services/packs/packService'; 
import { dbArchiveToArchivePackBundle as _dbArchiveToArchivePackBundle } from '../../services/database/dbMappers';
import type { Pack, PackBundle } from '../../models/pack'; 
import type { Card } from '../../models/card';
import type { DBArchive, DBPackBundle } from '../../models/db-types'; 
import type { 
    ArchivePack, 
    ArchivePackBundle, 
    ArchiveItemToSave, 
    ArchiveItemType, 
    ArchiveDisplayData,
    ArchiveItemData
} from '../../models/archive'; 
import { 
    createCommonArchiveActions, 
    type ArchiveHandler, 
    type ArchiveMappers
} from './_archiveCoreUtils'; 

// 💡 修正: dataUtilsから createDefaultPack をインポート
import { createDefaultPack } from '../../utils/dataUtils'; 

// 💡 PackStore の型をインポート
import type { PackStore } from '../packStore';
import type { CardStore } from '../cardStore'; // CardStoreの型をインポート


// ----------------------------------------
// 定数 
// ----------------------------------------
const ARCHIVE_ITEM_TYPE: ArchiveItemType = 'packBundle' as const;


// ----------------------------------------
// 💡 Pack Archiveの依存関係インターフェース (get関数を受け取る形に修正)
// ----------------------------------------
export interface PackArchiveDependencies {
    // Pack Storeの get 関数全体を受け取る
    get: () => PackStore;
    // Card Storeの getState 関数を受け取る
    getCardStoreState: () => CardStore;
}


// ----------------------------------------
// プライベートヘルパー関数 (変更なし)
// ----------------------------------------

/**
 * PackとCardリストを PackBundle に統合する。(Handler.mappers.toArchiveDataとして使用)
 */
const _createPackBundle = (pack: Pack, cards?: Card[]): PackBundle => ({ 
    packData: pack, 
    cardsData: cards ?? [] 
});

/**
 * PackBundleからPackとCardリストに展開する。(Handler.mappers.fromArchiveDataとして使用)
 */
const _unpackPackBundle = (data: DBPackBundle): { pack: Pack, cards: Card[] } => {
    // ここでは単純にDB型からアプリ型への型変換が行われると仮定し、型キャストで対応する
    return { 
        pack: data.packData as Pack, 
        cards: data.cardsData as Card[],
    };
};

/**
 * 💡 復元後のPackBundleからCardを取り出し、Storeに保存する (Handler.postRestoreActionとして使用)
 */
const _postRestoreAction = async (
    restoredEntities: Pack[], 
    bulkSaveCards: (cards: Card[]) => Promise<void>
): Promise<Pack[]> => {
    const restoredBundles = restoredEntities as unknown as PackBundle[]; 
    
    const allCardsToSave: Card[] = [];
    restoredBundles.forEach(bundle => {
        allCardsToSave.push(...bundle.cardsData);
    });
    
    // Card Storeに保存
    await bulkSaveCards(allCardsToSave); 

    // PackBundleからPack型に戻して返す
    return restoredBundles as unknown as Pack[]; 
};

// ----------------------------------------
// Pack Mappers (変更なし)
// ----------------------------------------

// ArchivePackBundle (完全データ) から ArchivePack (リスト表示用) を抽出
const _archiveBundleToArchivePack = (bundle: ArchivePackBundle): ArchivePack => ({
    ...bundle.packData,
    archiveId: bundle.archiveId,
    archivedAt: bundle.archivedAt,
    isFavorite: bundle.isFavorite,
    isManual: bundle.isManual,
});

/**
 * DBArchiveからArchiveDisplayData (ArchivePack) へ変換するマッパー
 * 💡 修正: createDefaultPack を利用し、手動補完を削除
 */
const packToArchiveDisplayData = (dbRecord: DBArchive): ArchiveDisplayData => {
    const archiveBundle = _dbArchiveToArchivePackBundle(dbRecord); 
    const packData = archiveBundle.packData;
    
    // データが完全に存在する場合
    if (packData) {
        return _archiveBundleToArchivePack(archiveBundle);
    }
    
    // Packデータが削除されている（null）場合
    
    // 1. dataUtilsからデフォルトのPackオブジェクトを生成 (packIdを付与)
    const defaultPack = createDefaultPack(dbRecord.itemId); 
    
    // 3. 最終的な ArchivePack オブジェクトを生成
    return {
        // Archive固有のメタデータを追加
        archiveId: dbRecord.archiveId,
        archivedAt: dbRecord.archivedAt,
        // createDefaultPack の値をベースに、削除メタデータで上書き
        ...defaultPack,         
        // DBから取得したアーカイブ日時を最終更新日として設定
        createdAt: dbRecord.archivedAt,
        updatedAt: dbRecord.archivedAt,

    } as ArchivePack;
};

const packToArchiveItemData = (dbRecord: DBArchive): ArchiveItemData => {
    return _dbArchiveToArchivePackBundle(dbRecord); 
};

const packMappers: ArchiveMappers = {
    toArchiveDisplayData: packToArchiveDisplayData,
    toArchiveItemData: packToArchiveItemData,
};


// --- PackArchive インターフェース定義 (変更なし) ---
export interface PackArchive {
    fetchAllArchivePacksFromHistory: () => Promise<ArchivePack[]>;
    fetchArchivePackBundleFromHistory: (archiveId: string) => Promise<ArchivePackBundle | null>;
    saveLatestPackBundleToHistory: (packId: string) => Promise<void>;
    saveEditingPackBundleToHistory: (bundle: PackBundle) => Promise<void>;
    restorePackBundleFromHistory: (archiveId: string) => Promise<void>;
    bulkRestorePackBundlesFromHistory: (archiveIds: string[]) => Promise<void>;
    deletePackBundleFromHistory: (archiveId: string) => Promise<void>;
    bulkDeletePackBundlesFromHistory: (archiveIds: string[]) => Promise<void>;

    fetchAllArchivePacksFromTrash: () => Promise<ArchivePack[]>;
    fetchArchivePackBundleFromTrash: (archiveId: string) => Promise<ArchivePackBundle | null>;
    movePackToTrash: (packId: string) => Promise<void>;
    bulkMovePacksToTrash: (packIds: string[]) => Promise<void>;
    restorePackBundleFromTrash: (archiveId: string) => Promise<void>;
    bulkRestorePackBundlesFromTrash: (archiveIds: string[]) => Promise<void>;
    deletePackBundleFromTrash: (archiveId: string) => Promise<void>;
    bulkDeletePackBundlesFromTrash: (archiveIds: string[]) => Promise<void>;

    runPackGarbageCollection: () => Promise<void>;
}


/**
 * Packのアーカイブ操作のためのアクションファクトリ関数。
 * @param dependencies Pack Storeの get 関数と Card Storeの getState 関数
 * @returns PackArchive
 */
export const createPackArchive = (dependencies: PackArchiveDependencies): PackArchive => { 
    
    // 💡 依存関係の解決 
    const getPackStore = dependencies.get; 
    const getCardStoreState = dependencies.getCardStoreState;
    
    // Card Store のアクションと状態を解決 (getState() で解決可能)
    const cardStore = getCardStoreState();
    const bulkSaveCards = cardStore.bulkSaveCards;
    const removeCardsFromStoreByPackId = cardStore.removeCardsFromStoreByPackId;
    
    // 💡 削除: bulkSyncPacksToStore などの直接的な解決は削除。Handler内で遅延評価させる。
    // const bulkSyncPacksToStore = getPackStore().bulkSyncPacksToStore; 
    // const bulkRemovePacksFromStore = getPackStore().bulkRemovePacksFromStore;
    // const fetchAllPacks = getPackStore().fetchAllPacks; 

    // 1. Pack固有の依存関係を構成
    const packHandler: ArchiveHandler<Pack, PackBundle> = {
        itemType: ARCHIVE_ITEM_TYPE, 
        mainService: {
            fetchByIds: async (ids: string[]) => {
                const packs = await packService.fetchPacksByIds(ids);
                return packs.filter((pack): pack is Pack => pack !== null);
            },
            save: packService.savePacks,
            delete: packService.deletePacks,
        },
        storeActions: {
            // 💡 修正 1: getPackStore() を呼び出す関数としてラップし、遅延評価させる
            syncToStore: (packs: Pack[]) => getPackStore().bulkSyncPacksToStore(packs), 
            // 💡 修正 2: getPackStore() を呼び出す関数としてラップし、遅延評価させる
            bulkRemoveFromStore: (ids: string[]) => getPackStore().bulkRemovePacksFromStore(ids), 
        },
        mappers: {
            // Pack Storeの最新の状態からCardsを絞り込むため、Packのみを受け取る型シグネチャを使用
            toArchiveData: (pack: Pack) => {
                // cardStore は getState() 経由で取得済み
                const cards = cardStore.cards.filter(card => card.packId === pack.packId);
                return _createPackBundle(pack, cards) as unknown as PackBundle;
            },
            fromArchiveData: (data: any) => _unpackPackBundle(data as DBPackBundle),
        },
        // postRestoreActionは bulkSaveCards をクロージャとして使用
        postRestoreAction: (restoredEntities) => _postRestoreAction(restoredEntities, bulkSaveCards),
        cardActions: {
            bulkSaveCards: bulkSaveCards,
            removeCardsFromStoreByPackId: removeCardsFromStoreByPackId,
        },
    };

    // 2. 共通ロジックを生成
    const commonActions = createCommonArchiveActions(packHandler, packMappers);


    // ----------------------------------------------------------------------
    // --- 📜 履歴アクション ---
    // ----------------------------------------------------------------------
    
    const fetchAllArchivePacksFromHistory = () => commonActions.fetchAllArchiveMetadata('history') as Promise<ArchivePack[]>;
    
    const fetchArchivePackBundleFromHistory = async (archiveId: string): Promise<ArchivePackBundle | null> => {
        const itemData = await commonActions.fetchArchiveItemData(archiveId, 'history');
        if (!itemData) return null;
        return itemData as ArchivePackBundle; 
    };
    
    const saveLatestPackBundleToHistory = async (packId: string) => {
        const latestPacks = await packService.fetchPacksByIds([packId]); 
        const latestPack = latestPacks.length > 0 ? latestPacks[0] : null; 
        if (!latestPack) throw new Error(`Pack ID ${packId} not found in main DB.`);
        
        // cardStore は getState() 経由で取得済み
        const cardsData = cardStore.cards.filter(card => card.packId === packId); 
        
        const bundle = _createPackBundle(latestPack, cardsData); 
        
        await archiveService.saveItemsToArchive(
            [{ itemType: ARCHIVE_ITEM_TYPE, itemId: packId, data: bundle as unknown as DBPackBundle }], 'history' 
        );
    };

    const saveEditingPackBundleToHistory = async (bundle: PackBundle) => {
        const packId = bundle.packData.packId;
        
        const archiveData = _createPackBundle(bundle.packData, bundle.cardsData);

        await archiveService.saveItemsToArchive(
            [{ itemType: ARCHIVE_ITEM_TYPE, itemId: packId, data: archiveData as unknown as DBPackBundle }], 'history' 
        );
    };
    
    const restorePackBundleFromHistory = (archiveId: string) => commonActions.bulkRestoreItemsFromArchive([archiveId], 'history').then(() => {});
    const bulkRestorePackBundlesFromHistory = (archiveIds: string[]) => commonActions.bulkRestoreItemsFromArchive(archiveIds, 'history').then(() => {});
    
    const deletePackBundleFromHistory = (archiveId: string) => commonActions.bulkDeleteItemsFromArchive([archiveId], 'history');
    const bulkDeletePackBundlesFromHistory = (archiveIds: string[]) => commonActions.bulkDeleteItemsFromArchive(archiveIds, 'history');


    // ----------------------------------------------------------------------
    // --- 🗑️ ゴミ箱アクション ---
    // ----------------------------------------------------------------------

    const fetchAllArchivePacksFromTrash = () => commonActions.fetchAllArchiveMetadata('trash') as Promise<ArchivePack[]>;
    
    const fetchArchivePackBundleFromTrash = async (archiveId: string): Promise<ArchivePackBundle | null> => {
        const itemData = await commonActions.fetchArchiveItemData(archiveId, 'trash');
        if (!itemData) return null;
        return itemData as ArchivePackBundle; 
    };
    
    const movePackToTrash = (packId: string) => bulkMovePacksToTrash([packId]);

    // 💡 Pack固有のゴミ箱移動ロジック
    const bulkMovePacksToTrash = async (packIds: string[]) => {
        if (packIds.length === 0) return;
        
        const packsWithNulls = await packService.fetchPacksByIds(packIds); 
        const packsToMove = packsWithNulls.filter((pack): pack is Pack => pack !== null);

        const itemsToArchive: ArchiveItemToSave<DBPackBundle>[] = packsToMove.map(packToMove => {
            // cardStore は getState() 経由で取得済み
            const cardsData = getCardStoreState().cards.filter(card => card.packId === packToMove.packId); 
            
            const bundle = _createPackBundle(packToMove, cardsData);
            
            return { itemType: ARCHIVE_ITEM_TYPE, itemId: packToMove.packId, data: bundle as unknown as DBPackBundle };
        });

        // 1. Archiveへ保存
        if (itemsToArchive.length > 0) {
            await archiveService.saveItemsToArchive(itemsToArchive, 'trash'); 
        }
        
        // 2. Main DBから削除
        await packService.deletePacks(packIds); 
        
        // 3. Storeから削除 (Packのみ)
        // 💡 修正 3: getPackStore() を呼び出す関数としてラップし、遅延評価させる
        getPackStore().bulkRemovePacksFromStore(packIds); 
        
        // 4. Card Storeからの削除
        packIds.forEach(packId => {
             removeCardsFromStoreByPackId(packId); 
        });
    };

    const restorePackBundleFromTrash = (archiveId: string) => commonActions.bulkRestoreItemsFromArchive([archiveId], 'trash').then(() => {});
    const bulkRestorePackBundlesFromTrash = (archiveIds: string[]) => commonActions.bulkRestoreItemsFromArchive(archiveIds, 'trash').then(() => {});
    
    const deletePackBundleFromTrash = (archiveId: string) => commonActions.bulkDeleteItemsFromArchive([archiveId], 'trash');
    const bulkDeletePackBundlesFromTrash = (archiveIds: string[]) => commonActions.bulkDeleteItemsFromArchive(archiveIds, 'trash');


    // ----------------------------------------------------------------------
    // --- 🛠️ メンテナンスアクション ---
    // ----------------------------------------------------------------------

    const runPackGarbageCollection = async () => {
        console.log(`[createPackArchive:runPackGarbageCollection] 🧹 START running garbage collection...`);
        try {
            await commonActions.runGarbageCollection(); 
            
            // 💡 修正 4: getPackStore() を呼び出す関数としてラップし、遅延評価させる
            await getPackStore().fetchAllPacks(); 
            console.log(`[createPackArchive:runPackGarbageCollection] ✅ Garbage collection complete and packs reloaded.`);
        } catch (error) {
            console.error("[createPackArchive:runPackGarbageCollection] ❌ Failed to run garbage collection:", error);
            throw error;
        }
    };


    return {
        fetchAllArchivePacksFromHistory,
        fetchArchivePackBundleFromHistory,
        saveLatestPackBundleToHistory,
        saveEditingPackBundleToHistory,
        restorePackBundleFromHistory,
        bulkRestorePackBundlesFromHistory,
        deletePackBundleFromHistory,
        bulkDeletePackBundlesFromHistory,

        fetchAllArchivePacksFromTrash,
        fetchArchivePackBundleFromTrash,
        movePackToTrash,
        bulkMovePacksToTrash,
        restorePackBundleFromTrash,
        bulkRestorePackBundlesFromTrash,
        deletePackBundleFromTrash,
        bulkDeletePackBundlesFromTrash,
        
        runPackGarbageCollection, 
    };
};