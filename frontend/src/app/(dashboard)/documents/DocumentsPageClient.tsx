"use client"

import { useCallback } from "react"
import { FolderIcon } from "@heroicons/react/24/outline"
import type { CompanyDocument } from "@/services/documents/types"
import { useDocumentsAdmin } from "@/hooks/useDocumentsAdmin"
import { AdminDocumentCard, AdminUploadModal } from "@/components/features/documents"

interface DocumentsPageClientProps {
    initialDocuments: CompanyDocument[]
}

export function DocumentsPageClient({ initialDocuments }: DocumentsPageClientProps) {
    const {
        filteredDocuments,
        filterCategory,
        setFilterCategory,
        categories,
        showUploadModal,
        setShowUploadModal,
        selectedFile,
        setSelectedFile,
        uploadForm,
        setUploadForm,
        isSubmitting,
        fileInputRef,
        handleFileSelect,
        handleUpload,
        handleToggleVisibility,
        handleDelete,
    } = useDocumentsAdmin({ initialDocuments })

    const formatDate = useCallback((dateStr: string) => {
        return new Date(dateStr).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        })
    }, [])

    return (
        <div className="p-4 sm:p-6">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Company Documents</h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Manage policies, handbooks, and other company documents
                        </p>
                    </div>
                    <button
                        onClick={() => setShowUploadModal(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                    >
                        Upload Document
                    </button>
                </div>

                {/* Filter */}
                <div className="mb-6 flex flex-wrap gap-2">
                    <button
                        onClick={() => setFilterCategory("")}
                        className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors ${!filterCategory
                                ? "bg-blue-600 text-white"
                                : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                            }`}
                    >
                        All
                    </button>
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setFilterCategory(cat)}
                            className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors ${filterCategory === cat
                                    ? "bg-blue-600 text-white"
                                    : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* Documents Grid */}
                {filteredDocuments.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-xl border border-gray-100 shadow-sm">
                        <FolderIcon className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-4 text-lg font-medium text-gray-900">No documents</h3>
                        <p className="mt-2 text-sm text-gray-500">
                            {filterCategory
                                ? `No documents in the "${filterCategory}" category.`
                                : "Upload your first company document."}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredDocuments.map((doc) => (
                            <AdminDocumentCard
                                key={doc.id}
                                doc={doc}
                                onToggleVisibility={handleToggleVisibility}
                                onDelete={handleDelete}
                                formatDate={formatDate}
                            />
                        ))}
                    </div>
                )}

                {/* Upload Modal */}
                <AdminUploadModal
                    isOpen={showUploadModal}
                    onClose={() => {
                        setShowUploadModal(false)
                        setUploadForm({ title: "", description: "", category: categories[0] ?? "" })
                        setSelectedFile(null)
                    }}
                    onUpload={handleUpload}
                    isSubmitting={isSubmitting}
                    selectedFile={selectedFile}
                    onFileSelect={handleFileSelect}
                    uploadForm={uploadForm}
                    onFormChange={setUploadForm}
                    fileInputRef={fileInputRef}
                    categories={categories}
                />
            </div>
        </div>
    )
}
