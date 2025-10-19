import { archiveService } from '../../services/archive/archiveService';
// dbArchiveToArchivePackBundle は PackHook のみで利用されるため、ここではインポートしない。
import type { Deck } from '../../models/deck';
import type { Pack } from '../../models/pack'; 
import type { Card } from '../../models/card';
import type { DBArchive } from '../../models/db-types';
import type { 
    ArchiveCollectionKey, 
    ArchiveItemType,
    ArchiveDisplayData, 
    ArchiveItemData
} from '../../models/archive'; 


// --- 共通型定義 ---

// 注入するMain Serviceのアクション (DB層)
export interface MainServiceActions<TEntity> {
    fetchByIds: (ids: string[]) => Promise<TEntity[]>;
    save: (entities: TEntity[]) => Promise<TEntity[]>;
    delete: (ids: string[]) => Promise<void>;
}

// 注入するStoreのアクション (メモリキャッシュ層)
export interface StoreActions<TEntity> {
    syncToStore: (entities: TEntity[]) => void;
    bulkRemoveFromStore: (ids: string[]) => void;
}


// 💡 外部から注入されるマッパー関数の型を定義
export interface ArchiveMappers {
    toArchiveDisplayData: (dbRecord: DBArchive) => ArchiveDisplayData;
    toArchiveItemData: (dbRecord: DBArchive) => ArchiveItemData;
}


// 固有のロジックと依存関係をまとめたハンドラー
export interface ArchiveHandler<TEntity extends Deck | Pack, TArchiveData> {
    itemType: ArchiveItemType;
    mainService: MainServiceActions<TEntity>;
    storeActions: StoreActions<TEntity>;
    
    // マッパー: 複雑なPackBundleの処理を吸収するために必要
    mappers: {
        // TEntity(Pack/Deck)をArchiveのデータ形式に変換
        toArchiveData: (entity: TEntity, relatedCards?: Card[]) => TArchiveData; 
        // ArchiveデータからTEntity(Pack/Deck)または複合型に変換
        fromArchiveData: (data: any) => TEntity | { pack: Pack, cards: Card[] }; 
    };
    
    // 💡 復元後の固有処理 
    postRestoreAction?: (restoredEntities: TEntity[]) => Promise<TEntity[]>;
    
    // 💡 Pack固有のCard操作のための依存性（Deckの場合は利用しない）
    // TEntityがPackの場合にのみ必要
    cardActions?: {
        bulkSaveCards: (cards: Card[]) => Promise<void>;
        removeCardsFromStoreByPackId: (packId: string) => void;
    };
}

// 💡 共通アクションの戻り値型を定義
export interface CommonArchiveActions<TEntity extends Deck | Pack> {
    bulkRestoreItemsFromArchive: (archiveIds: string[], collection: ArchiveCollectionKey) => Promise<TEntity[]>;
    bulkDeleteItemsFromArchive: (archiveIds: string[], collection: ArchiveCollectionKey) => Promise<void>;
    runGarbageCollection: () => Promise<void>;
    fetchAllArchiveMetadata: (collection: ArchiveCollectionKey) => Promise<ArchiveDisplayData[]>;
    fetchArchiveItemData: (archiveId: string, collection: ArchiveCollectionKey) => Promise<ArchiveItemData | null>;
}


/**
 * アーカイブ操作の共通ロジックを生成するファクトリ関数。
 * @param handler PackまたはDeck固有の依存関係とロジック
 * @param mappers DBArchiveから表示/詳細データへの変換マッパー
 * @returns 共通のアーカイブ操作関数
 */
