"use client";

import React, { useEffect, useState } from 'react';
import { documentService, CompanyDocument } from '@/services/documentService';
import { DocumentCard } from '@/components/modules/documents/DocumentCard';
import { UploadDocumentDialog } from '@/components/modules/documents/UploadDocumentDialog';
import Sidebar from '@/components/ui/Sidebar';
import Header from '@/components/ui/Header';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

const categories = ['All', 'HR Policy', 'IT Policy', 'Handbook', 'Form', 'Other'];

export default function DocumentsPage() {
    const [mounted, setMounted] = useState(false);
    const [documents, setDocuments] = useState<CompanyDocument[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('All');
    const isAdmin = true;

    useEffect(() => {
        setMounted(true);
    }, []);

    const loadDocuments = async () => {
        setLoading(true);
        try {
            const data = await documentService.getDocuments();
            setDocuments(data || []);
        } catch (error) {
            console.error('Failed to load documents:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (mounted) {
            loadDocuments();
        }
    }, [mounted]);

    const filteredDocs = documents.filter(doc => {
        const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            doc.category.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === 'All' || doc.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    if (!mounted) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-50 flex">
            <Sidebar />
            <div className="flex-1 flex flex-col">
                <Header />
                <main className="flex-1 p-6">
                    <div className="max-w-7xl mx-auto">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Company Documents</h1>
                                <p className="text-gray-600">Access policies, handbooks, and forms.</p>
                            </div>
                            {isAdmin && <UploadDocumentDialog onSuccess={loadDocuments} />}
                        </div>

                        <div className="flex flex-col md:flex-row gap-4 mb-6">
                            <div className="relative flex-1 max-w-sm">
                                <MagnifyingGlassIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                                <input
                                    type="text"
                                    placeholder="Search documents..."
                                    className="pl-9 pr-4 py-2 w-full border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="flex gap-2 overflow-x-auto pb-2">
                                {categories.map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => setSelectedCategory(cat)}
                                        className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${selectedCategory === cat
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-white text-gray-700 hover:bg-gray-100 border'
                                            }`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {loading ? (
                            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} className="h-40 bg-gray-100 rounded-lg animate-pulse" />
                                ))}
                            </div>
                        ) : filteredDocs.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                {filteredDocs.map(doc => (
                                    <DocumentCard
                                        key={doc.id}
                                        doc={doc}
                                        isAdmin={isAdmin}
                                        onDelete={loadDocuments}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-20 text-gray-500 border-2 border-dashed rounded-xl bg-white">
                                <p>No documents found matching your criteria.</p>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}
