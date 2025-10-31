/**
 * src/services/database/db.ts
 *
 * * IndexedDB (Dexie) を使用したアプリケーションのデータベース接続とスキーマ定義を提供するコアモジュール。
 * * 責務:
 * 1. データベース接続（OmniTCGSimDB）のインスタンス化と管理。
 * 2. アプリケーションで永続化する全てのエンティティ（packs, cards, decks, history, trash など）に対するDexieテーブルの型定義。
 * 3. アプリケーションの最新のデータ構造（V2/V3スキーマ）に基づいたIndexedDBのスキーマバージョン管理（this.version(X).stores({...})）と、効率的なクエリのためのインデックス定義。
 * 4. 永続化層の唯一のエントリポイントとして、データベースインスタンス（db）をエクスポートする。
 */

import Dexie, { type Table } from 'dexie';
import {
    type DBCard,
    type DBPack,
    type DBCardPool,
    type DBDeck,
    type DBSetting,
    type DBArchive,
} from '../../models/db-types';
import { type Preset } from '../../models/preset';

// DBインスタンスの型定義
export class OmniTCGSimDB extends Dexie {
    // 既存のテーブル
    packs!: Table<DBPack, string>;
    cards!: Table<DBCard, string>;
    cardPool!: Table<DBCardPool, string>;
    decks!: Table<DBDeck, string>;
    userSettings!: Table<DBSetting, string>;
    presets!: Table<Preset, string>;

    // DBArchive 型を使用したアーカイブテーブル
    history!: Table<DBArchive, string>;
    trash!: Table<DBArchive, string>;


    constructor() {
        super('OmniTCGSimDB');

        // 開発環境のためバージョンを1に初期化し、最新のスキーマを定義する。
        this.version(1).stores({
            // packs: カスタムフィールドと最新の変更点をすべて含むスキーマ
            packs: `&packId, name, number, price, packType, cardsPerPack, totalCards, series, isOpened, isFavorite, createdAt, updatedAt, imageColor, cardBackImageColor, specialProbabilitySlots, isAdvancedRulesEnabled, num_1, num_2, str_1, str_2, searchText`,


            // cards: カスタムフィールドと最新の変更点をすべて含むスキーマ
            cards: `&cardId, [packId+number], packId, name, number, rarity, isFavorite, createdAt, imageColor, num_1, num_2, num_3, num_4, num_5, num_6, str_1, str_2, str_3, str_4, str_5, str_6, searchText`,

            cardPool: '&cardId',

            // decks: カスタムフィールドと最新の変更点をすべて含むスキーマ
            decks: `&deckId, name, number, ruleId, deckType, totalCards, series, isLegal, hasUnownedCards, isFavorite, createdAt, updatedAt, imageColor, num_1, num_2, num_3, num_4, str_1, str_2, str_3, str_4, searchText`,

            userSettings: '&key',
            presets: '&id, name',

            // history (履歴) テーブルのスキーマ: archiveIdをプライマリキー、itemIdとitemTypeによる複合インデックス
            history: '&archiveId, itemId, itemType, archivedAt, [itemType+archivedAt], [itemId+archivedAt]',

            // trash (ゴミ箱) テーブルのスキーマ: archiveIdをプライマリキー、itemTypeとarchivedAtによる複合インデックス
            trash: '&archiveId, itemType, archivedAt, itemId, [itemType+archivedAt]',
        });

    }
}

// データベースインスタンスのエクスポート
export const db = new OmniTCGSimDB();