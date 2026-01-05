"use client"

import { useState, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import {
    PlusIcon,
    DocumentTextIcon,
    ArrowLeftIcon,
    FolderIcon,
    ArrowDownTrayIcon,
    EyeIcon,
    EyeSlashIcon,
    TrashIcon,
} from "@heroicons/react/24/outline"
import { useAuth } from "@/features/auth"
import {
    uploadCompanyDocument,
    toggleCompanyDocumentVisibility,
    deleteCompanyDocument,
    type CompanyDocument,
} from "@/features/documents"
import { useToast } from "@/components/ui/ToastProvider"
import { Modal } from "@/components/ui/Modal"
import { Input, TextArea } from "@/components/ui/FormComponents"

interface DocumentsPageClientProps {
    initialDocuments: CompanyDocument[]
}

const categoryColors: Record<string, string> = {
    "HR Policy": "bg-blue-100 text-blue-800",
    "IT Policy": "bg-purple-100 text-purple-800",
    Handbook: "bg-green-100 text-green-800",
    Form: "bg-orange-100 text-orange-800",
    Other: "bg-gray-100 text-gray-800",
}

const categories = ["HR Policy", "IT Policy", "Handbook", "Form", "Other"]

export function DocumentsPageClient({ initialDocuments }: DocumentsPageClientProps) {
    const router = useRouter()
    const { showToast } = useToast()
    const { token } = useAuth()
    const fileInputRef = useRef<HTMLInputElement>(null)

    const [documents, setDocuments] = useState<CompanyDocument[]>(initialDocuments)
    const [showUploadModal, setShowUploadModal] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [filterCategory, setFilterCategory] = useState<string>("")

    const [uploadForm, setUploadForm] = useState({
        title: "",
        description: "",
        category: "HR Policy",
    })

    const filteredDocuments = filterCategory
        ? documents.filter((d) => d.category === filterCategory)
        : documents

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setSelectedFile(file)
            if (!uploadForm.title) {
                setUploadForm((prev) => ({ ...prev, title: file.name.replace(/\.[^/.]+$/, "") }))
            }
        }
    }

    const handleUpload = useCallback(async () => {
        if (!selectedFile || !uploadForm.title.trim()) {
            showToast("Please select a file and enter a title", "error")
            return
        }

        setIsSubmitting(true)
        try {
            const result = await uploadCompanyDocument(
                {
                    file: selectedFile,
                    title: uploadForm.title,
                    description: uploadForm.description || undefined,
                    category: uploadForm.category,
                },
                token ?? undefined,
            )

            setDocuments((prev) => [...prev, result])
            showToast("Document uploaded successfully", "success")
            setShowUploadModal(false)
            setUploadForm({ title: "", description: "", category: "HR Policy" })
            setSelectedFile(null)
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Failed to upload document"
            showToast(message, "error")
        } finally {
            setIsSubmitting(false)
        }
    }, [selectedFile, uploadForm, showToast])

    const handleToggleVisibility = async (doc: CompanyDocument) => {
        try {
            await toggleCompanyDocumentVisibility(doc.id, !doc.isVisible, token ?? undefined)
            setDocuments((prev) =>
                prev.map((d) => (d.id === doc.id ? { ...d, isVisible: !d.isVisible } : d))
            )
            showToast(`Document ${doc.isVisible ? "hidden" : "visible"} to employees`, "success")
        } catch {
            showToast("Failed to update visibility", "error")
        }
    }

    const handleDelete = async (docId: string) => {
        if (!confirm("Are you sure you want to delete this document?")) return

        try {
            await deleteCompanyDocument(docId, token ?? undefined)
            setDocuments((prev) => prev.filter((d) => d.id !== docId))
            showToast("Document deleted", "success")
        } catch {
            showToast("Failed to delete document", "error")
        }
    }

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        })
    }

    return (
        <div className="min-h-screen bg-gray-50/50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
                {/* Header */}
                <div className="mb-6">
                    <button
                        onClick={() => router.back()}
                        className="inline-flex items-center justify-center p-2 rounded-full hover:bg-gray-200 transition-colors text-gray-500 hover:text-gray-900"
                        aria-label="Go back"
                    >
                        <ArrowLeftIcon className="h-6 w-6" />
                    </button>
                </div>

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
                        <PlusIcon className="h-5 w-5" />
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
                            <div
                                key={doc.id}
                                className={`bg-white rounded-xl border shadow-sm hover:shadow-md transition-shadow p-6 ${!doc.isVisible ? "opacity-60 border-dashed" : "border-gray-100"
                                    }`}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <DocumentTextIcon className="h-5 w-5 text-blue-500 flex-shrink-0" />
                                            <h3 className="text-lg font-semibold text-gray-900 truncate">
                                                {doc.title}
                                            </h3>
                                        </div>
                                        <span
                                            className={`inline-block mt-2 px-2 py-0.5 text-xs font-medium rounded-full ${categoryColors[doc.category] || categoryColors.Other
                                                }`}
                                        >
                                            {doc.category}
                                        </span>
                                    </div>
                                </div>

                                {doc.description && (
                                    <p className="mt-3 text-sm text-gray-600 line-clamp-2">{doc.description}</p>
                                )}

                                <div className="mt-4 text-xs text-gray-500">
                                    Uploaded: {formatDate(doc.createdAt)}
                                </div>

                                <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                                    <a
                                        href={doc.fileUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-800"
                                    >
                                        <ArrowDownTrayIcon className="h-4 w-4" />
                                        Download
                                    </a>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleToggleVisibility(doc)}
                                            className={`p-1.5 rounded-lg transition-colors ${doc.isVisible
                                                    ? "text-green-600 hover:bg-green-50"
                                                    : "text-gray-400 hover:bg-gray-100"
                                                }`}
                                            title={doc.isVisible ? "Hide from employees" : "Show to employees"}
                                        >
                                            {doc.isVisible ? (
                                                <EyeIcon className="h-4 w-4" />
                                            ) : (
                                                <EyeSlashIcon className="h-4 w-4" />
                                            )}
                                        </button>
                                        <button
                                            onClick={() => handleDelete(doc.id)}
                                            className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                                            title="Delete document"
                                        >
                                            <TrashIcon className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Upload Modal */}
                <Modal
                    isOpen={showUploadModal}
                    onClose={() => {
                        setShowUploadModal(false)
                        setUploadForm({ title: "", description: "", category: "HR Policy" })
                        setSelectedFile(null)
                    }}
                    title="Upload Company Document"
                >
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                File <span className="text-red-500">*</span>
                            </label>
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 transition-colors"
                            >
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    className="hidden"
                                    onChange={handleFileSelect}
                                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
                                />
                                {selectedFile ? (
                                    <div className="flex items-center justify-center gap-2">
                                        <DocumentTextIcon className="h-8 w-8 text-blue-500" />
                                        <span className="text-sm font-medium text-gray-900">{selectedFile.name}</span>
                                    </div>
                                ) : (
                                    <>
                                        <DocumentTextIcon className="mx-auto h-10 w-10 text-gray-400" />
                                        <p className="mt-2 text-sm text-gray-500">Click to select a file</p>
                                        <p className="text-xs text-gray-400">PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX</p>
                                    </>
                                )}
                            </div>
                        </div>
                        <Input
                            label="Title"
                            required
                            value={uploadForm.title}
                            onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                            placeholder="e.g., Employee Handbook 2024"
                        />
                        <TextArea
                            label="Description"
                            value={uploadForm.description}
                            onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                            placeholder="Brief description of the document..."
                            rows={2}
                        />
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                            <select
                                value={uploadForm.category}
                                onChange={(e) => setUploadForm({ ...uploadForm, category: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                {categories.map((cat) => (
                                    <option key={cat} value={cat}>
                                        {cat}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse gap-3">
                            <button
                                type="button"
                                onClick={handleUpload}
                                disabled={isSubmitting || !selectedFile}
                                className="inline-flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:w-auto sm:text-sm disabled:opacity-50"
                            >
                                {isSubmitting ? "Uploading..." : "Upload"}
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowUploadModal(false)
                                    setUploadForm({ title: "", description: "", category: "HR Policy" })
                                    setSelectedFile(null)
                                }}
                                className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:mt-0 sm:w-auto sm:text-sm"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </Modal>
            </div>
        </div>
    )
}
