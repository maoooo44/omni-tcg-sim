/**
 * src/features/packs/hooks/usePackForm.ts
 *
 * PackEditorPageのフォーム入力と状態管理 (PackData) を担うカスタムフック。
 * テキスト入力、数値入力、Selectコンポーネントからの変更を処理し、
 * Packオブジェクトの状態を維持する。フォームの状態管理と型変換の責務を持つ。
 */

import { useState, useCallback, useMemo } from 'react';
import type { Pack, PackType } from '../../../models/pack';
import type { SelectChangeEvent } from '@mui/material';

/**
 * PackEditorPageのフォーム入力と状態管理（PackData）を担うカスタムフック
 * @param initialPack - 初期値として設定するPackオブジェクト
 */
export const usePackForm = (initialPack: Pack) => {
    // フォームの状態（Packオブジェクト全体）
    const [packData, setPackData] = useState<Pack>(initialPack);

    // フォームデータの変更ハンドラ（テキスト入力、数値入力）
    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        
        // 数値入力フィールドの型変換ロジックをここに集約
        let processedValue: string | number | null = value;

        if (type === 'number') {
            // valueは必ずstring（または空文字列）であるため、value === nullは不要
            if (value === '') {
                // 'number'プロパティ（図鑑No./ソート順）はnullを許容
                processedValue = name === 'number' ? null : 0;
            } else {
                const numValue = parseFloat(value);
                
                if (isNaN(numValue)) {
                    // 不正な値（例: '-'のみ）の場合
                    processedValue = name === 'number' ? null : 0;
                } else {
                    // 正常な数値
                    processedValue = numValue;
                }
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
        setPackData, 
    }), [packData, setFormData, handleInputChange, handleSelectChange]);
};