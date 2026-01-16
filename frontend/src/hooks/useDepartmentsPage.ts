'use client'

import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { PlusIcon } from '@heroicons/react/24/outline'
import { useAuthStore } from '@/store/useAuthStore'
import { useToast } from '@/components/ui/ToastProvider'
import { handleCrudError } from '@/lib/apiError'
import type { Department, EmployeeSummary } from '@/types/hrm'
import {
  fetchDepartments,
  fetchManagerSummaries,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from '@/services/departments/api'

export type DepartmentFormErrors = Partial<Record<'name' | 'description' | 'managerId' | 'parentDepartmentId', string>>

export function useDepartmentsPage(initialDepartments: Department[] = [], initialEmployees: EmployeeSummary[] = []) {
  const { token } = useAuthStore()
  const { showToast } = useToast()
  const queryClient = useQueryClient()

  const [formErrors, setFormErrors] = useState<DepartmentFormErrors>({})
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [departmentToDelete, setDepartmentToDelete] = useState<Department | null>(null)

  const departmentsQuery = useQuery<Department[]>({
    queryKey: ['departments', token],
    queryFn: () => fetchDepartments(token ?? undefined),
    initialData: initialDepartments.length > 0 ? initialDepartments : undefined,
  })

  const managersQuery = useQuery<EmployeeSummary[]>({
    queryKey: ['employees', 'manager-list', token],
    queryFn: () => fetchManagerSummaries(token ?? undefined),
    initialData: initialEmployees.length > 0 ? initialEmployees : undefined,
  })

  const listLoading = departmentsQuery.isPending || managersQuery.isPending || !token

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

  const handleDeleteRequest = (dept: Department) => {
    setDepartmentToDelete(dept)
    setIsDeleteOpen(true)
  }

  const saveDepartment = useMutation({
    mutationFn: async ({ payload, department }: { payload: Partial<Department>; department?: Department | null }) => {
      if (department) {
        await updateDepartment(department.id, payload, token ?? undefined)
        return 'updated'
      }
      await createDepartment(payload, token ?? undefined)
      return 'created'
    },
    onSuccess: (action) => {
      showToast(action === 'updated' ? 'Department updated successfully' : 'Department created successfully', 'success')
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
        setFieldError: (field, message) => setFormErrors((prev) => ({ ...prev, [field]: message })),
        defaultField: 'name',
        onUnauthorized: () => console.warn('Department action unauthorized'),
      })
    },
  })

  const deleteDepartmentMutation = useMutation({
    mutationFn: async (departmentId: string) => deleteDepartment(departmentId, token ?? undefined),
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
    await deleteDepartmentMutation.mutateAsync(departmentToDelete.id)
  }

  const currentEmployees = useMemo(() => managersQuery.data ?? [], [managersQuery.data])

  return {
    departments: departmentsQuery.data ?? [],
    employees: currentEmployees,
    loading: listLoading,
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
  }
}
