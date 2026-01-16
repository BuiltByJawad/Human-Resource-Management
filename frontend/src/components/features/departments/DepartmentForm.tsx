"use client"

import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { Modal } from '@/components/ui/Modal'
import { Input, TextArea, Select } from '@/components/ui/FormComponents'
import type { Department, EmployeeSummary } from '@/types/hrm'

const departmentSchema = yup.object().shape({
  name: yup.string().required('Department name is required'),
  description: yup.string(),
  managerId: yup.string().nullable(),
  parentDepartmentId: yup.string().nullable(),
})

export type DepartmentFormData = yup.InferType<typeof departmentSchema>
export type DepartmentFormField = keyof DepartmentFormData
export type DepartmentFormErrors = Partial<Record<DepartmentFormField, string>>

export interface DepartmentFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: Partial<Department>) => Promise<void>
  initialData?: Department | null
  departments: Department[]
  employees: EmployeeSummary[]
  loading?: boolean
  apiErrors?: DepartmentFormErrors
  onClearApiErrors?: (field: DepartmentFormField) => void
}

export function DepartmentForm({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  departments,
  employees,
  loading,
  apiErrors,
  onClearApiErrors,
}: DepartmentFormProps) {
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
    setError,
    clearErrors,
  } = useForm<DepartmentFormData>({
    resolver: yupResolver(departmentSchema) as any,
    defaultValues: {
      name: '',
      description: '',
      managerId: '',
      parentDepartmentId: '',
    },
  })

  useEffect(() => {
    if (initialData) {
      reset({
        name: initialData.name,
        description: initialData.description || '',
        managerId: initialData.managerId || '',
        parentDepartmentId: initialData.parentDepartmentId || '',
      })
    } else {
      reset({ name: '', description: '', managerId: '', parentDepartmentId: '' })
    }
  }, [initialData, isOpen, reset])

  useEffect(() => {
    if (!apiErrors) return
    (Object.entries(apiErrors) as [DepartmentFormField, string | undefined][]).forEach(([field, message]) => {
      if (message) {
        setError(field, { type: 'server', message })
      } else {
        clearErrors(field)
      }
    })
  }, [apiErrors, setError, clearErrors])

  const onFormSubmit = async (data: DepartmentFormData) => {
    await onSubmit({
      ...data,
      managerId: data.managerId || undefined,
      parentDepartmentId: data.parentDepartmentId || undefined,
    })
  }

  const handleFieldFocus = (field: DepartmentFormField) => {
    clearErrors(field)
    onClearApiErrors?.(field)
  }

  const parentOptions = departments
    .filter((d) => d.id !== initialData?.id)
    .map((d) => ({ value: d.id, label: d.name }))

  const managerOptions = employees.map((e) => ({ value: e.id, label: `${e.firstName} ${e.lastName} (${e.email})` }))

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initialData ? 'Edit Department' : 'Add Department'}>
      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4 pb-6">
        <Input
          label="Department Name"
          placeholder="e.g. Engineering"
          required
          error={errors.name?.message}
          {...register('name', { onChange: () => handleFieldFocus('name') })}
          onBlur={() => handleFieldFocus('name')}
        />

        <TextArea
          label="Description"
          placeholder="Brief description of the department"
          error={errors.description?.message}
          {...register('description', { onChange: () => handleFieldFocus('description') })}
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
              options={[{ value: '', label: 'None (Top Level)' }, ...parentOptions]}
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
              options={[{ value: '', label: 'Select Manager' }, ...managerOptions]}
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
