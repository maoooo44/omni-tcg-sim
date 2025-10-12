/**
 * src/service/database/db.ts
 *
 * IndexedDB (Dexie) を使用したアプリケーションのデータベース接続と
 * スキーマ定義 (テーブルとインデックス) を提供する。
 * Pack, Card, CardPool, Deck, UserSettings のテーブルを含む。
 */

import Dexie, { type Table } from 'dexie';
import { type Pack } from '../../models/pack';
import { type Card } from '../../models/card'; 
import { type DBCardPool, type DBDeck, type DBSetting } from '../../models/db-types'; 
import { type Preset } from '../../models/preset';

export class OmniTCGSimDB extends Dexie {
    packs!: Table<Pack, string>; 
    cards!: Table<Card, string>; 
    
    cardPool!: Table<DBCardPool, string>;
    decks!: Table<DBDeck, string>; 
    userSettings!: Table<DBSetting, string>; 
    presets!: Table<Preset, string>;

    constructor() {
        super('OmniTCGSimDB');
        
        // 既存のversion(1)
        this.version(1).stores({
            packs: '&packId, name, series', 
            cards: '&cardId, packId, rarity', 
            cardPool: '&cardId', 
            decks: '&deckId', 
            userSettings: '&key', 
            presets: '&id, name',
        });
        
        // 💡 修正: version(2)に上げ、cardsテーブルに登録順のための複合インデックスを追加
        this.version(2).stores({
            packs: '&packId, name, series', 
            cards: '&cardId, [packId+registrationSequence], packId, rarity', 
            cardPool: '&cardId', 
            decks: '&deckId', 
            userSettings: '&key', 
            presets: '&id, name',
        });
        
        // Version 2 のマイグレーションロジック（既存データへの registrationSequence 付与など）は省略
    }
}

export const db = new OmniTCGSimDB();