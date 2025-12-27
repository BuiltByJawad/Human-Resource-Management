import { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Input, TextArea, Select } from '@/components/ui/FormComponents'
import { DataTable, Column } from '@/components/ui/DataTable'
import { PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline'
import { useForm, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'

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
  apiErrors?: Partial<Record<keyof DepartmentFormData, string>>
  onClearApiErrors?: (field: DepartmentFormField) => void
}

const departmentSchema = yup.object().shape({
  name: yup.string().required('Department name is required'),
  description: yup.string(),
  managerId: yup.string().nullable(),
  parentDepartmentId: yup.string().nullable()
})

type DepartmentFormData = yup.InferType<typeof departmentSchema>
export type DepartmentFormField = keyof DepartmentFormData
export type DepartmentFormErrors = Partial<Record<DepartmentFormField, string>>

export const DepartmentForm = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  departments,
  employees,
  loading,
  apiErrors,
  onClearApiErrors
}: DepartmentFormProps) => {
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
    setError,
    clearErrors
  } = useForm<DepartmentFormData>({
    resolver: yupResolver(departmentSchema) as any,
    defaultValues: {
      name: '',
      description: '',
      managerId: '',
      parentDepartmentId: ''
    }
  })

  useEffect(() => {
    if (initialData) {
      reset({
        name: initialData.name,
        description: initialData.description || '',
        managerId: initialData.managerId || '',
        parentDepartmentId: initialData.parentDepartmentId || ''
      })
    } else {
      reset({
        name: '',
        description: '',
        managerId: '',
        parentDepartmentId: ''
      })
    }
  }, [initialData, isOpen, reset])

  useEffect(() => {
    if (!apiErrors) {
      return
    }

    (Object.entries(apiErrors) as [keyof DepartmentFormData, string | undefined][])
      .forEach(([field, message]) => {
        if (message) {
          setError(field, { type: 'server', message })
        } else {
          clearErrors(field)
        }
      })
  }, [apiErrors, setError, clearErrors])

  const onFormSubmit = async (data: DepartmentFormData) => {
    try {
      await onSubmit({
        ...data,
        managerId: data.managerId || undefined,
        parentDepartmentId: data.parentDepartmentId || undefined
      })
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('Department form submission failed', error)
      }
    }
  }

  const handleFieldFocus = (field: DepartmentFormField) => {
    clearErrors(field)
    onClearApiErrors?.(field)
  }

  // Filter out the current department from parent options to prevent circular dependency
  const parentOptions = (Array.isArray(departments) ? departments : [])
    .filter(d => d.id !== initialData?.id)
    .map(d => ({ value: d.id, label: d.name }))

  const managerOptions = (Array.isArray(employees) ? employees : []).map(e => ({
    value: e.id,
    label: `${e.firstName} ${e.lastName} (${e.email})`
  }))

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Department' : 'Add Department'}
    >
      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4 pb-6">
        <Input
          label="Department Name"
          placeholder="e.g. Engineering"
          required
          error={errors.name?.message}
          {...register('name', {
            onChange: () => handleFieldFocus('name')
          })}
          onBlur={() => handleFieldFocus('name')}
        />

        <TextArea
          label="Description"
          placeholder="Brief description of the department"
          error={errors.description?.message}
          {...register('description', {
            onChange: () => handleFieldFocus('description')
          })}
          onBlur={() => handleFieldFocus('description')}
        />

        <Controller
          control={control}
          name="parentDepartmentId"
          render={({ field }) => (
            <Select
              label="Parent Department"
              value={field.value || ''}
              onChange={field.onChange}
              options={[
                { value: '', label: 'None (Top Level)' },
                ...parentOptions
              ]}
              error={errors.parentDepartmentId?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="managerId"
          render={({ field }) => (
            <Select
              label="Manager"
              value={field.value || ''}
              onChange={field.onChange}
              options={[
                { value: '', label: 'Select Manager' },
                ...managerOptions
              ]}
              error={errors.managerId?.message}
            />
          )}
        />

        <div className="sticky bottom-0 left-0 right-0 bg-white pt-4 pb-2 flex justify-end gap-3 border-t">
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
      searchKeys={['name', 'description', 'manager.firstName', 'manager.lastName', 'parentDepartment.name']}
    />
  )
}