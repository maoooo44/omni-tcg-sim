/**
 * src/features/pack-management/hooks/useCardCsvIO.ts
 * * カードデータの一括インポート・エクスポート (CSV形式) を管理するカスタムフック。
 * CSVファイルのパース、予約語チェック、Cardオブジェクトへの変換、
 * およびストアへのインポート処理を提供する。
 */

import { useState, useCallback } from 'react';
import { useCardStore } from '../../../stores/cardStore';
import { usePackStore } from '../../../stores/packStore';
import type { Card } from '../../../models/card';
import { generateUUID } from '../../../utils/uuidUtils';
import { useShallow } from 'zustand/react/shallow';
import { parseCSV } from '../../../services/data-import-export/csvUtils'; 
import { getMaxNumberByCollection } from '../../../services/database/dbUtils'; // ★追加: 最大ナンバー取得
import { getNextNumber } from '../../../utils/numberingUtils'; // ★追加: 次のナンバー計算


// ユーザーが意図的に値を指定することを許容するフィールド (小文字で定義)
const FIXED_FIELDS_LOWER: string[] = ['name', 'rarity', 'imageurl', 'number'];

const SYSTEM_RESERVED_FIELDS: (keyof Card)[] = [
    'cardId',       // 固有ID
    'packId',       // パックID
    'userCustom',   // userCustomオブジェクト自体
];

// FIXED_FIELDS_LOWER 以外の予約語のみをチェック対象とする
const CHECK_RESERVED_FIELDS: string[] = SYSTEM_RESERVED_FIELDS
    .map(f => (f as string).toLowerCase())
    .filter(f => !FIXED_FIELDS_LOWER.includes(f));

// =========================================================================
// 💡 追加: パイプ区切り値を処理するヘルパー関数
// =========================================================================
/**
 * CSVの単一のセル値をパースし、パイプ(|)区切りの場合は配列に分割します。
 * @param value CSVセルから取得した文字列値。
 * @returns 分割された文字列の配列。値がない場合は空配列。
 */
const splitPipeSeparatedValue = (value: string | null | undefined): string[] => {
    if (typeof value !== 'string' || value.trim() === '') {
        return [];
    }
    // パイプで区切り、前後の空白をトリムし、空文字を除外
    return value.split('|').map(v => v.trim()).filter(v => v.length > 0);
};
// =========================================================================


/**
 * カードデータの一括インポート・エクスポート（CSV形式）を管理するカスタムフック
 * @param packId - 対象のパックID
 */
