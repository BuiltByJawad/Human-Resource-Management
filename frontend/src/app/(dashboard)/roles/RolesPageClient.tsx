"use client"

import { PlusIcon } from "@heroicons/react/24/outline"

import DashboardShell from "@/components/ui/DashboardShell"
import { Button } from "@/components/ui/FormComponents"
import { ConfirmDialog } from "@/components/ui/ConfirmDialog"
import { Skeleton } from "@/components/ui/Skeleton"
import { RoleForm, RoleList, type RoleFormField } from "@/components/hrm/RoleComponents"
import { useRolesPage } from "@/hooks/useRolesPage"
import type { Role, Permission } from "@/types/hrm"

interface RolesPageClientProps {
  initialRoles: Role[]
  initialPermissionsPayload: {
    permissions: Permission[]
    grouped: Record<string, Permission[]>
  }
}

export function RolesPageClient({ initialRoles, initialPermissionsPayload }: RolesPageClientProps) {
  const {
    roles,
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
    handleCreate,
    handleEdit,
    handleDeleteRequest,
    handleSubmit,
    handleDeleteConfirm,
    actionLoading,
    deleteRole,
    rolesLoading,
    permissionsLoading,
    showSkeleton,
  } = useRolesPage({ initialRoles, initialPermissionsPayload })

  return (
    <DashboardShell>
      <div className="p-4 md:p-6">
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

              <RoleList roles={roles} onEdit={handleEdit} onDelete={handleDeleteRequest} loading={rolesLoading && !roles.length} />
            </>
          )}
        </div>
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
        onClearApiErrors={(field: RoleFormField) => {
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
    </DashboardShell>
  )
}
