/**
 * src/services/data-io/cardCsvIO.ts
 *
 * CardデータのCSVインポート/エクスポートを行うI/Oサービス層。
 * CSVパース/フォーマットのロジックと、Cardオブジェクトへのマッピングを担う。
 * 
 * 【仕様】
 * - カスタムフィールドは物理フィールド名（bool_1, num_1, str_1等）で指定
 * - ユーザーフレンドリー名のマッピングは行わない
 * - コメント行（# で始まる行）は無視される
 */

import type { Card } from '../../models/card';
import { formatCardsToCsv } from '../../utils/csvFormatter';
import { parseCSV } from '../..//utils/csvParser';
import { generateId, createDefaultCard } from '../../utils/dataUtils'; 
// 💡 修正: CustomFieldDefinitionは不要になったが、インターフェース互換性のため一旦残す
import type { CustomFieldDefinition } from './dataIOUtils';

type CsvCustomFieldType = 'bool' | 'num' | 'str';

// =========================================================================
// 定数定義
// =========================================================================

// ユーザーが意図的に値を指定することを許容する固定フィールド (小文字で定義)
const FIXED_FIELDS_LOWER: string[] = [
    'name', 
    'rarity', 
    'imageurl', 
    'number', 
    'isfavorite', 
    'imagecolor',
];

// システム予約語 (CSVで値を設定すべきでないフィールド)
const SYSTEM_RESERVED_FIELDS: (keyof Card)[] = [
    'cardId', 
    'packId', 
    'createdAt',
    'updatedAt',
];

// 物理カスタムフィールド名のパターン（bool_1～10, num_1～10, str_1～10）
const CUSTOM_FIELD_PATTERN = /^(bool|num|str)_([1-9]|10)$/;

// FIXED_FIELDS_LOWER 以外の予約語のみをチェック対象とする
const CHECK_RESERVED_FIELDS: string[] = SYSTEM_RESERVED_FIELDS
    .map(f => (f as string).toLowerCase())
    .filter(f => !FIXED_FIELDS_LOWER.includes(f.toLowerCase()));

// =========================================================================
// ヘルパー関数 (変更なし)
// =========================================================================

const splitPipeSeparatedValue = (value: string | null | undefined): string[] => {
    if (typeof value !== 'string' || value.trim() === '') {
        return [];
    }
    return value.split('|').map(v => v.trim()).filter(v => v.length > 0);
};

// =========================================================================
// インポート処理
// =========================================================================

/**
 * CSVテキストをパースし、Cardオブジェクトの配列に変換します。
 * @param packId - 割り当てるPack ID
 * @param csvText - CSV形式の文字列
 * @param customFieldDefs - （互換性のため残すが使用しない）
 * @returns Cardオブジェクトの配列
 */
