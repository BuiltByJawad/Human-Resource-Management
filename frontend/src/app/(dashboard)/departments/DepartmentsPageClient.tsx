"use client"

import { useMemo, useState } from 'react'

import DashboardShell from '@/components/ui/DashboardShell'
import {
  DepartmentForm,
  DepartmentList,
  DepartmentFilters,
  DepartmentStats,
  type DepartmentFormField,
} from '@/components/features/departments'
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

  const [searchTerm, setSearchTerm] = useState('')
  const filteredDepartments = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    if (!term) return departments
    return departments.filter((dept) => {
      const managerName = dept.manager ? `${dept.manager.firstName} ${dept.manager.lastName}` : ''
      return [dept.name, dept.description ?? '', dept.parentDepartment?.name ?? '', managerName]
        .join(' ')
        .toLowerCase()
        .includes(term)
    })
  }, [departments, searchTerm])

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
                <DepartmentFilters searchTerm={searchTerm} onSearchChange={setSearchTerm} onCreate={handleCreate} />

                <DepartmentStats departments={departments} />

                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                  <DepartmentList
                    departments={filteredDepartments}
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
