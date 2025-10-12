/**
 * src/features/pack-management/hooks/usePackForm.ts
 * 
 * PackEditPageのフォーム入力と状態管理 (PackData) を担うカスタムフック。
 * テキスト入力、数値入力、Selectコンポーネントからの変更を処理し、
 * Packオブジェクトの状態を維持する。
 */

import { useState, useCallback, useMemo } from 'react';
import type { Pack, PackType } from '../../../models/pack';
import type { SelectChangeEvent } from '@mui/material';

/**
 * PackEditPageのフォーム入力と状態管理（PackData）を担うカスタムフック
 * @param initialPack - 初期値として設定するPackオブジェクト
 */
export const usePackForm = (initialPack: Pack) => {
    // フォームの状態（Packオブジェクト全体）
    const [packData, setPackData] = useState<Pack>(initialPack);

    // フォームデータの変更ハンドラ（テキスト入力、数値入力）
    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        
        // 数値入力フィールドの型変換ロジックをここに集約
        let processedValue: string | number = value;
        if (type === 'number') {
            processedValue = parseFloat(value);
            if (isNaN(processedValue)) {
                // NaNの場合は0にリセット
                processedValue = 0; 
            }
        }

        setPackData(prev => ({ 
            ...prev, 
            [name]: processedValue 
        }));
    }, []);

    // フォームデータの変更ハンドラ（Selectコンポーネント用）
    const handleSelectChange = useCallback((e: SelectChangeEvent<PackType>) => {
        const { name, value } = e.target;
        
        // PackTypeは文字列なのでそのまま利用
        setPackData(prev => ({ 
            ...prev, 
            [name]: value as PackType 
        }));
    }, []);
    
    // PackDataを外部から完全に上書きする関数（初期ロードやプリセットロード用）
    const setFormData = useCallback((newPack: Pack) => {
        setPackData(newPack);
    }, []);


    return useMemo(() => ({
        packData,
        setFormData,
        handleInputChange,
        handleSelectChange,
    }), [packData, setFormData, handleInputChange, handleSelectChange]);
};