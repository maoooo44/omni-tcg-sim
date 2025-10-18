/**
 * src/utils/csvFormatter.ts
 *
 * 汎用的なフォーマットロジックを提供するユーティリティ関数群。
 * 主に、特定のモデルオブジェクトの配列をCSV文字列に変換する処理を担う。
 */

import type { Card } from '../models/card';

/**
 * Cardオブジェクトの配列をCSV文字列にフォーマットします。
 */
export const formatCardsToCsv = (cards: Card[]): string => {
    if (cards.length === 0) return "";

    // Cardのプロパティを安全に扱うためのキーリストを定義
    const headers: (keyof Card)[] = [
        'cardId', 'packId', 'number', /*'term', 'definition', 'lastViewedAt', 'createdAt',*/ 'updatedAt', 'isInStore'
    ];
    
    // 値のフォーマットとエスケープ
    const escapeCsvValue = (value: any): string => {
        if (value === null || value === undefined) return '';
        let str = String(value);
        // カンマ、二重引用符、改行を含む場合は二重引用符で囲み、二重引用符は二重にエスケープ
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            str = str.replace(/"/g, '""');
            return `"${str}"`;
        }
        return str;
    };

    // ヘッダー行を生成
    const csvRows = [headers.join(',')];

    // データ行を生成
    cards.forEach(card => {
        const row = headers.map(header => {
            // Card型プロパティへのアクセスは安全になりました
            return escapeCsvValue(card[header]);
        });
        csvRows.push(row.join(','));
    });

    return csvRows.join('\n');
};