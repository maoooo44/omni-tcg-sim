/**
 * src/features/pack-management/hooks/useCardCsvIO.ts
 * 
 * カードデータの一括インポート・エクスポート (CSV形式) を管理するカスタムフック。
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


// ユーザーが意図的に値を指定することを許容するフィールド
const FIXED_FIELDS: (keyof Card)[] = ['name', 'rarity', 'imageUrl'];

const SYSTEM_RESERVED_FIELDS: (keyof Card)[] = [
    'cardId',       // 固有ID
    'packId',       // パックID
    'userCustom',   // userCustomオブジェクト自体
    // 将来的に追加されるシステム固有のフィールドがあればここに追加する
];

/**
 * カードデータの一括インポート・エクスポート（CSV形式）を管理するカスタムフック
 * @param packId - 対象のパックID
 */
export const useCardCsvIO = (packId: string) => {
    const { importCards, exportCardsToCsv } = useCardStore(useShallow(state => ({
        importCards: state.importCards,
        exportCardsToCsv: state.exportCardsToCsv,
    })));
    
    const currentPack = usePackStore(state => state.packs.find(p => p.packId === packId));

    const [isLoading, setIsLoading] = useState(false);
    const [statusMessage, setStatusMessage] = useState<string | null>(null);

    /**
     * CSVファイルをパースし、Cardオブジェクトの配列に変換してストアにインポートします。
     * @param file - ユーザーがアップロードした File オブジェクト
     */
    const handleImportCsvFile = useCallback((file: File) => {
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
                const lowerCaseSystemReserved = SYSTEM_RESERVED_FIELDS.map(f => f.toLowerCase());
                
                for (const header of headers) {
                    const lowerCaseHeader = header.toLowerCase().trim();
                    if (lowerCaseSystemReserved.includes(lowerCaseHeader)) {
                        throw new Error(`予約済みのシステムフィールド名 "${header}" はカスタムプロパティとして使用できません。`);
                    }
                }
                
                // 1. デフォルト値の決定
                const defaultRarity = currentPack.rarityConfig[0]?.rarityName || 'Common';

                // 2. ヘッダーを分類し、インデックスを保持
                const fixedHeaderIndices: { [key: string]: number } = {};
                const customHeaderIndices: { header: string, index: number }[] = [];

                headers.forEach((header, index) => {
                    const lowerCaseHeader = header.toLowerCase().trim();
                    
                    if (FIXED_FIELDS.includes(lowerCaseHeader as keyof Card)) {
                        fixedHeaderIndices[lowerCaseHeader] = index;
                    } else if (header.trim() !== '') { 
                        customHeaderIndices.push({ header: header.trim(), index });
                    }
                });
                
                // 3. データ行をCardオブジェクトに変換 (すべて新規カードとして扱う)
                const cardsToImport: Card[] = [];
                let cardNameCounter = 1;

                for (const row of data) {
                    if (row.length !== headers.length) {
                        console.warn(`Skipping row due to column count mismatch: ${row.join(',')}`);
                        continue; 
                    }
                    
                    // 固定フィールドの値取得とデフォルト値の適用
                    const nameIndex = fixedHeaderIndices['name'];
                    const rarityIndex = fixedHeaderIndices['rarity'];
                    const imageUrlIndex = fixedHeaderIndices['imageUrl'];

                    const rawCardName = nameIndex !== undefined ? row[nameIndex] : '';
                    const cardName = rawCardName 
                        ? rawCardName 
                        : `新しいカード_${cardNameCounter++}`;
                    
                    const cardRarity = (rarityIndex !== undefined && row[rarityIndex]) 
                        ? row[rarityIndex] 
                        : defaultRarity;

                    const cardImageUrl = (imageUrlIndex !== undefined && row[imageUrlIndex]) 
                        ? row[imageUrlIndex] 
                        : '';

                    // Cardオブジェクトの基本部分を構築
                    const newCard: Card = {
                        cardId: generateUUID(), // 常に新しいUUIDを生成
                        packId: packId,
                        name: cardName,
                        rarity: cardRarity,
                        imageUrl: cardImageUrl,
                        userCustom: {}, 
                        registrationSequence: 0, 
                    };

                    // 4. カスタムプロパティをマッピング
                    customHeaderIndices.forEach(({ header, index }) => {
                        const value = row[index];
                        if (value) {
                            newCard.userCustom[header] = value;
                        }
                    });
                    
                    cardsToImport.push(newCard);
                }

                // 5. ストアに一括インポートを依頼
                if (cardsToImport.length > 0) {
                    const result = await importCards(cardsToImport); 
                    setStatusMessage(`✅ ${result.importedCount}枚のカードを正常にインポートしました。`);
                } else {
                    setStatusMessage("⚠️ 警告: 有効なカードデータ行が見つかりませんでした。");
                }
            } catch (error) {
                console.error('CSVインポートエラー:', error);
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
    }, [packId, currentPack, importCards]);

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
        handleImportCsvFile,
        handleExportCards,
        setStatusMessage,
    };
};