export const useCardCsvIO = (packId: string) => {
    const { importCards, exportCardsToCsv } = useCardStore(useShallow(state => ({
        importCards: state.importCards,
        exportCardsToCsv: state.exportCardsToCsv,
    })));
    
    // packsリストからではなく、usePackEditでパックがロードされていることを期待
    const currentPack = usePackStore(state => 
        state.packs.find(p => p.packId === packId) || state.packForEdit
    );
    const [isLoading, setIsLoading] = useState(false);
    const [statusMessage, setStatusMessage] = useState<string | null>(null);

    /**
     * CSVファイルをパースし、Cardオブジェクトの配列に変換してストアにインポートします。
     * @param file - ユーザーがアップロードした File オブジェクト
     */
    const handleImportCsvFile = useCallback((file: File) => {
        console.log(`[CSV Debug 01] Handler called. Pack ID: ${packId}`);
        
        if (!file || !currentPack) {
            console.error(`[CSV Debug E02] Validation failed. File: ${!!file}, Pack: ${!!currentPack}`);
            setStatusMessage("❌ エラー: ファイルまたはパック情報が無効です。");
            return;
        }

        setIsLoading(true);
        setStatusMessage("インポート処理を開始しています...");
        
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const fileText = e.target?.result as string;
                console.log(`[CSV Debug 03] File loaded. Text length: ${fileText.length}`);
                
                const { headers, data } = parseCSV(fileText);
                console.log(`[CSV Debug 04] CSV Parsed. Headers: ${headers.length}, Data Rows: ${data.length}`);

                if (headers.length === 0 || data.length === 0) {
                    setStatusMessage("⚠️ 警告: CSVファイルにデータが含まれていません。");
                    setIsLoading(false);
                    return;
                }

                // 予約語と固定フィールドのチェック (変更なし)
                for (const header of headers) {
                    const lowerCaseHeader = header.toLowerCase().trim();
                    if (!FIXED_FIELDS_LOWER.includes(lowerCaseHeader) && CHECK_RESERVED_FIELDS.includes(lowerCaseHeader)) {
                        throw new Error(`予約済みのシステムフィールド名 "${header}" はカスタムプロパティとして使用できません。`);
                    }
                }
                console.log(`[CSV Debug 05] Reserved field check passed.`);

                // 1. デフォルト値の決定
                const defaultRarity = currentPack.rarityConfig[0]?.rarityName || 'Common';
                const availableRarities = currentPack.rarityConfig.map(r => r.rarityName); // 有効なレアリティリスト
                console.log(`[CSV Debug 06] Default Rarity: ${defaultRarity}, Available: ${availableRarities.join(', ')}`);

                // 2. ヘッダーを分類し、インデックスを保持
                const fixedHeaderIndices: { [key: string]: number } = {};
                const customHeaderIndices: { header: string, index: number }[] = [];
                
                headers.forEach((header, index) => {
                    const lowerCaseHeader = header.toLowerCase().trim();
                    
                    if (FIXED_FIELDS_LOWER.includes(lowerCaseHeader)) {
                        if (lowerCaseHeader === 'imageurl') {
                            fixedHeaderIndices['imageUrl'] = index;
                        } else {
                            fixedHeaderIndices[lowerCaseHeader] = index; 
                        }
                    } else if (header.trim() !== '') { 
                        customHeaderIndices.push({ header: header.trim(), index });
                    }
                });
                console.log(`[CSV Debug 07] Fixed Headers: ${JSON.stringify(Object.keys(fixedHeaderIndices))}, Custom Count: ${customHeaderIndices.length}`);
                
                // 3. データ行をCardオブジェクトに変換 (すべて新規カードとして扱う)
                const cardsToImport: Card[] = [];
                let cardNameCounter = 1;
                
                // 💡 number 採番のために既存の最大番号を取得
                let maxNumber: number | null = await getMaxNumberByCollection('cards', 'number'); 
                let nextNumberToAssign: number | null = getNextNumber(maxNumber, 1);
                console.log(`[CSV Debug 08] Initial Max Number: ${maxNumber}, Next Number: ${nextNumberToAssign}`);
                
                // 💡 例外報告のためのカウンター
                let numberAssignedCount = 0;
                let rarityFixedCount = 0;
                let pipeSplitCardCount = 0;

                for (const row of data) {
                    if (row.length !== headers.length) {
                        console.warn(`[CSV Debug W09] Skipping row due to column count mismatch: ${row.join(',')}`);
                        continue; 
                    }
                    
                    const nameIndex = fixedHeaderIndices['name'];
                    const rarityIndex = fixedHeaderIndices['rarity'];
                    const imageUrlIndex = fixedHeaderIndices['imageUrl'];
                    const numberIndex = fixedHeaderIndices['number']; 

                    // --- 修正: パイプ区切りを適用 ---
                    const rawCardName = nameIndex !== undefined ? row[nameIndex] : '';
                    const rawRarity = rarityIndex !== undefined ? row[rarityIndex] : '';
                    
                    // パイプ区切りを処理
                    const cardNames = splitPipeSeparatedValue(rawCardName);
                    const cardRarities = splitPipeSeparatedValue(rawRarity);
                    
                    // CSVの行が空でなければ、最低一つは名前が存在することを保証
                    if (cardNames.length === 0) {
                         cardNames.push(`新しいカード_${cardNameCounter++}`);
                    }
                    // --- 修正終わり ---
                    
                    const cardImageUrl = (imageUrlIndex !== undefined && row[imageUrlIndex]) 
                        ? row[imageUrlIndex] 
                        : '';
                    
                    // number の値をパース (単一値のみを想定)
                    let baseCardNumber: number | null = null;
                    if (numberIndex !== undefined && row[numberIndex]) {
                        const rawNumber = row[numberIndex];
                        const parsedNumber = parseInt(rawNumber, 10);
                        if (!isNaN(parsedNumber)) {
                            baseCardNumber = parsedNumber;
                        } else {
                            // number列はあるが値が無効な場合は null
                            console.warn(`[CSV Debug W10] Invalid number: ${rawNumber}. Card: ${cardNames[0]}`);
                        }
                    }

                    // 💡 パイプ分割された組み合わせを処理
                    const cardCountInRow = Math.max(cardNames.length, cardRarities.length, 1); 
                    if (cardCountInRow > 1) {
                        pipeSplitCardCount += cardCountInRow;
                    }

                    for (let i = 0; i < cardCountInRow; i++) {
                        
                        const finalCardName = cardNames[i] || cardNames[0] || `新しいカード_${cardNameCounter++}`;
                        
                        const rawFinalRarity = cardRarities[i] || cardRarities[0] || '';
                        let finalRarity = rawFinalRarity;

                        // 💡 レアリティの自動割り当て
                        let isRarityFixed = false;
                        if (!rawFinalRarity || !availableRarities.includes(rawFinalRarity)) {
                            finalRarity = defaultRarity;
                            isRarityFixed = true;
                            rarityFixedCount++; // 報告用
                        }
                        
                        // 💡 numberの自動採番
                        let finalCardNumber: number | null = baseCardNumber;
                        let isNumberAssigned = false;
                        
                        if (finalCardNumber === null || finalCardNumber === undefined) {
                             if (nextNumberToAssign !== null) {
                                finalCardNumber = nextNumberToAssign;
                                nextNumberToAssign += 1; // 次のためにインクリメント
                                isNumberAssigned = true; // 報告用
                                numberAssignedCount++; // 報告用
                            }
                        } else {
                            // 明示的に number が指定されていた場合は、次の自動採番番号を上書きしないようにインクリメント
                            if (nextNumberToAssign !== null && finalCardNumber >= nextNumberToAssign) {
                                nextNumberToAssign = finalCardNumber + 1;
                            }
                        }

                        console.log(`[CSV Debug 11] Card Processed: ${finalCardName}, Rarity: ${finalRarity} (Fixed: ${isRarityFixed}), Number: ${finalCardNumber} (Assigned: ${isNumberAssigned})`);

                        // Cardオブジェクトの基本部分を構築
                        const newCard: Card = {
                            cardId: generateUUID(), 
                            packId: packId,
                            name: finalCardName,
                            rarity: finalRarity,
                            imageUrl: cardImageUrl,
                            userCustom: {}, 
                            isInStore: false,
                            updatedAt: '',
                            number: finalCardNumber,
                        }; 

                        // 4. カスタムプロパティをマッピング (パイプ区切りはここでは未適用)
                        customHeaderIndices.forEach(({ header, index }) => {
                            const value = row[index];
                            if (value) {
                                newCard.userCustom[header] = value;
                            }
                        });

                        cardsToImport.push(newCard);
                    }
                }
                
                console.log(`[CSV Debug 12] Total cards ready for import: ${cardsToImport.length}`);

                // 5. ストアに一括インポートを依頼
                if (cardsToImport.length > 0) {
                    const result = await importCards(cardsToImport); 
                    
                    // 💡 修正: インポート完了メッセージに例外処理情報を追加
                    let successMessage = `✅ ${result.importedCount}枚のカードを正常にインポートしました。`;
                    
                    const exceptionMessages: string[] = [];
                    if (pipeSplitCardCount > 0) {
                        exceptionMessages.push(`CSVのパイプ(|)区切りにより、${pipeSplitCardCount}枚のカードが1行から複数生成されました。`);
                    }
                    if (numberAssignedCount > 0) {
                        exceptionMessages.push(`numberが未指定の${numberAssignedCount}枚のカードに自動で採番しました。`);
                    }
                    if (rarityFixedCount > 0) {
                        exceptionMessages.push(`レアリティが不適切/未指定の${rarityFixedCount}枚のカードにデフォルトレアリティを割り当てました。`);
                    }

                    if (exceptionMessages.length > 0) {
                        successMessage += `\n(⚠️ 例外処理: ${exceptionMessages.length}件)`;
                        setStatusMessage(successMessage + '\n' + exceptionMessages.join('\n'));
                    } else {
                         setStatusMessage(successMessage);
                    }
                    
                    console.log(`[CSV Debug 13] Import successful. Imported count: ${result.importedCount}`);
                } else {
                    setStatusMessage("⚠️ 警告: 有効なカードデータ行が見つかりませんでした。");
                    console.warn("[CSV Debug W14] No valid cards to import.");
                }
            } catch (error) {
                console.error('[CSV Debug E15] Fatal Import Error:', error);
                setStatusMessage(`❌ インポート中に致命的なエラーが発生しました: ${error instanceof Error ? error.message : '不明なエラー'}`);
            } finally {
                setIsLoading(false);
                console.log("[CSV Debug 16] Import process finished.");
            }
        };

        reader.onerror = () => {
            setIsLoading(false);
            console.error('[CSV Debug E17] File read error.');
            setStatusMessage('❌ ファイルの読み込み中にエラーが発生しました。');
        };

        reader.readAsText(file);
    }, [packId, currentPack, importCards]); // importCards を依存配列に追加

    
    // --- 💡 修正: handleExportCards の定義をここに移動 ---
    
    const handleExportCards = useCallback(async () => {
        setIsLoading(true);
        setStatusMessage(null);

        try {
            const csvData = await exportCardsToCsv(packId);
            
            if (!csvData) {
                setStatusMessage('⚠️ エクスポート対象のカードがありません。');
                setIsLoading(false);
                return;
            }

            // ダウンロード処理 
            const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.setAttribute('href', url);
            link.setAttribute('download', `${packId}_cards_export.csv`); 
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            setStatusMessage('✅ カードデータのエクスポートが完了しました。');
            
        } catch (error) {
            const message = error instanceof Error ? error.message : "未知のエラー";
            setStatusMessage(`❌ エクスポート失敗: ${message}`);
        } finally {
            setIsLoading(false);
        }
    }, [packId, exportCardsToCsv]);

    // --- 修正終わり ---

    return {
        isLoading,
        statusMessage,
        handleImportCsvFile,
        handleExportCards,
        setStatusMessage,
    };
};