/**
 * src/features/packs/hooks/useCardCsvIO.ts
 *
 * カードデータの一括インポート・エクスポート (CSV形式) を管理するカスタムフック。
 * CSVファイルのパース、予約語チェック、Cardオブジェクトへの変換ロジック、
 * およびストアへのインポート・エクスポート処理のトリガーを提供する。
 *
 * 責務は主に、ファイル操作、CSVパース、および**ストアが処理できる形式へのデータマッピング**に限定される。
 * データベースアクセス、採番、永続化のロジックは、全て CardStore/CardService に委譲する。
 */

import { useState, useCallback } from 'react';
import { useCardStore } from '../../../stores/cardStore';
import { usePackStore } from '../../../stores/packStore';
import type { Card } from '../../../models/card';
import { generateId, createDefaultCard } from '../../../utils/dataUtils'; // 💡 修正: createDefaultCard をインポート
import { useShallow } from 'zustand/react/shallow';
import { parseCSV } from '../../../utils/csvParser'; 
// 修正: 不要なインポートを削除 (採番ロジックを Store に戻すため)
// import { getNextNumber } from '../../../utils/numberingUtils';
// import { getMaxNumberByCollection } from '../../../services/database/dbUtils';


// ユーザーが意図的に値を指定することを許容する固定フィールド (小文字で定義)
const FIXED_FIELDS_LOWER: string[] = ['name', 'rarity', 'imageurl', 'number'];

const SYSTEM_RESERVED_FIELDS: (keyof Card)[] = [
    'cardId',       // 固有ID
    'packId',       // パックID
    'userCustom',   // userCustomオブジェクト自体
    'isInStore',    // 予約語として明示
    'updatedAt',    // 予約語として明示
    'createdAt',    // 予約語として明示
];

// FIXED_FIELDS_LOWER 以外の予約語のみをチェック対象とする
const CHECK_RESERVED_FIELDS: string[] = SYSTEM_RESERVED_FIELDS
    .map(f => (f as string).toLowerCase())
    .filter(f => !FIXED_FIELDS_LOWER.includes(f));

// =========================================================================
// パイプ区切り値を処理するヘルパー関数
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
 * @param onCardListUpdated - インポート成功時に実行するカードリスト更新コールバック
 */
