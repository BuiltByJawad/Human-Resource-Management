"use client"

import { PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline'
import { DataTable, type Column } from '@/components/ui/DataTable'
import type { Role } from '@/types/hrm'

interface RoleListProps {
  roles: Role[]
  onEdit: (role: Role) => void
  onDelete: (role: Role) => void
  loading?: boolean
}

export function RoleList({ roles, onEdit, onDelete, loading }: RoleListProps) {
  const columns: Column<Role>[] = [
    {
      header: 'Name',
      key: 'name',
      render: (_value, role) => (
        <div>
          <div className="flex items-center space-x-2">
            <span className="font-medium text-gray-900">{role.name}</span>
            {role.isSystem && (
              <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">System</span>
            )}
          </div>
          {role.description && <div className="text-xs text-gray-500">{role.description}</div>}
        </div>
      ),
    },
    {
      header: 'Users Assigned',
      key: '_count',
      render: (_value, role) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          {role._count?.users || 0}
        </span>
      ),
    },
    {
      header: 'Actions',
      key: 'actions',
      render: (_value, role) => (
        <div className="flex space-x-2 justify-end">
          <button onClick={() => onEdit(role)} className="text-blue-600 hover:text-blue-900 p-1" title="Edit">
            <PencilSquareIcon className="h-4 w-4" />
          </button>
          {!role.isSystem && (
            <button onClick={() => onDelete(role)} className="text-red-600 hover:text-red-900 p-1" title="Delete">
              <TrashIcon className="h-4 w-4" />
            </button>
          )}
        </div>
      ),
    },
  ]

  return <DataTable data={roles} columns={columns} loading={loading} searchKeys={['name', 'description']} />
}
