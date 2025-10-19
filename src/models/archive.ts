//archive.ts
import type { Pack, PackBundle } from "./pack";
import type { Deck } from "./deck";
import type { DBArchiveData } from "./db-types";

export interface ArchivePack extends Pack {
    archiveId: string;
    archivedAt: string; // ISO 8601 string
    isFavorite: boolean;
    isManual: boolean;
}

export interface ArchivePackBundle extends PackBundle {
    archiveId: string;
    archivedAt: string; // ISO 8601 string
    isFavorite: boolean;
    isManual: boolean;
}

export interface ArchiveDeck extends Deck {
    archiveId: string;
    archivedAt: string; // ISO 8601形式のタイムスタンプ
    isFavorite: boolean;
    isManual: boolean;
}

export type ArchiveCollectionKey = 'history' | 'trash';
export type ArchiveItemType = 'packBundle' | 'deck';

export interface ArchiveItemToSave<T extends DBArchiveData> { 
    itemType: ArchiveItemType, 
    itemId: string, 
    data: T, // DBArchive.itemData の型は呼び出し側で担保
    isManual?: boolean,
    isFavorite?: boolean; 
}

// 💡 修正案: リスト表示用のユニオン型を定義 (ArchiveDeck | ArchivePack)
export type ArchiveDisplayData = ArchiveDeck | ArchivePack;

// 💡 修正案: 個別取得・復元用の完全データユニオン型を定義 (ArchiveDeck | ArchivePackBundle)
export type ArchiveItemData = ArchiveDeck | ArchivePackBundle;