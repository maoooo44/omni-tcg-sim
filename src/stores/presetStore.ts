/**
* src/stores/presetStore.ts
*
* Zustandを使用してパックおよびカードのカスタムプロパティのプリセットを管理するストア。
* DBサービスを呼び出し、IndexedDBへの永続化と、メモリ状態の管理を行う。
*/

import { create } from 'zustand';
import type { PackPreset, CardCustomPreset, Preset } from '../models/preset';
import { generateUUID } from '../utils/uuidUtils';
// DBサービスへの依存を明確にする
import { presetService } from '../services/user-logic/presetService'; 


export interface PresetStore {
    packPresets: PackPreset[];
    cardCustomPresets: CardCustomPreset[];

    // アクション
    loadPresets: () => Promise<void>; // 👈 追加: DBからのロード
    savePackPreset: (
        data: Omit<PackPreset, 'id' | 'createdAt' | 'updatedAt' | 'name'>, 
        name: string
    ) => Promise<void>
    saveCardCustomPreset: (data: Record<string, string>, name: string) => Promise<void>;
    deletePreset: (id: string, type: 'pack' | 'card') => Promise<void>;
}

// 簡易的な初期データ (デモ用)
const INITIAL_PACK_PRESETS: PackPreset[] = [{
    id: 'pack-preset-001',
    name: '遊戯王風スタンダード',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    series: 'スタンダード',
    cardsPerPack: 5,
    packType: 'Booster',
    imageUrl: '',
    description: '標準的なブースターパック構成',
    rarityConfig: [
        { rarityName: 'Common', probability: 0.85 },
        { rarityName: 'Rare', probability: 0.1 },
        { rarityName: 'SuperRare', probability: 0.04 },
        { rarityName: 'SecretRare', probability: 0.01 },
    ],
}];

const INITIAL_CARD_PRESETS: CardCustomPreset[] = [{
    id: 'card-preset-001',
    name: 'MTG風クリーチャー',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    customFields: {
        "コスト": "",
        "パワー": "",
        "タフネス": "",
        "能力": "",
    }
}];

const INITIAL_PRESETS: Preset[] = [...INITIAL_PACK_PRESETS, ...INITIAL_CARD_PRESETS];


export const usePresetStore = create<PresetStore>((set, _get) => ({
    packPresets: [], // DBからロードするため初期値を空に変更
    cardCustomPresets: [], // DBからロードするため初期値を空に変更

    /**
     * IndexedDBからプリセットをロードし、ストアを初期化する
     */
    loadPresets: async () => {
        try {
            // DBが空の場合に初期データを投入 (サービスの責務)
            await presetService.initializePresets(INITIAL_PRESETS as Preset[]); 
            
            // DBからデータをロード (サービスの責務)
            const loadedPresets = await presetService.loadAllPresets();
            
            // ロードしたデータを Pack/Card にフィルタリングして状態にセット
            const packPresets = loadedPresets.filter((p): p is PackPreset => 'cardsPerPack' in p);
            const cardCustomPresets = loadedPresets.filter((p): p is CardCustomPreset => 'customFields' in p);

            set({ packPresets, cardCustomPresets });
        } catch (error) {
            console.error('Failed to load presets from DB:', error);
            // ロード失敗時: フォールバックとしてハードコードされた初期データを使用
            set({ 
                packPresets: INITIAL_PACK_PRESETS,
                cardCustomPresets: INITIAL_CARD_PRESETS,
            });
        }
    },

    savePackPreset: async (data, name) => {
        const now = new Date().toISOString();
        const newPreset: PackPreset = {
            ...data,
            id: generateUUID(),
            name: name,
            createdAt: now,
            updatedAt: now,
        };
        
        // 永続化ロジック (DBサービスを呼び出し)
        await presetService.savePreset(newPreset);
        
        // メモリ状態を更新
        set(state => ({ packPresets: [...state.packPresets, newPreset] }));
    },

    saveCardCustomPreset: async (customFields, name) => {
        const now = new Date().toISOString();
        const newPreset: CardCustomPreset = {
            id: generateUUID(),
            name: name,
            createdAt: now,
            updatedAt: now,
            customFields: customFields,
        };
        
        // 永続化ロジック (DBサービスを呼び出し)
        await presetService.savePreset(newPreset);

        // メモリ状態を更新
        set(state => ({ cardCustomPresets: [...state.cardCustomPresets, newPreset] }));
    },
    
    deletePreset: async (id, type) => {
        
        // 永続化ロジック (DBサービスを呼び出し)
        await presetService.deletePresetById(id);
        
        // メモリ状態を更新
        if (type === 'pack') {
            set(state => ({ packPresets: state.packPresets.filter(p => p.id !== id) }));
        } else {
            set(state => ({ cardCustomPresets: state.cardCustomPresets.filter(c => c.id !== id) }));
        }
    },
}));