'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/components/ui/ToastProvider'
import { useDebounce } from '@/hooks/useDebounce'
import { useAuthStore } from '@/store/useAuthStore'
import type {
  Department,
  EmployeesPage,
  EmployeesPagination,
  Employee,
  Role,
  EmployeePayload,
  EmployeesQueryParams,
} from '@/types/hrm'
import {
  fetchDepartments,
  fetchRolesWithToken,
  fetchEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployeeById,
  sendEmployeeInvite,
} from '@/services/employees/api'

export interface UseEmployeesPageProps {
  initialDepartments?: Department[]
  initialRoles?: Role[]
  initialEmployees?: EmployeesPage | null
}

export interface UseEmployeesPageResult {
  departments: Department[]
  roles: Role[]
  employees: Employee[]
  pagination: EmployeesPagination
  searchTerm: string
  filterStatus: string
  filterDepartment: string
  loading: boolean
  isModalOpen: boolean
  editingEmployee?: Employee
  viewingEmployee?: Employee
  pendingDelete: Employee | null
  setPendingDelete: (employee: Employee | null) => void
  setViewingEmployee: (employee?: Employee) => void
  setIsModalOpen: (open: boolean) => void
  onSearchChange: (value: string) => void
  onFilterStatusChange: (value: string) => void
  onFilterDepartmentChange: (value: string) => void
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
  onCreate: () => void
  onEdit: (employee: Employee) => void
  onSubmit: (data: EmployeePayload | (EmployeePayload & { id?: string })) => void
  onDeleteRequest: (employee: Employee) => void
  onConfirmDelete: () => void
  onSendInvite: (employee: Employee) => void
}

