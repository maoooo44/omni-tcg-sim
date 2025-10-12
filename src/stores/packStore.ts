/**
* src/stores/packStore.ts
*
* 修正箇所:
* savePack アクション:
* 1. packService.savePack() の戻り値として、DBで確定した新しい ID (newId) を取得する。
* 2. finalPackToSave の packId をこの新しい ID で上書きし、パックデータ全体を確定させる。
* 3. 確定した packForEdit を set に渡す。
* 4. 確定した packToReturn を返す。
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
    initializeNewPackEditing: () => string; // 💡 修正後のアクション
    loadPackForEdit: (pack: Pack) => void;
    updatePackForEdit: (updatedFields: Partial<Pack>) => void;
    /** 新規または既存パックをDBに保存し、ストアを更新する統合アクション */
    savePack: (packToSave: Pack) => Promise<Pack>; // ★ 修正: 保存後の Pack を返す
}

export const usePackStore = create<PackState>((set, get) => ({
    packs: [],
    // ★追加: 編集状態の初期値
    packForEdit: null,

    loadPacks: async () => {
        const allPacks = await packService.getAllPacks();
        set({ packs: allPacks });
        console.log(`[PackStore] Loaded ${allPacks.length} packs.`);
    },

    // 既存のcreatePack (新しいフローでは使用されないが、互換性のために維持)
    createPack: async (newPackData) => {
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
        console.log(`パックを作成: ${newPack.name} (ID: ${newId})`);
        return newId; 
    },
    
    // 既存のupdatePack (新しいフローでは使用されないが、互換性のために維持)
    updatePack: async (updatedPack) => { 
        await packService.updatePack(updatedPack.packId, updatedPack);
        
        set(state => ({
            packs: state.packs.map(p => 
                p.packId === updatedPack.packId ? updatedPack : p
            ),
        }));
        console.log(`パックを更新: ${updatedPack.name}`);
    },
    
    deletePack: async (packId) => {
        try {
            await packService.deletePack(packId); 
            
            const cardStore = useCardStore.getState();
            cardStore.deleteCardsByPackId(packId);

            set((state) => ({
                packs: state.packs.filter(pack => pack.packId !== packId)
            }));
            console.log(`パックを削除: ID: ${packId}`);
        } catch (error) {
            console.error("Failed to delete pack:", error);
            throw error;
        }
    },

    loadPackById: async (packId) => {
        const pack = await packService.getPackById(packId);
        return pack;
    },
    
    // ★修正後の新規作成初期化アクション
    /**
     * 新規作成用のパックを初期化し、生成されたIDを返します。
     * PackManagerから呼び出され、即時遷移に利用されます。
     */
    initializeNewPackEditing: () => {
        const newPack = createDefaultPackData();
        set({ packForEdit: newPack });
        console.log(`[PackStore] Initialized new pack editing with ID: ${newPack.packId}`);
        return newPack.packId; // 💡 生成したIDを返す
    },

    // 既存パックを編集用にロードする
    loadPackForEdit: (pack) => {
        set({ packForEdit: pack });
        console.log(`[PackStore] Loaded pack for editing: ${pack.name} (ID: ${pack.packId})`);
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
            
            return { packForEdit: updatedPack };
        });
    },

    /**
     * 新規または既存パックをDBに保存し、ストアを更新する統合アクション
     * @param packToSave - 保存するパックデータ (UUIDを含む)
     * @returns 保存された Pack データ
     */
     savePack: async (packToSave) => {
        const isNew = !get().packs.some(p => p.packId === packToSave.packId);
        
        const packWithTimestamp = { 
            ...packToSave, 
            updatedAt: new Date().toISOString() 
        };

        try {
            // 1. DBに保存し、DBが採番した新しいID（文字列）を取得
            // 🚨 修正 1.1: DBが自動採番したIDを必ず取得する
            const newId = await packService.savePack(packWithTimestamp);
            
            // 2. 確定した新しいIDでパックデータ全体を更新
            const finalPack = {
                ...packWithTimestamp,
                packId: newId as string, // 確定したIDを反映
            };
            
            // 3. DBから全リストを再取得し、状態の完全な同期を保証する
            await get().loadPacks();

            // 4. StoreのpackForEditを保存後の最新データ（確定IDを含む）に更新
            // 🚨 修正 1.2: finalPack をセットする
            set({ packForEdit: finalPack });
            
            console.log(`[PackStore] パックを${isNew ? '作成' : '更新'}し保存: ${finalPack.name} (ID: ${finalPack.packId})`);
            
            // 5. フック側に戻り値として確定データを返す
            return finalPack;

        } catch (error) {
            console.error('Failed to save pack:', error);
            throw new Error('パックの保存に失敗しました。');
        }
    },
}));