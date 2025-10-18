/**
* src/stores/packStore.ts
*
* Pack（パック）データのグローバルな状態管理を行うZustandストア。
*
* 責務:
* 1. メインコレクション（'packs'）に存在する Pack データのリスト（packs）の保持と、UIで利用する編集対象パック（editingPack）の管理。
* 2. Pack の CRUD (作成/読み取り/更新/削除) 操作のオーケストレーション。
* 3. 関連する Card データも考慮した上での、論理削除（'trash'へ移動）・復元・履歴（'history'）保存・物理削除の制御。
* 4. ユーザーインターフェース（UI）の操作（編集パックのロード、更新）に対応するStoreの状態変更。
* 5. データサービス（packService, useCardStore）への非同期操作の委譲と、Storeの同期（packs, editingPack, useCardStore）の維持。
*
* * 外部依存:
* - zustand (状態管理ライブラリ)
* - ../models/pack (Pack, PackBundle 型)
* - ../utils/dataUtils (ID生成、デフォルトデータ)
* - ../services/packs/packService (Packデータの永続化とアーカイブ操作)
* - ../services/data-io/packJsonIO (JSONインポート/エクスポート)
* - ./cardStore (関連カードデータの操作)
* - ./userDataStore (ユーザー設定の参照 - 間接依存)
*/
import { create } from 'zustand';
import type { Pack, PackBundle } from '../models/pack'; 
import { createDefaultPackData } from '../utils/dataUtils'; 
import { packService, type CollectionKey } from '../services/packs/packService'; 
import * as packJsonIO from '../services/data-io/packJsonIO'; 
import { useCardStore } from './cardStore'; 
import { useUserDataStore } from './userDataStore'; 

// --- 修正後の PackState インターフェース定義 ---
export interface PackState {
    packs: Pack[];
    editingPack: Pack | null; 

    // --- 1. 参照/ロード (変更なし) ---
    fetchAllPacks: () => Promise<void>; 
    fetchPackById: (packId: string) => Promise<Pack | null>; 

    // --- 2. CRUD/永続化 (変更なし) ---
    savePack: (packToSave: Pack) => Promise<Pack>; 

    // --- 3. エディタ/UI操作 (変更なし) ---
    loadEditingPack: (packId: string) => Promise<void>;
    initializeNewEditingPack: () => string; 
    updateEditingPackInfo: (updatedFields: Partial<Pack>) => void;
    
    // --- 4. メモリ/ストア操作 (変更なし) ---
    syncPackToStore: (pack: Pack) => void;
    removePackFromStore: (packId: string) => void; 
    bulkRemovePacksFromStore: (packIds: string[]) => void;

    // --- 5. I/O (変更なし) ---
    importPacksFromJson: (jsonText: string) => Promise<{ importedCount: number, newPackIds: string[], importedCardCounts: number[] }>; 
    exportPacksToJson: (packIds: string[]) => Promise<string>; 

    // --- 6. 📜 履歴アクション ---
    fetchAllPacksFromHistory: () => Promise<Pack[]>; 
    fetchPackBundleByIdFromHistory: (archiveId: string) => Promise<PackBundle | null>; 
    savePackToHistory: (packToSave: Pack) => Promise<void>; 
    restorePackFromHistory: (archiveId: string) => Promise<void>;
    deletePackFromHistory: (archiveId: string) => Promise<void>;
    bulkDeletePacksFromHistory: (archiveIds: string[]) => Promise<void>;

    // --- 7. 🗑️ ゴミ箱アクション ---
    fetchAllPacksFromTrash: () => Promise<Pack[]>; 
    fetchPackBundleByIdFromTrash: (archiveId: string) => Promise<PackBundle | null>; 
    movePackToTrash: (packId: string) => Promise<void>; 
    bulkMovePacksToTrash: (packIds: string[]) => Promise<void>;
    restorePackFromTrash: (archiveId: string) => Promise<void>;
    bulkRestorePacksFromTrash: (archiveIds: string[]) => Promise<void>; 
    deletePackFromTrash: (archiveId: string) => Promise<void>; 
    bulkDeletePacksFromTrash: (archiveIds: string[]) => Promise<void>;