export const createCommonArchiveActions = <TEntity extends Deck | Pack, TArchiveData>(
    handler: ArchiveHandler<TEntity, TArchiveData>,
    mappers: ArchiveMappers 
): CommonArchiveActions<TEntity> => {
    
    // 💡 全表示用メタデータリストの取得
    const fetchAllArchiveMetadata = async (collection: ArchiveCollectionKey): Promise<ArchiveDisplayData[]> => {
        const dbArchives = await archiveService.fetchAllItemsFromArchive<DBArchive>(collection, (dbRecord) => dbRecord );
        
        const archiveMetadata: ArchiveDisplayData[] = dbArchives
            .filter(dbArchive => dbArchive.itemType === handler.itemType)
            .flatMap(dbArchive => {
                 // 💡 外部から注入された toArchiveDisplayData マッパーを利用
                return mappers.toArchiveDisplayData(dbArchive); 
            });
            
        archiveMetadata.sort((a, b) => b.archivedAt.localeCompare(a.archivedAt)); 
        return archiveMetadata;
    };

    /**
     * 💡 個別表示用のアーカイブ実体 (ArchiveItemData) を取得するロジック
     */
    const fetchArchiveItemData = async (archiveId: string, collection: ArchiveCollectionKey): Promise<ArchiveItemData | null> => {
        const bundles = await archiveService.fetchRawItemsByIdsFromArchive([archiveId], collection);
        const dbArchive = bundles[0];
        // itemTypeのチェック
        if (!dbArchive || dbArchive.itemType !== handler.itemType) return null;
        
        // 💡 外部から注入された toArchiveItemData マッパーを利用して変換
        return mappers.toArchiveItemData(dbArchive); 
    };


    // 💡 Pack/Deck共通のバルク復元ロジック
    const bulkRestoreItemsFromArchive = async (archiveIds: string[], collection: ArchiveCollectionKey): Promise<TEntity[]> => {
        if (archiveIds.length === 0) return [];

        console.log(`[ArchiveCore] ♻️ START bulk restoring ${archiveIds.length} items from ${collection}.`);
        
        try {
            // 1. ArchiveからDBArchiveを取得
            const rawRecords = await archiveService.fetchRawItemsByIdsFromArchive(archiveIds, collection);
            let entitiesToRestore: TEntity[] = [];
            const restoredCards: Card[] = []; // Packの場合のみ使用
            const archiveIdsToDelete: string[] = [];
            
            rawRecords.forEach(dbArchive => {
                if (dbArchive && dbArchive.itemType === handler.itemType) { // itemTypeをチェック
                    const unpacked = handler.mappers.fromArchiveData(dbArchive.itemData);
                    
                    if (handler.itemType === 'deck') {
                        // Deck (TEntity = Deck) の場合
                        entitiesToRestore.push(unpacked as TEntity);
                    } else if (handler.itemType === 'packBundle') {
                        // PackBundle (TEntity = Pack) の場合
                        const { pack, cards } = unpacked as { pack: Pack, cards: Card[] };
                        entitiesToRestore.push(pack as TEntity);
                        restoredCards.push(...cards); // 関連カードを抽出
                    }
                    
                    if (collection === 'trash') {
                        archiveIdsToDelete.push(dbArchive.archiveId); 
                    }
                }
            });

            // 2. Main DBにバルク保存
            if (entitiesToRestore.length > 0) {
                // 💡 復元後処理を適用
                if (handler.postRestoreAction) {
                    entitiesToRestore = await handler.postRestoreAction(entitiesToRestore);
                }
                
                const restoredEntities = await handler.mainService.save(entitiesToRestore);
                handler.storeActions.syncToStore(restoredEntities); // Storeに同期
                entitiesToRestore = restoredEntities; // 戻り値を更新
            }

            // 3. 🚨 Pack固有の処理: Cardの復元
            if (handler.itemType === 'packBundle' && restoredCards.length > 0 && handler.cardActions) {
                await handler.cardActions.bulkSaveCards(restoredCards);
            }

            // 4. ゴミ箱から削除 (ゴミ箱からの復元の場合のみ)
            if (collection === 'trash' && archiveIdsToDelete.length > 0) {
                await archiveService.deleteItemsFromArchive(archiveIdsToDelete, 'trash');
            }
            
            console.log(`[ArchiveCore] ✅ ${entitiesToRestore.length} items restored from ${collection}.`);
            return entitiesToRestore;

        } catch (error) {
            console.error(`[ArchiveCore] ❌ Failed to restore items from ${collection}:`, error);
            throw error;
        }
    };
    
    // 💡 Pack/Deck共通のバルク物理削除ロジック
    const bulkDeleteItemsFromArchive = async (archiveIds: string[], collection: ArchiveCollectionKey) => {
        if (archiveIds.length === 0) return;
        
        console.log(`[ArchiveCore] 💥 START physical deletion of ${archiveIds.length} items from ${collection}.`);
        try {
            await archiveService.deleteItemsFromArchive(archiveIds, collection);
            console.log(`[ArchiveCore] ✅ ${archiveIds.length} items physically deleted from ${collection}.`);
        } catch (error) {
            console.error(`[ArchiveCore] ❌ Failed to delete archives from ${collection}:`, error);
            throw error;
        }
    };
    
    // 💡 Pack/Deck共通のガーベジコレクションロジック
    const runGarbageCollection = async () => {
        console.log(`[ArchiveCore] 🧹 START running garbage collection for type: ${handler.itemType}...`);
        try {
            await archiveService.runArchiveGarbageCollection(handler.itemType);
            console.log(`[ArchiveCore] ✅ Garbage collection complete for type: ${handler.itemType}.`);
        } catch (error) {
            console.error(`[ArchiveCore] ❌ Failed to run garbage collection for type: ${handler.itemType}:`, error);
            throw error;
        }
    };

    return {
        bulkRestoreItemsFromArchive,
        bulkDeleteItemsFromArchive,
        runGarbageCollection, 
        fetchAllArchiveMetadata, 
        fetchArchiveItemData,
    } as CommonArchiveActions<TEntity>;
};