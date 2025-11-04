/**
 * src/services/data-io/userDataJsonIO.ts
 *
 * * UserDataStateのデータ構造をJSON文字列へシリアライズ/デシリアライズするドメイン固有のI/Oサービス層モジュール。
 * * 責務:
 * 1. UserDataStateオブジェクトをJSON文字列にエクスポートする。
 * 2. JSON文字列からUserDataStateオブジェクトをインポートする。
 * 3. UserDataStateがMap構造を含まないため、汎用JSON I/Oユーティリティ（genericJsonIO）のデフォルト機能を利用し、シンプルなI/Oインターフェースを提供する。
 */

import type { UserDataState } from '../../models/models';
import { exportDataToJson, importDataFromJson } from '../../utils/genericJsonIO';

// --- 汎用I/Oを使用した公開関数 ---

/**
 * UserDataStateをJSON文字列にエクスポートする。
 * @param userDataState - エクスポート対象のUserDataState
 * @returns JSON形式の文字列
 */
export const exportUserDataToJson = (userDataState: UserDataState): string => {
    // serializerは省略し、genericJsonIOのデフォルト動作（データをそのままJSON化）を利用。
    return exportDataToJson(userDataState);
};

/**
 * JSON文字列からUserDataStateをインポートする。
 * @param jsonText - インポートするJSON文字列
 * @returns UserDataStateオブジェクト
 */
export const importUserDataFromJson = (jsonText: string): UserDataState => {
    // deserializerは省略し、genericJsonIOのデフォルト動作（パース結果を型として返す）を利用。
    return importDataFromJson<UserDataState>(jsonText);
};