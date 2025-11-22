import { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Input, TextArea, Select } from '@/components/ui/FormComponents'
import { DataTable, Column } from '@/components/ui/DataTable'
import { PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline'

export interface Department {
  id: string
  name: string
  description?: string
  managerId?: string
  parentDepartmentId?: string
  manager?: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
  parentDepartment?: {
    id: string
    name: string
  }
  _count?: {
    employees: number
    subDepartments: number
  }
}

interface DepartmentFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: Partial<Department>) => Promise<void>
  initialData?: Department | null
  departments: Department[] // For parent selection
  employees: any[] // For manager selection - replace any with Employee type if available
  loading?: boolean
}

export const DepartmentForm = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  departments,
  employees,
  loading
}: DepartmentFormProps) => {
  const [formData, setFormData] = useState<Partial<Department>>({
    name: '',
    description: '',
    managerId: '',
    parentDepartmentId: ''
  })

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        description: initialData.description || '',
        managerId: initialData.managerId || '',
        parentDepartmentId: initialData.parentDepartmentId || ''
      })
    } else {
      setFormData({
        name: '',
        description: '',
        managerId: '',
        parentDepartmentId: ''
      })
    }
  }, [initialData, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit(formData)
  }

  // Filter out the current department from parent options to prevent circular dependency
  const parentOptions = departments
    .filter(d => d.id !== initialData?.id)
    .map(d => ({ value: d.id, label: d.name }))

  const managerOptions = employees.map(e => ({
    value: e.id,
    label: `${e.firstName} ${e.lastName} (${e.email})`
  }))

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Department' : 'Add Department'}
    >
      <form onSubmit={handleSubmit} className="space-y-4 pb-32">
        <Input
          label="Department Name"
          value={formData.name || ''}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
          placeholder="e.g. Engineering"
        />

        <TextArea
          label="Description"
          value={formData.description || ''}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Brief description of the department"
        />

        <Select
          label="Parent Department"
          value={formData.parentDepartmentId || ''}
          onChange={(value) => setFormData({ ...formData, parentDepartmentId: value || undefined })}
          options={[
            { value: '', label: 'None (Top Level)' },
            ...parentOptions
          ]}
        />

        <Select
          label="Manager"
          value={formData.managerId || ''}
          onChange={(value) => setFormData({ ...formData, managerId: value || undefined })}
          options={[
            { value: '', label: 'Select Manager' },
            ...managerOptions
          ]}
        />

        <div className="flex justify-end space-x-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? 'Saving...' : initialData ? 'Update' : 'Create'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

interface DepartmentListProps {
  departments: Department[]
  onEdit: (dept: Department) => void
  onDelete: (dept: Department) => void
  loading?: boolean
}

export const DepartmentList = ({ departments, onEdit, onDelete, loading }: DepartmentListProps) => {
  const columns: Column<Department>[] = [
    {
      header: 'Name',
      key: 'name',
      render: (value, dept) => (
        <div>
          <div className="font-medium text-gray-900">{dept.name}</div>
          {dept.description && <div className="text-xs text-gray-500">{dept.description}</div>}
        </div>
      )
    },
    {
      header: 'Parent Department',
      key: 'parentDepartment',
      render: (value, dept) => dept.parentDepartment?.name || '-'
    },
    {
      header: 'Manager',
      key: 'manager',
      render: (value, dept) => dept.manager ? `${dept.manager.firstName} ${dept.manager.lastName}` : '-'
    },
    {
      header: 'Employees',
      key: '_count',
      render: (value, dept) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          {dept._count?.employees || 0}
        </span>
      )
    },
    {
      header: 'Actions',
      key: 'actions',
      render: (value, dept) => (
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
      )
    }
  ]

  return (
    <DataTable
      data={departments}
      columns={columns}
      loading={loading}
      searchKeys={['name', 'description']}
    />
  )
}