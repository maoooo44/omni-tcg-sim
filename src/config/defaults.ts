/**
 * src/config/defaults.ts
 *
 */
import type { ArchiveItemType } from '../models/db-types';
import type { ArchiveCollectionKey } from '../services/user-data/userDataService'; // ★ ArchiveCollectionKeyはuserDataServiceからインポート

// GC設定のデフォルト値の型
export interface GCServiceDefaults {
    [key: ArchiveCollectionKey]: {
        [key in ArchiveItemType]: {
            timeLimit: number; // 保持期間 (日数)
            maxSize: number; // 最大アイテム数
        };
    };
}

/**
 * アーカイブコレクション ('trash' および 'history') ごとの GC デフォルト設定。
 * ItemGcSettings のプロパティ名 (timeLimit, maxSize) に合わせて統一しています。
 */
export const ARCHIVE_GC_DEFAULTS: GCServiceDefaults = {
    trash: {
        packBundle: { 
            timeLimit: 30, // 30 days
            maxSize: 100 
        },
        deck: { 
            timeLimit: 60, // 60 days (仮の値)
            maxSize: 50 // 仮の値
        },
    },
    history: {
        packBundle: { 
            timeLimit: 90, // 90 days
            maxSize: 500 
        },
        deck: { 
            timeLimit: 180, // 180 days (仮の値)
            maxSize: 250 // 仮の値
        },
    },
};