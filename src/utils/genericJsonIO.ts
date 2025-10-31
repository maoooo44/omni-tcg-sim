/**
 * src/utils/genericJsonIO.ts
 *
 * * JSONシリアライズ/デシリアライズの汎用ロジックを提供するユーティリティモジュール。
 * 主な責務は、Mapなどの標準JSONではサポートされないカスタムなデータ構造を持つオブジェクトに対し、
 * 専用のSerializer/Deserializer関数を適用して、安全かつ読みやすいJSON入出力操作をラップすることです。
 *
 * * 責務:
 * 1. データのJSONシリアライズ（エクスポート）処理をラップする（exportDataToJson）。
 * 2. JSON文字列のパースとデータ型へのデシリアライズ（インポート）処理をラップし、パース失敗時のエラー処理を提供する（importDataFromJson）。
 * 3. 汎用的なSerializer/Deserializer関数の型定義を提供する。
 */

// シリアライザ関数の型定義: T型のデータを受け取り、JSON互換なオブジェクトを返す
export type Serializer<T> = (data: T) => any;

// デシリアライザ関数の型定義: JSON互換なオブジェクトを受け取り、T型のデータを復元して返す
export type Deserializer<T> = (json: any) => T;


/**
 * 汎用的なデータエクスポート関数
 * @param data エクスポート対象のデータ
 * @param serializer Mapなど非JSON互換構造をJSON互換構造に変換する関数 (省略可)
 * @returns 整形されたJSON文字列
 */
export const exportDataToJson = <T>(
    data: T,
    serializer: Serializer<T> = (d) => d // デフォルトはTをそのままJSON化
): string => {
    const jsonCompatibleData = serializer(data);
    return JSON.stringify(jsonCompatibleData, null, 2); // 見やすいように整形
};

/**
 * 汎用的なデータインポート関数
 * @param jsonText インポート対象のJSON文字列
 * @param deserializer JSON互換構造を元のデータ型Tに復元する関数 (省略可)
 * @returns 復元されたデータT
 */
export const importDataFromJson = <T>(
    jsonText: string,
    deserializer: Deserializer<T> = (d) => d as T // デフォルトはパース結果をT型としてそのまま返す
): T => {
    const parsedData: any = JSON.parse(jsonText);

    if (parsedData === null || parsedData === undefined) {
        // JSON.parse(null) は null を返すため、それを失敗と見なす
        throw new Error('JSONのパースに失敗しました。無効なJSON形式です。');
    }

    // デシリアライザを適用してMapなどの構造を復元
    return deserializer(parsedData);
};