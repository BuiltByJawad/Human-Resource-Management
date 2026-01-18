import { DocumentTextIcon } from '@heroicons/react/24/outline'
import { Modal } from '@/components/ui/Modal'
import { Input, TextArea } from '@/components/ui/FormComponents'

const categories = ['HR Policy', 'IT Policy', 'Handbook', 'Form', 'Other']

interface AdminUploadModalProps {
  isOpen: boolean
  onClose: () => void
  onUpload: () => void
  isSubmitting: boolean
  selectedFile: File | null
  onFileSelect: (file: File | null) => void
  uploadForm: { title: string; description?: string; category: string }
  onFormChange: (next: { title: string; description?: string; category: string }) => void
  fileInputRef: React.RefObject<HTMLInputElement>
}

export function AdminUploadModal({
  isOpen,
  onClose,
  onUpload,
  isSubmitting,
  selectedFile,
  onFileSelect,
  uploadForm,
  onFormChange,
  fileInputRef,
}: AdminUploadModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Upload Company Document">
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
              onChange={(event) => onFileSelect(event.target.files?.[0] ?? null)}
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
          onChange={(event) => onFormChange({ ...uploadForm, title: event.target.value })}
          placeholder="e.g., Employee Handbook 2024"
        />
        <TextArea
          label="Description"
          value={uploadForm.description}
          onChange={(event) => onFormChange({ ...uploadForm, description: event.target.value })}
          placeholder="Brief description of the document..."
          rows={2}
        />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <select
            value={uploadForm.category}
            onChange={(event) => onFormChange({ ...uploadForm, category: event.target.value })}
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
            onClick={onUpload}
            disabled={isSubmitting || !selectedFile}
            className="inline-flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:w-auto sm:text-sm disabled:opacity-50"
          >
            {isSubmitting ? 'Uploading...' : 'Upload'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:mt-0 sm:w-auto sm:text-sm"
          >
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  )
}
