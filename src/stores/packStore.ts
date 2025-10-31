/**
 * src/stores/packStore.ts
 *
 * * Pack（パック）データのグローバルな状態管理を行うZustandストア。
 * 責務は、メインのPackリスト（packs）のキャッシュ、CRUD操作の実行、およびPack/Cardの
 * 履歴/ゴミ箱（アーカイブ）機能への窓口提供です。
 *
 * * 責務:
 * 1. Packコレクションの状態（packs: Pack[]）とロード状態（isLoading: boolean）を保持する。
 * 2. `packService` を介したDBからのデータフェッチおよびメインコレクションへの永続化をトリガーする。
 * 3. `packJsonIO` を介したPackデータのJSONインポート/エクスポートをトリガーする。
 * 4. 独立したモジュール（createPackArchive）から履歴/ゴミ箱関連のアーカイブアクションを取得し、
 * Storeのアクションとして公開する（窓口責務）。アーカイブ機能は Pack と Packに属する Card をまとめて扱う（Pack Bundle）。
 * 5. 必要な他のStoreの状態（useCardStore.getState）をアーカイブモジュールに提供し、Store間の連携を担う。
 */
import { create } from 'zustand';
import type { Pack } from '../models/pack';
import { packService } from '../services/packs/packService';
import { importPacksFromJson, exportPacksToJson } from '../services/data-io/packJsonIO';

import {
    createPackArchive,
    type PackArchive,
    type PackArchiveDependencies
} from './utils/createPackArchive';
import type { Card } from '../models/card';
import type { ArchivePack, ArchivePackBundle } from '../models/archive';

import { useCardStore } from './cardStore';


// --- PackStore インターフェース定義 ---
export interface PackStore {
    packs: Pack[];
    isLoading: boolean;

    // --- 1. 参照/ロード ---
    fetchAllPacks: () => Promise<void>;
    fetchPackById: (packId: string) => Promise<Pack | null>;

    // --- 2. CRUD/永続化 ---
    savePack: (packToSave: Pack) => Promise<Pack>;
    updatePackIsFavorite: (packId: string, isFavorite: boolean) => Promise<Pack | null>;

    // --- 4. メモリ/ストア操作 (usePackArchiveで使用されるためpublicのまま保持) ---
    syncPackToStore: (pack: Pack) => void;
    bulkSyncPacksToStore: (packs: Pack[]) => void;
    removePackFromStore: (packId: string) => void;
    bulkRemovePacksFromStore: (packIds: string[]) => void;

    // --- 5. I/O ---
    importPacksFromJson: (jsonText: string) => Promise<{ newPackIds: string[], skippedIds: string[] }>;
    exportPacksToJson: (packIds: string[]) => Promise<string>;

    // --- 6. PackArchive アクション ---
    fetchAllArchivePacksFromHistory: () => Promise<ArchivePack[]>;
    fetchArchivePackBundleFromHistory: (archiveId: string) => Promise<ArchivePackBundle | null>;
    saveLatestPackBundleToHistory: (packId: string) => Promise<void>;
    saveEditingPackBundleToHistory: (bundle: { packData: Pack, cardsData: Card[] }) => Promise<void>;
    restorePackBundleFromHistory: (archiveId: string) => Promise<void>;
    bulkRestorePackBundlesFromHistory: (archiveIds: string[]) => Promise<void>;
    deletePackBundleFromHistory: (archiveId: string) => Promise<void>;
    bulkDeletePackBundlesFromHistory: (archiveIds: string[]) => Promise<void>;
    updateArchivePackBundleIsFavoriteToHistory: (archiveId: string, isFavorite: boolean) => Promise<void>;

    fetchAllArchivePacksFromTrash: () => Promise<ArchivePack[]>;
    fetchArchivePackBundleFromTrash: (archiveId: string) => Promise<ArchivePackBundle | null>;
    movePackToTrash: (packId: string) => Promise<void>;
    bulkMovePacksToTrash: (packIds: string[]) => Promise<void>;
    restorePackBundleFromTrash: (archiveId: string) => Promise<void>;
    bulkRestorePackBundlesFromTrash: (archiveIds: string[]) => Promise<void>;
    deletePackBundleFromTrash: (archiveId: string) => Promise<void>;
    bulkDeletePackBundlesFromTrash: (archiveIds: string[]) => Promise<void>;
    updateArchivePackBundleIsFavoriteToTrash: (archiveId: string, isFavorite: boolean) => Promise<void>;

    runPackGarbageCollection: () => Promise<void>;
}


const initialState = {
    packs: [] as Pack[],
    isLoading: false,
};


