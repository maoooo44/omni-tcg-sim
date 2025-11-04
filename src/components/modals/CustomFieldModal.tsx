/**
 * src/components/modals/CustomFieldModal.tsx
 *
 * * カスタムフィールド設定の管理リスト。ドラッグ＆ドロップ (D&D) でフィールドの表示名と表示順序を設定するモーダルコンポーネント。
 * * 責務:
 * 1. 親から渡された全フィールド情報 (`allFieldInfo`) を基に、現在の設定（表示名、順序、表示/非表示）と未設定フィールドを組み合わせたローカル状態 (`localSettings`) を構築・管理する。
 * 2. `SortableItem` コンポーネントを通じて、個々のフィールドの**表示/非表示（チェックボックス）**、表示名入力、D&D によるリストの再順序付けを可能にする UI を提供する。
 * 3. 「設定を保存」時、ローカル状態と初期設定を比較し、変更（新規設定、更新、削除、順序変更、**表示/非表示の変更**）があったフィールドのみを `onSettingChange` コールバックを通じて親コンポーネントに通知する。
 * 4. Material-UI の Dialog を使用したモーダルとしての表示・非表示、およびキャンセル/保存時のクローズ動作を制御する。
 */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, Button, Typography, Box, Grid, Switch,
    FormControlLabel,
} from '@mui/material';
import ReorderIcon from '@mui/icons-material/Reorder';

import {
    DndContext,
    closestCenter,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent
} from '@dnd-kit/core';
import {
    SortableContext,
    useSortable,
    verticalListSortingStrategy,
    arrayMove
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import type { FieldSetting, CustomFieldType } from '../../models/customField';
import type { CustomFieldKeys, CustomFieldInfo } from '../controls/CustomFieldManager';
import { MODAL_WIDTH, MODAL_HEIGHT } from '../../configs/configs';


// ----------------------------------------
// 型定義 
// ----------------------------------------
export type AllFieldInfo = CustomFieldInfo & {
    setting: FieldSetting | undefined;
};

interface LocalFieldSetting extends AllFieldInfo {
    displayName: string;
    // フィールドの表示・非表示の状態をローカルで管理
    isVisible: boolean;
}

export interface CustomFieldModalProps {
    isOpen: boolean;
    onClose: () => void;
    itemType: 'Card' | 'Deck' | 'Pack';
    onSettingChange: (
        itemType: 'Card' | 'Deck' | 'Pack',
        type: CustomFieldType,
        index: number,
        settingUpdates: Partial<FieldSetting>
    ) => void;
    allFieldInfo: AllFieldInfo[];
}

// ----------------------------------------
// Sortableアイテムコンポーネント 
// ----------------------------------------

interface SortableItemProps {
    field: LocalFieldSetting;
    handleDisplayNameChange: (fieldKey: CustomFieldKeys, newDisplayName: string) => void;
    // isVisible 変更ハンドラ
    handleVisibleChange: (fieldKey: CustomFieldKeys, newIsVisible: boolean) => void;
}

const SortableItem: React.FC<SortableItemProps> = ({ field, handleDisplayNameChange, handleVisibleChange }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: field.fieldKey });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : 1,
        opacity: isDragging ? 0.9 : 1,
        p: 1,
    };

    const isActive = field.isVisible;
    const physicalName = `${field.type.toUpperCase()} ${field.index} (${field.fieldKey})`;

    return (
        <Grid
            // 1列表示
            size={12}
            ref={setNodeRef}
            style={style}
        >
            <Box
                sx={{
                    p: 1,
                    display: 'flex',
                    alignItems: 'center',
                    border: isDragging ? '1px dashed primary.main' : '1px solid #eee',
                    borderRadius: 1,
                    // isVisible で背景色を制御
                    bgcolor: isActive ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 0, 0, 0.05)',
                    opacity: isActive ? 1 : 0.6,
                }}
            >
                {/* ドラッグハンドル（三本線） */}
                <Box
                    sx={{
                        cursor: 'grab',
                        p: 1,
                        mr: 1,
                        display: 'flex',
                        alignItems: 'center',
                        color: 'text.secondary',
                        '&:hover': { color: 'primary.main' },
                        flexShrink: 0,
                    }}
                    // isVisible が false の場合はD&Dを無効化 (見た目上)
                    {...attributes}
                    {...listeners}
                >
                    <ReorderIcon />
                </Box>

                {/* 表示/非表示の切り替えスイッチ */}
                <FormControlLabel
                    control={
                        <Switch
                            checked={field.isVisible}
                            onChange={(e) => handleVisibleChange(field.fieldKey, e.target.checked)}
                            // 入力中に D&D が発動しないように onMouseDown を設定
                            onMouseDown={(e) => e.stopPropagation()}
                        />
                    }
                    label={
                        <Typography variant="body2" sx={{ width: '60px', flexShrink: 0 }}>
                            {field.isVisible ? '表示' : '非表示'}
                        </Typography>
                    }
                    sx={{ mr: 2 }}
                />

                {/* 入力フォーム */}
                <TextField
                    fullWidth
                    // ラベルを物理名に変更。displayNameは値として扱う
                    label={physicalName}
                    placeholder="カスタムフィールド名"
                    value={field.displayName}
                    onChange={(e) => handleDisplayNameChange(field.fieldKey, e.target.value)}
                    size="small"
                    // 入力中に D&D が発動しないように onMouseDown を設定
                    onMouseDown={(e) => e.stopPropagation()}
                />
            </Box>
        </Grid>
    );
};