    // --- 8. 🛠️ メンテナンスアクション (変更なし) ---
    runPackGarbageCollection: () => Promise<void>;
}


export const usePackStore = create<PackState>((set, get) => { 
    
    const _setEditingPack = (pack: Pack) => {
        set({ editingPack: JSON.parse(JSON.stringify(pack)) });
    };

    return { 
    
        packs: [],
        editingPack: null,

        // ----------------------------------------------------------------------
        // --- 1. 参照/ロード (変更なし) --- 
        // ----------------------------------------------------------------------

        fetchAllPacks: async () => {
            console.log(`[PackStore:fetchAllPacks] 🚀 START loading packs. (No filtering applied)`); 
            try {
                const packsToDisplay = await packService.fetchAllPacksFromCollection('packs');
                set({ packs: packsToDisplay });
                console.log(`[PackStore:fetchAllPacks] ✅ Loaded ${packsToDisplay.length} packs for display.`); 
            } catch (error) {
                console.error("[PackStore:fetchAllPacks] ❌ Failed to load packs:", error); 
                set({ packs: [] });
            }
        },
        
        fetchPackById: async (packId: string) => {
            try {
                const pack = await packService.fetchPackByIdFromCollection(packId, 'packs');
                return pack;
            } catch (error) {
                console.error(`[PackStore:fetchPackById] Failed to load pack ${packId}:`, error);
                return null;
            }
        },

        // ----------------------------------------------------------------------
        // --- 2. CRUD/永続化 (変更なし) ---
        // ----------------------------------------------------------------------

        savePack: async (packToSave) => {
            console.log(`[PackStore:savePack] 💾 START saving pack: ${packToSave.packId}`); 
            
            try {
                const savedPacks = await packService.savePacksToCollection([packToSave], 'packs');
                if (!savedPacks || savedPacks.length === 0) throw new Error("Service returned empty result.");
                const savedPack = savedPacks[0];

                // Store同期
                get().syncPackToStore(savedPack);
                
                console.log(`[PackStore:savePack] ✅ Pack finalized and saved: ${savedPack.name} (ID: ${packToSave.packId})`); 
                return savedPack; 
            } catch (error) {
                console.error("[PackStore:savePack] ❌ ERROR during save:", error); 
                throw new Error('パックの保存に失敗しました。');
            }
        },


        // ----------------------------------------------------------------------
        // --- 3. エディタ/UI操作 (変更なし) ---
        // ----------------------------------------------------------------------
        
        loadEditingPack: async (packId: string) => {
            const pack = await get().fetchPackById(packId); 
            if (pack) {
                _setEditingPack(pack);
            }
        },

        initializeNewEditingPack: () => {
            const tempPack = createDefaultPackData();
            _setEditingPack(tempPack); 
            return tempPack.packId;
        },

        updateEditingPackInfo: (updatedFields) => {
            set(state => {
                if (!state.editingPack) return state;
                return { 
                    editingPack: { 
                        ...state.editingPack, 
                        ...updatedFields, 
                        updatedAt: new Date().toISOString()
                    } 
                };
            });
        },

        // ----------------------------------------------------------------------
        // --- 4. メモリ/ストア操作 (変更なし) ---
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
                
                const updatedEditingPack = state.editingPack?.packId === updatedPack.packId 
                    ? updatedPack 
                    : state.editingPack;
                    
                return { packs: newPacks, editingPack: updatedEditingPack };
            });
        },
        
        removePackFromStore: (packId) => {
            set(state => {
                const newPacks = state.packs.filter(p => p.packId !== packId);
                const newEditingPack = state.editingPack?.packId === packId ? null : state.editingPack;
                return { packs: newPacks, editingPack: newEditingPack };
            });
            console.log(`[PackStore] Memory state cleared for pack ID: ${packId}`);
        },
        
        bulkRemovePacksFromStore: (packIdsToRemove: string[]) => {
            const idSet = new Set(packIdsToRemove);
            set(state => {
                const newPacks = state.packs.filter(p => !idSet.has(p.packId));
                
                const isEditingPackRemoved = state.editingPack && idSet.has(state.editingPack.packId);
                const newEditingPack = isEditingPackRemoved ? null : state.editingPack;

                return { packs: newPacks, editingPack: newEditingPack };
            });
            console.log(`[PackStore] Memory state cleared for ${packIdsToRemove.length} packs.`);
        },


        // ----------------------------------------------------------------------
        // --- 5. I/O (変更なし) ---
        // ----------------------------------------------------------------------

        importPacksFromJson: async (jsonText) => {
            console.log(`[PackStore:importPacksFromJson] 💾 START importing from JSON...`);
            const result = await packJsonIO.importPacksFromJson(jsonText);
            await get().fetchAllPacks(); 
            console.log(`[PackStore:importPacksFromJson] ✅ Imported: ${result.importedCount} packs. New IDs: ${result.newPackIds.length}`);
            return result;
        },

        exportPacksToJson: async (packIds) => {
            if (packIds.length === 0) {
                throw new Error("エクスポート対象のパックIDが指定されていません。");
            }
            console.log(`[PackStore:exportPacksToJson] 📤 Exporting ${packIds.length} packs to JSON...`);
            const jsonString = await packJsonIO.exportPacksToJson(packIds);
            console.log(`[PackStore:exportPacksToJson] ✅ Exported to JSON string.`);
            return jsonString;
        },

        // ----------------------------------------------------------------------
        // --- 6. 📜 履歴アクション ---
        // ----------------------------------------------------------------------

        savePackToHistory: async (packToSave) => {
            const packId = packToSave.packId;
            console.log(`[PackStore:savePackToHistory] 📜💾 START saving snapshot to history for: ${packId}`);
            try {
                // 1. パックとカードを取得し、PackBundleを作成 
                const cardsData = useCardStore.getState().getCardsByPackIdFromStore(packId); 
                
                const bundle: PackBundle = { 
                    packData: packToSave, 
                    cardsData: cardsData 
                };

                // 2. PackBundleの配列をServiceに渡して保存を委譲
                await packService.savePacksToCollection([bundle], 'history');
                
                console.log(`[PackStore:savePackToHistory] ✅ Snapshot (Pack+${cardsData.length} cards) saved to history for: ${packId}`);
            } catch (error) {
                console.error(`[PackStore:savePackToHistory] ❌ Failed to save snapshot for ${packId}:`, error);
                throw error;
            }
        },
        
        /** 💡 単体リストア (archiveId) - Serviceのバルク関数に単体IDの配列を渡す */
        restorePackFromHistory: async (archiveId: string) => {
            console.log(`[PackStore:restorePackFromHistory] 📜♻️ START restoring single pack from history: ${archiveId}`);
            try {
                // Serviceに復元処理全体を委譲
                const restoredPacks = await packService.restorePackBundlesFromArchive([archiveId], 'history');
                
                // Storeに同期
                if (restoredPacks.length > 0) {
                    restoredPacks.forEach(pack => get().syncPackToStore(pack)); 
                    await useCardStore.getState().fetchAllCards(); // カードデータ再ロード
                }
                
                console.log(`[PackStore:restorePackFromHistory] ✅ Pack restored and cards reloaded from history.`);
            } catch (error) {
                console.error(`[PackStore:restorePackFromHistory] ❌ Failed to restore pack ${archiveId} from history:`, error);
                throw error;
            }
        },

        fetchAllPacksFromHistory: async () => {
            console.log(`[PackStore:fetchAllPacksFromHistory] 🧺 START fetching packs from history...`);
            try {
                const packs = await packService.fetchAllPacksFromCollection('history');
                console.log(`[PackStore:fetchAllPacksFromHistory] ✅ Fetched ${packs.length} packs from history.`);
                return packs;
            } catch (error) {
                console.error("[PackStore:fetchAllPacksFromHistory] ❌ Failed to fetch packs from history:", error);
                throw error;
            }
        },

        fetchPackBundleByIdFromHistory: async (archiveId) => {
            console.log(`[PackStore:fetchPackBundleByIdFromHistory] 🔍 START fetching bundle with archiveId ${archiveId} from history...`);
            try {
                // Serviceのバルク関数にarchiveIdを渡し、結果配列から単一の要素を取得
                const bundles = await packService.fetchPackBundlesFromCollection([archiveId], 'history');
                const bundle = bundles[0] ?? null;
                return bundle;
            } catch (error) {
                console.error(`[PackStore:fetchPackBundleByIdFromHistory] ❌ Failed to fetch bundle ${archiveId} from history:`, error);
                return null;
            }
        },
        
        /** 💡 単体物理削除はバルクを呼び出す */
        deletePackFromHistory: async (archiveId: string) => {
            return get().bulkDeletePacksFromHistory([archiveId]);
        },

        /** 💡 バルク物理削除 (Archive IDの配列) */
        bulkDeletePacksFromHistory: async (archiveIds: string[]) => {
            if (archiveIds.length === 0) return;
            const idList = archiveIds.slice(0, 3).join(', ');
            console.log(`[PackStore:bulkDeletePacksFromHistory] 📜💥 START physical deletion from history: [${idList}...]`);
            try {
                await packService.deletePacksFromCollection(archiveIds, 'history');
                console.log(`[PackStore:bulkDeletePacksFromHistory] ✅ ${archiveIds.length} items physically deleted from history.`);
            } catch (error) {
                console.error(`[PackStore:bulkDeletePacksFromHistory] ❌ Failed to delete packs from history:`, error);
                throw error;
            }
        },

        // ----------------------------------------------------------------------
        // --- 7. 🗑️ ゴミ箱アクション ---
        // ----------------------------------------------------------------------
        
        /** 💡 単体ゴミ箱へ移動 */
        movePackToTrash: async (packId) => {
            return get().bulkMovePacksToTrash([packId]);
        },

        /** 💡 新規追加: バルクゴミ箱へ移動 */
        bulkMovePacksToTrash: async (packIds: string[]) => {
            if (packIds.length === 0) return;
            const idList = packIds.slice(0, 3).join(', ');
            console.log(`[PackStore:bulkMovePacksToTrash] 🗑️ START moving ${packIds.length} packs to trash: [${idList}...]`);
            try {
                // 1. メインDBからパックデータを取得
                const packsToMove = get().packs.filter(p => packIds.includes(p.packId));
                if (packsToMove.length === 0) {
                    console.log(`[PackStore:bulkMovePacksToTrash] No packs found in store to move.`);
                    return;
                }

                // 2. 関連カードを取得し、PackBundleを作成
                const bundles: PackBundle[] = packsToMove.map(packToMove => {
                    const cardsData = useCardStore.getState().getCardsByPackIdFromStore(packToMove.packId); 
                    return { packData: packToMove, cardsData: cardsData };
                });

                // 3. PackBundleをトラッシュにバルク保存
                await packService.savePacksToCollection(bundles, 'trash'); 
                
                // 4. 本番DBをバルク削除
                await packService.deletePacksFromCollection(packIds, 'packs'); 
                
                // 5. Storeから削除 (PackとCardの両方を削除)
                get().bulkRemovePacksFromStore(packIds);
                // Card StoreからもパックIDに紐づくカードを個別に削除
                packIds.forEach(packId => {
                    useCardStore.getState().removeCardsByPackIdFromStore(packId);
                });
                
                console.log(`[PackStore:bulkMovePacksToTrash] ✅ ${packIds.length} packs moved to trash and removed from store.`);
            } catch (error) {
                console.error(`[PackStore:bulkMovePacksToTrash] ❌ Failed to move packs [${idList}...] to trash:`, error);
                throw error;
            }
        },
        
        /** 💡 単体リストアはバルクを呼び出す */
        restorePackFromTrash: async (archiveId: string) => {
            return get().bulkRestorePacksFromTrash([archiveId]);
        },

        /** 💡 バルク リストア (Archive IDの配列) */
        bulkRestorePacksFromTrash: async (archiveIds) => {
            if (archiveIds.length === 0) return;
            const idList = archiveIds.slice(0, 3).join(', ');
            console.log(`[PackStore:bulkRestorePacksFromTrash] 🗑️♻️ START restoring ${archiveIds.length} packs from trash: [${idList}...]`);
            try {
                // 1. Serviceに復元処理全体を委譲
                const restoredPacks = await packService.restorePackBundlesFromArchive(archiveIds, 'trash');
                
                // 2. Storeに同期
                if (restoredPacks.length > 0) {
                    restoredPacks.forEach(pack => get().syncPackToStore(pack)); 
                    await useCardStore.getState().fetchAllCards(); // カードデータ再ロード
                }

                console.log(`[PackStore:bulkRestorePacksFromTrash] ✅ ${restoredPacks.length} packs restored and cards reloaded from trash.`);

            } catch (error) {
                console.error(`[PackStore:bulkRestorePacksFromTrash] ❌ Failed to restore packs from trash IDs [${idList}...]:`, error);
                throw error;
            }
        },

        fetchAllPacksFromTrash: async () => {
            console.log(`[PackStore:fetchAllPacksFromTrash] 🧺 START fetching packs from trash...`);
            try {
                const packs = await packService.fetchAllPacksFromCollection('trash');
                console.log(`[PackStore:fetchAllPacksFromTrash] ✅ Fetched ${packs.length} packs from trash.`);
                return packs;
            } catch (error) {
                console.error("[PackStore:fetchAllPacksFromTrash] ❌ Failed to fetch packs from trash:", error);
                throw error;
            }
        },

        fetchPackBundleByIdFromTrash: async (archiveId) => {
            console.log(`[PackStore:fetchPackBundleByIdFromTrash] 🔍 START fetching bundle with archiveId ${archiveId} from trash...`);
            try {
                // Serviceのバルク関数にarchiveIdを渡し、結果配列から単一の要素を取得
                const bundles = await packService.fetchPackBundlesFromCollection([archiveId], 'trash');
                const bundle = bundles[0] ?? null;
                return bundle;
            } catch (error) {
                console.error(`[PackStore:fetchPackBundleByIdFromTrash] ❌ Failed to fetch bundle ${archiveId} from trash:`, error);
                return null;
            }
        },
        
        /** 💡 単体物理削除 (Archive ID) */
        deletePackFromTrash: async (archiveId) => {
            return get().bulkDeletePacksFromTrash([archiveId]);
        },
        
        /** 💡 バルク物理削除 (Archive IDの配列) */
        bulkDeletePacksFromTrash: async (archiveIds: string[]) => {
            if (archiveIds.length === 0) return;
            const idList = archiveIds.slice(0, 3).join(', ');
            console.log(`[PackStore:bulkDeletePacksFromTrash] 🗑️💥 START physical deletion from trash: [${idList}...]`);
            try {
                await packService.deletePacksFromCollection(archiveIds, 'trash'); 
                console.log(`[PackStore:bulkDeletePacksFromTrash] ✅ ${archiveIds.length} packs physically deleted from trash.`);
            } catch (error) {
                console.error(`[PackStore:bulkDeletePacksFromTrash] ❌ Failed to delete packs from trash:`, error);
                throw error;
            }
        },

        // ----------------------------------------------------------------------
        // --- 8. 🛠️ メンテナンスアクション (変更なし) ---
        // ----------------------------------------------------------------------

        runPackGarbageCollection: async () => {
            console.log(`[PackStore:runPackGarbageCollection] 🧹 START running garbage collection...`);
            try {
                await packService.runPackGarbageCollection();
                await get().fetchAllPacks();
                console.log(`[PackStore:runPackGarbageCollection] ✅ Garbage collection complete and packs reloaded.`);
            } catch (error) {
                console.error("[PackStore:runPackGarbageCollection] ❌ Failed to run garbage collection:", error);
                throw error;
            }
        }
    }
});