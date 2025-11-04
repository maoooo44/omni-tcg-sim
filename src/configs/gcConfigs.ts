/**
 * src/configs/gcConfigs.ts
 *
 * * ガベージコレクション (GC) サービスで使用される、アイテムタイプおよびアーカイブコレクションごとの設定を定義するモジュール。
 *
 * * 責務:
 * 1. アーカイブアイテムのタイプ (`ArchiveItemType`) およびコレクション (`ArchiveCollectionKey`) に基づくGC設定値 (`ARCHIVE_GC_CONFIGS`) を保持する。
 * 2. GC設定オブジェクトの型定義 (`ItemGcConfig`, `GCServiceConfigs`) を提供する。
 * 3. 保持期間 (`timeLimit`) と最大アイテム数 (`maxSize`) の設定値を定義する。
 */
import type { ArchiveItemType, ArchiveCollectionKey } from '../models/archive';

// アイテムタイプごとのGC設定の型
export type ItemGcConfig = Record<ArchiveItemType, {
    timeLimit: number; // 保持期間 (日数)
    maxSize: number; // 最大アイテム数
}>;

// GC設定値の型
// ArchiveCollectionKey ('trash' | 'history') をキーとするマップ型
export type GCServiceConfigs = Record<ArchiveCollectionKey, ItemGcConfig>;

/**
 * アーカイブコレクション ('trash' および 'history') ごとの GC 設定。
 * ItemGcConfig のプロパティ名 (timeLimit, maxSize) に合わせて統一しています。
 */
export const ARCHIVE_GC_CONFIGS: GCServiceConfigs = {
    trash: {
        packBundle: {
            timeLimit: 30, // 30 days
            maxSize: 100
        },
        deck: {
            timeLimit: 60, // 60 days
            maxSize: 50
        },
    },
    history: {
        packBundle: {
            timeLimit: 90, // 90 days
            maxSize: 500
        },
        deck: {
            timeLimit: 180, // 180 days
            maxSize: 250
        },
    },
};