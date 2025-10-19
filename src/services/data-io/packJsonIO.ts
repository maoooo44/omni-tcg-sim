/**
 * src/services/data-io/packJsonIO.ts
 *
 * 単一/複数のPackとその収録カード（関連データ）をまとめてJSON形式でシリアライズ/デシリアライズするドメインI/Oサービス。
 * JSONI/Oだけでなく、インポート時のID衝突解決とデータ初期化ロジックも担う。
 */

import { packService } from '../packs/packService';
import { cardService } from '../cards/cardService';
// 💡 修正点: generateId と dataUtils の補完関数をインポート
import { generateId, createDefaultPack, applyDefaultsIfMissing } from '../../utils/dataUtils'; 
import type { Pack, PackBundle } from '../../models/pack'; // 💡 修正点: PackBundleをインポート
import type { Card } from '../../models/card';
// 💡 修正点: シリアライザ/デシリアライザを使用しないため、Serializer, Deserializerの型は不要
import { exportDataToJson, importDataFromJson } from '../../utils/genericJsonIO'; 

// --- 💡 修正点: ローカルの型定義 PackData, PacksExportData を削除し、PackBundle を使用する ---
// PackBundle は { packData: Pack, cardsData: Card[] } を想定

// ----------------------------------------------------
// 💡 追加: インポートオプションの定義 (変更なし)
// ----------------------------------------------------

/** ID衝突時のPackデータの処理方法 */
export type PackIdConflictStrategy = 'RENAME' | 'SKIP';

/** インポート処理のオプション */
export interface PackImportOptions {
    /** 既存のPackIdとインポートデータのPackIdが衝突した場合の戦略 */
    packIdConflictStrategy: PackIdConflictStrategy;
}

// ----------------------------------------------------
// [1] Export (エクスポート)
// ----------------------------------------------------

/**
 * 💡 [個別エクスポート] 単一パックとその収録カードをJSON形式でエクスポートする
 * 複数エクスポート関数を呼び出すラッパー。（維持）
 * @param packId - エクスポート対象のパックID
 * @returns JSON形式の文字列
 */
export const exportPackToJson = async (packId: string): Promise<string> => {
    return exportPacksToJson([packId]);
};


/**
 * 💡 [一括エクスポート] 複数パックとその収録カードを一括でJSON形式でエクスポートする
 * @param packIds - エクスポート対象のパックIDの配列
 * @returns JSON形式の文字列
 */
export const exportPacksToJson = async (packIds: string[]): Promise<string> => {
    // 💡 修正点: PackBundle[] を使用
    const exportItems: PackBundle[] = [];
    
    for (const packId of packIds) {
        // fetchPacksByIds は Pack[] を返す可能性があるため、[0]を取得（パックIDがユニークであることを前提）
        const packs = await packService.fetchPacksByIds([packId]);
        const pack = packs[0];
        
        if (!pack) {
            console.warn(`[packJsonIO] Pack ID ${packId} not found. Skipping export.`);
            continue;
        }
        
        // 関連するカードデータをすべて取得
        const cards = await cardService.fetchCardsByPackIds([packId]);

        exportItems.push({
            packData: pack, // 💡 修正点: packDataに変更
            cardsData: cards // 💡 修正点: cardsDataに変更
        });
    }

    if (exportItems.length === 0) {
        throw new Error('エクスポート対象のパックデータが見つかりませんでした。');
    }
    
    // 💡 修正点: PackBundle[] を直接エクスポート（最上位の exports フィールドを削除）
    return exportDataToJson(exportItems); 
};

// ----------------------------------------------------
// [2] Import (インポート)
// ----------------------------------------------------

// 💡 修正点: importPackFromJson の削除 (単一インポート関数の廃止)


/**
 * 💡 [一括インポート] JSON文字列から複数パックとその収録カードを一括でインポートし、DBに新規登録する
 * Pack IDが既存データと衝突した場合の挙動はオプションによって制御されます。
 * @param jsonText - インポートするJSON文字列
 * @param options - インポートオプション (オプション)
 * @returns 新規作成されたパックのIDの配列と、スキップされたIDの配列
 */
