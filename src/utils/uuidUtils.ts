/**
* src/utils/uuidUtils.ts
* 
* UUID (Universally Unique Identifier) 生成に関する汎用ユーティリティ関数。
*/
import { v4 as uuidv4 } from 'uuid'; 

/**
* 業界標準のUUID v4 (Universally Unique Identifier) を生成する汎用関数。
* アプリケーション内のすべてのエンティティID生成に使用できます。
* @returns {string} 生成されたユニークなUUID
*/
export const generateUUID = (): string => {
    return uuidv4();
};