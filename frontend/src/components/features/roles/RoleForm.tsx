"use client"

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { SlideOver } from '@/components/ui/SlideOver'
import { Input, TextArea } from '@/components/ui/FormComponents'
import type { Permission, Role } from '@/types/hrm'

const roleSchema = yup.object().shape({
  name: yup.string().required('Role name is required'),
  description: yup.string().default(''),
  permissionIds: yup.array().of(yup.string().required()).required(),
})

export type RoleFormData = yup.InferType<typeof roleSchema>
export type RoleFormField = keyof RoleFormData

interface RoleFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: Partial<Role> & { permissionIds?: string[] }) => Promise<void>
  initialData?: Role | null
  permissions: Permission[]
  groupedPermissions: Record<string, Permission[]>
  loading?: boolean
  apiErrors?: Partial<Record<RoleFormField, string>>
  onClearApiErrors?: (field: RoleFormField) => void
}

export function RoleForm({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  permissions,
  groupedPermissions,
  loading,
  apiErrors,
  onClearApiErrors,
}: RoleFormProps) {
  const [activeResource, setActiveResource] = useState<string>('')

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
    setError,
    clearErrors,
  } = useForm<RoleFormData>({
    resolver: yupResolver(roleSchema),
    defaultValues: {
      name: '',
      description: '',
      permissionIds: [],
    },
  })

  const selectedPermissionIds = watch('permissionIds') || []

  const selectedPermissionDetails = Array.isArray(initialData?.permissions)
    ? initialData!.permissions
        .map((p) => p?.permission)
        .filter((p): p is Permission => !!p && selectedPermissionIds.includes(p.id))
    : []

  useEffect(() => {
    if (initialData) {
      reset({
        name: initialData.name,
        description: initialData.description || '',
        permissionIds: Array.isArray(initialData.permissions)
          ? initialData.permissions.map((p) => p.permission.id)
          : [],
      })
    } else {
      reset({ name: '', description: '', permissionIds: [] })
    }
  }, [initialData, isOpen, reset])

  useEffect(() => {
    if (!apiErrors) return
    (Object.entries(apiErrors) as [RoleFormField, string | undefined][]).forEach(([field, message]) => {
      if (message) {
        setError(field, { type: 'server', message })
      } else {
        clearErrors(field)
      }
    })
  }, [apiErrors, setError, clearErrors])

  // Set initial active resource
  useEffect(() => {
    if (!isOpen) return
    const firstResource = Object.keys(groupedPermissions)[0]
    if (firstResource && (!activeResource || !groupedPermissions[activeResource])) {
      setActiveResource(firstResource)
    }
  }, [isOpen, groupedPermissions, activeResource])

  const onFormSubmit = async (data: RoleFormData) => {
    await onSubmit({ ...data, permissionIds: data.permissionIds as string[] })
  }

  const togglePermission = (id: string) => {
    const currentIds = selectedPermissionIds
    const exists = currentIds.includes(id)
    if (exists) {
      setValue('permissionIds', currentIds.filter((pid) => pid !== id))
    } else {
      setValue('permissionIds', [...currentIds, id])
    }
  }

  const toggleResource = (resource: string) => {
    const resourcePerms = Array.isArray(groupedPermissions[resource])
      ? groupedPermissions[resource].map((p) => p.id)
      : []
    const allSelected = resourcePerms.every((id) => selectedPermissionIds.includes(id))

    if (allSelected) {
      setValue('permissionIds', selectedPermissionIds.filter((pid) => !resourcePerms.includes(pid)))
    } else {
      const newIds = [...selectedPermissionIds]
      resourcePerms.forEach((id) => {
        if (!newIds.includes(id)) newIds.push(id)
      })
      setValue('permissionIds', newIds)
    }
  }

  const handleFieldFocus = (field: RoleFormField) => {
    clearErrors(field)
    onClearApiErrors?.(field)
  }

  return (
    <SlideOver isOpen={isOpen} onClose={onClose} title={initialData ? 'Edit Role' : 'Create New Role'} size="2xl">
      <form onSubmit={handleSubmit(onFormSubmit)} className="flex flex-col h-full">
        <div className="flex-1 space-y-8 pb-20">
          <div className="space-y-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h3 className="text-sm font-medium text-gray-900 uppercase tracking-wider">Role Details</h3>
            <Input
              label="Role Name"
              required
              placeholder="e.g. HR Manager"
              disabled={initialData?.isSystem}
              error={errors.name?.message}
              {...register('name', { onChange: () => handleFieldFocus('name') })}
              onBlur={() => handleFieldFocus('name')}
            />
            <TextArea
              label="Description"
              placeholder="What is this role for?"
              error={errors.description?.message}
              {...register('description', { onChange: () => handleFieldFocus('description') })}
              onBlur={() => handleFieldFocus('description')}
            />
          </div>

          <div className="border rounded-xl overflow-hidden flex flex-col flex-1 shadow-sm min-h-[400px]">
            <div className="bg-gray-100 px-4 py-3 border-b flex justify-between items-center">
              <h3 className="font-medium text-gray-900">Permissions Configuration</h3>
              <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded border">
                {selectedPermissionIds.length} permissions selected
              </span>
            </div>

            <div className="flex flex-1 overflow-hidden">
              <div className="w-1/3 border-r bg-gray-50 overflow-y-auto">
                {Object.entries(groupedPermissions).map(([resource, perms]) => {
                  const safePerms = Array.isArray(perms) ? perms : []
                  const selectedCount = safePerms.filter((p) => selectedPermissionIds.includes(p.id)).length
                  const totalCount = safePerms.length
                  const isComplete = selectedCount === totalCount
                  const isActive = activeResource === resource

                  return (
                    <button
                      key={resource}
                      type="button"
                      onClick={() => setActiveResource(resource)}
                      className={`w-full text-left px-4 py-3 border-b border-gray-100 transition-colors hover:bg-white focus:outline-none ${
                        isActive ? 'bg-white border-l-4 border-l-blue-500 shadow-sm' : 'border-l-4 border-l-transparent text-gray-600'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className={`text-sm font-medium ${isActive ? 'text-gray-900' : 'text-gray-700'}`}>{resource}</span>
                        {isComplete && <span className="h-2 w-2 rounded-full bg-green-500" title="All selected" />}
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="w-full bg-gray-200 rounded-full h-1.5 mr-2">
                          <div
                            className={`h-1.5 rounded-full ${isComplete ? 'bg-green-500' : 'bg-blue-500'}`}
                            style={{ width: `${(selectedCount / totalCount) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500 font-mono">
                          {selectedCount}/{totalCount}
                        </span>
                      </div>
                    </button>
                  )
                })}
              </div>

              <div className="w-2/3 bg-white overflow-y-auto p-4">
                {!Object.keys(groupedPermissions).length ? (
                  <div className="space-y-3">
                    <div className="text-sm text-gray-500">No permissions available.</div>
                    {selectedPermissionDetails.length > 0 && (
                      <div className="border rounded-lg bg-gray-50 p-3">
                        <div className="text-xs font-medium text-gray-700 mb-2">Currently selected for this role</div>
                        <div className="space-y-2">
                          {selectedPermissionDetails.map((perm) => (
                            <div key={perm.id} className="flex items-start rounded-md border bg-white px-3 py-2">
                              <div className="mt-0.5 h-4 w-4 rounded border border-gray-300 bg-blue-600" />
                              <div className="ml-3">
                                <div className="text-sm font-medium text-gray-900">
                                  {perm.resource}.{perm.action}
                                </div>
                                {perm.description && <div className="text-xs text-gray-500">{perm.description}</div>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : activeResource && groupedPermissions[activeResource] ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center pb-4 border-b">
                      <div>
                        <h4 className="text-lg font-bold text-gray-900">{activeResource}</h4>
                        <p className="text-xs text-gray-500">Manage access for {activeResource.toLowerCase()} module</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleResource(activeResource)}
                        className="text-xs font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-3 py-1.5 rounded transition-colors"
                      >
                        {(Array.isArray(groupedPermissions[activeResource]) ? groupedPermissions[activeResource] : []).every((p) =>
                          selectedPermissionIds.includes(p.id),
                        )
                          ? 'Deselect All'
                          : 'Select All'}
                      </button>
                    </div>

                    <div className="space-y-3">
                      {(Array.isArray(groupedPermissions[activeResource]) ? groupedPermissions[activeResource] : []).map((perm) => {
                        const isSelected = selectedPermissionIds.includes(perm.id)
                        return (
                          <div
                            key={perm.id}
                            onClick={() => {
                              handleFieldFocus('permissionIds')
                              togglePermission(perm.id)
                            }}
                            className={`flex items-start p-3 rounded-lg border cursor-pointer transition-all ${
                              isSelected
                                ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-200'
                                : 'bg-white border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}}
                              className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <div className="ml-3">
                              <label className={`text-sm font-medium ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                                {perm.action}
                              </label>
                              {perm.description && (
                                <p className={`text-xs mt-0.5 ${isSelected ? 'text-blue-700' : 'text-gray-500'}`}>
                                  {perm.description}
                                </p>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 bg-white border-t p-4 flex justify-between items-center z-10">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-500">
              {initialData ? 'Changes will affect all users with this role.' : 'New role will be inactive until assigned.'}
            </span>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Saving...' : initialData ? 'Save Changes' : 'Create Role'}
            </button>
          </div>
        </div>
      </form>
    </SlideOver>
  )
}
