/**
 * src/services/data-io/zipIO.ts
 *
 * * アプリケーションの全データ（パック、デッキ、ユーザー設定、カードプール）のZIP入出力オーケストレーションモジュール。
 * * 責務:
 * 1. エクスポート時: ドメインサービスから全ての生データを収集し、各エンティティのJsonIOサービスにJSON文字列への変換を委譲し、ZIPファイル構造（packs/packId.json, decks/decks.json, user_data/*）を構築・生成する。
 * 2. インポート時: ZIPファイルから各エンティティのJSON文字列を抽出し、エンティティごとにJsonIOサービスに処理（デシリアライズ、衝突解決、永続化）を委譲する。
 * 3. データの収集、ファイルの読み書き、および各JsonIOサービスへの処理委譲のフロー全体を制御し、結果の概要を返す。
 */

import JSZip from 'jszip';
import { packService } from '../packs/packService';
import { deckService } from '../decks/deckService';
// 型定義をインポート
import { useUserDataStore } from '../../stores/userDataStore';
import type { UserDataState } from '../../models/userData';
import { useCardPoolStore, type CardPoolState } from '../../stores/cardPoolStore';
import type { Deck } from '../../models/deck';
import type { Pack } from '../../models/pack';

// 分離した各エンティティのI/Oサービスをインポート
import { exportPacksToJson, importPacksFromJson } from './packJsonIO';
import { exportDecksToJson, importDecksFromJson } from './deckJsonIO';
import { exportCardPoolToJson, importCardPoolFromJson } from './cardPoolJsonIO';
import { exportUserDataToJson, importUserDataFromJson } from './userDataJsonIO';


/**
 * データのコレクションとZIPファイルの生成、およびインポート後の統合を担うサービス
 */
