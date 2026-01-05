"use client"

import { Suspense, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

import Sidebar from '@/components/ui/Sidebar'
import Header from '@/components/ui/Header'
import { useAuth } from '@/features/auth'
import {
  EmployeeForm,
  type Employee,
  EmployeesToolbar,
  EmployeesListSection,
  EmployeeDetailsModal,
  fetchEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployeeById,
  sendEmployeeInvite,
  type EmployeesPage,
  type EmployeesPagination,
} from '@/features/employees'
import { Modal } from '@/components/ui/Modal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { useToast } from '@/components/ui/ToastProvider'
import { useDebounce } from '@/shared/hooks/useDebounce'
import type { Department } from '@/features/departments'
import type { Role } from '@/features/roles'
import { fetchDepartments } from '@/features/departments'
import { fetchRoles } from '@/features/roles'

interface EmployeesPageClientProps {
  initialDepartments?: Department[]
  initialRoles?: Role[]
  initialEmployees?: EmployeesPage | null
}

function EmployeesContent({
  initialDepartments = [],
  initialRoles = [],
  initialEmployees
}: EmployeesPageClientProps) {
  const searchParams = useSearchParams()
  const { token } = useAuth()
  const { showToast } = useToast()
  const queryClient = useQueryClient()

  const defaultPagination = initialEmployees?.pagination ?? { page: 1, limit: 9, total: 0, pages: 0 }

  const [mounted, setMounted] = useState(false)
  const [pagination, setPagination] = useState<EmployeesPagination>(defaultPagination)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | undefined>(undefined)
  const [viewingEmployee, setViewingEmployee] = useState<Employee | undefined>()
  const [pendingDelete, setPendingDelete] = useState<Employee | null>(null)

  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterDepartment, setFilterDepartment] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const debouncedSearch = useDebounce(searchTerm, 500)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const initial = searchParams.get('search') || ''
    setSearchTerm(initial)
  }, [searchParams])

  const sendInviteMutation = useMutation({
    mutationFn: async (employee: Employee) => {
      if (!employee.email || !employee.role?.id) {
        throw new Error('Employee email and role are required to send an invite')
      }
      await sendEmployeeInvite(
        { email: employee.email, roleId: employee.role.id },
        token ?? undefined,
      )
    },
    onSuccess: () => {
      showToast('Invite link sent to employee', 'success')
      queryClient.invalidateQueries({ queryKey: ['employees', token] })
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to send invite', 'error')
    },
  })

  const departmentsQuery = useQuery<Department[]>({
    queryKey: ['departments', token],
    queryFn: () => fetchDepartments(token ?? undefined),
    enabled: !!token,
    initialData: initialDepartments,
  })

  const rolesQuery = useQuery<Role[]>({
    queryKey: ['roles', token],
    queryFn: () => fetchRoles(token ?? undefined),
    enabled: !!token,
    initialData: initialRoles,
  })

  const isDefaultFilters =
    pagination.page === defaultPagination.page &&
    pagination.limit === defaultPagination.limit &&
    filterStatus === 'all' &&
    filterDepartment === 'all' &&
    !debouncedSearch

  const employeesQuery = useQuery<EmployeesPage>({
    queryKey: ['employees', token, pagination.page, pagination.limit, debouncedSearch, filterStatus, filterDepartment],
    queryFn: () =>
			fetchEmployees(
			  {
			    page: pagination.page,
			    limit: pagination.limit,
			    search: debouncedSearch,
			    status: filterStatus,
			    departmentId: filterDepartment,
			  },
			  token ?? undefined,
			),
    enabled: !!token,
    placeholderData: (previousData) => previousData,
    initialData: isDefaultFilters ? initialEmployees ?? undefined : undefined
  })

  useEffect(() => {
    if (employeesQuery.data?.pagination) {
      setPagination((prev: EmployeesPagination) => ({
        ...prev,
        ...employeesQuery.data!.pagination
      }))
    }
  }, [employeesQuery.data])

  const employees = employeesQuery.data?.employees || []

	const createEmployeeMutation = useMutation({
		mutationFn: async (data: any) => {
			const created = await createEmployee(data, token ?? undefined)
			return created
		},
    onSuccess: async (_data, variables) => {
      showToast('Employee created successfully', 'success')
      queryClient.invalidateQueries({ queryKey: ['employees', token] })
      setIsModalOpen(false)

      if (variables.email && variables.roleId) {
			try {
				await sendEmployeeInvite(
				  { email: variables.email, roleId: variables.roleId },
				  token ?? undefined,
				)
				showToast('Invite link sent to employee', 'success')
			} catch (inviteError: any) {
				if (process.env.NODE_ENV !== 'production') {
					console.error('Failed to send invite', inviteError)
				}
				showToast(inviteError.response?.data?.message || 'Failed to send invite', 'error')
			}
		}
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to create employee', 'error')
    }
  })

  const updateEmployeeMutation = useMutation({
    mutationFn: async (data: any) => {
      const { id, ...payload } = data
      const updated = await updateEmployee(id, payload, token ?? undefined)
      return updated
    },
    onSuccess: () => {
      showToast('Employee updated successfully', 'success')
      queryClient.invalidateQueries({ queryKey: ['employees', token] })
      setIsModalOpen(false)
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to update employee', 'error')
    }
  })

  const deleteEmployeeMutation = useMutation({
    mutationFn: async (id: string) => {
      await deleteEmployeeById(id, token ?? undefined)
    },
    onSuccess: () => {
      showToast('Employee deleted successfully', 'success')
      queryClient.invalidateQueries({ queryKey: ['employees', token] })
      setPendingDelete(null)
    },
    onError: () => {
      showToast('Failed to delete employee', 'error')
    }
  })

  const handleCreateEmployee = () => {
    setEditingEmployee(undefined)
    setIsModalOpen(true)
  }

  const handleEditEmployee = (employee: Employee) => {
    setEditingEmployee(employee)
    setIsModalOpen(true)
  }

  const handleViewEmployee = (employee: Employee) => {
    setViewingEmployee(employee)
  }

  const handleDeleteEmployee = (employee: Employee) => {
    setPendingDelete(employee)
  }

  const handleSendInvite = (employee: Employee) => {
    sendInviteMutation.mutate(employee)
  }

  const confirmDelete = () => {
    if (pendingDelete) {
      deleteEmployeeMutation.mutate(pendingDelete.id)
    }
  }

  const handleSubmitEmployee = (data: any) => {
    if (editingEmployee) {
      updateEmployeeMutation.mutate({ id: editingEmployee.id, ...data })
    } else {
      createEmployeeMutation.mutate(data)
    }
  }

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.pages) {
      setPagination((prev: EmployeesPagination) => ({ ...prev, page: newPage }))
    }
  }

  const departments = departmentsQuery.data ?? []
  const roles = rolesQuery.data ?? []
  const loading = employeesQuery.isLoading

  if (!mounted) {
    return null
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="max-w-7xl mx_auto space-y-6">
            <EmployeesToolbar
              totalEmployees={pagination.total}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              filterStatus={filterStatus}
              onFilterStatusChange={setFilterStatus}
              filterDepartment={filterDepartment}
              onFilterDepartmentChange={setFilterDepartment}
              departments={departments}
              onCreateEmployee={handleCreateEmployee}
            />

            <EmployeesListSection
              employees={employees}
              loading={employeesQuery.isLoading}
              pagination={pagination}
              onPageChange={handlePageChange}
              onViewEmployee={handleViewEmployee}
              onEditEmployee={handleEditEmployee}
              onDeleteEmployee={handleDeleteEmployee}
              onSendInvite={handleSendInvite}
            />
          </div>
        </main>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingEmployee ? 'Edit Employee' : 'Add New Employee'}
        size="lg"
      >
        <EmployeeForm
          employee={editingEmployee}
          onSubmit={handleSubmitEmployee}
          onCancel={() => setIsModalOpen(false)}
          departments={departments}
          roles={roles}
        />
      </Modal>

      {viewingEmployee && (
        <EmployeeDetailsModal
          isOpen={!!viewingEmployee}
          onClose={() => setViewingEmployee(undefined)}
          employee={viewingEmployee}
        />
      )}

      <ConfirmDialog
        isOpen={!!pendingDelete}
        title="Remove employee?"
        message={
          pendingDelete ? `${pendingDelete.firstName} ${pendingDelete.lastName} will be removed from your organization.` : ''
        }
        confirmText="Delete"
        onConfirm={confirmDelete}
        onClose={() => setPendingDelete(null)}
        type="danger"
      />
    </div>
  )
}

export function EmployeesPageClient(props: EmployeesPageClientProps) {
  return (
    <Suspense fallback={<div className="p-6">Loading employees...</div>}>
      <EmployeesContent {...props} />
    </Suspense>
  )
}
