/**
 * src/services/data-io/userDataJsonIO.ts
 *
 * UserDataStateのデータ構造をJSON文字列へシリアライズ/デシリアライズするドメイン固有のI/Oサービス。
 * (UserDataStateはMap構造を含まないため、汎用JsonIOのデフォルト動作を利用する)
 */

import type { UserDataState } from '../../models/userData';
import { exportDataToJson, importDataFromJson } from '../../utils/genericJsonIO';

// --- 汎用I/Oを使用した公開関数 ---

/**
 * UserDataStateをJSON文字列にエクスポートする。
 */
export const exportUserDataToJson = (userDataState: UserDataState): string => {
    // UserDataStateはMap構造を含まないため、serializer/deserializerは省略し、
    // genericJsonIOのデフォルト動作（データをそのままJSON化）を利用する。
    return exportDataToJson(userDataState);
};

/**
 * JSON文字列からUserDataStateをインポートする。
 */
export const importUserDataFromJson = (jsonText: string): UserDataState => {
    // deserializerは省略し、genericJsonIOのデフォルト動作（パース結果を型として返す）を利用する。
    return importDataFromJson<UserDataState>(jsonText);
};