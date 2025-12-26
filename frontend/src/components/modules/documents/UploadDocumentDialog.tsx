"use client";

import React, { useState } from 'react';
import { useForm, Controller, type Resolver } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/FormComponents';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { documentService } from '@/services/documentService';
import { PlusIcon } from '@heroicons/react/24/outline';

interface UploadDocumentDialogProps {
    onSuccess?: () => void;
}

const uploadDocumentSchema = yup.object({
    title: yup.string().trim().required('Title is required'),
    category: yup.string().trim().required('Category is required'),
    fileUrl: yup.string().trim().url('Enter a valid URL (https://...)').required('File URL is required'),
    description: yup.string().max(500, 'Description must be 500 characters or less').nullable().notRequired()
});

type UploadDocumentFormValues = {
    title: string;
    category: string;
    fileUrl: string;
    description?: string | null;
};

const FieldLabel = ({ htmlFor, children, required }: { htmlFor?: string; children: React.ReactNode; required?: boolean }) => (
    <label
        htmlFor={htmlFor}
        className="flex items-center text-sm font-medium text-gray-700 gap-1"
    >
        <span>{children}</span>
        {required && <span className="text-red-500" aria-hidden="true">*</span>}
    </label>
);

export const UploadDocumentDialog: React.FC<UploadDocumentDialogProps> = ({ onSuccess }) => {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const {
        register,
        control,
        handleSubmit,
        reset,
        formState: { errors }
    } = useForm<UploadDocumentFormValues>({
        resolver: yupResolver(uploadDocumentSchema) as unknown as Resolver<UploadDocumentFormValues>,
        defaultValues: {
            title: '',
            description: '',
            category: 'HR Policy',
            fileUrl: ''
        }
    });

    const inferDocumentType = (url: string) => {
        try {
            const parsed = new URL(url)
            const extension = parsed.pathname.split('.').pop()
            if (!extension) return 'PDF'
            return extension.toUpperCase()
        } catch {
            const fallbackExtension = url.split('?')[0]?.split('.').pop()
            return fallbackExtension ? fallbackExtension.toUpperCase() : 'PDF'
        }
    }

    const onSubmit = async (values: UploadDocumentFormValues) => {
        setLoading(true);
        try {
            await documentService.uploadDocument({
                title: values.title.trim(),
                category: values.category.trim(),
                fileUrl: values.fileUrl.trim(),
                description: values.description?.trim() || undefined,
                type: inferDocumentType(values.fileUrl)
            });
            setOpen(false);
            reset();
            if (onSuccess) onSuccess();
        } catch (error) {
            if (process.env.NODE_ENV !== 'production') {
                console.error('Failed to upload document:', error);
            }
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
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <FieldLabel htmlFor="title" required>Title</FieldLabel>
                        <Input
                            id="title"
                            required
                            error={errors.title?.message}
                            {...register('title')}
                        />
                    </div>

                    <div className="space-y-2">
                        <FieldLabel htmlFor="category" required>Category</FieldLabel>
                        <Controller
                            control={control}
                            name="category"
                            render={({ field }) => (
                                <>
                                    <Select value={field.value} onValueChange={field.onChange}>
                                        <SelectTrigger className={`${errors.category ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}`}>
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
                                    {errors.category && <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>}
                                </>
                            )}
                        />
                    </div>

                    <div className="space-y-2">
                        <FieldLabel htmlFor="fileUrl" required>File URL (Demo)</FieldLabel>
                        <Input
                            id="fileUrl"
                            placeholder="https://..."
                            required
                            error={errors.fileUrl?.message}
                            {...register('fileUrl')}
                        />
                        <p className="text-xs text-gray-500">Enter a public URL for demonstration.</p>
                    </div>

                    <div className="space-y-2">
                        <FieldLabel htmlFor="description">Description</FieldLabel>
                        <Input
                            id="description"
                            error={errors.description?.message}
                            {...register('description')}
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