export const usePackStore = create<PackStore>((set, get) => {

    // createPackArchive の依存関係を構築: get 関数全体と CardStore の getState() を渡す
    const packArchiveDependencies: PackArchiveDependencies = {
        // get() 関数全体を渡す
        get: get as () => PackStore,
        // CardStoreの状態取得関数を渡す
        getCardStoreState: useCardStore.getState,
    };

    // createPackArchive のインスタンスを取得
    const packArchiveActions: PackArchive = createPackArchive(packArchiveDependencies);


    return {
        ...initialState,

        // ----------------------------------------------------------------------
        // --- 1. 参照/ロード --- 
        // ----------------------------------------------------------------------

        fetchAllPacks: async () => {
            set({ isLoading: true });
            console.log(`[PackStore:fetchAllPacks] 🚀 START loading packs. (No filtering applied)`);
            try {
                const packsToDisplay = await packService.fetchAllPacks();
                set({ packs: packsToDisplay });
                console.log(`[PackStore:fetchAllPacks] ✅ Loaded ${packsToDisplay.length} packs for display.`);
            } catch (error) {
                console.error("[PackStore:fetchAllPacks] ❌ Failed to load packs:", error);
                set({ packs: [] });
            } finally {
                set({ isLoading: false });
            }
        },

        fetchPackById: async (packId: string) => {
            try {
                const packs = await packService.fetchPacksByIds([packId]);
                return packs && packs.length > 0 ? packs[0] : null;
            } catch (error) {
                console.error(`[PackStore:fetchPackById] Failed to load pack ${packId}:`, error);
                return null;
            }
        },

        // ----------------------------------------------------------------------
        // --- 2. CRUD/永続化 ---
        // ----------------------------------------------------------------------

        savePack: async (packToSave) => {
            console.log(`[PackStore:savePack] 💾 START saving pack: ${packToSave.packId}`);

            try {
                const now = new Date().toISOString();
                const packWithUpdatedTimestamp: Pack = {
                    ...packToSave,
                    updatedAt: now // 保存時は必ず更新
                };

                const savedPacks = await packService.savePacks([packWithUpdatedTimestamp]);
                if (!savedPacks || savedPacks.length === 0) throw new Error("Service returned empty result.");
                const savedPack = savedPacks[0];

                get().syncPackToStore(savedPack);

                console.log(`[PackStore:savePack] ✅ Pack finalized and saved: ${savedPack.name} (ID: ${packToSave.packId})`);
                return savedPack;
            } catch (error) {
                console.error("[PackStore:savePack] ❌ ERROR during save:", error);
                throw new Error('パックの保存に失敗しました。');
            }
        },

        updatePackIsFavorite: async (packId: string, isFavorite: boolean): Promise<Pack | null> => {
            console.log(`[PackStore:updatePackIsFavorite] Toggling favorite state for Pack ID: ${packId} to ${isFavorite}`);

            try {
                // サービス層の汎用バルク関数を、単一のID配列で呼び出す
                const numUpdated = await packService.updatePacksField(
                    [packId], // 1つだけのIDを配列として渡す
                    'isFavorite', // 更新フィールド名
                    isFavorite
                );

                if (numUpdated === 1) {
                    // DBが更新されたので、最新のPackデータを取得してストアの状態を同期させる
                    const updatedPack = await get().fetchPackById(packId);

                    if (updatedPack) {
                        get().syncPackToStore(updatedPack);
                        console.log(`[PackStore:updatePackIsFavorite] ✅ Updated Pack ID: ${packId} in DB and Store.`);
                        return updatedPack;
                    }
                }

                if (numUpdated === 0) {
                    console.warn(`[PackStore:updatePackIsFavorite] ⚠️ Pack ID: ${packId} not found for update.`);
                }

                return null;
            
            } catch (error) {
                console.error(`[PackStore:updatePackIsFavorite] ❌ Failed to update favorite state for ${packId}:`, error);
                throw error;
            }
        },


        // ----------------------------------------------------------------------
        // --- 4. メモリ/ストア操作 ---
        // ----------------------------------------------------------------------

        syncPackToStore: (updatedPack) => {
            set(state => {
                const index = state.packs.findIndex(p => p.packId === updatedPack.packId);
                const newPacks = [...state.packs];

                if (index !== -1) {
                    newPacks[index] = updatedPack;
                } else {
                    newPacks.push(updatedPack);
                }

                return { packs: newPacks };
            });
        },

        bulkSyncPacksToStore: (updatedPacks: Pack[]) => {
            set(state => {
                const updatedPackMap = new Map(updatedPacks.map(d => [d.packId, d]));
                const existingPackIds = new Set(state.packs.map(d => d.packId));

                const newPacks = state.packs.map(d =>
                    updatedPackMap.has(d.packId) ? updatedPackMap.get(d.packId)! : d
                ).filter(p => !p.packId.startsWith('archived'));

                // 新しいパックを追加
                updatedPacks.forEach(updatedPack => {
                    if (!existingPackIds.has(updatedPack.packId)) {
                        newPacks.push(updatedPack);
                    }
                });

                return { packs: newPacks };
            });
            console.log(`[PackStore:bulkSyncPacksToStore] Memory state synced for ${updatedPacks.length} packs.`);
        },


        removePackFromStore: (packId) => {
            set(state => {
                const newPacks = state.packs.filter(p => p.packId !== packId);
                return { packs: newPacks };
            });
            console.log(`[PackStore:removePackFromStore] Memory state cleared for pack ID: ${packId}`);
        },

        bulkRemovePacksFromStore: (packIdsToRemove: string[]) => {
            const idSet = new Set(packIdsToRemove);
            set(state => {
                const newPacks = state.packs.filter(p => !idSet.has(p.packId));
                return { packs: newPacks };
            });
            console.log(`[PackStore:bulkRemovePacksFromStore] Memory state cleared for ${packIdsToRemove.length} packs.`);
        },


        // ----------------------------------------------------------------------
        // --- 5. I/O ---
        // ----------------------------------------------------------------------

        importPacksFromJson: async (jsonText) => {
            console.log(`[PackStore:importPacksFromJson] 💾 START importing from JSON...`);

            try {
                // I/O ServiceにパースとDB保存を委譲
                const result = await importPacksFromJson(jsonText);

                // DBの全件を再ロードしてStoreを更新
                await get().fetchAllPacks();

                console.log(`[PackStore:importPacksFromJson] ✅ Imported: ${result.newPackIds.length}. Skipped: ${result.skippedIds.length}`);

                return { newPackIds: result.newPackIds, skippedIds: result.skippedIds };
            } catch (error) {
                console.error('[PackStore:importPacksFromJson] ❌ Failed to import packs:', error);
                throw error;
            }

        },

        exportPacksToJson: async (packIds) => {
            if (packIds.length === 0) {
                throw new Error("エクスポート対象のパックIDが指定されていません。");
            }
            console.log(`[PackStore:exportPacksToJson] 📤 Exporting ${packIds.length} packs to JSON...`);
            // I/O ServiceにDB参照とJSON生成を委譲
            const jsonString = await exportPacksToJson(packIds);
            console.log(`[PackStore:exportPacksToJson] ✅ Exported to JSON string.`);
            return jsonString;
        },

        // ----------------------------------------------------------------------
        // --- 6. PackArchive アクション (createPackArchiveからの委譲) ---
        // ----------------------------------------------------------------------

        // 📜 履歴アクション
        fetchAllArchivePacksFromHistory: packArchiveActions.fetchAllArchivePacksFromHistory,
        fetchArchivePackBundleFromHistory: packArchiveActions.fetchArchivePackBundleFromHistory,
        saveLatestPackBundleToHistory: packArchiveActions.saveLatestPackBundleToHistory,
        // TypeScript の型推論を強制的に適用（型が完全に一致しているため）
        saveEditingPackBundleToHistory: packArchiveActions.saveEditingPackBundleToHistory as PackStore['saveEditingPackBundleToHistory'],
        restorePackBundleFromHistory: packArchiveActions.restorePackBundleFromHistory,
        bulkRestorePackBundlesFromHistory: packArchiveActions.bulkRestorePackBundlesFromHistory,
        deletePackBundleFromHistory: packArchiveActions.deletePackBundleFromHistory,
        bulkDeletePackBundlesFromHistory: packArchiveActions.bulkDeletePackBundlesFromHistory,
        updateArchivePackBundleIsFavoriteToHistory: packArchiveActions.updateArchivePackBundleIsFavoriteToHistory,
        

        // 🗑️ ゴミ箱アクション
        fetchAllArchivePacksFromTrash: packArchiveActions.fetchAllArchivePacksFromTrash,
        fetchArchivePackBundleFromTrash: packArchiveActions.fetchArchivePackBundleFromTrash,
        movePackToTrash: packArchiveActions.movePackToTrash,
        bulkMovePacksToTrash: packArchiveActions.bulkMovePacksToTrash,
        restorePackBundleFromTrash: packArchiveActions.restorePackBundleFromTrash,
        bulkRestorePackBundlesFromTrash: packArchiveActions.bulkRestorePackBundlesFromTrash,
        deletePackBundleFromTrash: packArchiveActions.deletePackBundleFromTrash,
        bulkDeletePackBundlesFromTrash: packArchiveActions.bulkDeletePackBundlesFromTrash,
        updateArchivePackBundleIsFavoriteToTrash: packArchiveActions.updateArchivePackBundleIsFavoriteToTrash,

        // 🛠️ メンテナンスアクション
        runPackGarbageCollection: packArchiveActions.runPackGarbageCollection,
    }
});