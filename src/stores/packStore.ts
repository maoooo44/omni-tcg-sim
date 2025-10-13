/**
* src/stores/packStore.ts
*
* 【適用した修正】
* 1. loadPacksアクションのクリーンアップ時間を1時間から24時間に変更 (ONE_HOUR_MS -> ONE_DAY_MS)。
* 2. loadPacks のエラーハンドリングを追加。
* 3. ログを詳細に追加。
*/
import { create } from 'zustand';
import type { Pack, /*RarityConfig,*/ } from '../models/pack'; 
// ★修正: 新規パックのデフォルトデータ生成関数をインポート
import { createDefaultPackData } from '../utils/dataUtils'; 
import { v4 as uuidv4 } from 'uuid'; 
import { packService } from '../services/pack-logic/packService'; 
import { useCardStore } from './cardStore'; 

const generatePackId = () => uuidv4(); 

// Pack の必須フィールドのうち、自動で生成/設定されるものを除外した型
type NewPackData = Omit<Pack, 'packId' | 'totalCards' | 'isOpened'>;

// 💡 修正: PackStateをexportし、`startNewPackEditing`をIDを返す`initializeNewPackEditing`に変更
export interface PackState {
    packs: Pack[];
    // ★追加: 編集中のパックデータ
    packForEdit: Pack | null; 

    // --- アクション ---
    loadPacks: () => Promise<void>; 
    /** 新しいパックを作成 (packId, totalCards, isOpened は自動設定) */
    createPack: (newPackData: NewPackData) => Promise<string>; 
    updatePack: (updatedPack: Pack) => Promise<void>; 
    deletePack: (packId: string) => Promise<void>;
    loadPackById: (packId: string) => Promise<Pack | null>; 

    // ★修正: 編集フロー用アクション
    /** 新規作成用のパックを初期化し、生成されたIDを返します。 */
    // 💡 修正 1: シグネチャを非同期に変更
    initializeNewPackEditing: () => Promise<string>; 
    loadPackForEdit: (pack: Pack) => void;
    updatePackForEdit: (updatedFields: Partial<Pack>) => void;
    /** 新規または既存パックをDBに保存し、ストアを更新する統合アクション */
    savePack: (packToSave: Pack) => Promise<Pack>; // ★ 修正: 保存後の Pack を返す
    
    // 💡 追加: ページ遷移時や削除ボタンで、DB操作を伴わずストアからのみパックを削除する
    removePackFromStore: (packId: string) => void; 

    updatePackIsInStore: (packId: string, isInStore: boolean) => Promise<void>;
}

