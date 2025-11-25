'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import axios from 'axios'
import Sidebar from '@/components/ui/Sidebar'
import Header from '@/components/ui/Header'
import { EmployeeCard, EmployeeForm, Employee } from '@/components/hrm/EmployeeComponents'
import EmployeeDetailsModal from '@/components/hrm/EmployeeDetailsModal'
import { Modal } from '@/components/ui/Modal'
import { Button, Select } from '@/components/ui/FormComponents'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { useToast } from '@/components/ui/ToastProvider'
import { PlusIcon, FunnelIcon, UsersIcon, ChevronLeftIcon, ChevronRightIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { useAuthStore } from '@/store/useAuthStore'
import { useDebounce } from '@/hooks/useDebounce'


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
  const router = useRouter()
  const searchParams = useSearchParams()
  const { token } = useAuthStore()
  const { showToast } = useToast()

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
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '')
  const debouncedSearch = useDebounce(searchTerm, 500)

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

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Employees</h1>
                <p className="text-sm text-gray-500">Manage your workforce</p>
              </div>
              <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 w-full sm:w-64"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <FunnelIcon className="h-5 w-5 text-gray-400" />
                  <div className="w-48">
                    <Select
                      value={filterDepartment}
                      onChange={(value) => setFilterDepartment(value)}
                      options={[
                        { value: 'all', label: 'All Departments' },
                        ...departments.map(d => ({ value: d.id, label: d.name }))
                      ]}
                    />
                  </div>
                  <div className="w-40">
                    <Select
                      value={filterStatus}
                      onChange={(value) => setFilterStatus(value)}
                      options={[
                        { value: 'all', label: 'All Status' },
                        { value: 'active', label: 'Active' },
                        { value: 'inactive', label: 'Inactive' },
                        { value: 'terminated', label: 'Terminated' }
                      ]}
                    />
                  </div>
                </div>
                <Button
                  variant="primary"
                  onClick={handleCreateEmployee}
                  className="flex items-center space-x-2"
                >
                  <PlusIcon className="h-4 w-4" />
                  <span>Add Employee</span>
                </Button>
              </div>
            </div>

            {/* Employee Grid */}
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {employees.map((employee) => (
                    <EmployeeCard
                      key={employee.id}
                      employee={employee}
                      onEdit={handleEditEmployee}
                      onView={handleViewEmployee}
                      onDelete={handleDeleteEmployee}
                    />
                  ))}
                </div>

                {employees.length === 0 && (
                  <div className="text-center py-12">
                    <UsersIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No employees found</h3>
                    <p className="text-gray-500 mb-6">
                      Try adjusting your search or filters.
                    </p>
                  </div>
                )}

                {/* Pagination */}
                {employees.length > 0 && (
                  <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 mt-6 rounded-lg shadow-sm">
                    <div className="flex flex-1 justify-between sm:hidden">
                      <Button
                        variant="outline"
                        onClick={() => handlePageChange(pagination.page - 1)}
                        disabled={pagination.page === 1}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handlePageChange(pagination.page + 1)}
                        disabled={pagination.page === pagination.pages}
                      >
                        Next
                      </Button>
                    </div>
                    <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm text-gray-700">
                          Showing <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span> to <span className="font-medium">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of{' '}
                          <span className="font-medium">{pagination.total}</span> results
                        </p>
                      </div>
                      <div>
                        <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                          <button
                            onClick={() => handlePageChange(pagination.page - 1)}
                            disabled={pagination.page === 1}
                            className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                          >
                            <span className="sr-only">Previous</span>
                            <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
                          </button>
                          {/* Simple pagination for now, can be improved */}
                          {[...Array(pagination.pages)].map((_, i) => (
                            <button
                              key={i + 1}
                              onClick={() => handlePageChange(i + 1)}
                              className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${pagination.page === i + 1
                                ? 'z-10 bg-blue-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'
                                : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                                }`}
                            >
                              {i + 1}
                            </button>
                          ))}
                          <button
                            onClick={() => handlePageChange(pagination.page + 1)}
                            disabled={pagination.page === pagination.pages}
                            className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                          >
                            <span className="sr-only">Next</span>
                            <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
                          </button>
                        </nav>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
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