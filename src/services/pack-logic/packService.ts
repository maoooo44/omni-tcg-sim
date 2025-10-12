/**
 * src/services/pack-logic/packService.ts
 * * * IndexedDB (Dexie) の 'packs' テーブルに対する CRUD 操作、
 * および関連するテーブル（cards, cardPool）のデータ削除操作を扱うサービス。
 * パックの作成、取得、更新、トランザクションによる削除、一括インポート機能を提供する。
 */
import { db } from "../database/db";
import type { Pack } from "../../models/pack";
// import { createDefaultPack } from "./packUtils"; // 💡 未使用だがインポートは維持

/**
 * IndexedDB (Dexie) の 'packs' テーブルに対する CRUD 操作を扱うサービス
 */
export const packService = {

    /**
     * パックを新規作成/更新し、IndexedDBに保存する (Upsert)。
     * Dexieの put() を使用し、IDの存在に応じて挿入/更新を自動で切り替える。
     * @param packData - 保存する Pack データ (UUIDを含む)
     * @returns 保存されたパックのID
     */
    async savePack(packData: Pack): Promise<string> { // ★ 追加: createPack の代わりに savePack を定義
        try {
            // Dexieの put() は、主キー(packId)が既存なら更新、なければ新規作成します。
            const id = await db.packs.put(packData); 
            console.log(`Pack saved/updated with ID: ${id}`);
            return id as string;
        } catch (error) {
            console.error("Failed to save pack:", error);
            throw new Error("パックの保存に失敗しました。");
        }
    },
    
    // 💡 修正: createPack を削除 (savePack に統合するため)

    /**
     * IDを指定して特定のパックを取得する。
     * @param packId - 取得したいパックのID
     * @returns Pack オブジェクト、または見つからなかった場合は null
     */
    async getPackById(packId: string): Promise<Pack | null> {
        try {
            const pack = await db.packs.get(packId);
            return pack ?? null;
        } catch (error) {
            console.error("Failed to get pack:", error);
            return null;
        }
    },

    /**
     * 特定のパックを更新する。
     * 💡 この updatePack は savePack で代替可能ですが、既存の呼び出し元がある場合は残します。
     * @param packId - 更新対象のパックID
     * @param updateData - 更新データ
     */
    async updatePack(packId: string, updateData: Partial<Pack>): Promise<void> {
        try {
            // update を使うと packId の指定が重複して不要な場合があるため、
            // store側で完全なPackを渡し、上記 savePack(put) を呼ぶ方がシンプルになりますが、
            // ここでは既存の定義を維持します。
            await db.packs.update(packId, updateData);
        } catch (error) {
            console.error("Failed to update pack:", error);
            throw new Error("パックの更新に失敗しました。");
        }
    },

    /**
     * パックとその関連データ (カード定義, カードプール内の資産) を全て削除する。
     * トランザクションを利用して原子性を保証する。
     * @param packId - 削除したいパックのID
     */
    async deletePack(packId: string): Promise<void> {
        if (!packId) {
            console.error("Cannot delete pack: packId is undefined.");
            return;
        }

        try {
            // トランザクションを開始し、packs, cards, cardPool の操作の原子性を保証
            await db.transaction('rw', db.packs, db.cards, db.cardPool, async () => {
                
                // 1. パック本体の削除
                await db.packs.delete(packId);

                // 2. そのパックに収録されているすべてのカード定義を削除 (cardsテーブル)
                await db.cards.where('packId').equals(packId).delete();

                // 3. そのパックから入手されたカードプール内の資産データを削除 (cardPoolテーブル)
                await db.cardPool.where('packId').equals(packId).delete(); 
            });
            console.log(`Pack (ID: ${packId}) and related data deleted successfully in transaction.`);
        } catch (error) {
            console.error("Failed to delete pack and related data in transaction:", error);
            throw new Error("パックとその関連データの削除に失敗しました。");
        }
    },

    /**
     * すべてのパックを取得する。
     * @returns すべての Pack オブジェクトの配列
     */
    async getAllPacks(): Promise<Pack[]> {
        try {
            return await db.packs.toArray();
        } catch (error) {
            console.error("Failed to get all packs:", error);
            return [];
        }
    },

    /**
     * 複数のパックを一括でインポートする (IDの重複はスキップ)。
     */
    async importPacks(packsToImport: Pack[]): Promise<{ importedCount: number, skippedIds: string[] }> {
        const existingPacks = await db.packs.toArray();
        const existingIds = new Set(existingPacks.map(p => p.packId));
        
        const newPacks: Pack[] = [];
        const skippedIds: string[] = [];

        // 1. 重複チェックと新規パックのフィルタリング
        packsToImport.forEach(pack => {
            // パックの必須フィールドチェック（IDと価格）
            if (!pack.packId || pack.price === undefined) {
                 console.warn("Skipping invalid pack data: Missing packId or price.");
                 return;
            }

            if (existingIds.has(pack.packId)) {
                skippedIds.push(pack.packId);
            } else {
                newPacks.push({
                    ...pack,
                    // インポートされたデータが isOpened を持たない場合を考慮し、デフォルトは false
                    isOpened: pack.isOpened ?? false, 
                });
            }
        });

        if (newPacks.length === 0) {
            return { importedCount: 0, skippedIds };
        }

        try {
            // 2. 新規パックを一括追加 (bulkAdd)
            await db.packs.bulkAdd(newPacks);
            console.log(`${newPacks.length} packs imported successfully.`);
            
            return { 
                importedCount: newPacks.length, 
                skippedIds 
            };
        } catch (error) {
            console.error("Failed to import packs:", error);
            throw new Error("パックデータの一括インポートに失敗しました。");
        }
    },
};