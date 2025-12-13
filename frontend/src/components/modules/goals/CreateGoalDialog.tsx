"use client";

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { goalsService } from '@/services/goalsService';
import { PlusIcon } from '@heroicons/react/24/outline';

interface CreateGoalDialogProps {
    onSuccess?: () => void;
}

export const CreateGoalDialog: React.FC<CreateGoalDialogProps> = ({ onSuccess }) => {
    const [open, setOpen] = useState(false);
    const [title, setTitle] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await goalsService.createGoal({ title, status: 'in-progress' });
            setOpen(false);
            setTitle('');
            if (onSuccess) onSuccess();
        } catch (error) {
            console.error('Failed to create goal:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <PlusIcon className="w-4 h-4 mr-2" />
                    New Goal
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Set New Performance Goal</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">Goal Objective</Label>
                        <Input
                            id="title"
                            placeholder="e.g. Increase Customer Satisfaction"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                        />
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Creating...' : 'Create Goal'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};
