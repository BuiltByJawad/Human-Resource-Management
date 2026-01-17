import { ArrowDownTrayIcon, DocumentTextIcon, EyeIcon, EyeSlashIcon, TrashIcon } from '@heroicons/react/24/outline'
import type { CompanyDocument } from '@/services/documents/types'

const categoryColors: Record<string, string> = {
  'HR Policy': 'bg-blue-100 text-blue-800',
  'IT Policy': 'bg-purple-100 text-purple-800',
  Handbook: 'bg-green-100 text-green-800',
  Form: 'bg-orange-100 text-orange-800',
  Other: 'bg-gray-100 text-gray-800',
}

interface AdminDocumentCardProps {
  doc: CompanyDocument
  onToggleVisibility: (doc: CompanyDocument) => void
  onDelete: (docId: string) => void
  formatDate: (value: string) => string
}

export function AdminDocumentCard({ doc, onToggleVisibility, onDelete, formatDate }: AdminDocumentCardProps) {
  return (
    <div
      className={`bg-white rounded-xl border shadow-sm hover:shadow-md transition-shadow p-6 ${
        !doc.isVisible ? 'opacity-60 border-dashed' : 'border-gray-100'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <DocumentTextIcon className="h-5 w-5 text-blue-500 flex-shrink-0" />
            <h3 className="text-lg font-semibold text-gray-900 truncate">{doc.title}</h3>
          </div>
          <span
            className={`inline-block mt-2 px-2 py-0.5 text-xs font-medium rounded-full ${
              categoryColors[doc.category] || categoryColors.Other
            }`}
          >
            {doc.category}
          </span>
        </div>
      </div>

      {doc.description && <p className="mt-3 text-sm text-gray-600 line-clamp-2">{doc.description}</p>}

      <div className="mt-4 text-xs text-gray-500">Uploaded: {formatDate(doc.createdAt)}</div>

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
            onClick={() => onToggleVisibility(doc)}
            className={`p-1.5 rounded-lg transition-colors ${
              doc.isVisible ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-100'
            }`}
            title={doc.isVisible ? 'Hide from employees' : 'Show to employees'}
          >
            {doc.isVisible ? <EyeIcon className="h-4 w-4" /> : <EyeSlashIcon className="h-4 w-4" />}
          </button>
          <button
            onClick={() => onDelete(doc.id)}
            className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
            title="Delete document"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
