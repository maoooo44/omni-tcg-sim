/**
 * src/models/db-types.ts
 *
 * * IndexedDB (Dexie) のテーブルに保存されるオブジェクトのスキーマ型定義を集約したモデル層モジュール。
 * アプリケーションの主要なエンティティ（Card, Pack, Deck, Archive, CardPool, Setting）について、
 * IndexedDBで永続化可能な JSON 互換のデータ構造（プリミティブ型、Record、配列のみ）を定義します。
 *
 * * 責務:
 * 1. 永続化が必要な主要なデータモデルのインターフェース（DBCard, DBPack, DBDeckなど）を定義する。
 * 2. 履歴機能で使用する複雑なデータ構造（DBPackBundle, DBArchiveData, DBArchive）を定義する。
 * 3. データのキー（ID）やタイムスタンプなどの必須フィールドの型を明確にする。
 */

import type { PackType, RarityConfig, AdvancedRarityConfig, ConstructedDeckCard, PackFieldSettings, CardFieldSettings } from "./pack";
import type { DeckType, DeckFieldSettings } from "./deck";
import type { ArchiveCollectionKey } from "./archive";



// Card Data (DBに保存される JSON 互換の構造)
export interface DBCard {
    cardId: string;
    packId: string;
    name: string;
    number?: number | null;
    imageUrl: string;
    imageColor?: string;
    rarity: string;
    text: string;
    subtext: string;
    isFavorite: boolean;
    createdAt: string;
    updatedAt: string;

    num_1?: number | null;
    num_2?: number | null;
    num_3?: number | null;
    num_4?: number | null;
    num_5?: number | null;
    num_6?: number | null;
    str_1?: string;
    str_2?: string;
    str_3?: string;
    str_4?: string;
    str_5?: string;
    str_6?: string;

    tag?: string[];
    searchText?: string;
}

// Pack Data (DBに保存される JSON 互換の構造)
export interface DBPack {
    packId: string;
    name: string;
    number?: number | null;
    imageUrl: string;
    imageColor?: string;
    cardBackImageUrl: string;
    cardBackImageColor?: string;
    packType: PackType;
    cardsPerPack: number;
    rarityConfig: RarityConfig[];
    advancedRarityConfig?: AdvancedRarityConfig[];
    specialProbabilitySlots: number;
    isAdvancedRulesEnabled: boolean;
    price: number;
    totalCards: number;
    series: string;
    description: string;
    isOpened: boolean;
    isFavorite: boolean;
    createdAt: string;
    updatedAt: string;

    constructedDeckCards?: ConstructedDeckCard[];

    cardPresetId?: string;
    num_1?: number | null;
    num_2?: number | null;
    str_1?: string;
    str_2?: string;
    packFieldSettings: PackFieldSettings;
    cardFieldSettings: CardFieldSettings;
    tag?: string[];
    searchText?: string;

}

// Deck Data (DBに保存される JSON 互換の構造)
export interface DBDeck {
    deckId: string;
    name: string;
    number?: number | null;
    imageUrl: string;
    imageColor?: string;
    ruleId?: string;
    deckType: DeckType;
    totalCards: number;
    series: string;
    description: string;
    keycard_1?: string;
    keycard_2?: string;
    keycard_3?: string;
    isLegal: boolean;
    hasUnownedCards: boolean;
    isFavorite: boolean;
    createdAt: string;
    updatedAt: string;
    // デッキに含まれるカードと枚数
    // key: cardId (string), value: count (number)
    // Mapを使用して、編集時や検索時に高速なアクセスを可能にする
    mainDeck: Record<string, number>;
    sideDeck: Record<string, number>;
    extraDeck: Record<string, number>;

    num_1?: number | null;
    num_2?: number | null;
    num_3?: number | null;
    num_4?: number | null;
    str_1?: string;
    str_2?: string;
    str_3?: string;
    str_4?: string;
    fieldSettings: DeckFieldSettings;
    tag?: string[];
    searchText?: string;
}

// Card Pool
export interface DBCardPool {
    cardId: string;
    count: number;
}

// User Settings (汎用的なキー・バリュー形式)
export interface DBSetting {
    key: string;
    value: any;
}



// --- 履歴/ゴミ箱データ型 ---

export type ItemType = 'card' | 'pack' | 'deck';

export interface DBPackBundle {
    packData: DBPack;
    cardsData: DBCard[];
}

export type DBArchiveData = DBPackBundle | DBDeck;

export interface DBArchive {
    archiveId: string
    itemId: string;
    itemType: 'packBundle' | 'deck';
    collectionKey?: ArchiveCollectionKey;
    archivedAt: string;
    itemData: DBArchiveData;
    isFavorite: boolean;
    isManual: boolean;
}