/**
 * src/models/preset.ts
 *
 * * パックやカードのカスタムフィールドなどの設定を一括で管理するためのプリセットデータ構造を定義するモデル層モジュール。
 * 汎用的な基本構造（BasePreset）を拡張し、各エンティティ（Pack、Cardカスタム、カスタムフィールド定義）に特化した
 * 具体的なプリセットの型を定義することで、設定の一元管理と再利用を可能にします。
 *
 * * 責務:
 * 1. プリセット共通のメタデータ構造（BasePreset）を定義する。
 * 2. パック設定（PackPreset）のデータ構造を定義する。
 * 3. 古いカードカスタムフィールド初期値（CardCustomPreset）のデータ構造を定義する（現在は非使用）。
 * 4. カスタムフィールドの表示名定義（CustomFieldDefinitionPreset）のデータ構造を定義する（現在は非使用）。
 * 5. 現在使用するプリセット型のユニオン型（Preset）を定義する。
 */

//import { type CustomFieldType } from './customField';

export interface BasePreset {
    id: string;
    name: string;
    createdAt: string;
    updatedAt: string;
}

// --------------------------------------------------
// 既存のプリセット型
// --------------------------------------------------

/**
 * パック設定を保存するためのプリセットデータ構造です。
 */
export interface PackPreset extends BasePreset {
    series: string;
    cardsPerPack: number;
    packType: 'Booster' | 'ConstructedDeck' | 'Other';
    imageUrl: string;
    description: string;

    rarityConfig: {
        rarityName: string;
        probability: number;
    }[];
}

/**
 * カードのユーザーカスタムフィールドの構造を保存するためのプリセットデータ構造です。
 */
// export interface CardCustomPreset extends BasePreset {
//     // userCustomのキーと値を保持（値は空文字列で保存し、フィールド定義用として扱う）
//     customFields: Record<string, string>;
// }

// --------------------------------------------------
// 新しいカスタムフィールド表示名定義プリセット
// --------------------------------------------------


/**
 * カスタムフィールドの表示名（ユーザーフレンドリー名）の定義を保存するためのプリセットです。
 */
// export interface CustomFieldDefinitionPreset extends BasePreset {

//     // フィールド定義の基本構造
//     fieldDefinitions: {
//         cardKey: string;
//         fieldName: string; 
//         type: CustomFieldType; 
//     }[];

//     // カード用の表示名定義 (30枠)
//     cardFields: CustomFieldDefinitionPreset['fieldDefinitions'];

//     // パック用の表示名定義 (15枠に削減)
//     packFields: CustomFieldDefinitionPreset['fieldDefinitions'];

//     // デッキ用の表示名定義 (15枠に削減)
//     deckFields: CustomFieldDefinitionPreset['fieldDefinitions'];
// }

// --------------------------------------------------
// 統合された最終型
// --------------------------------------------------

export type Preset = PackPreset;