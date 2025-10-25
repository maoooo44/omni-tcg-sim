//src/configs/gcDefaults.ts
import type { ArchiveItemType, ArchiveCollectionKey } from '../models/archive';

// アイテムタイプごとのGC設定の型
export type ItemGcConfig = Record<ArchiveItemType, {
    timeLimit: number; // 保持期間 (日数)
    maxSize: number; // 最大アイテム数
}>;

// GC設定のデフォルト値の型
// ArchiveCollectionKey ('trash' | 'history') をキーとするマップ型
export type GCServiceDefaults = Record<ArchiveCollectionKey, ItemGcConfig>;
// または、以下のようにマップ型をネストして直接定義することもできます。
// export type GCServiceDefaults = {
//     [K in ArchiveCollectionKey]: {
//         [T in ArchiveItemType]: {
//             timeLimit: number; // 保持期間 (日数)
//             maxSize: number; // 最大アイテム数
//         };
//     };
// };

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