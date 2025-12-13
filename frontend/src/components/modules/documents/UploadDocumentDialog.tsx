"use client";

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { documentService } from '@/services/documentService';
import { PlusIcon } from '@heroicons/react/24/outline';

interface UploadDocumentDialogProps {
    onSuccess?: () => void;
}

export const UploadDocumentDialog: React.FC<UploadDocumentDialogProps> = ({ onSuccess }) => {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: 'HR Policy',
        fileUrl: '',
        type: 'PDF'
    });

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await documentService.uploadDocument(formData);
            setOpen(false);
            setFormData({ title: '', description: '', category: 'HR Policy', fileUrl: '', type: 'PDF' });
            if (onSuccess) onSuccess();
        } catch (error) {
            console.error('Failed to upload document:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <PlusIcon className="w-4 h-4 mr-2" />
                    Upload Document
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Upload New Document</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">Title</Label>
                        <Input
                            id="title"
                            value={formData.title}
                            onChange={(e) => handleChange('title', e.target.value)}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="category">Category</Label>
                        <Select onValueChange={(val) => handleChange('category', val)} defaultValue={formData.category}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="HR Policy">HR Policy</SelectItem>
                                <SelectItem value="IT Policy">IT Policy</SelectItem>
                                <SelectItem value="Handbook">Handbook</SelectItem>
                                <SelectItem value="Form">Form</SelectItem>
                                <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="url">File URL (Demo)</Label>
                        <Input
                            id="url"
                            placeholder="https://..."
                            value={formData.fileUrl}
                            onChange={(e) => handleChange('fileUrl', e.target.value)}
                            required
                        />
                        <p className="text-xs text-gray-500">Enter a public URL for demonstration.</p>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="desc">Description</Label>
                        <Input
                            id="desc"
                            value={formData.description}
                            onChange={(e) => handleChange('description', e.target.value)}
                        />
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Uploading...' : 'Upload'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};
