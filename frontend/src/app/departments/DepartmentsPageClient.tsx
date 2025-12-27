"use client"

import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { PlusIcon } from '@heroicons/react/24/outline'

import Sidebar from '@/components/ui/Sidebar'
import Header from '@/components/ui/Header'
import {
  Department,
  DepartmentForm,
  type DepartmentFormErrors,
  DepartmentList,
} from '@/components/hrm/DepartmentComponents'
import { useAuthStore } from '@/store/useAuthStore'
import { useToast } from '@/components/ui/ToastProvider'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { LoadingSpinner } from '@/components/ui/CommonComponents'
import api from '@/lib/axios'
import { fetchDepartments, fetchEmployeesForManagers } from '@/lib/hrmData'
import { handleCrudError } from '@/lib/apiError'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

interface DepartmentsPageClientProps {
  initialDepartments?: Department[]
  initialEmployees?: any[]
}

export function DepartmentsPageClient({
  initialDepartments = [],
  initialEmployees = [],
}: DepartmentsPageClientProps) {
  const { token } = useAuthStore()
  const { showToast } = useToast()
  const queryClient = useQueryClient()

  const [formErrors, setFormErrors] = useState<DepartmentFormErrors>({})
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null)

  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [departmentToDelete, setDepartmentToDelete] = useState<Department | null>(null)

  const {
    data: departments = initialDepartments,
    isLoading: departmentsLoading,
  } = useQuery<Department[]>({
    queryKey: ['departments', token],
    queryFn: () => fetchDepartments(token ?? undefined),
    enabled: !!token,
    initialData: initialDepartments,
  })

  const {
    data: employees = initialEmployees,
    isLoading: employeesLoading,
  } = useQuery<any[]>({
    queryKey: ['employees', 'manager-list', token],
    queryFn: () => fetchEmployeesForManagers(token ?? undefined),
    enabled: !!token,
    initialData: initialEmployees,
  })

  const listLoading = departmentsLoading || employeesLoading

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
        await api.put(`${API_URL}/departments/${department.id}`, payload)
        return 'updated'
      }
      await api.post(`${API_URL}/departments`, payload)
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
      await api.delete(`${API_URL}/departments/${departmentId}`)
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
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {listLoading && !departments.length ? (
              <div className="flex flex-col items-center justify-center py-24">
                <LoadingSpinner size="lg" />
                <p className="mt-4 text-sm text-gray-500">Loading departments…</p>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">Departments</h1>
                    <p className="text-sm text-gray-500">Manage company organizational structure</p>
                  </div>
                  <button
                    onClick={handleCreate}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                    Add Department
                  </button>
                </div>

                <DepartmentList
                  departments={departments}
                  onEdit={handleEdit}
                  onDelete={handleDeleteClick}
                  loading={departmentsLoading && !departments.length}
                />
              </>
            )}
          </div>
        </main>
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
    </div>
  )
}
