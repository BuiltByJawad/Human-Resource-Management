"use client";

import React, { useState } from 'react';
import { KeyResult, goalsService } from '@/services/goalsService';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CheckIcon, PencilIcon } from '@heroicons/react/24/outline';

interface KeyResultListProps {
    keyResults: KeyResult[];
    onUpdate?: () => void;
}

export const KeyResultList: React.FC<KeyResultListProps> = ({ keyResults, onUpdate }) => {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editValue, setEditValue] = useState<number>(0);

    const startEdit = (kr: KeyResult) => {
        setEditingId(kr.id);
        setEditValue(kr.currentValue);
    };

    const saveProgress = async (id: string) => {
        try {
            await goalsService.updateKeyResultProgress(id, editValue);
            setEditingId(null);
            if (onUpdate) onUpdate();
        } catch (error) {
            console.error('Failed to update progress:', error);
        }
    };

    if (keyResults.length === 0) return <div className="text-sm text-gray-400 italic">No key results defined.</div>;

    return (
        <div className="space-y-4 mt-2">
            {keyResults.map(kr => {
                const percentage = Math.min((kr.currentValue / kr.targetValue) * 100, 100);
                return (
                    <div key={kr.id} className="space-y-1">
                        <div className="flex justify-between items-center text-sm">
                            <span className="font-medium">{kr.description}</span>
                            <div className="flex items-center gap-2">
                                {editingId === kr.id ? (
                                    <div className="flex items-center gap-1">
                                        <Input
                                            type="number"
                                            className="h-6 w-16 text-right"
                                            value={editValue}
                                            onChange={(e) => setEditValue(Number(e.target.value))}
                                        />
                                        <span className="text-xs text-gray-500">/ {kr.targetValue} {kr.unit}</span>
                                        <Button size="icon" variant="ghost" className="h-6 w-6 text-green-600" onClick={() => saveProgress(kr.id)}>
                                            <CheckIcon className="w-3 h-3" />
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <span className="text-gray-600">{kr.currentValue} / {kr.targetValue} {kr.unit}</span>
                                        <Button size="icon" variant="ghost" className="h-6 w-6 text-blue-600" onClick={() => startEdit(kr)}>
                                            <PencilIcon className="w-3 h-3" />
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                        <Progress value={percentage} className="h-1.5" />
                    </div>
                );
            })}
        </div>
    );
};
