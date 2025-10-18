/**
 * src/services/data-io/zipIO.ts
 *
 * アプリケーションの全データ（パック、デッキ、ユーザー設定、カードプール）を
 * 収集し、ZIPファイルとしてエクスポート/インポートするサービスのオーケストレーター。
 * 各エンティティのJSON I/Oロジックは外部のJsonIOサービスに完全に委譲する。
 */

import JSZip from 'jszip';
import { packService } from '../packs/packService';
import { deckService } from '../decks/deckService';
// 型定義をインポート
import { useUserDataStore} from '../../stores/userDataStore'; 
import { type UserData } from '../../models/userData'; 
import { useCardPoolStore, type CardPoolState } from '../../stores/cardPoolStore'; 
import type { Deck } from '../../models/deck'; 

// 追加: 分離した各エンティティのI/Oサービスをインポート
import { exportPackToJson, importPackFromJson } from './packJsonIO';
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
        userData: UserData,
        cardPool: CardPoolState,
        metadata: Record<string, any>
    }> {
        const decks = await deckService.getAllDecksFromCache();
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
        const allPacks = await packService.getAllPacks();
        const packExportPromises = allPacks.map(async (pack) => {
            try {
                // packJsonIOにエクスポート処理を委譲 (PackとCardsを含むJSONを取得)
                const packJson = await exportPackToJson(pack.packId);
                zip.file(`packs/${pack.packId}.json`, packJson);
            } catch (error) {
                console.error(`Failed to export pack ${pack.packId}:`, error);
                // エクスポートに失敗したパックがあっても処理は継続
            }
        });

        await Promise.all(packExportPromises);

        // 2. その他のデータを JsonIO サービス経由でファイルに追加
        zip.file("decks/decks.json", exportDecksToJson(allData.decks));
        zip.file("user_data/userData.json", exportUserDataToJson(allData.userData));
        zip.file("user_data/cardPool.json", exportCardPoolToJson(allData.cardPool));
        zip.file("metadata.json", JSON.stringify(allData.metadata, null, 2));

        const zipBlob = await zip.generateAsync({ type: "blob" });
        return zipBlob;
    },

    /**
     * ZIPファイルからデータを読み込み、Map構造などに復元する
     */
    async importDataFromZip(zipFile: File): Promise<Record<string, any>> {
        const zip = new JSZip();
        await zip.loadAsync(zipFile);

        const loadedData: Record<string, any> = {};
        loadedData.packs = []; // PackExportData[] の配列として収集

        const filePromises: Promise<void>[] = [];

        // 1. Packs/Cards の個別ファイル読み込み (インポート時に再パースするため、ここではJSON文字列として取得し、オブジェクト化して配列に追加)
        zip.folder("packs")?.forEach((relativePath, file) => {
            if (file.dir || !relativePath.endsWith('.json')) return;
            filePromises.push(
                file.async("string").then(content => {
                    if (content) {
                        // JSONをパースし、PackExportDataオブジェクトとしてpacks配列に追加
                        loadedData.packs.push(JSON.parse(content));
                    }
                })
            );
        });
        
        // 2. その他のファイル読み込みと JsonIO によるデシリアライズ/復元
        const otherFilePromises = [
            // デッキ: JSON文字列を渡し、Map復元済みのDeck[]を取得
            zip.file("decks/decks.json")?.async("string").then(content => {
                if (content) loadedData.decks = importDecksFromJson(content); 
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
        let importedPackCount = 0;
        let totalImportedCardCount = 0;

        if (importedData.packs && importedData.packs.length > 0) {
            // PackExportData (Pack+Cards) オブジェクトの配列を処理
            const packImportPromises = importedData.packs.map(async (packExportData: any) => {
                try {
                    // packJsonIO.importPackFromJson はJSON文字列を期待するため、再変換
                    const jsonText = JSON.stringify(packExportData);
                    // packJsonIOにインポート処理を委譲し、DBへの新規登録とIDの再採番を行う
                    const result = await importPackFromJson(jsonText);
                    importedPackCount++;
                    totalImportedCardCount += result.importedCardCount;
                } catch (e) {
                    console.error(`Failed to import pack: ${packExportData?.pack?.name || 'Unknown Pack'}`, e);
                }
            });

            await Promise.all(packImportPromises);

            summary += `- パックと収録カード: ${importedPackCount}件のパックが再採番され、新規追加されました (${totalImportedCardCount}枚のカード)。\n`;
        } else {
            summary += "- パック: データがZIPに存在しませんでした。\n";
        }

        // 3. デッキデータの追加 (Deck[]として取得済み)
        if (importedData.decks && importedData.decks.length > 0) {
            // Map構造はJsonIOで復元済みなので、そのまま service に渡せる
            const result = await deckService.importDecks(importedData.decks as Deck[]);
            summary += `- デッキ: ${result.importedCount}件追加されました。`;
            if (result.renamedCount > 0) {
                summary += ` (${result.renamedCount}件のID衝突を自動リネーム。)\n`;
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