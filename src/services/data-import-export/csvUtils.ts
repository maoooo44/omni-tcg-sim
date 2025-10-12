/**
 * src/services/data-import-export/csvUtils.ts
 *
 * CSV形式の文字列を受け取り、ヘッダー行とデータ行の配列にパースするユーティリティ関数。
 * シンプルなカンマ区切りを想定し、空行を無視して処理する。
 */

/**
 * CSVテキストをパースし、ヘッダーとデータの配列に変換します。
 * 空行を無視し、1行目をヘッダーとして扱います。
 * @param csvText - パース対象のCSV文字列
 * @returns { headers: string[], data: string[][] } - ヘッダー行とデータ行の配列
 */
export const parseCSV = (csvText: string): { headers: string[], data: string[][] } => {
    // 正規表現を使用して、CRLFまたはLFで改行を分割し、空行をフィルター
    const lines = csvText.trim().split(/\r\n|\n/).filter(line => line.trim() !== '');
    
    if (lines.length === 0) return { headers: [], data: [] };
    
    // ヘッダー行をカンマで分割し、前後の空白を除去
    const headers = lines[0].split(',').map(h => h.trim());
    
    // データ行をカンマで分割し、前後の空白を除去
    const data = lines.slice(1).map(line => 
        // 厳密には、CSVエンコード（ダブルクォーテーションの処理）が必要だが、ここではシンプルなカンマ区切りを想定
        line.split(',').map(d => d.trim())
    );
    
    return { headers, data };
};