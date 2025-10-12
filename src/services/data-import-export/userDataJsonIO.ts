// src/services/data-import-export/userDataJsonIO.ts

import type { UserDataState } from '../../stores/userDataStore';
import { exportDataToJson, importDataFromJson } from './genericJsonIO';

// --- 汎用I/Oを使用した公開関数 ---

export const exportUserDataToJson = (userDataState: UserDataState): string => {
    // 💡 修正: UserDataStateはMap構造を含まないため、serializer/deserializerは省略
    return exportDataToJson(userDataState);
};

export const importUserDataFromJson = (jsonText: string): UserDataState => {
    return importDataFromJson<UserDataState>(jsonText);
};