"use client"

import { PlusIcon } from '@heroicons/react/24/outline'
import DashboardShell from '@/components/ui/DashboardShell'
import { DepartmentForm, DepartmentList, type DepartmentFormField } from '@/components/features/departments'
import type { Department, EmployeeSummary } from '@/types/hrm'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { LoadingSpinner } from '@/components/ui/CommonComponents'
import { useDepartmentsPage } from '@/hooks/useDepartmentsPage'

interface DepartmentsPageClientProps {
  initialDepartments?: Department[]
  initialEmployees?: EmployeeSummary[]
}

export function DepartmentsPageClient({
  initialDepartments = [],
  initialEmployees = [],
}: DepartmentsPageClientProps) {
  const {
    departments,
    employees,
    loading,
    formErrors,
    setFormErrors,
    isModalOpen,
    editingDepartment,
    isDeleteOpen,
    departmentToDelete,
    setIsModalOpen,
    setIsDeleteOpen,
    setDepartmentToDelete,
    handleCreate,
    handleEdit,
    handleDeleteRequest,
    handleSubmit,
    handleDeleteConfirm,
    saveDepartment,
    deleteDepartmentMutation,
  } = useDepartmentsPage(initialDepartments, initialEmployees)

  const actionLoading = saveDepartment.isPending || deleteDepartmentMutation.isPending

  return (
    <DashboardShell>
      <div className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="space-y-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-gray-100 shadow-sm">
                <LoadingSpinner size="lg" />
                <p className="mt-4 text-sm font-medium text-gray-500">Loading departments…</p>
              </div>
            ) : departments.length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-500">No departments found.</div>
            ) : (
              <div className="space-y-8">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Departments</h1>
                    <p className="mt-1 text-sm text-gray-500">Manage company organizational structure and hierarchy</p>
                  </div>
                  <button
                    onClick={handleCreate}
                    className="inline-flex items-center px-4 py-2.5 border border-transparent rounded-xl shadow-lg shadow-blue-600/20 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-all active:scale-[0.98] outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                    Add Department
                  </button>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                  <DepartmentList
                    departments={departments}
                    onEdit={handleEdit}
                    onDelete={handleDeleteRequest}
                    loading={loading && !departments.length}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <DepartmentForm
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        initialData={editingDepartment}
        departments={departments}
        employees={employees}
        loading={actionLoading}
        apiErrors={formErrors}
        onClearApiErrors={(field: DepartmentFormField) => {
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
        title="Delete Department"
        message={`Are you sure you want to delete "${departmentToDelete?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
        loading={deleteDepartmentMutation.isPending}
      />
    </DashboardShell>
  )
}
