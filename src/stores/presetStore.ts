/**
 * src/stores/presetStore.ts
 *
 * * Packのカスタムプロパティのプリセットを管理するZustandストア。
 * 責務は、Packプリセットのリスト（packPresets）の保持、DBサービス（presetService）を
 * 介したIndexedDBへの永続化、およびメモリ状態の同期を行うことです。
 *
 * * 責務:
 * 1. Packプリセットの状態（packPresets: PackPreset[]）を保持する。
 * 2. 永続化層（presetService）を介して、プリセットの初期ロード、新規作成・保存、および削除を実行する。
 * 3. DBが空の場合に初期データを投入する処理（initializePresets）をトリガーする。
 * 4. DB操作後のメモリ状態（packPresets）を同期する。
 */

import { create } from 'zustand';
import type { PackPreset, Preset } from '../models/preset';
import { generateId } from '../utils/dataUtils';
import { presetService } from '../services/user-data/presetService';


export interface PresetStore {
    packPresets: PackPreset[];

    // アクション
    /** DBからプリセットをロードし、ストアを初期化する */
    fetchPresets: () => Promise<void>;
    /** 新しいPackプリセットを作成し、DBとストアに保存する */
    savePackPreset: (
        data: Omit<PackPreset, 'id' | 'createdAt' | 'updatedAt' | 'name'>,
        name: string
    ) => Promise<void>
    /** プリセットをDBとストアから削除する */
    deletePreset: (id: string, type: 'pack') => Promise<void>;
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

// 初期化時にDBに投入するためのプリセットリスト (PackPresetのみ)
const INITIAL_PRESETS: Preset[] = [...INITIAL_PACK_PRESETS] as Preset[];


export const usePresetStore = create<PresetStore>((set, _get) => ({
    packPresets: [],

    /**
     * IndexedDBからプリセットをロードし、ストアを初期化する
     */
    fetchPresets: async () => {
        try {
            // DBが空の場合に初期データを投入 (サービスの責務)
            await presetService.initializePresets(INITIAL_PRESETS);

            // DBからデータをロード
            const loadedPresets = await presetService.loadAllPresets();

            // ロードしたデータを Pack のみにフィルタリングして状態にセット
            const packPresets = loadedPresets.filter((p): p is PackPreset => 'cardsPerPack' in p);

            set({ packPresets });
        } catch (error) {
            console.error('Failed to load presets from DB:', error);
            // ロード失敗時: フォールバックとしてハードコードされた初期データを使用
            set({
                packPresets: INITIAL_PACK_PRESETS,
            });
        }
    },

    /**
     * Packプリセットを生成し、DBとストアに保存する
     */
    savePackPreset: async (data, name) => {
        const now = new Date().toISOString();
        const newPreset: PackPreset = {
            ...data,
            id: generateId(),
            name: name,
            createdAt: now,
            updatedAt: now,
        };

        // 永続化ロジック (DBサービスを呼び出し)
        await presetService.savePreset(newPreset);

        // メモリ状態を更新
        set(state => ({ packPresets: [...state.packPresets, newPreset] }));
    },

    /**
     * プリセットをDBとストアから削除する
     */
    deletePreset: async (id, type) => {

        // 永続化ロジック (DBサービスを呼び出し)
        await presetService.deletePresetById(id);

        // メモリ状態を更新
        if (type === 'pack') {
            set(state => ({ packPresets: state.packPresets.filter(p => p.id !== id) }));
        } else {
            console.warn(`Attempted to delete a preset of unsupported type: ${type}. Only 'pack' is supported.`);
        }
    },
}));