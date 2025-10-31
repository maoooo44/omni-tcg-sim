/**
 * src/utils/csvFormatter.ts
 *
 * * 汎用的なCSVフォーマットロジックを提供するユーティリティモジュール。
 * 主な責務は、特定のモデルオブジェクトの配列を、CSV標準（RFC 4180）に準拠した形式のCSV文字列に変換することです。
 * 変換ロジックには、カンマ、二重引用符、改行を含む値の適切な二重引用符エスケープ処理が含まれます。
 *
 * * 責務:
 * 1. Cardオブジェクトの配列をCSV文字列に変換する（formatCardsToCsv）。
 * 2. CSV値のエスケープ処理（二重引用符で囲み、内部の二重引用符を二重化）を適用する。
 * 3. データのヘッダー（列）を明示的に定義し、データの一貫性を保証する。
 */

import type { Card } from '../models/card';

/**
 * Cardオブジェクトの配列をCSV文字列にフォーマットします。
 */
export const formatCardsToCsv = (cards: Card[]): string => {
    if (cards.length === 0) return "";

    // Cardのプロパティを安全に扱うためのキーリストを定義
    const headers: (keyof Card)[] = [
        'cardId', 'packId', 'number', 'updatedAt',
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
    const csvRows = [headers.map(h => escapeCsvValue(h)).join(',')]; // ヘッダーもエスケープすることが望ましい

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