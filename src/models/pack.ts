/**
 * src/models/pack.ts
 *
 * * TCG Builderアプリケーションで使用される「パック」のデータ構造と関連型を定義するモデル層モジュール。
 * パック名、価格、封入枚数、複雑なレアリティ設定、画像URLなど、パック開封シミュレーションと
 * パック管理に必要なすべてのメタデータ構造を定義します。
 *
 * * 責務:
 * 1. パックの構成タイプ（PackType）と、その選択肢リストを定義する。
 * 2. 封入確率に関する設定構造（RarityConfig, AdvancedRarityConfig）を定義する。
 * 3. パックおよび収録カードのカスタムフィールド設定構造（PackFieldSettings, CardFieldSettings）を定義する。
 * 4. パック本体のデータ構造（Pack）を定義する。
 * 5. パックデータとその収録カードをバンドルした構造（PackBundle）を定義する。
 */

import type { Card } from "./card";

import type { FieldSetting } from './customField';


export type PackType = 'Booster' | 'ConstructedDeck';

/**
 * パック種別 (PackType) の選択肢リスト
 */
export const PACK_TYPE_OPTIONS: PackType[] = ['Booster', 'ConstructedDeck'];

export interface RarityConfig {
    rarityName: string;
    probability: number;
}

// 確定枚数ロジック用の新しい設定
export interface AdvancedRarityConfig {
    rarityName: string;
    /**
     * [基本確率] 残り枠を埋めるために使用される確率 (合計 1.0)。
     */
    probability: number;

    /**
     * [特殊確率] 特殊抽選スロットで使用される確率 (合計 1.0)。
     */
    specialProbability: number;

    /**
     * パック内のこのレアリティの確定枚数
     */
    fixedValue: number;
}


/** パックのカスタムフィールドの表示設定を定義する型 */
export interface PackFieldSettings {
    num_1: FieldSetting;
    num_2: FieldSetting;
    str_1: FieldSetting;
    str_2: FieldSetting;
}

/** 収録カードのカスタムフィールドの表示設定を定義する型 */
export interface CardFieldSettings {
    num_1: FieldSetting;
    num_2: FieldSetting;
    num_3: FieldSetting;
    num_4: FieldSetting;
    num_5: FieldSetting;
    num_6: FieldSetting;
    str_1: FieldSetting;
    str_2: FieldSetting;
    str_3: FieldSetting;
    str_4: FieldSetting;
    str_5: FieldSetting;
    str_6: FieldSetting;
}

/** 構築済みデッキに含まれるカード情報 */
export interface ConstructedDeckCard {
    /** 収録されるカードのID */
    cardId: string;
    /** 収録される枚数 */
    count: number;
}

export interface Pack {
    packId: string;
    name: string;
    number?: number | null;
    imageUrl: string;
    imageColor?: string;
    cardBackImageUrl: string;
    cardBackImageColor?: string;
    price: number;
    packType: PackType;
    cardsPerPack: number;
    totalCards: number;
    series: string;
    description: string;
    isOpened: boolean;
    isFavorite: boolean;
    createdAt: string;
    updatedAt: string;

    //確率用
    rarityConfig: RarityConfig[];
    advancedRarityConfig?: AdvancedRarityConfig[];
    specialProbabilitySlots: number;
    isAdvancedRulesEnabled: boolean;

    constructedDeckCards?: ConstructedDeckCard[];

    cardPresetId?: string;

    num_1?: number | null;
    num_2?: number | null;
    str_1?: string;
    str_2?: string;

    packFieldSettings: PackFieldSettings;
    cardFieldSettings: CardFieldSettings;

    /** ユーザー定義のタグ/その他の属性。カスタムフィールドの代わり。 */
    tag?: string[];
    /** 全文検索用の連結文字列（tagを結合） */
    searchText?: string;
}

export interface PackBundle {
    packData: Pack;
    cardsData: Card[];
}