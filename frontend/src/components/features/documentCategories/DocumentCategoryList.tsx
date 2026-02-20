"use client"

import { PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline'
import { DataTable, type Column } from '@/components/ui/DataTable'
import type { DocumentCategory } from '@/services/documentCategories/types'

interface DocumentCategoryListProps {
  categories: DocumentCategory[]
  onEdit: (category: DocumentCategory) => void
  onDelete: (category: DocumentCategory) => void
  loading?: boolean
}

export function DocumentCategoryList({ categories, onEdit, onDelete, loading }: DocumentCategoryListProps) {
  const columns: Column<DocumentCategory>[] = [
    {
      header: 'Name',
      key: 'name',
      render: (_value, category) => (
        <div>
          <div className="font-medium text-gray-900">{category.name}</div>
          {category.description ? <div className="text-xs text-gray-500">{category.description}</div> : null}
        </div>
      ),
    },
    {
      header: 'Employee Upload',
      key: 'allowEmployeeUpload',
      render: (_value, category) => (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            category.allowEmployeeUpload ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-700'
          }`}
        >
          {category.allowEmployeeUpload ? 'Allowed' : 'Restricted'}
        </span>
      ),
    },
    {
      header: 'Status',
      key: 'isActive',
      render: (_value, category) => (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            category.isActive ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-700'
          }`}
        >
          {category.isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      header: 'Sort',
      key: 'sortOrder',
      render: (_value, category) => <span className="text-sm text-slate-600">{category.sortOrder}</span>,
    },
    {
      header: 'Actions',
      key: 'actions',
      render: (_value, category) => (
        <div className="flex space-x-2 justify-end">
          <button onClick={() => onEdit(category)} className="text-blue-600 hover:text-blue-900 p-1" title="Edit">
            <PencilSquareIcon className="h-4 w-4" />
          </button>
          <button onClick={() => onDelete(category)} className="text-red-600 hover:text-red-900 p-1" title="Delete">
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ]

  return <DataTable data={categories} columns={columns} loading={loading} />
}