export const zipIO = {

    /**
     * 各サービスのデータを生のデータ構造（Map含む）のまま収集する
     */
    async collectAllData(): Promise<{
        decks: Deck[],
        userData: UserDataState,
        cardPool: CardPoolState,
        metadata: Record<string, any>
    }> {
        await deckService.fetchAllDecks(); // キャッシュを最新化
        const decks = deckService.getAllDecksFromCache();
        const userDataState = useUserDataStore.getState();
        const cardPoolState = useCardPoolStore.getState();

        return {
            decks: decks,
            userData: userDataState,
            cardPool: cardPoolState,
            metadata: {
                exportedAt: new Date().toISOString(),
                version: "1.0.0"
            },
        };
    },

    /**
     * データを収集し、ZIPファイルを生成する
     */
    async exportDataToZip(): Promise<Blob> {
        // rawなデータ構造を収集
        const allData = await this.collectAllData();
        const zip = new JSZip();

        // 1. パックデータの個別エクスポートを packJsonIO に委譲
        await packService.fetchAllPacks();
        const allPacks = packService.getAllPacksFromCache();
        const packExportPromises = allPacks.map(async (pack: Pack) => {
            try {
                // packJsonIOにエクスポート処理を委譲 (PackとCardsを含むJSONを取得)
                const packJson = await exportPacksToJson([pack.packId]);
                zip.file(`packs/${pack.packId}.json`, packJson);
            } catch (error) {
                console.error(`Failed to export pack ${pack.packId}:`, error);
                // エクスポートに失敗したパックがあっても処理は継続
            }
        });

        await Promise.all(packExportPromises);

        // 2. その他のデータを JsonIO サービス経由でファイルに追加
        const deckIds = allData.decks.map(d => d.deckId);
        // exportDecksToJson は Deck ID配列 (string[]) を引数に取る
        const decksJson = await exportDecksToJson(deckIds);
        zip.file("decks/decks.json", decksJson);

        zip.file("user_data/userData.json", exportUserDataToJson(allData.userData));
        zip.file("user_data/cardPool.json", exportCardPoolToJson(allData.cardPool));
        zip.file("metadata.json", JSON.stringify(allData.metadata, null, 2));

        const zipBlob = await zip.generateAsync({ type: "blob" });
        return zipBlob;
    },

    /**
     * ZIPファイルからデータを読み込み、インポートロジックに渡すために必要な形式（JSON文字列またはMap復元済みデータ）にパースする
     */
    async importDataFromZip(zipFile: File): Promise<Record<string, any>> {
        const zip = new JSZip();
        await zip.loadAsync(zipFile);

        const loadedData: Record<string, any> = {};
        // packs の JSON文字列の配列として保持
        loadedData.packJsons = [];
        loadedData.decksJson = null; // DeckのJSON文字列を保持

        const filePromises: Promise<void>[] = [];

        // 1. Packs/Cards の個別ファイル読み込み (JSON文字列として取得し、配列に追加)
        zip.folder("packs")?.forEach((relativePath, file) => {
            if (file.dir || !relativePath.endsWith('.json')) return;
            filePromises.push(
                file.async("string").then(content => {
                    if (content) {
                        loadedData.packJsons.push(content); // JSON文字列をそのまま保存
                    }
                })
            );
        });

        // 2. その他のファイル読み込みと JsonIO によるデシリアライズ/復元
        const otherFilePromises = [
            // デッキ: JSON文字列を取得し、そのまま保存 (インポート時の衝突解決ロジックに渡すため)
            zip.file("decks/decks.json")?.async("string").then(content => {
                if (content) loadedData.decksJson = content;
            }),
            // ユーザーデータ: JSON文字列を渡し、UserDataStateを取得
            zip.file("user_data/userData.json")?.async("string").then(content => {
                if (content) loadedData.userData = importUserDataFromJson(content);
            }),
            // カードプール: JSON文字列を渡し、Map復元済みのCardPoolStateを取得
            zip.file("user_data/cardPool.json")?.async("string").then(content => {
                if (content) loadedData.cardPool = importCardPoolFromJson(content);
            }),
        ];

        await Promise.all([...filePromises, ...otherFilePromises]);

        return loadedData;
    },

    // --------------------------------------------------
    // データ統合 (オーケストレーション) ロジック
    // --------------------------------------------------

    /**
     * 解析済みのインポートデータを受け取り、各サービス/ストアに書き込む。
     */
    async integrateImportedData(importedData: Record<string, any>): Promise<string> {
        let summary = "ZIPインポート結果:\n";

        // 1. ユーザーデータ (UserDataStateとして取得済み) の上書き
        if (importedData.userData) {
            useUserDataStore.getState().importUserData(importedData.userData);
            summary += "- ユーザーデータ: 上書き完了。\n";
        } else {
            summary += "- ユーザーデータ: データがZIPに存在しませんでした。\n";
        }

        // 2. パックデータの追加 (衝突回避) - packJsonIOに委譲
        if (importedData.packJsons && importedData.packJsons.length > 0) {

            let totalNewPacks = 0;
            let totalSkippedPacks = 0;

            // JSON文字列（各パックファイルの内容）を一つずつインポートロジックに渡す
            for (const packJsonText of importedData.packJsons) {
                try {
                    // packJsonIO.importPacksFromJson はJSON文字列を期待
                    const result = await importPacksFromJson(packJsonText);
                    totalNewPacks += result.newPackIds.length;
                    totalSkippedPacks += result.skippedIds.length;
                } catch (e) {
                    console.error(`Failed to import pack:`, e);
                }
            }

            summary += `- パックと収録カード: ${totalNewPacks}件のパックが新規追加されました (スキップ: ${totalSkippedPacks}件)。\n`;
        } else {
            summary += "- パック: データがZIPに存在しませんでした。\n";
        }

        // 3. デッキデータの追加 (JSON文字列として取得済み) - deckJsonIOに委譲
        if (importedData.decksJson) {
            // deckJsonIO.importDecksFromJson に JSON文字列を渡す
            const result = await importDecksFromJson(importedData.decksJson);

            summary += `- デッキ: ${result.newDeckIds.length}件追加されました。`;
            if (result.skippedIds.length > 0) {
                summary += ` (${result.skippedIds.length}件がスキップされました。)\n`;
            } else {
                summary += "\n";
            }
        } else {
            summary += "- デッキ: データがZIPに存在しませんでした。\n";
        }

        // 4. カードプール (CardPoolStateとして取得済み) の全体上書き
        if (importedData.cardPool && importedData.cardPool.ownedCards instanceof Map) {
            // Map構造はJsonIOで復元済みなので、そのまま Map を service に渡す
            await useCardPoolStore.getState().importCardPool(importedData.cardPool.ownedCards);
            summary += `- カードプール: ${importedData.cardPool.ownedCards.size}種類のカードで完全に上書きされました。\n`;
        } else {
            summary += "- カードプール: データがZIPに存在しませんでした。\n";
        }

        return summary;
    },

    /**
     * 統合されたエクスポート/インポートフローの公開関数
     */
    exportData: async () => {
        return zipIO.exportDataToZip();
    },

    importData: async (zipFile: File) => {
        const loadedData = await zipIO.importDataFromZip(zipFile);
        const resultSummary = await zipIO.integrateImportedData(loadedData);
        return resultSummary;
    }
};