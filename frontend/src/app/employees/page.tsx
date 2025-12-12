'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import axios from 'axios'
import Sidebar from '@/components/ui/Sidebar'
import Header from '@/components/ui/Header'
import { EmployeeForm, Employee } from '@/components/hrm/EmployeeComponents'
import EmployeeDetailsModal from '@/components/hrm/EmployeeDetailsModal'
import { Modal } from '@/components/ui/Modal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { useToast } from '@/components/ui/ToastProvider'
import { useAuthStore } from '@/store/useAuthStore'
import { useDebounce } from '@/hooks/useDebounce'
import { EmployeesToolbar, EmployeesListSection } from '@/components/hrm/EmployeesPageComponents'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

interface Department {
  id: string
  name: string
}

interface Role {
  id: string
  name: string
}

interface Pagination {
  page: number
  limit: number
  total: number
  pages: number
}

function EmployeesContent() {
  const searchParams = useSearchParams()
  const { token } = useAuthStore()
  const { showToast } = useToast()
  const queryClient = useQueryClient()

  const [mounted, setMounted] = useState(false)
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 9, total: 0, pages: 0 })

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | undefined>(undefined)
  const [viewingEmployee, setViewingEmployee] = useState<Employee | undefined>()
  const [pendingDelete, setPendingDelete] = useState<Employee | null>(null)

  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterDepartment, setFilterDepartment] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const debouncedSearch = useDebounce(searchTerm, 500)

  // Mark mounted on client to avoid hydration issues
  useEffect(() => {
    setMounted(true)
  }, [])

  // Initialize search term from URL on client after mount to avoid server/client mismatch
  useEffect(() => {
    const initial = searchParams.get('search') || ''
    setSearchTerm(initial)
  }, [searchParams])

  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/departments`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      return response.data.data as Department[]
    },
    enabled: !!token
  })

  const { data: roles = [] } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/roles`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      return response.data.data as Role[]
    },
    enabled: !!token
  })

  const { data: employeesData, isLoading: loading } = useQuery({
    queryKey: ['employees', pagination.page, pagination.limit, debouncedSearch, filterStatus, filterDepartment],
    queryFn: async () => {
      const params: any = {
        page: pagination.page,
        limit: pagination.limit,
      }

      if (debouncedSearch) params.search = debouncedSearch
      if (filterStatus !== 'all') params.status = filterStatus
      if (filterDepartment !== 'all') params.departmentId = filterDepartment

      const response = await axios.get(`${API_URL}/employees`, {
        headers: { Authorization: `Bearer ${token}` },
        params
      })
      return response.data.data
    },
    enabled: !!token,
    placeholderData: (previousData) => previousData,
  })

  // Update pagination state when data changes
  useEffect(() => {
    if (employeesData?.pagination) {
      setPagination(employeesData.pagination)
    }
  }, [employeesData])

  const employees = employeesData?.employees || []

  const createEmployeeMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await axios.post(`${API_URL}/employees`, data, {
        headers: { Authorization: `Bearer ${token}` }
      })
      return response.data
    },
    onSuccess: async (data, variables) => {
      showToast('Employee created successfully', 'success')
      queryClient.invalidateQueries({ queryKey: ['employees'] })
      setIsModalOpen(false)

      // Automatically send invite to new employee
      if (variables.email && variables.roleId) {
        try {
          await axios.post(
            `${API_URL}/auth/invite`,
            { email: variables.email, roleId: variables.roleId },
            { headers: { Authorization: `Bearer ${token}` } }
          )
          showToast('Invite link sent to employee', 'success')
        } catch (inviteError: any) {
          console.error('Failed to send invite', inviteError)
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
      const response = await axios.patch(`${API_URL}/employees/${id}`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      })
      return response.data
    },
    onSuccess: () => {
      showToast('Employee updated successfully', 'success')
      queryClient.invalidateQueries({ queryKey: ['employees'] })
      setIsModalOpen(false)
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to update employee', 'error')
    }
  })

  const deleteEmployeeMutation = useMutation({
    mutationFn: async (id: string) => {
      await axios.delete(`${API_URL}/employees/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
    },
    onSuccess: () => {
      showToast('Employee deleted successfully', 'success')
      queryClient.invalidateQueries({ queryKey: ['employees'] })
      setPendingDelete(null)
    },
    onError: (error: any) => {
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

  const confirmDelete = () => {
    if (pendingDelete) {
      deleteEmployeeMutation.mutate(pendingDelete.id)
    }
  }

  const handleSubmitEmployee = (data: any) => {
    const payload = {
      ...data,
    }

    if (editingEmployee) {
      updateEmployeeMutation.mutate({ id: editingEmployee.id, ...payload })
    } else {
      createEmployeeMutation.mutate(payload)
    }
  }

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.pages) {
      setPagination(prev => ({ ...prev, page: newPage }))
    }
  }

  if (!mounted) {
    return null
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="max-w-7xl mx-auto space-y-6">
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
              loading={loading}
              pagination={pagination}
              onPageChange={handlePageChange}
              onViewEmployee={handleViewEmployee}
              onEditEmployee={handleEditEmployee}
              onDeleteEmployee={handleDeleteEmployee}
            />
          </div>
        </main>
      </div>

      {/* Employee Form Modal */}
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
        message={pendingDelete ? `${pendingDelete.firstName} ${pendingDelete.lastName} will be removed from your organization.` : ''}
        confirmText="Delete"
        onConfirm={confirmDelete}
        onClose={() => setPendingDelete(null)}
        type="danger"
      />
    </div>
  )
}

export default function EmployeesPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <EmployeesContent />
    </Suspense>
  )
}
