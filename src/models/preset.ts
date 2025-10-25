/**
 * src/models/preset.ts
 *
 * パックやカードのカスタムフィールドなどの設定を一括で管理するためのプリセットデータ構造を定義します。
 * 汎用的な基本構造 (`BasePreset`) を拡張し、パック用 (`PackPreset`)、カードカスタム用 (`CardCustomPreset`)、
 * およびカスタムフィールド定義用 (`CustomFieldDefinitionPreset`) の具体的な型を定義します。
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
 * 💡 この型は、古い「キーと値の初期値」を保存するものであり、表示名定義とは区別します。
 *
export interface CardCustomPreset extends BasePreset {
    // userCustomのキーと値を保持（値は空文字列で保存し、フィールド定義用として扱う）
    customFields: Record<string, string>;
}

// --------------------------------------------------
// 💡 新しいカスタムフィールド表示名定義プリセット
// --------------------------------------------------


/**
 * カスタムフィールドの表示名（ユーザーフレンドリー名）の定義を保存するためのプリセットです。
 * これがカスタムフィールド名定義の一元管理を担います。
 *
export interface CustomFieldDefinitionPreset extends BasePreset {
    
    /** フィールド定義の基本構造 *
    fieldDefinitions: {
        // 例: 'custom_1_str'
        cardKey: string; // keyof Card | keyof Pack | keyof Deck などのユニオン型は複雑なので、一旦 string で定義
        // 例: '種族'
        fieldName: string; 
        // 例: 'str'
        type: CustomFieldType; 
    }[];

    // カード用の表示名定義 (30枠)
    cardFields: CustomFieldDefinitionPreset['fieldDefinitions'];
    
    // パック用の表示名定義 (15枠に削減)
    packFields: CustomFieldDefinitionPreset['fieldDefinitions'];
    
    // デッキ用の表示名定義 (15枠に削減)
    deckFields: CustomFieldDefinitionPreset['fieldDefinitions'];
}*/

// --------------------------------------------------
// 統合された最終型
// --------------------------------------------------

export type Preset = PackPreset;