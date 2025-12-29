"use client"

import { useEffect, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { PlusIcon } from "@heroicons/react/24/outline"

import Sidebar from "@/components/ui/Sidebar"
import Header from "@/components/ui/Header"
import { Button } from "@/components/ui/FormComponents"
import { ConfirmDialog } from "@/components/ui/ConfirmDialog"
import { Skeleton } from "@/components/ui/Skeleton"
import {
  Role,
  Permission,
  RoleList,
  RoleForm,
  type RoleFormField,
} from "@/components/hrm/RoleComponents"
import { useAuthStore } from "@/store/useAuthStore"
import { useToast } from "@/components/ui/ToastProvider"
import { handleCrudError } from "@/lib/apiError"
import {
  fetchRolesWithToken,
  fetchRolePermissions,
  createRole,
  updateRole,
  deleteRoleById,
} from "@/lib/hrmData"

interface RolesPageClientProps {
  initialRoles: Role[]
  initialPermissionsPayload: {
    permissions: Permission[]
    grouped: Record<string, Permission[]>
  }
}

export function RolesPageClient({ initialRoles, initialPermissionsPayload }: RolesPageClientProps) {
  const { token } = useAuthStore()
  const { showToast } = useToast()
  const queryClient = useQueryClient()

  const [formErrors, setFormErrors] = useState<Partial<Record<RoleFormField, string>>>({})
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null)

  const {
    data: roles = [],
    isLoading: rolesLoading,
  } = useQuery<Role[]>({
    queryKey: ["roles", token],
    queryFn: () => fetchRolesWithToken(token ?? undefined),
    enabled: !!token,
    initialData: initialRoles,
  })

  const {
    data: permissionsPayload = initialPermissionsPayload,
    isLoading: permissionsLoading,
  } = useQuery<{
    permissions: Permission[]
    grouped: Record<string, Permission[]>
  }>({
    queryKey: ["roles", "permissions", token],
    queryFn: () => fetchRolePermissions(token ?? undefined),
    enabled: !!token,
    initialData: initialPermissionsPayload,
    staleTime: 5 * 60 * 1000,
  })

  const permissions = permissionsPayload?.permissions ?? []
  const groupedPermissions = permissionsPayload?.grouped ?? {}

  // Debug: surface empty permissions payload in browser console
  useEffect(() => {
    if (!rolesLoading && !permissionsLoading && permissions.length === 0) {
      console.warn('[roles] permissions payload is empty for current token; grouped keys:', Object.keys(groupedPermissions))
    }
  }, [rolesLoading, permissionsLoading, permissions.length, groupedPermissions])

  const invalidateRoleQueries = () => {
    queryClient.invalidateQueries({ queryKey: ["roles"] })
    queryClient.invalidateQueries({ queryKey: ["roles", "permissions"] })
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

  const handleDeleteClick = (role: Role) => {
    setRoleToDelete(role)
    setIsDeleteOpen(true)
  }

  const saveRole = useMutation({
    mutationFn: async ({
      payload,
      roleId,
    }: {
      payload: Partial<Role> & { permissionIds?: string[] }
      roleId?: string
    }) => {
      if (roleId) {
        await updateRole(roleId, payload, token ?? undefined)
        return "updated"
      }
      await createRole(payload, token ?? undefined)
      return "created"
    },
    onSuccess: (action) => {
      showToast(action === "updated" ? "Role updated successfully" : "Role created successfully", "success")
      setFormErrors({})
      setIsModalOpen(false)
      setEditingRole(null)
      invalidateRoleQueries()
    },
    onError: (error: any) => {
      handleCrudError({
        error,
        resourceLabel: "Role",
        showToast,
        setFieldError: (field, message) => {
          setFormErrors((prev) => ({ ...prev, [field as RoleFormField]: message }))
        },
        defaultField: "name",
        onUnauthorized: () => console.warn("Not authorized to manage roles"),
      })
    },
  })

  const deleteRole = useMutation({
    mutationFn: async (roleId: string) => {
      await deleteRoleById(roleId, token ?? undefined)
    },
    onSuccess: () => {
      showToast("Role deleted successfully", "success")
      setIsDeleteOpen(false)
      setRoleToDelete(null)
      invalidateRoleQueries()
    },
    onError: (error: any) => {
      handleCrudError({
        error,
        resourceLabel: "Role",
        showToast,
        onUnauthorized: () => console.warn("Not authorized to delete roles"),
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
  const showSkeleton = rolesLoading && !roles.length

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {showSkeleton ? (
              <div className="space-y-6">
                <header className="flex justify-between items-center">
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-72" />
                  </div>
                  <Skeleton className="h-10 w-32" />
                </header>
                <div className="space-y-3">
                  {[1, 2, 3].map((row) => (
                    <Skeleton key={row} className="h-20 w-full" />
                  ))}
                </div>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">Roles &amp; Permissions</h1>
                    <p className="text-sm text-gray-500">Manage user roles and access control</p>
                  </div>
                  <Button onClick={handleCreate} className="flex items-center">
                    <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                    Add Role
                  </Button>
                </div>

                <RoleList roles={roles} onEdit={handleEdit} onDelete={handleDeleteClick} loading={rolesLoading && !roles.length} />
              </>
            )}
          </div>
        </main>
      </div>

      <RoleForm
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        initialData={editingRole}
        permissions={permissions}
        groupedPermissions={groupedPermissions}
        loading={actionLoading || permissionsLoading}
        apiErrors={formErrors}
        onClearApiErrors={(field) => {
          setFormErrors((prev) => {
            if (!prev[field]) return prev
            const next = { ...prev }
            delete next[field]
            return next
          })
        }}
      />

      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Role"
        message={`Are you sure you want to delete "${roleToDelete?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
        loading={deleteRole.isPending}
      />
    </div>
  )
}
