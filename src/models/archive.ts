/**
 * src/models/archive.ts
 *
 * * アーカイブ機能に関連する全てのデータモデル（インターフェースおよびユニオン型）を定義するモデル層モジュール。
 * 元のデータモデル（Pack, Deck, PackBundle）にアーカイブ固有のメタデータ（ID、日時、フラグ）を追加した型を定義します。
 *
 * * 責務:
 * 1. アーカイブされたアイテムのデータ構造（ArchivePack, ArchiveDeckなど）を定義する。
 * 2. アーカイブコレクションのキー（'history', 'trash'）やアイテムタイプなどの列挙型を定義する。
 * 3. データの保存、表示、取得といった各ユースケースに応じたユニオン型（ArchiveDisplayData, ArchiveItemData）を提供する。
 */
import type { Pack, PackBundle } from "./pack";
import type { Deck } from "./deck";
import type { DBArchiveData } from "./db-types";

export interface ArchiveMeta {
    archiveId: string;
    archivedAt: string; // ISO 8601 string
    isFavorite: boolean; // これは「アーカイブアイテムのお気に入り」
    isManual: boolean;
}

export interface ArchivePack extends Pack {
    meta: ArchiveMeta;
}

export interface ArchivePackBundle extends PackBundle {
    meta: ArchiveMeta;
}

export interface ArchiveDeck extends Deck {
    meta: ArchiveMeta;
}

export type ArchiveCollectionKey = 'history' | 'trash';
export type ArchiveItemType = 'packBundle' | 'deck';

export interface ArchiveItemToSave<T extends DBArchiveData> {
    itemType: ArchiveItemType,
    itemId: string,
    data: T, // パック/デッキ本体 (DBPackBundle | DBDeck)
    meta: {
        isManual?: boolean,
        isFavorite?: boolean;
    }
}

export type ArchiveDisplayData = ArchiveDeck | ArchivePack;

export type ArchiveItemData = ArchiveDeck | ArchivePackBundle;