/**
 * src/services/data-io/deckJsonIO.ts
 *
 * * Deckモデル内のMap構造（mainDeck, sideDeck, extraDeck）をJSON互換の形式へ
 * * シリアライズ/デシリアライズ（Mapの変換/復元）するドメイン固有のI/Oサービス層モジュール。
 * * 責務:
 * 1. DeckモデルのMapプロパティをJSON互換形式に変換するシリアライザ/デシリアライザの提供。
 * 2. ドメインサービス（deckService）と連携し、指定されたIDのデッキデータを取得しJSONとしてエクスポートする。
 * 3. JSON文字列をインポートする際、ID衝突解決（SKIPまたはRENAME）のビジネスロジックとデータ補完を担当し、永続化（DB保存）をトリガーする。
 */

import type { Deck } from '../../models/models';
import { exportDataToJson, importDataFromJson, type Serializer, type Deserializer } from '../../utils/genericJsonIO';
import { deckService } from '../decks/deckService';
import { generateId, applyDefaultsIfMissing, createDefaultDeck } from '../../utils/dataUtils';

// --- インポートオプションの定義 ---

/** ID衝突時のDeckデータの処理方法 */
export type DeckIdConflictStrategy = 'RENAME' | 'SKIP';

/** インポート処理のオプション */
export interface DeckImportOptions {
    /** 既存のDeckIdとインポートデータのDeckIdが衝突した場合の戦略 */
    deckIdConflictStrategy: DeckIdConflictStrategy;
}

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
 * Deck ID配列を受け取り、Deckデータ配列を取得・シリアライズし、JSON文字列にエクスポートする。
 * @param deckIds - エクスポート対象のDeck ID配列
 * @returns JSON形式の文字列
 */
export const exportDecksToJson = async (deckIds: string[]): Promise<string> => {

    // 1. I/O層内でサービスを呼び出し、必要なデータを非同期で取得
    const fetchedDecks = await deckService.fetchDecksByIds(deckIds);

    // 2. nullを除去して、型を Deck[] に絞り込む
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
            deck.deckId = generateId();
            console.log(`[deckJsonIO] Deck ID collision for ${originalDeckId}. New ID assigned: ${deck.deckId}`);
        }

        // データのクリーンアップ/更新日設定
        // 1. 欠落フィールドの補完 (createdAtなどが含まれる)
        deck = applyDefaultsIfMissing(deck, defaultDeckData);

        // 2. updatedAt を最新に上書き
        deck.updatedAt = new Date().toISOString();

        // 3. Map型の初期化が欠落している場合に補完
        // (デシリアライザで復元されているはずだが、念のため安全性を高める)
        deck.mainDeck = deck.mainDeck || new Map();
        deck.sideDeck = deck.sideDeck || new Map();
        deck.extraDeck = deck.extraDeck || new Map();


        // 新しいIDをexistingIdsに追加し、以降のインポートデータとの衝突を避ける
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