// ----------------------------------------
// コンポーネント本体
// ----------------------------------------

const CustomFieldModal: React.FC<CustomFieldModalProps> = ({
    isOpen, onClose, itemType, allFieldInfo, onSettingChange
}) => {
    const [localSettings, setLocalSettings] = useState<LocalFieldSetting[]>([]);

    // DndContextのためのセンサー設定
    const sensors = useSensors(
        useSensor(PointerSensor, {
            // センサーの距離を小さくし、純粋なクリックではないことを強調
            activationConstraint: { distance: 5 }
        })
    );

    // allFieldInfo の変更時にローカル状態を構築/リセット
    useEffect(() => {
        // 1. 設定済み (orderを持つ) フィールドを order 順にソートする (既存の設定を尊重)
        // 2. 未設定フィールドを物理名順にソートする (新規フィールドを分かりやすく配置)
        // 3. 結合し、ローカル状態とする。

        const fieldsWithLocalData = allFieldInfo.map(f => ({
            ...f,
            displayName: f.setting?.displayName || '',
            isVisible: f.setting?.isVisible ?? false, // 初期値は設定があればその値、なければ false
        }));
        
        // 1. 設定済みフィールド (orderがある)
        const orderedFields = fieldsWithLocalData
            .filter(f => f.setting?.order !== undefined)
            .sort((a, b) => a.setting!.order! - b.setting!.order!);
            
        // 2. 未設定フィールド (orderがない) - isVisible: false のものを含む
        const unorderedFields = fieldsWithLocalData
            .filter(f => f.setting?.order === undefined)
            .sort((a, b) => {
                // 物理名順
                if (a.type !== b.type) return a.type === 'num' ? -1 : 1;
                return a.index - b.index;
            });
            
        // 設定済み > 未設定 の順に結合し、順序付けの初期状態とする
        setLocalSettings([...orderedFields, ...unorderedFields]);

    }, [allFieldInfo]);


    // 表示名変更ハンドラ (SortableItemに渡す)
    const handleDisplayNameChange = useCallback((fieldKey: CustomFieldKeys, newDisplayName: string) => {
        setLocalSettings(prev => prev.map(f =>
            f.fieldKey === fieldKey
                ? { ...f, displayName: newDisplayName }
                : f
        ));
    }, []);

    // isVisible 変更ハンドラ。配列順序はそのまま維持。
    const handleVisibleChange = useCallback((fieldKey: CustomFieldKeys, newIsVisible: boolean) => {
        setLocalSettings(prev => prev.map(f =>
            f.fieldKey === fieldKey
                ? { ...f, isVisible: newIsVisible }
                : f
        ));
    }, []);


    /**
     * D&D終了時の処理
     */
    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (active.id !== over?.id) {
            setLocalSettings(prev => {
                const oldIndex = prev.findIndex(f => f.fieldKey === active.id);
                const newIndex = prev.findIndex(f => f.fieldKey === over?.id);

                if (oldIndex !== -1 && newIndex !== -1) {
                    // 配列の並び替えに arrayMove を使用
                    return arrayMove(prev, oldIndex, newIndex);
                }
                return prev;
            });
        }
    };


    // 保存処理
    const handleSave = () => {
        localSettings.forEach((field, index) => {
            const initialFieldInfo = allFieldInfo.find(f => f.fieldKey === field.fieldKey);
            const initialSetting = initialFieldInfo?.setting;

            // 初期値（保存済みの値、または空）
            const initialDisplayName = initialSetting?.displayName || '';
            const initialIsVisible = initialSetting?.isVisible ?? false;
            const initialOrder = initialSetting?.order;

            // ローカル状態の値
            let newDisplayName = field.displayName.trim();
            const newIsVisible = field.isVisible;

            // isVisible: true のフィールドにのみ順序を設定する（非表示フィールドの順序は保存しない）
            // newIsVisible が true の場合、現在のインデックス+1を順序とする。
            const newCurrentOrder = newIsVisible ? (index + 1) : undefined;
            
            const updates: Partial<FieldSetting> = {};
            let hasChange = false;

            // 1. データ完全性ロジック (維持): isVisible: true の場合、displayName が空なら自動で物理名を設定
            if (newIsVisible && newDisplayName === '') {
                newDisplayName = `${field.type.toUpperCase()} ${field.index}`;
            }

            // 2. isVisible の変更チェック
            if (newIsVisible !== initialIsVisible) {
                updates.isVisible = newIsVisible;
                hasChange = true;
            }

            // 3. displayName の変更チェック
            if (newDisplayName !== initialDisplayName) {
                updates.displayName = newDisplayName;
                hasChange = true;
            }

            // 4. order の変更チェック/クリア
            if (newIsVisible) {
                // 表示が有効: 新しい順序 (newCurrentOrder) が初期値と違う、または初期値がなかった場合
                if (newCurrentOrder !== initialOrder) {
                    updates.order = newCurrentOrder;
                    hasChange = true;
                }
            } else {
                // 表示が無効: 以前 order が設定されていた場合は undefined で明示的にクリアする
                if (initialOrder !== undefined) {
                    updates.order = undefined; 
                    hasChange = true;
                }
            }

            // 変更があったフィールドのみ onSettingChange を呼び出す
            if (hasChange && initialFieldInfo) {
                onSettingChange(itemType, initialFieldInfo.type, initialFieldInfo.index, updates);
            }
        });

        onClose();
    };

    const handleCancel = () => {
        onClose();
    };

    // SortableContext に渡すIDのリスト
    const items = useMemo(() => localSettings.map(f => f.fieldKey), [localSettings]);

    // isVisible: true のフィールド数をカウント
    const activeCount = localSettings.filter(f => f.isVisible).length;


    return (
        <Dialog
            open={isOpen}
            onClose={handleCancel}
            sx={{
                            '& .MuiDialog-paper': { // PaperComponent のスタイルを上書き
                                width: MODAL_WIDTH,
                                maxWidth: MODAL_WIDTH, // 念のため maxWidth も設定
                                height: MODAL_HEIGHT,
                                maxHeight: MODAL_HEIGHT, // 念のため maxHeight も設定
                            }
                        }}
        >
            <DialogTitle>カスタムフィールド設定の管理</DialogTitle>
            <DialogContent dividers>
                <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" sx={{ mt: 1, fontWeight: 'bold' }}>
                        現在表示中のフィールド: {activeCount} / {localSettings.length}
                    </Typography>
                </Box>

                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                    autoScroll={false}
                >
                    <SortableContext
                        items={items}
                        // 縦軸固定の verticalListSortingStrategy を適用
                        strategy={verticalListSortingStrategy}
                    >
                        <Grid container spacing={1}>
                            {localSettings.map((field) => (
                                <SortableItem
                                    key={field.fieldKey}
                                    field={field}
                                    handleDisplayNameChange={handleDisplayNameChange}
                                    handleVisibleChange={handleVisibleChange} 
                                />
                            ))}
                        </Grid>
                    </SortableContext>
                </DndContext>

            </DialogContent>
            <DialogActions>
                <Button onClick={handleCancel} color="inherit">
                    キャンセル
                </Button>
                <Button
                    onClick={handleSave}
                    color="primary"
                    variant="contained"
                >
                    設定を保存
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default CustomFieldModal;