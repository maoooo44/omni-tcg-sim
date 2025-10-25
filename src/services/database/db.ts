/**
 * src/services/database/db.ts
 *
 * IndexedDB (Dexie) を使用したアプリケーションのデータベース接続と
 * スキーマ定義を提供するコアファイル。アプリケーション内の永続化層の唯一のエントリポイントであり、
 * 全てのアプリケーションエンティティ（Pack, Card, Deckなど）のテーブルとインデックスを定義し、
 * バージョン管理を行う。
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
        // ローカル環境の既存のDBを削除して再ビルド・起動すると、このスキーマで再作成されます。
        this.version(1).stores({
            // packs: カスタムフィールド30枠とV2の変更点をすべて含む最新スキーマ
            packs: `&packId, name, number, imageColor, price, packType, cardsPerPack, totalCards, series, isOpened, isFavorite, createdAt, updatedAt, specialProbabilitySlots, isAdvancedRulesEnabled, num_1, num_2, str_1, str_2, searchText`,
                     
            
            // cards: V2の変更点をすべて含む最新スキーマ
            cards: `&cardId, [packId+number], packId, name, number, imageColor, rarity, isFavorite, createdAt, num_1, num_2, num_3, num_4, num_5, num_6, str_1, str_2, str_3, str_4, str_5, str_6, searchText`,
            
            cardPool: '&cardId', 
            
            // decks: V2の変更点をすべて含む最新スキーマ
            decks: `&deckId, name, number, imageColor, ruleId, deckType, totalCards, series, keycard_1, keycard_2, keycard_3, isLegal, hasUnownedCards, isFavorite, createdAt, updatedAt, num_1, num_2, num_3, num_4, str_1, str_2, str_3, str_4, searchText`,
            
            userSettings: '&key', 
            presets: '&id, name',

            // history (履歴) テーブルのスキーマ (V2/V3で追加)
            history: '&archiveId, itemId, [itemId+archivedAt], itemType, archivedAt',

            // trash (ゴミ箱) テーブルのスキーマ (V2/V3で追加)
            trash: '&archiveId, itemType, [itemType+archivedAt], archivedAt, itemId', 
        });
        
    }
}

// データベースインスタンスのエクスポート
export const db = new OmniTCGSimDB();