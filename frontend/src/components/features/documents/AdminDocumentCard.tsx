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

const extensionByMime: Record<string, string> = {
  'application/pdf': 'pdf',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/vnd.ms-excel': 'xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  'application/vnd.ms-powerpoint': 'ppt',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
  'text/plain': 'txt',
}

const toDownloadName = (doc: CompanyDocument): string => {
  const extension = extensionByMime[doc.type] || doc.type?.split('/')[1] || 'file'
  const base = doc.title?.trim() || 'document'
  return `${base}.${extension}`
}

export function AdminDocumentCard({ doc, onToggleVisibility, onDelete, formatDate }: AdminDocumentCardProps) {
  const handleDownload = async () => {
    const filename = toDownloadName(doc)
    try {
      const response = await fetch(doc.fileUrl)
      if (!response.ok) {
        window.open(doc.fileUrl, '_blank', 'noopener,noreferrer')
        return
      }

      const blob = await response.blob()
      const objectUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = objectUrl
      link.download = filename
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(objectUrl)
    } catch {
      window.open(doc.fileUrl, '_blank', 'noopener,noreferrer')
    }
  }

  return (
    <div
      className={`bg-white rounded-xl border shadow-sm hover:shadow-md transition-shadow p-6 ${
        !doc.isVisible ? 'border-dashed' : 'border-gray-100'
      }`}
    >
      <div className={doc.isVisible ? '' : 'opacity-60'}>
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
      </div>

      <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
        <button
          type="button"
          onClick={handleDownload}
          className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-800"
        >
          <ArrowDownTrayIcon className="h-4 w-4" />
          Download
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onToggleVisibility(doc)}
            className={`p-2 rounded-lg border transition-all shadow-sm ${
              doc.isVisible
                ? 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                : 'border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
            title={doc.isVisible ? 'Hide from employees' : 'Show to employees'}
          >
            {doc.isVisible ? <EyeIcon className="h-4 w-4" /> : <EyeSlashIcon className="h-4 w-4" />}
          </button>
          <button
            onClick={() => onDelete(doc.id)}
            className="p-2 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 transition-all shadow-sm"
            title="Delete document"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
