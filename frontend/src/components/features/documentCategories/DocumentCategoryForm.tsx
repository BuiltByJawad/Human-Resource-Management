"use client"

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'

import { Modal } from '@/components/ui/Modal'
import { Input, TextArea } from '@/components/ui/FormComponents'
import type { DocumentCategory, UpsertDocumentCategoryPayload } from '@/services/documentCategories/types'

const schema = yup.object({
  name: yup.string().trim().required('Name is required'),
  description: yup.string().max(500, 'Description must be 500 characters or less').nullable().notRequired(),
  sortOrder: yup
    .number()
    .typeError('Sort order must be a number')
    .integer('Sort order must be a whole number')
    .min(0, 'Sort order cannot be negative')
    .required('Sort order is required'),
  allowEmployeeUpload: yup.boolean().required(),
  isActive: yup.boolean().required(),
})

type FormValues = {
  name: string
  description?: string | null
  sortOrder: number
  allowEmployeeUpload: boolean
  isActive: boolean
}

interface DocumentCategoryFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (payload: UpsertDocumentCategoryPayload) => Promise<void>
  initialData?: DocumentCategory | null
  loading?: boolean
  apiErrors?: Partial<Record<'name' | 'description' | 'sortOrder', string>>
}

export function DocumentCategoryForm({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  loading,
  apiErrors,
}: DocumentCategoryFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: yupResolver(schema) as never,
    defaultValues: {
      name: '',
      description: '',
      sortOrder: 0,
      allowEmployeeUpload: false,
      isActive: true,
    },
  })

  useEffect(() => {
    if (initialData) {
      reset({
        name: initialData.name,
        description: initialData.description ?? '',
        sortOrder: initialData.sortOrder ?? 0,
        allowEmployeeUpload: initialData.allowEmployeeUpload,
        isActive: initialData.isActive,
      })
    } else {
      reset({
        name: '',
        description: '',
        sortOrder: 0,
        allowEmployeeUpload: false,
        isActive: true,
      })
    }
  }, [initialData, isOpen, reset])

  useEffect(() => {
    if (!apiErrors) return
    ;(Object.entries(apiErrors) as Array<[keyof typeof apiErrors, string | undefined]>).forEach(([field, message]) => {
      if (message) {
        setError(field as never, { type: 'server', message })
      } else {
        clearErrors(field as never)
      }
    })
  }, [apiErrors, setError, clearErrors])

  const submit = async (values: FormValues) => {
    const trimmedDescription = (values.description ?? '').trim()

    await onSubmit({
      name: values.name.trim(),
      description: initialData ? trimmedDescription : trimmedDescription || undefined,
      sortOrder: values.sortOrder,
      allowEmployeeUpload: values.allowEmployeeUpload,
      isActive: values.isActive,
    })
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initialData ? 'Edit Category' : 'Add Category'}>
      <form onSubmit={handleSubmit(submit)} className="space-y-4 pb-6">
        <Input label="Name" required error={errors.name?.message} {...register('name')} />

        <TextArea
          label="Description"
          rows={2}
          error={errors.description?.message}
          {...register('description')}
        />

        <Input
          label="Sort Order"
          type="number"
          required
          error={errors.sortOrder?.message}
          {...register('sortOrder', {
            valueAsNumber: true,
          })}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" className="h-4 w-4" {...register('allowEmployeeUpload')} />
            Allow employee upload
          </label>

          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" className="h-4 w-4" {...register('isActive')} />
            Active
          </label>
        </div>

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
