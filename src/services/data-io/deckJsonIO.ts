/**
 * src/services/data-io/deckJsonIO.ts
 *
 * Deckモデル内のMap構造（mainDeck, sideDeck, extraDeck）をJSON互換の形式へ
 * シリアライズ/デシリアライズ（Mapの変換/復元）するドメイン固有のI/Oサービス。
 * ID衝突解決などのインポートビジネスロジックもここで担当する。
 */

import type { Deck } from '../../models/deck';
import { exportDataToJson, importDataFromJson, type Serializer, type Deserializer } from '../../utils/genericJsonIO';
import { deckService } from '../decks/deckService';
// 💡 修正点: generateId, applyDefaultsIfMissing, createDefaultDeckData をインポート
import { generateId, applyDefaultsIfMissing, createDefaultDeck } from '../../utils/dataUtils'; 

// --- 💡 修正点: 不要なインポートを削除 ---
// import { v4 as uuidv4 } from 'uuid'; 
// import { getNextNumber } from '../../utils/numberingUtils'; 

// --- インポートオプションの定義 (変更なし) ---

/** ID衝突時のDeckデータの処理方法 */
export type DeckIdConflictStrategy = 'RENAME' | 'SKIP';

/** インポート処理のオプション */
export interface DeckImportOptions {
    /** 既存のDeckIdとインポートデータのDeckIdが衝突した場合の戦略 */
    deckIdConflictStrategy: DeckIdConflictStrategy;
}

// --- 固有の変換ロジックの定義 (変更なし) ---

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

// --- 汎用I/Oを使用した公開関数 (変更なし) ---

/**
 * Deck配列をJSON文字列にエクスポートする。
 */
/**
 * 💡 [修正] Deck ID配列を受け取り、Deckデータ配列を取得・シリアライズし、JSON文字列にエクスポートする。
 */
export const exportDecksToJson = async (deckIds: string[]): Promise<string> => {
    
    // 1. I/O層内でサービスを呼び出し、必要なデータを非同期で取得
    //    fetchDecksByIdsは (Deck | null)[] を返す可能性がある
    const fetchedDecks = await deckService.fetchDecksByIds(deckIds);
    
    // 2. 💡 修正点: nullを除去して、型を Deck[] に絞り込む
    //    (deck): deck is Deck のような型ガード関数をフィルタに渡すことで、TypeScriptに型を理解させる
    const decks: Deck[] = fetchedDecks.filter((deck): deck is Deck => deck !== null);
    
    if (decks.length === 0) {
        throw new Error('エクスポート対象のデッキデータが見つかりませんでした。');
    }

    // 3. 取得したDeck[]をシリアライザーに通し、JSON文字列としてエクスポート
    return exportDataToJson(decks, deckSerializer);
};

/**
 * JSON文字列からDeck配列をインポートする。（デシリアライズのみ）
 */
const deserializeDecksFromJson = (jsonText: string): Deck[] => {
    return importDataFromJson(jsonText, deckDeserializer);
};

// --- インポートビジネスロジックと永続化連携 ---

/**
 * JSON文字列からDeck配列をインポートし、ID衝突解決を行った上でDBに保存する。
 * 💡 修正: ナンバリング処理を削除
 * @param jsonText - インポートするJSON文字列
 * @param options - インポートオプション
 * @returns 新しく追加されたデッキのIDと、スキップされたIDのリスト
 */
export const importDecksFromJson = async (
    jsonText: string,
    options?: DeckImportOptions
): Promise<{ newDeckIds: string[], skippedIds: string[] }> => {
    console.log("[deckJsonIO:importDecksFromJson] START bulk import process.");
    
    // 1. JSON文字列をDeck[]にデシリアライズ
    const decksToImport: Deck[] = deserializeDecksFromJson(jsonText);
    
    if (decksToImport.length === 0) {
        return { newDeckIds: [], skippedIds: [] };
    }

    // 2. 既存のデータをロードし、ID衝突解決に必要な情報を取得
    await deckService.fetchAllDecks(); 
    const existingDecks = deckService.getAllDecksFromCache();

    const skippedIds: string[] = [];
    const newDeckIds: string[] = [];
    
    // 既存のデッキIDを取得 (キャッシュから取得)
    const existingIds = new Set(existingDecks.map(d => d.deckId));
    
    // 💡 修正: ナンバリング関連の変数(currentMaxNumber)を削除

    const decksToSave: Deck[] = [];

    // オプションが渡されなかった場合のデフォルト戦略を 'SKIP' に設定
    const deckIdConflictStrategy: DeckIdConflictStrategy = options?.deckIdConflictStrategy || 'SKIP';
    
    const defaultDeckData = createDefaultDeck();

    // 3. ID衝突解決とデータ補完ロジックを実行
    decksToImport.forEach(rawDeck => {
        let deck: Deck = { ...rawDeck };
        const originalDeckId = deck.deckId;

        // ID衝突時の挙動をオプションで制御
        if (existingIds.has(originalDeckId)) {
            
            if (deckIdConflictStrategy === 'SKIP') {
                // SKIP戦略: IDが衝突したらスキップ
                skippedIds.push(originalDeckId);
                console.log(`[deckJsonIO] Deck ID ${originalDeckId} skipped due to conflict.`);
                return; // このデッキの処理を終了し、次のループへ
            }
            
            // 'RENAME' (新しいIDを割り当てる) 戦略の場合
            deck.deckId = generateId(); // 💡 修正: generateIdを使用
            console.log(`[deckJsonIO] Deck ID collision for ${originalDeckId}. New ID assigned: ${deck.deckId}`);
        }
        
        // 💡 修正: データのクリーンアップ/更新日設定
        // 1. 欠落フィールドの補完 (createdAtなどが含まれる)
        deck = applyDefaultsIfMissing(deck, defaultDeckData);
        
        // 2. updatedAt を最新に上書き
        deck.updatedAt = new Date().toISOString();
        
        // 3. Map型の初期化が欠落している場合に補完（applyDefaultsIfMissingではMapの初期化は意図的に除外）
        // ただし、deckDeserializer で Map 構造に復元されているため、通常は不要だが、念のため。
        deck.mainDeck = deck.mainDeck || new Map();
        deck.sideDeck = deck.sideDeck || new Map();
        deck.extraDeck = deck.extraDeck || new Map();


        // 💡 [重要] 新しいIDをexistingIdsに追加し、以降のインポートデータとの衝突を避ける
        if (!existingIds.has(deck.deckId)) {
            existingIds.add(deck.deckId);
        }
        
        decksToSave.push(deck);
        newDeckIds.push(deck.deckId);
    });
    
    // 4. ドメインサービスに永続化（DBへの書き込み）を依頼
    await deckService.saveDecks(decksToSave);
    
    console.log(`[deckJsonIO:importDecksFromJson] ✅ Bulk import complete. Imported: ${newDeckIds.length}. Skipped: ${skippedIds.length}`);
    
    return { newDeckIds, skippedIds };
};