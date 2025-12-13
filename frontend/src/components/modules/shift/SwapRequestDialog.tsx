"use client";

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Shift, shiftService } from '@/services/shiftService';
import { ArrowsRightLeftIcon } from '@heroicons/react/24/outline';

interface SwapRequestDialogProps {
    shift: Shift;
    onSuccess?: () => void;
}

export const SwapRequestDialog: React.FC<SwapRequestDialogProps> = ({ shift, onSuccess }) => {
    const [open, setOpen] = useState(false);
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await shiftService.requestSwap(shift.id, reason);
            setOpen(false);
            if (onSuccess) onSuccess();
        } catch (error) {
            console.error('Failed to submit swap request:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="w-full">
                    <ArrowsRightLeftIcon className="w-4 h-4 mr-2" />
                    Request Swap
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Request Shift Swap</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label>Shift Details</Label>
                        <div className="p-2 bg-slate-50 rounded text-sm">
                            {new Date(shift.startTime).toLocaleString()}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="reason">Reason for Swap</Label>
                        <Input
                            id="reason"
                            placeholder="e.g., Doctor appointment"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            required
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Submitting...' : 'Submit Request'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};
