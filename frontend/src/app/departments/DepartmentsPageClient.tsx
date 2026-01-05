"use client"

import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { PlusIcon } from '@heroicons/react/24/outline'

import DashboardShell from '@/components/ui/DashboardShell'
import {
  DepartmentForm,
  type DepartmentFormErrors,
  DepartmentList,
} from '@/components/hrm/DepartmentComponents'
import type { Department } from '@/features/departments'
import type { EmployeeSummary } from '@/features/employees'
import { useAuth } from '@/features/auth'
import { useToast } from '@/components/ui/ToastProvider'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { LoadingSpinner } from '@/components/ui/CommonComponents'
import {
  fetchDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartmentById,
} from '@/features/departments'
import { fetchEmployeesForManagers } from '@/features/employees'
import { handleCrudError } from '@/lib/apiError'

interface DepartmentsPageClientProps {
  initialDepartments?: Department[]
  initialEmployees?: EmployeeSummary[]
}

export function DepartmentsPageClient({
  initialDepartments = [],
  initialEmployees = [],
}: DepartmentsPageClientProps) {
  const { token } = useAuth()
  const { showToast } = useToast()
  // State
  const queryClient = useQueryClient()

  const [formErrors, setFormErrors] = useState<DepartmentFormErrors>({})
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null)

  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [departmentToDelete, setDepartmentToDelete] = useState<Department | null>(null)

  const {
    data: departments = [],
    isPending: departmentsPending,
  } = useQuery<Department[]>({
    queryKey: ['departments', token],
    queryFn: () => fetchDepartments(token ?? undefined),
    initialData: initialDepartments.length > 0 ? initialDepartments : undefined,
  })

  const {
    data: employees = initialEmployees,
    isPending: employeesPending,
  } = useQuery<EmployeeSummary[]>({
    queryKey: ['employees', 'manager-list', token],
    queryFn: () => fetchEmployeesForManagers(token ?? undefined),
    initialData: initialEmployees.length > 0 ? initialEmployees : undefined,
  })

  const listLoading = departmentsPending || employeesPending || !token

  const refetchLists = () => {
    queryClient.invalidateQueries({ queryKey: ['departments', token] })
    queryClient.invalidateQueries({ queryKey: ['employees', 'manager-list', token] })
  }

  const handleCreate = () => {
    setFormErrors({})
    setEditingDepartment(null)
    setIsModalOpen(true)
  }

  const handleEdit = (dept: Department) => {
    setFormErrors({})
    setEditingDepartment(dept)
    setIsModalOpen(true)
  }

  const handleDeleteClick = (dept: Department) => {
    setDepartmentToDelete(dept)
    setIsDeleteOpen(true)
  }

  const saveDepartment = useMutation({
    mutationFn: async ({
      payload,
      department,
    }: {
      payload: Partial<Department>
      department?: Department | null
    }) => {
      if (department) {
        await updateDepartment(department.id, payload, token ?? undefined)
        return 'updated'
      }
      await createDepartment(payload, token ?? undefined)
      return 'created'
    },
    onSuccess: (action) => {
      showToast(
        action === 'updated' ? 'Department updated successfully' : 'Department created successfully',
        'success',
      )
      setFormErrors({})
      setIsModalOpen(false)
      setEditingDepartment(null)
      refetchLists()
    },
    onError: (error: any) => {
      handleCrudError({
        error,
        resourceLabel: 'Department',
        showToast,
        setFieldError: (field, message) => {
          setFormErrors((prev) => ({ ...prev, [field]: message }))
        },
        defaultField: 'name',
        onUnauthorized: () => console.warn('Department action unauthorized'),
      })
    },
  })

  const deleteDepartment = useMutation({
    mutationFn: async (departmentId: string) => {
      await deleteDepartmentById(departmentId, token ?? undefined)
    },
    onSuccess: () => {
      showToast('Department deleted successfully', 'success')
      setIsDeleteOpen(false)
      setDepartmentToDelete(null)
      refetchLists()
    },
    onError: (error: any) => {
      handleCrudError({
        error,
        resourceLabel: 'Department',
        showToast,
        onUnauthorized: () => console.warn('Department delete unauthorized'),
      })
    },
  })

  const handleSubmit = async (data: Partial<Department>) => {
    await saveDepartment.mutateAsync({ payload: data, department: editingDepartment })
  }

  const handleDeleteConfirm = async () => {
    if (!departmentToDelete) return
    await deleteDepartment.mutateAsync(departmentToDelete.id)
  }

  const actionLoading = saveDepartment.isPending || deleteDepartment.isPending
  const currentEmployees = useMemo(() => employees ?? [], [employees])

  return (
    <DashboardShell>
      <div className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="space-y-6">
            {departmentsPending ? (
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
                    onDelete={handleDeleteClick}
                    loading={departmentsPending && !departments.length}
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
        employees={currentEmployees}
        loading={actionLoading}
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
        title="Delete Department"
        message={`Are you sure you want to delete "${departmentToDelete?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
        loading={deleteDepartment.isPending}
      />
    </DashboardShell>
  )
}
