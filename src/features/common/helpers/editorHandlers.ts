/**
 * src/features/common/helpers/editorHandlers.ts
 *
 * Pack/Deck/その他のエディター共通の基本フィールドハンドラ群
 * 責務:
 * 1. 入力フィールド（input, textarea）の変更処理（ジェネリック型）
 * 2. セレクトフィールドの変更処理（ジェネリック型）
 * 3. お気に入り状態のトグル処理（ジェネリック型）
 * 
 * ※ Pack/Deckの個別要件（カスタムフィールド等）は各フィーチャーのヘルパーで処理
 */

// ----------------------------------------------------------------------
// Generic Input Change Handler
// ----------------------------------------------------------------------

export interface CreateHandleInputChangeParams<T> {
    data: T | null;
    setData: React.Dispatch<React.SetStateAction<T | null>>;
    /**
     * 数値として扱うフィールド名のリスト（例: ['price', 'number']）
     */
    numericFields?: string[];
    /**
     * 数値フィールドでプレフィックスマッチング（例: 'num_' で num_1, num_2 など）
     */
    numericPrefixes?: string[];
    /**
     * 空文字をundefinedに変換するフィールドのプレフィックス（例: 'keycard_'）
     */
    optionalPrefixes?: string[];
}

/**
 * 汎用的な入力フィールド変更ハンドラ
 * 
 * @example
 * // Pack用
 * const handleInputChange = createHandleInputChange({
 *   data: packData,
 *   setData: setPackData,
 *   numericFields: ['price', 'number', 'cardsPerPack'],
 * });
 * 
 * // Deck用
 * const handleInputChange = createHandleInputChange({
 *   data: deckData,
 *   setData: setDeckData,
 *   numericFields: ['number'],
 *   numericPrefixes: ['num_'],
 *   optionalPrefixes: ['keycard_'],
 * });
 */
export const createHandleInputChange = <T extends Record<string, any>>(
    params: CreateHandleInputChangeParams<T>
) => {
    const { 
        data, 
        setData, 
        numericFields = [], 
        numericPrefixes = [],
        optionalPrefixes = [],
    } = params;
    
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        if (!data) return;
        
        const { name, value } = e.target;

        // 数値フィールドかどうかを判定
        const isNumericField = 
            numericFields.includes(name) || 
            numericPrefixes.some(prefix => name.startsWith(prefix));

        // オプショナルフィールド（空文字→undefined）かどうかを判定
        const isOptionalField = optionalPrefixes.some(prefix => name.startsWith(prefix));

        let finalValue: any = value;

        if (isOptionalField) {
            // 空文字列をundefinedに変換（keycard_*など）
            finalValue = value === '' ? undefined : value;
        } else if (isNumericField) {
            // 数値フィールドはNumber型に変換（空文字はundefined）
            finalValue = value === '' ? undefined : Number(value);
        }

        setData(prev => prev ? { ...prev, [name]: finalValue } : null);
    };
};

// ----------------------------------------------------------------------
// Generic Select Change Handler
// ----------------------------------------------------------------------

export interface CreateHandleSelectChangeParams<T> {
    data: T | null;
    setData: React.Dispatch<React.SetStateAction<T | null>>;
}

/**
 * 汎用的なセレクトフィールド変更ハンドラ
 * 
 * @example
 * const handleSelectChange = createHandleSelectChange({
 *   data: packData,
 *   setData: setPackData,
 * });
 */
export const createHandleSelectChange = <T extends Record<string, any>>(
    params: CreateHandleSelectChangeParams<T>
) => {
    const { data, setData } = params;
    
    return (e: any) => {
        if (!data) return;
        
        const { name, value } = e.target;
        
        setData(prev => prev ? { ...prev, [name]: value } : null);
    };
};

// ----------------------------------------------------------------------
// Generic Toggle Favorite Handler
// ----------------------------------------------------------------------

export interface CreateHandleToggleFavoriteParams<T> {
    itemId: string;
    isNew: boolean;
    updateIsFavorite: (itemId: string, isFavorite: boolean) => Promise<T | null>;
}

/**
 * 汎用的なお気に入り状態トグルハンドラ
 * 
 * @example
 * // Pack用
 * const handleToggleFavorite = createHandleToggleFavorite({
 *   itemId: packId,
 *   isNew: isNewPack,
 *   updateIsFavorite: updatePackIsFavorite,
 * });
 * 
 * // Deck用
 * const handleToggleFavorite = createHandleToggleFavorite({
 *   itemId: deckId,
 *   isNew: isNewDeck,
 *   updateIsFavorite: updateDeckIsFavorite,
 * });
 */
export const createHandleToggleFavorite = <T>(
    params: CreateHandleToggleFavoriteParams<T>
) => {
    const { itemId, isNew, updateIsFavorite } = params;
    
    return async (newState: boolean): Promise<void> => {
        // 新規アイテム（DB未保存）では不可
        if (isNew) return;

        try {
            const updatedItem = await updateIsFavorite(itemId, newState);
            
            if (updatedItem) {
                console.log(`[editorHandlers] Favorite state toggled for Item ID: ${itemId}`);
            }
        } catch (error) {
            console.error('[editorHandlers] Failed to toggle favorite state:', error);
        }
    };
};
