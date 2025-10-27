/**
 * src/utils/csvParser.ts
 *
 * CSV形式の文字列を受け取り、ヘッダー行とデータ行の配列にパースするユーティリティ関数。
 * CSV標準（ダブルクォーテーションによるエスケープ）に対応する。
 * コメント行（# で始まる行）は無視される。
 */

/**
 * 行がコメント行かどうかを判定します。
 * @param line - 判定対象の行
 * @returns コメント行の場合true
 */
const isCommentLine = (line: string): boolean => {
    const trimmed = line.trim();
    return trimmed.startsWith('#');
};

/**
 * CSVテキストをパースし、ヘッダーとデータの配列に変換します。
 * CSV標準のエスケープルールに従い、1行目をヘッダーとして扱います。
 * コメント行（# で始まる行）は無視されます。
 * @param csvText - パース対象のCSV文字列
 * @returns { headers: string[], data: string[][] } - ヘッダー行とデータ行の配列
 */
export const parseCSV = (csvText: string): { headers: string[], data: string[][] } => {
    // 空行とコメント行を無視し、改行コードを正規化
    const lines = csvText.trim().replace(/\r\n/g, '\n').split('\n')
        .filter(line => {
            const trimmed = line.trim();
            return trimmed !== '' && !isCommentLine(trimmed);
        });
    
    if (lines.length === 0) return { headers: [], data: [] };

    // --- 補助関数: CSVの行をフィールド配列にパースする ---
    const parseLine = (line: string): string[] => {
        const fields: string[] = [];
        let currentField = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];

            if (char === '"') {
                // 次の文字がダブルクォーテーションかチェック (エスケープされた二重引用符)
                if (inQuotes && line[i + 1] === '"') {
                    currentField += '"';
                    i++; // 2文字分進める
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (char === ',') {
                if (inQuotes) {
                    // ダブルクォーテーション内のカンマはそのままフィールドに追加
                    currentField += char;
                } else {
                    // フィールドの区切り
                    fields.push(currentField.trim());
                    currentField = '';
                }
            } else {
                currentField += char;
            }
        }
        
        // 最後のフィールドを追加（エスケープされていない最後のフィールドはトリム）
        fields.push(currentField.trim());

        // フィールド全体が引用符で囲まれていた場合、引用符を外す
        return fields.map(field => {
            if (field.startsWith('"') && field.endsWith('"') && field.length > 1) {
                return field.slice(1, -1).trim();
            }
            return field;
        });
    };
    // ----------------------------------------------------

    // 1行目をヘッダーとしてパース
    const headers = parseLine(lines[0]);
    
    // 2行目以降をデータ行としてパース
    const data = lines.slice(1).map(parseLine);
    
    return { headers, data };
};