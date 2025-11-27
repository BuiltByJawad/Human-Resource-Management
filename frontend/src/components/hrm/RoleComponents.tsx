import { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/Modal'
import { SlideOver } from '@/components/ui/SlideOver'
import { Input, TextArea } from '@/components/ui/FormComponents'
import { DataTable, Column } from '@/components/ui/DataTable'
import { PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'

export interface Permission {
    id: string
    resource: string
    action: string
    description?: string
}

export interface Role {
    id: string
    name: string
    description?: string
    isSystem: boolean
    permissions: { permission: Permission }[]
    _count?: {
        users: number
    }
}

interface RoleFormProps {
    isOpen: boolean
    onClose: () => void
    onSubmit: (data: Partial<Role> & { permissionIds?: string[] }) => Promise<void>
    initialData?: Role | null
    permissions: Permission[]
    groupedPermissions: Record<string, Permission[]>
    loading?: boolean
}

const roleSchema = yup.object().shape({
    name: yup.string().required('Role name is required'),
    description: yup.string().default(''),
    permissionIds: yup.array().of(yup.string().required()).required()
})

type RoleFormData = yup.InferType<typeof roleSchema>

export const RoleForm = ({
    isOpen,
    onClose,
    onSubmit,
    initialData,
    permissions,
    groupedPermissions,
    loading
}: RoleFormProps) => {
    const [activeResource, setActiveResource] = useState<string>('')

    const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm({
        resolver: yupResolver(roleSchema),
        defaultValues: {
            name: '',
            description: '',
            permissionIds: []
        }
    })

    const selectedPermissionIds = watch('permissionIds') || []

    useEffect(() => {
        if (initialData) {
            reset({
                name: initialData.name,
                description: initialData.description || '',
                permissionIds: initialData.permissions?.map(p => p.permission.id) || []
            })
        } else {
            reset({
                name: '',
                description: '',
                permissionIds: []
            })
        }
    }, [initialData, isOpen, reset])

    // Set initial active resource
    useEffect(() => {
        if (isOpen && Object.keys(groupedPermissions).length > 0) {
            setActiveResource(Object.keys(groupedPermissions)[0])
        }
    }, [isOpen, groupedPermissions])

    const onFormSubmit = async (data: RoleFormData) => {
        await onSubmit({
            ...data,
            permissionIds: data.permissionIds as string[]
        })
    }

    const togglePermission = (id: string) => {
        const currentIds = selectedPermissionIds
        const exists = currentIds.includes(id)
        if (exists) {
            setValue('permissionIds', currentIds.filter(pid => pid !== id))
        } else {
            setValue('permissionIds', [...currentIds, id])
        }
    }

    const toggleResource = (resource: string) => {
        const resourcePerms = groupedPermissions[resource].map(p => p.id)
        const allSelected = resourcePerms.every(id => selectedPermissionIds.includes(id))

        if (allSelected) {
            // Deselect all
            setValue('permissionIds', selectedPermissionIds.filter(pid => !resourcePerms.includes(pid)))
        } else {
            // Select all (add missing ones)
            const newIds = [...selectedPermissionIds]
            resourcePerms.forEach(id => {
                if (!newIds.includes(id)) newIds.push(id)
            })
            setValue('permissionIds', newIds)
        }
    }

    return (
        <SlideOver
            isOpen={isOpen}
            onClose={onClose}
            title={initialData ? 'Edit Role' : 'Create New Role'}
            size="2xl"
        >
            <form onSubmit={handleSubmit(onFormSubmit)} className="flex flex-col h-full">
                <div className="flex-1 space-y-8 pb-20">
                    {/* Basic Info Section */}
                    <div className="space-y-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <h3 className="text-sm font-medium text-gray-900 uppercase tracking-wider">Role Details</h3>
                        <Input
                            label="Role Name"
                            required
                            placeholder="e.g. HR Manager"
                            disabled={initialData?.isSystem}
                            error={errors.name?.message}
                            {...register('name')}
                        />
                        <TextArea
                            label="Description"
                            placeholder="What is this role for?"
                            error={errors.description?.message}
                            {...register('description')}
                        />
                    </div>

                    {/* Permissions Section - Vertical Tabs */}
                    <div className="border rounded-xl overflow-hidden flex flex-col flex-1 shadow-sm min-h-[400px]">
                        <div className="bg-gray-100 px-4 py-3 border-b flex justify-between items-center">
                            <h3 className="font-medium text-gray-900">Permissions Configuration</h3>
                            <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded border">
                                {selectedPermissionIds.length} permissions selected
                            </span>
                        </div>

                        <div className="flex flex-1 overflow-hidden">
                            {/* Left Sidebar: Resources */}
                            <div className="w-1/3 border-r bg-gray-50 overflow-y-auto">
                                {Object.entries(groupedPermissions).map(([resource, perms]) => {
                                    const selectedCount = perms.filter(p => selectedPermissionIds.includes(p.id)).length
                                    const totalCount = perms.length
                                    const isComplete = selectedCount === totalCount
                                    const isActive = activeResource === resource

                                    return (
                                        <button
                                            key={resource}
                                            type="button"
                                            onClick={() => setActiveResource(resource)}
                                            className={`w-full text-left px-4 py-3 border-b border-gray-100 transition-colors hover:bg-white focus:outline-none ${isActive ? 'bg-white border-l-4 border-l-blue-500 shadow-sm' : 'border-l-4 border-l-transparent text-gray-600'
                                                }`}
                                        >
                                            <div className="flex justify-between items-center mb-1">
                                                <span className={`text-sm font-medium ${isActive ? 'text-gray-900' : 'text-gray-700'}`}>
                                                    {resource}
                                                </span>
                                                {isComplete && (
                                                    <span className="h-2 w-2 rounded-full bg-green-500" title="All selected" />
                                                )}
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div className="w-full bg-gray-200 rounded-full h-1.5 mr-2">
                                                    <div
                                                        className={`h-1.5 rounded-full ${isComplete ? 'bg-green-500' : 'bg-blue-500'}`}
                                                        style={{ width: `${(selectedCount / totalCount) * 100}%` }}
                                                    />
                                                </div>
                                                <span className="text-xs text-gray-500 font-mono">{selectedCount}/{totalCount}</span>
                                            </div>
                                        </button>
                                    )
                                })}
                            </div>

                            {/* Right Content: Permissions */}
                            <div className="w-2/3 bg-white overflow-y-auto p-4">
                                {activeResource && groupedPermissions[activeResource] && (
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
                                                {groupedPermissions[activeResource].every(p => selectedPermissionIds.includes(p.id))
                                                    ? 'Deselect All'
                                                    : 'Select All'}
                                            </button>
                                        </div>

                                        <div className="space-y-3">
                                            {groupedPermissions[activeResource].map(perm => {
                                                const isSelected = selectedPermissionIds.includes(perm.id)
                                                return (
                                                    <div
                                                        key={perm.id}
                                                        onClick={() => togglePermission(perm.id)}
                                                        className={`
                                                            flex items-start p-3 rounded-lg border cursor-pointer transition-all
                                                            ${isSelected
                                                                ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-200'
                                                                : 'bg-white border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                                                            }
                                                        `}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={isSelected}
                                                            onChange={() => { }}
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
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
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

interface RoleListProps {
    roles: Role[]
    onEdit: (role: Role) => void
    onDelete: (role: Role) => void
    loading?: boolean
}

export const RoleList = ({ roles, onEdit, onDelete, loading }: RoleListProps) => {
    const columns: Column<Role>[] = [
        {
            header: 'Name',
            key: 'name',
            render: (value, role) => (
                <div>
                    <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-900">{role.name}</span>
                        {role.isSystem && (
                            <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                System
                            </span>
                        )}
                    </div>
                    {role.description && <div className="text-xs text-gray-500">{role.description}</div>}
                </div>
            )
        },
        {
            header: 'Users Assigned',
            key: '_count',
            render: (value, role) => (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {role._count?.users || 0}
                </span>
            )
        },
        {
            header: 'Actions',
            key: 'actions',
            render: (value, role) => (
                <div className="flex space-x-2 justify-end">
                    <button
                        onClick={() => onEdit(role)}
                        className="text-blue-600 hover:text-blue-900 p-1"
                        title="Edit"
                    >
                        <PencilSquareIcon className="h-4 w-4" />
                    </button>
                    {!role.isSystem && (
                        <button
                            onClick={() => onDelete(role)}
                            className="text-red-600 hover:text-red-900 p-1"
                            title="Delete"
                        >
                            <TrashIcon className="h-4 w-4" />
                        </button>
                    )}
                </div>
            )
        }
    ]

    return (
        <DataTable
            data={roles}
            columns={columns}
            loading={loading}
            searchKeys={['name', 'description']}
        />
    )
}