export function useEmployeesPage({
  initialDepartments = [],
  initialRoles = [],
  initialEmployees,
}: UseEmployeesPageProps): UseEmployeesPageResult {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const router = useRouter()
  const { token } = useAuthStore()
  const { showToast } = useToast()
  const queryClient = useQueryClient()

  const defaultPagination = initialEmployees?.pagination ?? { page: 1, limit: 9, total: 0, pages: 0 }

  const [pagination, setPagination] = useState<EmployeesPagination>(defaultPagination)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | undefined>(undefined)
  const [viewingEmployee, setViewingEmployee] = useState<Employee | undefined>()
  const [pendingDelete, setPendingDelete] = useState<Employee | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterDepartment, setFilterDepartment] = useState<string>('all')
  const initialSearchTerm = useMemo(() => (searchParams.get('search') ?? '').trim(), [searchParams])
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm)
  const skipNextUrlSyncRef = useRef(false)

  useEffect(() => {
    setSearchTerm(initialSearchTerm)
    skipNextUrlSyncRef.current = true
  }, [initialSearchTerm])
  const debouncedSearch = useDebounce(searchTerm, 500)

  useEffect(() => {
    if (!pathname.startsWith('/employees')) return
    if (skipNextUrlSyncRef.current) {
      skipNextUrlSyncRef.current = false
      return
    }
    const currentQuery = (searchParams.get('search') ?? '').trim()
    const nextQuery = debouncedSearch.trim()
    if (currentQuery === nextQuery) return

    const params = new URLSearchParams(searchParams.toString())
    if (nextQuery) {
      params.set('search', nextQuery)
    } else {
      params.delete('search')
    }

    const queryString = params.toString()
    router.replace(queryString ? `${pathname}?${queryString}` : pathname)
  }, [debouncedSearch, pathname, router, searchParams])

  const baseQueryParams: EmployeesQueryParams = useMemo(
    () => ({
      page: pagination.page,
      limit: pagination.limit,
      search: debouncedSearch,
      status: filterStatus,
      departmentId: filterDepartment,
    }),
    [pagination.page, pagination.limit, debouncedSearch, filterStatus, filterDepartment]
  )

  const departmentsQuery = useQuery<Department[]>({
    queryKey: ['departments', token],
    queryFn: () => fetchDepartments(token ?? undefined),
    enabled: !!token,
    initialData: initialDepartments,
    staleTime: 60 * 60 * 1000,
    gcTime: 2 * 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  })

  const rolesQuery = useQuery<Role[]>({
    queryKey: ['roles', token],
    queryFn: () => fetchRolesWithToken(token ?? undefined),
    enabled: !!token,
    initialData: initialRoles,
    staleTime: 60 * 60 * 1000,
    gcTime: 2 * 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  })

  const isDefaultFilters =
    pagination.page === defaultPagination.page &&
    pagination.limit === defaultPagination.limit &&
    filterStatus === 'all' &&
    filterDepartment === 'all' &&
    !debouncedSearch

  const employeesQueryKey = useMemo(
    () => ['employees', token, pagination.page, pagination.limit, debouncedSearch, filterStatus, filterDepartment] as const,
    [token, pagination.page, pagination.limit, debouncedSearch, filterStatus, filterDepartment]
  )

  const employeesQuery = useQuery<EmployeesPage>({
    queryKey: employeesQueryKey,
    queryFn: () => fetchEmployees(baseQueryParams, token ?? undefined),
    enabled: !!token,
    placeholderData: (previousData) => previousData,
    initialData: isDefaultFilters ? initialEmployees ?? undefined : undefined,
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  })

  useEffect(() => {
    if (employeesQuery.data?.pagination) {
      setPagination((prev) => ({ ...prev, ...employeesQuery.data!.pagination }))
    }
  }, [employeesQuery.data])

  const employees = employeesQuery.data?.employees || []

  const sendInviteMutation = useMutation({
    mutationFn: async (employee: Employee) => {
      if (!employee.email || !employee.role?.id) {
        throw new Error('Employee email and role are required to send an invite')
      }
      await sendEmployeeInvite({ email: employee.email, roleId: employee.role.id }, token ?? undefined)
    },
    onSuccess: () => {
      showToast('Invite link sent to employee', 'success')
      queryClient.invalidateQueries({ queryKey: employeesQueryKey, exact: true })
    },
    onError: (error: any) => {
      showToast(error?.response?.data?.message || 'Failed to send invite', 'error')
    },
  })

  const createEmployeeMutation = useMutation({
    mutationFn: async (payload: EmployeePayload) => createEmployee(payload, token ?? undefined),
    onSuccess: async (_data, variables) => {
      showToast('Employee created successfully', 'success')
      queryClient.invalidateQueries({ queryKey: employeesQueryKey, exact: true })
      setIsModalOpen(false)

      if (variables.email && variables.roleId) {
        try {
          await sendEmployeeInvite({ email: variables.email, roleId: variables.roleId }, token ?? undefined)
          showToast('Invite link sent to employee', 'success')
        } catch (inviteError: any) {
          showToast(inviteError?.response?.data?.message || 'Failed to send invite', 'error')
        }
      }
    },
    onError: (error: any) => {
      showToast(error?.response?.data?.message || 'Failed to create employee', 'error')
    },
  })

  const updateEmployeeMutation = useMutation({
    mutationFn: async (payload: EmployeePayload & { id: string }) => {
      const { id, ...rest } = payload
      return updateEmployee(id, rest, token ?? undefined)
    },
    onSuccess: () => {
      showToast('Employee updated successfully', 'success')
      queryClient.invalidateQueries({ queryKey: employeesQueryKey, exact: true })
      setIsModalOpen(false)
    },
    onError: (error: any) => {
      showToast(error?.response?.data?.message || 'Failed to update employee', 'error')
    },
  })

  const deleteEmployeeMutation = useMutation({
    mutationFn: async (id: string) => deleteEmployeeById(id, token ?? undefined),
    onSuccess: () => {
      showToast('Employee deleted successfully', 'success')
      queryClient.invalidateQueries({ queryKey: employeesQueryKey, exact: true })
      setPendingDelete(null)
    },
    onError: () => {
      showToast('Failed to delete employee', 'error')
    },
  })

  const handleCreate = () => {
    setEditingEmployee(undefined)
    setIsModalOpen(true)
  }

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee)
    setIsModalOpen(true)
  }

  const handleDeleteRequest = (employee: Employee) => {
    setPendingDelete(employee)
  }

  const handleSubmit = (data: EmployeePayload | (EmployeePayload & { id?: string })) => {
    if ('id' in data && data.id) {
      updateEmployeeMutation.mutate({ ...(data as EmployeePayload), id: data.id })
    } else {
      createEmployeeMutation.mutate(data as EmployeePayload)
    }
  }

  const handleConfirmDelete = () => {
    if (pendingDelete) {
      deleteEmployeeMutation.mutate(pendingDelete.id)
    }
  }

  const handleSendInvite = (employee: Employee) => {
    sendInviteMutation.mutate(employee)
  }

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.pages) {
      setPagination((prev) => ({ ...prev, page: newPage }))
    }
  }

  const handlePageSizeChange = (size: number) => {
    if (!Number.isFinite(size) || size <= 0) return
    setPagination((prev) => ({ ...prev, limit: size, page: 1 }))
  }

  return {
    departments: departmentsQuery.data ?? [],
    roles: rolesQuery.data ?? [],
    employees,
    pagination,
    searchTerm,
    filterStatus,
    filterDepartment,
    loading: employeesQuery.isLoading,
    isModalOpen,
    editingEmployee,
    viewingEmployee,
    pendingDelete,
    setPendingDelete,
    setViewingEmployee,
    setIsModalOpen,
    onSearchChange: setSearchTerm,
    onFilterStatusChange: setFilterStatus,
    onFilterDepartmentChange: setFilterDepartment,
    onPageChange: handlePageChange,
    onPageSizeChange: handlePageSizeChange,
    onCreate: handleCreate,
    onEdit: handleEdit,
    onSubmit: handleSubmit,
    onDeleteRequest: handleDeleteRequest,
    onConfirmDelete: handleConfirmDelete,
    onSendInvite: handleSendInvite,
  }
}
