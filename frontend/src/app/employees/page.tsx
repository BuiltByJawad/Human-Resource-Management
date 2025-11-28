'use client'

import { useState, useEffect, useCallback } from 'react'

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

  const [mounted, setMounted] = useState(false)
  const [employees, setEmployees] = useState<Employee[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
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

  const fetchDepartments = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/departments`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (response.data.success) {
        setDepartments(response.data.data)
      }
    } catch (error: any) {
      console.error('Failed to fetch departments', error)
      setDepartments([])
    }
  }, [token])

  const fetchRoles = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/roles`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (response.data.success) {
        setRoles(response.data.data)
      }
    } catch (error: any) {
      console.error('Failed to fetch roles', error)
      setRoles([])
    }
  }, [token])

  const fetchEmployees = useCallback(async () => {
    setLoading(true)
    try {
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

      if (response.data.status === 'success') {
        setEmployees(response.data.data.employees)
        setPagination(response.data.data.pagination)
      }
    } catch (error: any) {
      console.error('Failed to fetch employees', error)
      setEmployees([])
      setPagination(prev => ({ ...prev, total: 0, pages: 0 }))
    } finally {
      setLoading(false)
    }
  }, [token, pagination.page, pagination.limit, debouncedSearch, filterStatus, filterDepartment])

  useEffect(() => {
    if (token) {
      fetchDepartments()
      fetchRoles()
    }
  }, [token, fetchDepartments, fetchRoles])

  useEffect(() => {
    if (token) {
      fetchEmployees()
    }
  }, [token, fetchEmployees])

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

  const confirmDelete = async () => {
    if (!pendingDelete) return
    try {
      await axios.delete(`${API_URL}/employees/${pendingDelete.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      showToast('Employee deleted successfully', 'success')
      fetchEmployees()
    } catch (error) {
      console.error('Failed to delete employee', error)
      showToast('Failed to delete employee', 'error')
    } finally {
      setPendingDelete(null)
    }
  }

  const handleSubmitEmployee = async (data: any) => {
    try {
      // Transform data for API
      const payload = {
        ...data,
        // departmentId and roleId are already in data from the form
      }

      if (editingEmployee) {
        await axios.patch(`${API_URL}/employees/${editingEmployee.id}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        })
        showToast('Employee updated successfully', 'success')
      } else {
        await axios.post(`${API_URL}/employees`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        })
        showToast('Employee created successfully', 'success')

        // Automatically send invite to new employee
        if (data.email && data.roleId) {
          try {
            await axios.post(
              `${API_URL}/auth/invite`,
              { email: data.email, roleId: data.roleId },
              { headers: { Authorization: `Bearer ${token}` } }
            )
            showToast('Invite link sent to employee', 'success')
          } catch (inviteError: any) {
            console.error('Failed to send invite', inviteError)
            showToast(inviteError.response?.data?.message || 'Failed to send invite', 'error')
          }
        }
      }
      fetchEmployees()
      setIsModalOpen(false)
    } catch (error: any) {
      console.error('Failed to save employee', error)
      showToast(error.response?.data?.message || 'Failed to save employee', 'error')
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
    <EmployeesContent />
  )
}