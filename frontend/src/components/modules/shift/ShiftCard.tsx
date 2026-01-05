"use client";

import React from 'react';
import { format } from 'date-fns';
import { Shift } from '@/features/shifts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ClockIcon, MapPinIcon } from '@heroicons/react/24/outline';
import { SwapRequestDialog } from './SwapRequestDialog';

interface ShiftCardProps {
    shift: Shift;
    onSwapRequest?: () => void;
}

export const ShiftCard: React.FC<ShiftCardProps> = ({ shift, onSwapRequest }) => {
    const start = new Date(shift.startTime);
    const end = new Date(shift.endTime);

    const getVariant = (type: string): 'default' | 'secondary' | 'destructive' => {
        switch (type) {
            case 'Overtime': return 'destructive';
            case 'OnCall': return 'secondary';
            default: return 'default';
        }
    };

    return (
        <Card className="mb-4 shadow-sm hover:shadow-md transition-shadow bg-white">
            <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-lg font-semibold">{format(start, 'EEEE, MMM d')}</CardTitle>
                        <CardDescription>{shift.type} Shift</CardDescription>
                    </div>
                    <Badge variant={getVariant(shift.type)}>{shift.status}</Badge>
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                        <ClockIcon className="w-4 h-4" />
                        <span>{format(start, 'h:mm a')} - {format(end, 'h:mm a')}</span>
                    </div>
                    {shift.location && (
                        <div className="flex items-center gap-2">
                            <MapPinIcon className="w-4 h-4" />
                            <span>{shift.location}</span>
                        </div>
                    )}
                </div>

                <div className="mt-4 pt-4 border-t">
                    <SwapRequestDialog shift={shift} onSuccess={onSwapRequest} />
                </div>
            </CardContent>
        </Card>
    );
};
