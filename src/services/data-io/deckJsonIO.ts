/**
 * src/services/data-io/deckJsonIO.ts
 *
 * Deckモデル内のMap構造（mainDeck, sideDeck, extraDeck）をJSON互換の形式へ
 * シリアライズ/デシリアライズ（Mapの変換/復元）するドメイン固有のI/Oサービス。
 * 💡 修正: PackJsonIOと同様に、ID衝突解決やナンバリングなどの**インポートビジネスロジック**もここで担当する。
 */

import type { Deck } from '../../models/deck';
import { exportDataToJson, importDataFromJson, type Serializer, type Deserializer } from '../../utils/genericJsonIO';
import { deckService } from '../decks/deckService'; // 💡 追加: 永続化のためにDeckServiceをインポート
import { v4 as uuidv4 } from 'uuid'; // 💡 追加: ID再割り当てのためにuuidをインポート
import { getNextNumber } from '../../utils/numberingUtils'; // 💡 追加: ナンバリングのためにユーティリティをインポート

// --- 固有の変換ロジックの定義 ---

/** デッキのMap構造をJSON互換配列に変換するシリアライザ */
const deckSerializer: Serializer<Deck[]> = (decks: Deck[]) => {
    return decks.map(d => ({
        ...d,
        // Map<string, number> を Array<[string, number]> 形式に変換
        mainDeck: Array.from(d.mainDeck.entries()), 
        sideDeck: Array.from(d.sideDeck.entries()),
        extraDeck: Array.from(d.extraDeck.entries()),
    }));
};

/** JSON互換配列をDeckのMap構造に復元するデシリアライザ */
const deckDeserializer: Deserializer<Deck[]> = (loadedData: any): Deck[] => {
    if (!Array.isArray(loadedData)) {
        throw new Error('JSONの形式が正しくありません。Deckの配列である必要があります。');
    }
    // JSON互換配列を Map 構造に復元
    return loadedData.map((d: any) => ({
        ...d,
        mainDeck: new Map(d.mainDeck),
        sideDeck: new Map(d.sideDeck),
        extraDeck: new Map(d.extraDeck),
    })) as Deck[];
};

// --- 汎用I/Oを使用した公開関数 ---

/**
 * Deck配列をJSON文字列にエクスポートする。
 */
export const exportDecksToJson = (decks: Deck[]): string => {
    return exportDataToJson(decks, deckSerializer);
};

/**
 * JSON文字列からDeck配列をインポートする。（デシリアライズのみ）
 */
const deserializeDecksFromJson = (jsonText: string): Deck[] => {
    return importDataFromJson(jsonText, deckDeserializer);
};

// --- 💡 追加: インポートビジネスロジックと永続化連携 ---

/**
 * 💡 新規追加: JSON文字列からDeck配列をインポートし、ID衝突解決やナンバリングを行った上でDBに保存する。
 */
export const processImportDecks = async (jsonText: string): Promise<{ importedCount: number, renamedCount: number, skippedIds: string[] }> => {
    console.log("[deckJsonIO] START bulk import process.");
    
    // 1. JSON文字列をDeck[]にデシリアライズ
    const decksToImport: Deck[] = deserializeDecksFromJson(jsonText);
    
    if (decksToImport.length === 0) {
        return { importedCount: 0, renamedCount: 0, skippedIds: [] };
    }

    // 2. 既存のデータをロードし、ID衝突解決とナンバリングに必要な情報を取得
    // 💡 PackServiceと同様に、キャッシュが未ロードであればロードする (ナンバリングのために必要)
    await deckService.fetchAllDecks(); 
    const existingDecks = deckService.getAllDecksFromCache();

    let importedCount = 0;
    let renamedCount = 0;
    const skippedIds: string[] = [];
    
    // 既存のデッキIDと現在の最大番号を取得 (キャッシュから取得)
    const existingIds = new Set(existingDecks.map(d => d.deckId));
    let currentMaxNumber = existingDecks
        .map(d => d.number)
        .filter((n): n is number => !!n)
        .reduce((max, current) => Math.max(max, current), 0);
    
    const decksToSave: Deck[] = [];

    // 3. ID衝突解決とナンバリングのビジネスロジックを実行
    decksToImport.forEach(newDeck => {
        let deck: Deck = { ...newDeck };
        
        // IDが重複している場合 -> IDをリネームして衝突を避ける
        if (existingIds.has(deck.deckId)) {
            deck.name = `${deck.name} (Imported)`;
            deck.deckId = uuidv4(); // 新しいIDを割り当て
            renamedCount++;
        }
        
        // number の自動採番ロジック (インポートデータに番号がない場合)
        if (deck.number === undefined || deck.number === null) {
            currentMaxNumber = getNextNumber(currentMaxNumber, 1);
            deck.number = currentMaxNumber;
        }
        
        // データのクリーンアップ/更新日設定 (責務: data-io層で行う)
        deck.createdAt = deck.createdAt || new Date().toISOString();
        deck.updatedAt = new Date().toISOString();
        deck.isInStore = false; // 💡 インポートされたデッキは一旦ドラフト（非表示）として扱うのが自然
        
        // 💡 [重要] IDが重複した場合は、新しいIDをexistingIdsに追加し、以降のインポートデータとの衝突を避ける
        if (renamedCount > 0 && !existingIds.has(deck.deckId)) {
            existingIds.add(deck.deckId);
        }

        decksToSave.push(deck);
        importedCount++;
    });
    
    // 4. ドメインサービスに永続化（DBへの書き込み）を依頼
    await deckService.bulkPutDecks(decksToSave);
    
    console.log(`[deckJsonIO] ✅ Bulk import complete. Imported: ${importedCount}, Renamed: ${renamedCount}`);
    
    return { importedCount, renamedCount, skippedIds };
};