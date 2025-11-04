/**
 * ISO 8601形式の文字列を、ローカライズされた短い形式（YYYY/MM/DD hh:mm）に変換します。
 * @param dateString ISO 8601形式の日付文字列
 * @returns フォーマットされた日付文字列、または日付がない場合は「未設定」
 */
export const formatShortDateTime = (dateString: string | null | undefined): string => {
    if (!dateString) return '未設定';

    try {
        const date = new Date(dateString);
        
        // 🚨 無効な日付をチェック
        if (isNaN(date.getTime())) {
            return '無効な日付';
        }

        // 'ja-JP'ロケールで短い形式にフォーマット
        return date.toLocaleString('ja-JP', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            // 秒は含めない
        });
    } catch (error) {
        console.error("日付フォーマットエラー:", error);
        return 'エラー';
    }
};

// 例: 2024/01/10 15:30