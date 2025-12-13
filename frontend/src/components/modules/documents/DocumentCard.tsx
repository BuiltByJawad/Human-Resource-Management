"use client";

import React from 'react';
import { CompanyDocument, documentService } from '@/services/documentService';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DocumentTextIcon, ArrowDownTrayIcon, TrashIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';

interface DocumentCardProps {
    doc: CompanyDocument;
    isAdmin?: boolean;
    onDelete?: () => void;
}

export const DocumentCard: React.FC<DocumentCardProps> = ({ doc, isAdmin, onDelete }) => {

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this document?')) return;
        try {
            await documentService.deleteDocument(doc.id);
            if (onDelete) onDelete();
        } catch (error) {
            console.error('Failed to delete document:', error);
        }
    };

    return (
        <Card className="shadow-sm hover:shadow-md transition-shadow group bg-white">
            <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                            <DocumentTextIcon className="w-5 h-5" />
                        </div>
                        <div>
                            <CardTitle className="text-base font-medium line-clamp-1">{doc.title}</CardTitle>
                            <CardDescription className="text-xs">
                                {format(new Date(doc.createdAt), 'MMM d, yyyy')} • {doc.type}
                            </CardDescription>
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-gray-500 line-clamp-2 min-h-[40px]">
                    {doc.description || 'No description provided.'}
                </p>
            </CardContent>
            <CardFooter className="pt-2 flex justify-between border-t bg-gray-50">
                <Badge variant="secondary" className="text-xs font-normal">
                    {doc.category}
                </Badge>
                <div className="flex gap-2">
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => window.open(doc.fileUrl, '_blank')}>
                        <ArrowDownTrayIcon className="w-4 h-4 text-gray-600" />
                    </Button>
                    {isAdmin && (
                        <Button size="icon" variant="ghost" className="h-8 w-8 hover:text-red-600" onClick={handleDelete}>
                            <TrashIcon className="w-4 h-4" />
                        </Button>
                    )}
                </div>
            </CardFooter>
        </Card>
    );
};