export const usePackStore = create<PackState>((set, get) => ({
    packs: [],
    // ★追加: 編集状態の初期値
    packForEdit: null,

    /**
     * [DB連携] パックリストをロードし、古い下書きをクリーンアップする
     */
    loadPacks: async () => {
        console.log(`[PackStore:loadPacks] 🚀 START loading packs and cleaning up drafts.`); // ✅ ログ追加
        try {
            // 1. DBから全パックを取得
            const allPacks = await packService.getAllPacks();
            console.log(`[PackStore:loadPacks] Fetched ${allPacks.length} packs from DB.`); // ✅ ログ追加
            
            // 2. 🚨 古い下書き削除のロジックを isDraft に基づいて修正（古い name の判定は削除）
            // 💡 クリーンアップ対象: isDraft: true で、かつ 24時間 (86400000ms) 以上経過したものに変更
            const now = new Date().getTime();
            // 24時間 = 24 * 60 * 60 * 1000 = 86400000 ms
            const ONE_DAY_MS = 86400000;
            
            const packsToDelete = allPacks
                .filter(p => 
                    // isDraft が true かつ updatedAt があり、現在時刻から24時間以上経過している
                    !p.isInStore && p.updatedAt && (now - new Date(p.updatedAt).getTime() > ONE_DAY_MS)
                )
                .map(p => p.packId);

            // 3. 物理削除の実行（DBへの書き込み）
            if (packsToDelete.length > 0) {
                console.log(`[PackStore:loadPacks] 🧹 Deleting ${packsToDelete.length} expired draft packs.`); // ✅ ログ追加
                await packService.bulkDeletePacks(packsToDelete); 
                console.log(`[PackStore:loadPacks] Deletion complete.`); // ✅ ログ追加
            }
             
            // 4. 💡 パック一覧に表示するリストを定義（isDraft: false のみ）
            const packsToDisplay = allPacks
                // 削除対象に含まれておらず、かつ、isDraft: false のものを表示
                .filter(p => !packsToDelete.includes(p.packId) && p.isInStore === true); 
            
            // 5. Storeにセット
            set({ packs: packsToDisplay });
            console.log(`[PackStore:loadPacks] ✅ Loaded ${packsToDisplay.length} packs for display.`); // ✅ ログ追加
        } catch (error) {

            console.error("[PackStore:loadPacks] ❌ Failed to load or cleanup packs:", error); // ✅ ログ追加
            set({ packs: [] });
        }
    },

    // 既存のcreatePack (新しいフローでは使用されないが、互換性のために維持)
    createPack: async (newPackData) => {
        console.log(`[PackStore:createPack] ✍️ Creating legacy pack: ${newPackData.name}`); // ✅ ログ追加
        const newPack: Pack = {
            ...newPackData,
            packId: generatePackId(),
            totalCards: 0,
            isOpened: false,
        };
        
        const newId = await packService.savePack(newPack);
        
        set(state => ({
            packs: [...state.packs, { ...newPack, packId: newId }],
        }));
        console.log(`[PackStore:createPack] ✅ Pack created: ${newPack.name} (ID: ${newId})`); // ✅ ログ追加
        return newId; 
    },
    
    // 既存のupdatePack (新しいフローでは使用されないが、互換性のために維持)
    updatePack: async (updatedPack) => { 
        console.log(`[PackStore:updatePack] 🔄 Updating legacy pack: ${updatedPack.packId}`); // ✅ ログ追加
        await packService.updatePack(updatedPack.packId, updatedPack);
        
        set(state => ({
            packs: state.packs.map(p => 
                p.packId === updatedPack.packId ? updatedPack : p
            ),
        }));
        console.log(`[PackStore:updatePack] ✅ Pack updated: ${updatedPack.name}`); // ✅ ログ追加
    },
    
    deletePack: async (packId) => {
        console.log(`[PackStore:deletePack] 💥 Deleting pack from DB and store: ${packId}`); // ✅ ログ追加
        try {
            // packService.deletePack は内部で bulkDeletePacks を呼び出すように修正済み
            await packService.deletePack(packId); 
            
            // 関連するカードストアのステートも更新
            const cardStore = useCardStore.getState();
            cardStore.deleteCardsByPackId(packId);
            console.log(`[PackStore:deletePack] Related cards deleted from store.`); // ✅ ログ追加

            set((state) => ({
                packs: state.packs.filter(pack => pack.packId !== packId)
            }));
            console.log(`[PackStore:deletePack] ✅ Pack removed from Store: ID: ${packId}`); // ✅ ログ追加
        } catch (error) {
            console.error("[PackStore:deletePack] ❌ Failed to delete pack:", error); // ✅ ログ追加
            throw error;
        }
    },
    
    // 💡 新規追加: DB操作を伴わずストアからのみパックを削除する
    removePackFromStore: (packId) => {
        console.log(`[PackStore:removePackFromStore] 🗑️ START for ID: ${packId}. Current packs: ${get().packs.length}`); // ✅ ログ追加
        set((state) => {
            // packs リストから該当 packId を除外する
            const updatedPacks = state.packs.filter(pack => pack.packId !== packId);
            
            // 編集対象パックが削除対象だった場合、packForEdit もクリアする
            const updatedPackForEdit = state.packForEdit?.packId === packId 
                ? null 
                : state.packForEdit;
            
            console.log(`[PackStore:removePackFromStore] Packs count changed: ${state.packs.length} -> ${updatedPacks.length}`); // ✅ ログ追加
            
            return {
                packs: updatedPacks,
                packForEdit: updatedPackForEdit
            };
        });
        console.log(`[PackStore:removePackFromStore] END.`); // ✅ ログ追加
    },

    loadPackById: async (packId) => {
        console.log(`[PackStore:loadPackById] Loading pack ID: ${packId}`); // ✅ ログ追加
        const pack = await packService.getPackById(packId);
        console.log(`[PackStore:loadPackById] Result: ${pack ? 'Found' : 'Not Found'}`); // ✅ ログ追加
        return pack;
    },
    
    // ★修正後の新規作成初期化アクション
    /**
     * 新規作成用のパックを初期化し、生成されたIDを返します。
     * PackManagerから呼び出され、即時遷移に利用されます。
     */
    // 💡 修正 2: async 関数として定義
    initializeNewPackEditing: async () => {
        console.log(`[PackStore:initializeNewPackEditing] 🟢 START New Pack Init.`); // ✅ ログ追加
        // 1. デフォルトデータを生成 (isDraft: true が含まれると仮定)
        const newPack = createDefaultPackData();
        
        // 2. DBに即時登録し、確定IDを取得 (savePackはput操作でIDを返す)
        console.log(`[PackStore:initializeNewPackEditing] Calling packService.savePack (Draft)...`); // ✅ ログ追加
        const newId = await packService.savePack(newPack);
        
        // 3. StoreのpacksリストとpackForEditを更新
        const finalPack: Pack = { ...newPack, packId: newId };
        set(state => ({ 
            packs: [...state.packs, finalPack], // リストに追加
            packForEdit: finalPack // 編集対象も更新
        }));
        
        console.log(`[PackStore:initializeNewPackEditing] ✅ Initialized and saved DRAFT pack with ID: ${newId}.`); // ✅ ログ追加
        return newId; // 確定したIDを返す
    },


    // 既存パックを編集用にロードする
    loadPackForEdit: (pack) => {
        set({ packForEdit: pack });
        console.log(`[PackStore:loadPackForEdit] Loaded pack for editing: ${pack.name} (ID: ${pack.packId})`); // ✅ ログ追加
    },

    // 編集中のパックのフィールドを更新する (usePackEdit hookで利用)
    updatePackForEdit: (updatedFields) => {
        set(state => {
            if (!state.packForEdit) return state;

            // Dateの更新は savePack 時のみとする
            const updatedPack: Pack = { 
                ...state.packForEdit, 
                ...updatedFields,
            };
            
            console.log(`[PackStore:updatePackForEdit] PackForEdit updated: ${Object.keys(updatedFields).join(', ')}`); // ✅ ログ追加
            return { packForEdit: updatedPack };
        });
    },

    /**
     * 新規または既存パックをDBに保存し、ストアを更新する統合アクション
     * @param packToSave - 保存するパックデータ (UUIDを含む)
     * @returns 保存された Pack データ
     */
     // 💡 修正 2: savePack のロジックを簡素化（isNew判定は不要になる）
     savePack: async (packToSave) => {
         console.log(`[PackStore:savePack] 💾 START saving pack: ${packToSave.packId}`); // ✅ ログ追加
        // 新規/既存の判定は不要。DBに存在するドラフトを isDraft: false にして更新する。
        const packWithFinalUpdate = { 
            ...packToSave, 
            isInStore: true, // 💡 パックを確定させる
            updatedAt: new Date().toISOString() 
        };

        try {
            // 1. DBに保存し、確定IDを取得
            console.log(`[PackStore:savePack] Calling packService.savePack (Final save, isDraft=false)...`); // ✅ ログ追加
            await packService.savePack(packWithFinalUpdate);
            
            // 2. Store の packs リストと packForEdit を最新データで更新
            // 💡 packs を更新するために loadPacks を再利用
            console.log(`[PackStore:savePack] Calling loadPacks to refresh list...`); // ✅ ログ追加
            await get().loadPacks();

            set({ packForEdit: packWithFinalUpdate });
            
            console.log(`[PackStore:savePack] ✅ Pack finalized and saved: ${packWithFinalUpdate.name} (ID: ${packToSave.packId})`); // ✅ ログ追加
            
            return packWithFinalUpdate; // 確定データを返す

        } catch (error) {
            console.error("[PackStore:savePack] ❌ ERROR during save:", error); // ✅ ログ追加
            throw new Error('パックの保存に失敗しました。');
        }
    },

    /**
     * DB上のパックの isDraft ステータスを更新し、Storeの packs リストから除外/追加する（論理削除/復元）
     */
    updatePackIsInStore: async (packId, isInStore) => {
        console.log(`[PackStore:updatePackIsDraft] ⚙️ START update isDraft: ID=${packId}, NewStatus=${isInStore}`); // ✅ ログ追加
        try {
            // 1. Store/DBからパックデータを取得
            const packToUpdate = get().packs.find(p => p.packId === packId) || await packService.getPackById(packId);

            if (!packToUpdate) {
                console.warn(`[PackStore:updatePackIsDraft] ⚠️ Pack ID ${packId} not found for status update.`); // ✅ ログ追加
                return;
            }

            // 2. isDraft の値を更新し、updatedAt も更新
            const updatedPack: Pack = {
                ...packToUpdate,
                isInStore: isInStore,
                updatedAt: new Date().toISOString()
            };

            // 3. DBに更新を保存
            console.log(`[PackStore:updatePackIsDraft] Calling packService.savePack (isDraft=${isInStore})...`); // ✅ ログ追加
            await packService.savePack(updatedPack); 
            console.log(`[PackStore:updatePackIsDraft] DB update complete.`); // ✅ ログ追加
            
            // 4. Storeのpacksリストを更新 (リストから除外/追加)
            // 💡 論理削除の際は、storeの packs リストから即座に削除する
            /*if (isDraft) {
                console.log(`[PackStore:updatePackIsDraft] isDraft is true (Logical Delete), calling removePackFromStore...`); // ✅ ログ追加
                get().removePackFromStore(packId); // storeから削除
            } else {
                // isDraft: false (復元/確定) の場合は、loadPacksでリスト全体をリフレッシュするのが安全
                console.log(`[PackStore:updatePackIsDraft] isDraft is false, calling loadPacks to refresh list...`); // ✅ ログ追加
                await get().loadPacks();
            }*/

            console.log(`[PackStore:updatePackIsDraft] ✅ Status updated (ID: ${packId}): ${isInStore}`); // ✅ ログ追加
        } catch (error) {
            console.error("[PackStore:updatePackIsDraft] ❌ Failed to update pack draft status:", error); // ✅ ログ追加
            throw error;
        }
    },

}));