export const importCardsFromCsv = async (
    packId: string, 
    csvText: string,
    _customFieldDefs: CustomFieldDefinition[] // 使用しないが互換性のため残す
): Promise<Card[]> => {
    
    // 1. CSVパース（コメント行は自動的に除外される）
    const { headers, data } = parseCSV(csvText);

    if (headers.length === 0 || data.length === 0) {
        return [];
    }
    
    // 2. 予約語チェック（cardId, packId, createdAt, updatedAtのみ）
    for (const header of headers) {
        const lowerCaseHeader = header.toLowerCase().trim();
        
        if (CHECK_RESERVED_FIELDS.includes(lowerCaseHeader)) {
            throw new Error(`予約済みのシステムフィールド名 "${header}" はCSVで指定できません。`);
        }
    }

    // 3. ヘッダーを分類し、インデックスを保持
    const fixedHeaderIndices: { [key: string]: number } = {};
    const customHeaderIndices: { header: keyof Card, index: number, type: CsvCustomFieldType }[] = [];
    
    headers.forEach((header, index) => {
        const lowerCaseHeader = header.toLowerCase().trim();
        
        // --- (A) 標準固定フィールドの処理 ---
        if (FIXED_FIELDS_LOWER.includes(lowerCaseHeader)) {
            const fieldName = 
                lowerCaseHeader === 'imageurl' ? 'imageUrl' :
                lowerCaseHeader === 'isfavorite' ? 'isFavorite' :
                lowerCaseHeader === 'imagecolor' ? 'imageColor' :
                lowerCaseHeader;
                
            fixedHeaderIndices[fieldName] = index;
            return;
        }

        // --- (B) 物理カスタムフィールド名 (bool_1, num_1, str_1 等) の照合 ---
        const customMatch = lowerCaseHeader.match(CUSTOM_FIELD_PATTERN);
        if (customMatch) {
            const type = customMatch[1] as CsvCustomFieldType;
            const fieldKey = lowerCaseHeader as keyof Card; // 例: "bool_1"
            
            customHeaderIndices.push({ 
                header: fieldKey, 
                index: index, 
                type: type 
            });
            return;
        }
        
        // (A), (B) のいずれにもマッチしないヘッダーは無視される
        console.warn(`[cardCsvIO] Unknown CSV header "${header}" will be ignored.`);
    });

    // 4. データ行をCardオブジェクトに変換 (中略、ロジック変更なし)
    const cardsToImport: Card[] = [];
    let cardNameCounter = 1;

    for (const row of data) {
        if (row.length !== headers.length) {
            console.warn(`[cardCsvIO] Skipping row due to column count mismatch: ${row.join(',')}`);
            continue; 
        }
        
        // --- CSV値の抽出と固定フィールドの上書き ---
        const nameIndex = fixedHeaderIndices['name'];
        const rarityIndex = fixedHeaderIndices['rarity'];
        const imageUrlIndex = fixedHeaderIndices['imageUrl'];
        const numberIndex = fixedHeaderIndices['number']; 
        const isFavoriteIndex = fixedHeaderIndices['isFavorite'];
        const imageColorIndex = fixedHeaderIndices['imageColor'];

        const rawCardName = nameIndex !== undefined ? row[nameIndex] : '';
        const rawRarity = rarityIndex !== undefined ? row[rarityIndex] : '';
        
        const cardNames = splitPipeSeparatedValue(rawCardName);
        const cardRarities = splitPipeSeparatedValue(rawRarity);
        
        if (cardNames.length === 0) {
            cardNames.push(`新しいカード_${cardNameCounter++}`);
        }
        
        const cardImageUrl = (imageUrlIndex !== undefined && row[imageUrlIndex]) ? row[imageUrlIndex] : '';
        const cardImageColor = (imageColorIndex !== undefined && row[imageColorIndex]) ? row[imageColorIndex] : undefined;
        
        let baseIsFavorite = false;
        if (isFavoriteIndex !== undefined && row[isFavoriteIndex]) {
            const rawIsFavorite = row[isFavoriteIndex].toLowerCase().trim();
            baseIsFavorite = ['true', '1', 't', 'yes'].includes(rawIsFavorite);
        }
        
        let baseCardNumber: number | undefined = undefined;
        if (numberIndex !== undefined && row[numberIndex]) {
            const rawNumber = row[numberIndex];
            const parsedNumber = parseInt(rawNumber, 10);
            if (!isNaN(parsedNumber)) {
                baseCardNumber = parsedNumber;
            }
        }

        const cardCountInRow = Math.max(cardNames.length, cardRarities.length, 1); 

        for (let i = 0; i < cardCountInRow; i++) {
            
            const finalCardName = cardNames[i] || cardNames[0] || `新しいカード_${cardNameCounter++}`;
            const rawFinalRarity = cardRarities[i] || cardRarities[0] || '';
            
            let newCard: Card = createDefaultCard(packId);

            newCard.cardId = generateId(); 
            newCard.name = finalCardName;
            newCard.rarity = rawFinalRarity; 
            newCard.imageUrl = cardImageUrl;
            newCard.imageColor = cardImageColor; 
            newCard.isFavorite = baseIsFavorite; 
            newCard.number = baseCardNumber; 
            newCard.updatedAt = new Date().toISOString(); 
            newCard.createdAt = newCard.createdAt || newCard.updatedAt; 

            // 5. カスタムプロパティをマッピング 
            customHeaderIndices.forEach(({ header, index, type }) => {
                const value = row[index];
                if (!value) return;

                const fieldName = header; 
                
                if (type === 'bool') {
                    const boolValue = ['true', '1', 't', 'yes'].includes(value.toLowerCase().trim());
                    (newCard as any)[fieldName] = boolValue; 
                } else if (type === 'num') {
                    const parsedNumber = parseFloat(value);
                    if (!isNaN(parsedNumber)) {
                        (newCard as any)[fieldName] = parsedNumber;
                    }
                } else if (type === 'str') {
                    (newCard as any)[fieldName] = value;
                }
            });

            cardsToImport.push(newCard);
        }
    }
    
    return cardsToImport;
};

// =========================================================================
// エクスポート処理 (変更なし)
// =========================================================================

export const exportCardsToCsv = (cards: Card[]): string => {
    return formatCardsToCsv(cards);
};