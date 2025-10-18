/**
 * src/services/user-data/presetService.ts
 *
 * IndexedDB (Dexie) の 'presets' テーブルに対するプリセットデータ
 * (PackPreset, CardCustomPreset) の永続化操作を扱うサービス。
 * CRUD操作および初期データ投入ロジックを提供する。
 */

import { db } from '../database/db'; // DexieのDBインスタンスを参照
import type { Preset } from '../../models/preset';

// DBテーブル名 (db.tsで定義されている前提)
const PRESET_TABLE = 'presets';

/**
 * プリセットデータ (PackPreset, CardCustomPreset) の IndexedDB 操作を扱うサービス
 */
export const presetService = {
    
    /**
     * 全てのプリセットをIndexedDBからロード
     */
    loadAllPresets: async (): Promise<Preset[]> => {
        // 'presets'テーブルから全てのデータを取得
        return db.table<Preset, string>(PRESET_TABLE).toArray();
    },

    /**
     * プリセットをDBに保存 (新規作成または更新)
     */
    savePreset: async (preset: Preset): Promise<void> => {
        // IDに基づいてデータを上書きまたは新規追加
        await db.table<Preset, string>(PRESET_TABLE).put(preset);
    },

    /**
     * プリセットをIDで削除
     */
    deletePresetById: async (id: string): Promise<void> => {
        await db.table<Preset, string>(PRESET_TABLE).delete(id);
    },
    
    /**
     * (オプション) プリセットの初期データ投入 (DBが空の場合にのみ実行)
     */
    initializePresets: async (initialData: Preset[]): Promise<void> => {
        const count = await db.table<Preset, string>(PRESET_TABLE).count();
        if (count === 0) {
            await db.table<Preset, string>(PRESET_TABLE).bulkAdd(initialData);
        }
    }
};