/**
 * src/components/modals/CustomFieldModal.tsx
 * * カスタムフィールド設定の管理リスト。ドラッグ＆ドロップで表示名と順序を設定。
 */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
    Dialog, DialogTitle, DialogContent, DialogActions, 
    TextField, Button, Typography, Box, Grid, 
} from '@mui/material';
import ReorderIcon from '@mui/icons-material/Reorder'; 

// 💡 D&D ライブラリのインポート
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

// ----------------------------------------
// 型定義 (変更なし)
// ----------------------------------------
export type AllFieldInfo = CustomFieldInfo & { 
    setting: FieldSetting | undefined; 
};

interface LocalFieldSetting extends AllFieldInfo {
    displayName: string;
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
// Sortableアイテムコンポーネント (変更なし)
// ----------------------------------------

interface SortableItemProps {
    field: LocalFieldSetting;
    handleDisplayNameChange: (fieldKey: CustomFieldKeys, newDisplayName: string) => void;
}

const SortableItem: React.FC<SortableItemProps> = ({ field, handleDisplayNameChange }) => {
    // fieldKey を一意のIDとして利用
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: field.fieldKey });
    
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : 1, 
        opacity: isDragging ? 0.9 : 1, 
        p: 1, 
    };

    const isSet = !!field.setting?.displayName;

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
                    bgcolor: isSet ? 'rgba(0, 0, 0, 0.02)' : 'transparent',
                }}
            >
                {/* 💡 ドラッグハンドル（三本線）: attributes/listeners を適用し、ドラッグ専用にする */}
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
                    {...attributes} 
                    {...listeners} 
                >
                    <ReorderIcon />
                </Box>

                {/* 入力フォーム */}
                <TextField
                    fullWidth
                    label={`${field.fieldKey} (表示名)`} 
                    placeholder="表示名 (空で削除)"
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
        const sortedInfo = [...allFieldInfo].sort((a, b) => {
            if (a.type !== b.type) {
                return a.type === 'num' ? -1 : 1; 
            }
            return a.index - b.index;
        });

        const currentActiveFields = sortedInfo
            .filter(f => f.setting?.displayName)
            .map(f => ({ ...f, displayName: f.setting!.displayName })); 
        
        currentActiveFields.sort((a, b) => {
            const aOrder = a.setting?.order ?? Infinity;
            const bOrder = b.setting?.order ?? Infinity;
            return aOrder - bOrder;
        });
        
        const unusedFields = sortedInfo
            .filter(f => !f.setting?.displayName)
            .map(f => ({ ...f, displayName: '' })); 

        setLocalSettings([...currentActiveFields, ...unusedFields]);

    }, [allFieldInfo]);


    // 表示名変更ハンドラ (SortableItemに渡す)
    const handleDisplayNameChange = useCallback((fieldKey: CustomFieldKeys, newDisplayName: string) => { 
        setLocalSettings(prev => prev.map(f => 
            f.fieldKey === fieldKey 
                ? { ...f, displayName: newDisplayName } 
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
        const changes: Record<CustomFieldKeys, Partial<FieldSetting>> = {} as Record<CustomFieldKeys, Partial<FieldSetting>>;
        
        localSettings.forEach((field, index) => {
            const initialSetting = allFieldInfo.find(f => f.fieldKey === field.fieldKey)?.setting;
            const initialDisplayName = initialSetting?.displayName.trim() || '';
            const newDisplayName = field.displayName.trim();

            const initialOrder = initialSetting?.order;
            const newOrder = index + 1;

            const updates: Partial<FieldSetting> = {};

            // 1. displayName の変更・新規設定・削除チェック
            if (newDisplayName !== initialDisplayName) {
                updates.displayName = newDisplayName;
            }

            // 2. order の変更チェック
            if (newOrder !== initialOrder) {
                 updates.order = newOrder;
            }
            
            if (Object.keys(updates).length > 0 || (newDisplayName === '' && initialDisplayName !== '')) {
                changes[field.fieldKey] = updates;
            }
        });

        // onSettingChange を呼び出す
        Object.entries(changes).forEach(([fieldKey, updates]) => {
            const fieldInfo = allFieldInfo.find(f => f.fieldKey === fieldKey);
            if (fieldInfo) {
                onSettingChange(itemType, fieldInfo.type, fieldInfo.index, updates);
            }
        });
        
        onClose();
    };

    const handleCancel = () => {
        onClose();
    };
    
    // SortableContext に渡すIDのリスト
    const items = useMemo(() => localSettings.map(f => f.fieldKey), [localSettings]);


    return (
        <Dialog 
            open={isOpen} 
            onClose={handleCancel} 
            maxWidth="lg" 
            fullWidth
        >
            <DialogTitle>カスタムフィールド設定の管理（ドラッグ＆ドロップ）</DialogTitle>
            <DialogContent dividers>
                <Box sx={{ mb: 2 }}>
                    <Typography variant="caption" color="textSecondary">
                        **{itemType}** のカスタムフィールドの**表示名**と**表示順序**を管理します。**三本線アイコンをドラッグ**して**縦方向のみ**順序を変更できます。表示名を空にして保存すると、その設定は**削除**されます。
                        <br/>
                        *注: ドラッグ中の自動スクロール機能は無効にしました。*
                    </Typography>
                </Box>
                
                <DndContext 
                    sensors={sensors} 
                    collisionDetection={closestCenter} 
                    onDragEnd={handleDragEnd}
                    // 💡 修正: 自動スクロールを完全に無効化
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