export const useCardCsvIO = (packId: string, onCardListUpdated: () => Promise<void>) => { 
    // setStatusMessage はカスタムフックのセッターであり、依存配列に含める必要はないため、残さない
    const { importCards, exportCardsToCsv } = useCardStore(useShallow(state => ({
        importCards: state.importCards, // isInStore: false の状態で DB 永続化と Store キャッシュ追加を行う
        exportCardsToCsv: state.exportCardsToCsv,
    })));
    
    // packsリストからではなく、usePackEditorでパックがロードされていることを期待
    const currentPack = usePackStore(state => 
        state.packs.find(p => p.packId === packId) || state.editingPack
    );
    const [isLoading, setIsLoading] = useState(false);
    const [statusMessage, setStatusMessage] = useState<string | null>(null);

    /**
     * CSVファイルをパースし、Cardオブジェクトの配列に変換してストアにインポートします。
     * @param file - ユーザーがアップロードした File オブジェクト
     */
    const handleConfirmImport = useCallback(async (file: File) => { 
        
        if (!file || !currentPack) {
            setStatusMessage("❌ エラー: ファイルまたはパック情報が無効です。");
            return;
        }

        setIsLoading(true);
        setStatusMessage("インポート処理を開始しています...");
        
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const fileText = e.target?.result as string;
                
                const { headers, data } = parseCSV(fileText);

                if (headers.length === 0 || data.length === 0) {
                    setStatusMessage("⚠️ 警告: CSVファイルにデータが含まれていません。");
                    setIsLoading(false);
                    return;
                }

                // 予約語と固定フィールドのチェック
                for (const header of headers) {
                    const lowerCaseHeader = header.toLowerCase().trim();
                    if (!FIXED_FIELDS_LOWER.includes(lowerCaseHeader) && CHECK_RESERVED_FIELDS.includes(lowerCaseHeader)) {
                        throw new Error(`予約済みのシステムフィールド名 "${header}" はカスタムプロパティとして使用できません。`);
                    }
                }

                // 1. デフォルト値の決定
                const defaultRarity = currentPack.rarityConfig[0]?.rarityName || 'Common';
                const availableRarities = currentPack.rarityConfig.map(r => r.rarityName);

                // 2. ヘッダーを分類し、インデックスを保持
                const fixedHeaderIndices: { [key: string]: number } = {};
                const customHeaderIndices: { header: string, index: number }[] = [];
                
                headers.forEach((header, index) => {
                    const lowerCaseHeader = header.toLowerCase().trim();
                    
                    if (FIXED_FIELDS_LOWER.includes(lowerCaseHeader)) {
                        // imageUrl はキャメルケースに修正
                        const fieldName = lowerCaseHeader === 'imageurl' ? 'imageUrl' : lowerCaseHeader;
                        fixedHeaderIndices[fieldName] = index;
                    } else if (header.trim() !== '') { 
                        // 固定フィールドでも予約語でもないものはカスタムプロパティとして処理
                        customHeaderIndices.push({ header: header.trim(), index });
                    }
                });
                
                // 3. データ行をCardオブジェクトに変換
                const cardsToImport: Card[] = [];
                let cardNameCounter = 1;
                
                let rarityFixedCount = 0;
                let pipeSplitCardCount = 0;

                for (const row of data) {
                    // column count mismatch のチェック
                    if (row.length !== headers.length) {
                        console.warn(`Skipping row due to column count mismatch: ${row.join(',')}`);
                        continue; 
                    }
                    
                    // --- パイプ区切りを適用 ---
                    const nameIndex = fixedHeaderIndices['name'];
                    const rarityIndex = fixedHeaderIndices['rarity'];
                    const imageUrlIndex = fixedHeaderIndices['imageUrl'];
                    const numberIndex = fixedHeaderIndices['number']; 

                    const rawCardName = nameIndex !== undefined ? row[nameIndex] : '';
                    const rawRarity = rarityIndex !== undefined ? row[rarityIndex] : '';
                    
                    // パイプ区切りを処理
                    const cardNames = splitPipeSeparatedValue(rawCardName);
                    const cardRarities = splitPipeSeparatedValue(rawRarity);
                    
                    // CSVの行が空でなければ、最低一つは名前が存在することを保証
                    if (cardNames.length === 0) {
                        cardNames.push(`新しいカード_${cardNameCounter++}`);
                    }
                    
                    const cardImageUrl = (imageUrlIndex !== undefined && row[imageUrlIndex]) 
                        ? row[imageUrlIndex] 
                        : '';
                    
                    // number の値をパース (単一値のみを想定)
                    let baseCardNumber: number | undefined = undefined;
                    if (numberIndex !== undefined && row[numberIndex]) {
                        const rawNumber = row[numberIndex];
                        const parsedNumber = parseInt(rawNumber, 10);
                        if (!isNaN(parsedNumber)) {
                            baseCardNumber = parsedNumber;
                        }
                    }

                    // パイプ分割された組み合わせを処理
                    const cardCountInRow = Math.max(cardNames.length, cardRarities.length, 1); 
                    if (cardCountInRow > 1) {
                        pipeSplitCardCount += cardCountInRow;
                    }

                    for (let i = 0; i < cardCountInRow; i++) {
                        
                        // 最終的な名前を決定
                        const finalCardName = cardNames[i] || cardNames[0] || `新しいカード_${cardNameCounter++}`;
                        
                        // 最終的なレアリティを決定
                        const rawFinalRarity = cardRarities[i] || cardRarities[0] || '';
                        let finalRarity = rawFinalRarity;

                        // レアリティの自動割り当て
                        if (!rawFinalRarity || !availableRarities.includes(rawFinalRarity)) {
                            finalRarity = defaultRarity;
                            rarityFixedCount++; 
                        }
                        
                        // number はインポート値、または undefined を渡し、サービス側で採番させる
                        const finalCardNumber: number | undefined = baseCardNumber;
                        
                        // 💡 修正: createDefaultCardで基本部分を構築し、CSV値を上書きする
                        let newCard: Card = createDefaultCard(packId);

                        // CSVで上書き/ロジックを優先するフィールド
                        newCard.cardId = generateId(); // 新しいIDを必ず生成し直す
                        newCard.name = finalCardName;
                        newCard.rarity = finalRarity;
                        newCard.imageUrl = cardImageUrl;
                        newCard.number = finalCardNumber; 
                        newCard.isInStore = false; // CSVインポート時は false 固定
                        newCard.updatedAt = new Date().toISOString(); 
                        newCard.createdAt = newCard.createdAt || newCard.updatedAt; // デフォルトが未設定の場合に設定

                        // 4. カスタムプロパティをマッピング (パイプ区切りは未適用)
                        customHeaderIndices.forEach(({ header, index }) => {
                            const value = row[index];
                            if (value) {
                                newCard.userCustom[header] = value;
                            }
                        });

                        cardsToImport.push(newCard);
                    }
                }
                
                // 5. ストアに一括インポートを依頼
                if (cardsToImport.length > 0) {
                    // importCards は DB 永続化（isInStore: false）と Store キャッシュ追加を行う
                    const result = await importCards(cardsToImport); 
                    
                    // インポート完了メッセージに例外処理情報を追加
                    let successMessage = `✅ ${result.importedCount}枚のカードを正常にインポートしました。`;
                    
                    const exceptionMessages: string[] = [];
                    if (pipeSplitCardCount > 0) {
                        exceptionMessages.push(`CSVのパイプ(|)区切りにより、${pipeSplitCardCount}枚のカードが1行から複数生成されました。`);
                    }
                    
                    if (rarityFixedCount > 0) {
                        exceptionMessages.push(`レアリティが不適切/未指定の${rarityFixedCount}枚のカードにデフォルトレアリティを割り当てました。`);
                    }

                    if (exceptionMessages.length > 0) {
                        successMessage += `\n\n**⚠️ 例外処理 ${exceptionMessages.length}件**`;
                        setStatusMessage(successMessage + '\n- ' + exceptionMessages.join('\n- '));
                    } else {
                        setStatusMessage(successMessage);
                    }
                    
                    // 【最重要】Store更新完了後、親コンポーネントのローカル状態を更新するコールバックを実行
                    await onCardListUpdated(); 

                } else {
                    setStatusMessage("⚠️ 警告: 有効なカードデータ行が見つかりませんでした。");
                }
            } catch (error) {
                setStatusMessage(`❌ インポート中に致命的なエラーが発生しました: ${error instanceof Error ? error.message : '不明なエラー'}`);
            } finally {
                setIsLoading(false);
            }
        };

        reader.onerror = () => {
            setIsLoading(false);
            setStatusMessage('❌ ファイルの読み込み中にエラーが発生しました。');
        };

        reader.readAsText(file);
    }, [packId, currentPack, importCards, onCardListUpdated]); 

    
    // --- handleExportCards の定義 ---
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

    return {
        isLoading,
        statusMessage,
        handleConfirmImport, 
        handleExportCards,
        setStatusMessage,
    };
};