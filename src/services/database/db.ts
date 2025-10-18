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
            packs: `&packId, name, number, imageColor, price, packType, cardsPerPack, totalCards, series, releaseDate, isOpened, isFavorite, createdAt, updatedAt, specialProbabilitySlots, isAdvancedRulesEnabled,
                    custom_1_num, custom_2_num, custom_3_num, custom_4_num, custom_5_num, custom_6_num, custom_7_num, custom_8_num, custom_9_num, custom_10_num,
                    custom_1_bool, custom_2_bool, custom_3_bool, custom_4_bool, custom_5_bool, custom_6_bool, custom_7_bool, custom_8_bool, custom_9_bool, custom_10_bool,
                    custom_1_str, custom_2_str, custom_3_str, custom_4_str, custom_5_str, custom_6_str, custom_7_str, custom_8_str, custom_9_str, custom_10_str`,
                     
            
            // cards: V2の変更点をすべて含む最新スキーマ
            cards: `&cardId, [packId+number], packId, name, number, imageColor, rarity, isFavorite, isFavorite, createdAt,
                    custom_1_bool, custom_2_bool, custom_3_bool, custom_4_bool, custom_5_bool, custom_6_bool, custom_7_bool, custom_8_bool, custom_9_bool, custom_10_bool,
                    custom_1_num, custom_2_num, custom_3_num, custom_4_num, custom_5_num, custom_6_num, custom_7_num, custom_8_num, custom_9_num, custom_10_num,
                    custom_1_str, custom_2_str, custom_3_str, custom_4_str, custom_5_str, custom_6_str, custom_7_str, custom_8_str, custom_9_str, custom_10_str`,
            
            cardPool: '&cardId', 
            
            // decks: V2の変更点をすべて含む最新スキーマ
            decks: `&deckId, name, number, imgColor, ruleId, deckType, totalCards, series, isLegal, hasUnownedCards, isFavorite, createdAt, updatedAt,
                    custom_1_bool, custom_2_bool, custom_3_bool, custom_4_bool, custom_5_bool, custom_6_bool, custom_7_bool, custom_8_bool, custom_9_bool, custom_10_bool,
                    custom_1_num, custom_2_num, custom_3_num, custom_4_num, custom_5_num, custom_6_num, custom_7_num, custom_8_num, custom_9_num, custom_10_num,
                    custom_1_str, custom_2_str, custom_3_str, custom_4_str, custom_5_str, custom_6_str, custom_7_str, custom_8_str, custom_9_str, custom_10_str`,
            
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