export const importPacksFromJson = async (
    jsonText: string, 
    options?: PackImportOptions
): Promise<{ newPackIds: string[], skippedIds: string[] }> => {
    console.log("[packJsonIO:importPacksFromJson] START bulk import.");
    
    // 💡 修正点: PackBundle[] を直接パースする
    const bundlesToImport = importDataFromJson<PackBundle[]>(jsonText); 
    
    if (!Array.isArray(bundlesToImport)) {
        throw new Error('JSONの形式が正しくありません。PackBundleの配列である必要があります。');
    }
    
    // 💡 既存の Pack ID を取得
    await packService.fetchAllPacks();
    const existingPacks = packService.getAllPacksFromCache();
    // Setはインポート中のID衝突チェックにも使うため、インポートで新しく割り当てられたIDも追加していく
    const existingPackIds = new Set(existingPacks.map(p => p.packId));
    
    const packsToSave: Pack[] = [];
    const cardsToSave: Card[] = [];
    const newPackIds: string[] = [];
    const skippedIds: string[] = []; 
    
    // オプションが渡されなかった場合のデフォルト戦略を 'SKIP' に設定
    const packIdConflictStrategy: PackIdConflictStrategy = options?.packIdConflictStrategy || 'SKIP';

    for (const exportedItem of bundlesToImport) { // 💡 修正: bundlesToImport をループ
        if (!exportedItem.packData || !exportedItem.cardsData) { // 💡 修正: packData, cardsData にアクセス
            console.warn('[packJsonIO] Skipping malformed item in imports array.');
            // 💡 スキップ対象のIDは不明だが、データが不完全なため処理を継続
            continue;
        }

        let currentPackId = exportedItem.packData.packId;
        
        // ID衝突時の挙動をオプションで制御
        if (existingPackIds.has(currentPackId)) {
            
            if (packIdConflictStrategy === 'SKIP') {
                // SKIP戦略: IDが衝突したら、そのパック全体をスキップ
                skippedIds.push(currentPackId);
                console.log(`[packJsonIO] Pack ID ${currentPackId} skipped due to conflict.`);
                continue; // このパックの処理を終了し、次のループへ
            }
            
            // 'RENAME' (新しいIDを割り当てる) 戦略の場合
            currentPackId = generateId(); // 💡 修正: uuidv4ではなくgenerateIdを使用
            // 💡 新しいIDも existingPackIds に追加し、以降のインポートデータとの衝突を避ける
            existingPackIds.add(currentPackId); 
            console.log(`[packJsonIO] Pack ID collision. New ID assigned: ${currentPackId}`);
        }
        
        // 1. Packデータを準備 (IDと関連情報を更新)
        // 💡 修正点: 欠落フィールドの補完ロジックを適用
        const defaultPack = createDefaultPack();
        
        let newPack: Pack = applyDefaultsIfMissing(
            { // 適用時に packId, totalCards, isOpened, updatedAt を優先的に更新
                ...exportedItem.packData,
                packId: currentPackId,  
                isOpened: false,       
                totalCards: exportedItem.cardsData.length,
                updatedAt: new Date().toISOString(),
                // createdAt が欠落している場合にのみデフォルト値が適用される
            },
            defaultPack
        );
        
        // データの整合性チェックを強化: createdAt の欠落時の補完（applyDefaultsIfMissingで処理されるはずだが念のため）
        if (!newPack.createdAt) {
             newPack.createdAt = new Date().toISOString();
        }
        
        packsToSave.push(newPack);
        newPackIds.push(currentPackId);
        
        // 2. Cardデータを準備 (Pack IDを新しいものに、Card IDはインポートデータのIDを維持)
        const newCards: Card[] = exportedItem.cardsData.map(card => ({ // 💡 修正: cardsData にアクセス
            ...card,
            // cardId はインポートデータを維持
            packId: currentPackId,  // 新しいPack IDを適用
        }));

        cardsToSave.push(...newCards);
    }
    
    const importedCount = packsToSave.length; 
    
    if (importedCount === 0 && skippedIds.length === 0) {
        return { newPackIds: [], skippedIds: [] };
    }

    // 3. DBへの保存
    await packService.savePacks(packsToSave);
    
    // 4. Cardの一括保存
    await cardService.saveCards(cardsToSave);

    console.log(`[packJsonIO:importPacksFromJson] ✅ Bulk import complete. Imported ${importedCount} packs. Skipped ${skippedIds.length} packs. Total cards saved: ${cardsToSave.length}`);

    return { 
        newPackIds,
        skippedIds,
    };
};