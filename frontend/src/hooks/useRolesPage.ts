'use client'

import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/components/ui/ToastProvider'
import { handleCrudError } from '@/lib/apiError'
import { useAuthStore } from '@/store/useAuthStore'
import type { Role, Permission } from '@/types/hrm'
import { getRoles, getPermissions, createRoleApi, updateRoleApi, deleteRoleApi } from '@/services/roles/api'

export interface PermissionsPayload {
  permissions: Permission[]
  grouped: Record<string, Permission[]>
}

export interface UseRolesPageProps {
  initialRoles: Role[]
  initialPermissionsPayload: PermissionsPayload
}

export function useRolesPage({ initialRoles, initialPermissionsPayload }: UseRolesPageProps) {
  const { token } = useAuthStore()
  const { showToast } = useToast()
  const queryClient = useQueryClient()

  const [formErrors, setFormErrors] = useState<Partial<Record<string, string>>>({})
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null)

  const rolesQuery = useQuery<Role[]>({
    queryKey: ['roles', token],
    queryFn: () => getRoles(token ?? undefined),
    enabled: !!token,
    initialData: initialRoles,
  })

  const permissionsQuery = useQuery<PermissionsPayload>({
    queryKey: ['roles', 'permissions', token],
    queryFn: () => getPermissions(token ?? undefined),
    enabled: !!token,
    initialData: initialPermissionsPayload,
    staleTime: 5 * 60 * 1000,
  })

  const permissions = permissionsQuery.data?.permissions ?? []
  const groupedPermissions = permissionsQuery.data?.grouped ?? {}

  useEffect(() => {
    if (!rolesQuery.isLoading && !permissionsQuery.isLoading && permissions.length === 0) {
      console.warn('[roles] permissions payload empty for current token; grouped keys:', Object.keys(groupedPermissions))
    }
  }, [rolesQuery.isLoading, permissionsQuery.isLoading, permissions.length, groupedPermissions])

  const invalidateRoleQueries = () => {
    queryClient.invalidateQueries({ queryKey: ['roles'] })
    queryClient.invalidateQueries({ queryKey: ['roles', 'permissions'] })
  }

  const handleCreate = () => {
    setFormErrors({})
    setEditingRole(null)
    setIsModalOpen(true)
  }

  const handleEdit = (role: Role) => {
    setFormErrors({})
    setEditingRole(role)
    setIsModalOpen(true)
  }

  const handleDeleteRequest = (role: Role) => {
    setRoleToDelete(role)
    setIsDeleteOpen(true)
  }

  const saveRole = useMutation({
    mutationFn: async ({ payload, roleId }: { payload: Partial<Role> & { permissionIds?: string[] }; roleId?: string }) => {
      if (roleId) {
        await updateRoleApi(roleId, payload, token ?? undefined)
        return 'updated'
      }
      await createRoleApi(payload, token ?? undefined)
      return 'created'
    },
    onSuccess: (action) => {
      showToast(action === 'updated' ? 'Role updated successfully' : 'Role created successfully', 'success')
      setFormErrors({})
      setIsModalOpen(false)
      setEditingRole(null)
      invalidateRoleQueries()
    },
    onError: (error: unknown) => {
      handleCrudError({
        error,
        resourceLabel: 'Role',
        showToast,
        setFieldError: (field, message) => setFormErrors((prev) => ({ ...prev, [field]: message })),
        defaultField: 'name',
        onUnauthorized: () => console.warn('Not authorized to manage roles'),
      })
    },
  })

  const deleteRole = useMutation({
    mutationFn: async (roleId: string) => deleteRoleApi(roleId, token ?? undefined),
    onSuccess: () => {
      showToast('Role deleted successfully', 'success')
      setIsDeleteOpen(false)
      setRoleToDelete(null)
      invalidateRoleQueries()
    },
    onError: (error: unknown) => {
      handleCrudError({
        error,
        resourceLabel: 'Role',
        showToast,
        onUnauthorized: () => console.warn('Not authorized to delete roles'),
      })
    },
  })

  const handleSubmit = async (data: Partial<Role> & { permissionIds?: string[] }) => {
    await saveRole.mutateAsync({ payload: data, roleId: editingRole?.id })
  }

  const handleDeleteConfirm = async () => {
    if (!roleToDelete) return
    await deleteRole.mutateAsync(roleToDelete.id)
  }

  const actionLoading = saveRole.isPending || deleteRole.isPending
  const rolesLoading = rolesQuery.isLoading
  const permissionsLoading = permissionsQuery.isLoading
  const showSkeleton = rolesLoading && (rolesQuery.data?.length ?? 0) === 0

  return {
    roles: rolesQuery.data ?? [],
    permissions,
    groupedPermissions,
    formErrors,
    setFormErrors,
    isModalOpen,
    setIsModalOpen,
    editingRole,
    isDeleteOpen,
    setIsDeleteOpen,
    roleToDelete,
    setRoleToDelete,
    handleCreate,
    handleEdit,
    handleDeleteRequest,
    handleSubmit,
    handleDeleteConfirm,
    actionLoading,
    deleteRole,
    saveRole,
    rolesLoading,
    permissionsLoading,
    showSkeleton,
  }
}
