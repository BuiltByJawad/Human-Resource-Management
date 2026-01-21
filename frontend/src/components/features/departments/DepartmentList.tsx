"use client"

import { PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline'
import { DataTable, type Column } from '@/components/ui/DataTable'
import type { Department } from '@/types/hrm'

export interface DepartmentListProps {
  departments: Department[]
  onEdit: (dept: Department) => void
  onDelete: (dept: Department) => void
  loading?: boolean
}

export function DepartmentList({ departments, onEdit, onDelete, loading }: DepartmentListProps) {
  const columns: Column<Department>[] = [
    {
      header: 'Name',
      key: 'name',
      render: (_value, dept) => (
        <div>
          <div className="font-medium text-gray-900">{dept.name}</div>
          {dept.description && <div className="text-xs text-gray-500">{dept.description}</div>}
        </div>
      ),
    },
    {
      header: 'Parent Department',
      key: 'parentDepartment',
      render: (_value, dept) => dept.parentDepartment?.name || '-',
    },
    {
      header: 'Manager',
      key: 'manager',
      render: (_value, dept) => (dept.manager ? `${dept.manager.firstName} ${dept.manager.lastName}` : '-'),
    },
    {
      header: 'Employees',
      key: '_count',
      render: (_value, dept) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          {dept._count?.employees || 0}
        </span>
      ),
    },
    {
      header: 'Actions',
      key: 'actions',
      render: (_value, dept) => (
        <div className="flex space-x-2 justify-end">
          <button
            onClick={() => onEdit(dept)}
            className="text-blue-600 hover:text-blue-900 p-1"
            title="Edit"
          >
            <PencilSquareIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete(dept)}
            className="text-red-600 hover:text-red-900 p-1"
            title="Delete"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ]

  return (
    <DataTable
      data={departments}
      columns={columns}
      loading={loading}
    />
  )
}
