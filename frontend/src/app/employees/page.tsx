'use client'

import { useState, useMemo } from 'react'
import Sidebar from '@/components/ui/Sidebar'
import Header from '@/components/ui/Header'
import { EmployeeCard, EmployeeForm } from '@/components/hrm/EmployeeComponents'
import EmployeeDetailsModal from '@/components/hrm/EmployeeDetailsModal'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/FormComponents'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { useToast } from '@/components/ui/ToastProvider'
import { PlusIcon, FunnelIcon, UsersIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'

interface Employee {
  id: string
  employeeNumber: string
  firstName: string
  lastName: string
  email: string
  department: string
  role: string
  hireDate: string
  salary: number
  status: 'active' | 'inactive' | 'terminated'
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([
    {
      id: '1',
      employeeNumber: 'EMP001',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@company.com',
      department: 'Engineering',
      role: 'Senior Developer',
      hireDate: '2022-01-15',
      salary: 95000,
      status: 'active'
    },
    {
      id: '2',
      employeeNumber: 'EMP002',
      firstName: 'Sarah',
      lastName: 'Johnson',
      email: 'sarah.johnson@company.com',
      department: 'Marketing',
      role: 'Marketing Manager',
      hireDate: '2021-08-20',
      salary: 85000,
      status: 'active'
    },
    {
      id: '3',
      employeeNumber: 'EMP003',
      firstName: 'Michael',
      lastName: 'Brown',
      email: 'michael.brown@company.com',
      department: 'Sales',
      role: 'Sales Representative',
      hireDate: '2023-03-10',
      salary: 65000,
      status: 'active'
    },
    {
      id: '4',
      employeeNumber: 'EMP004',
      firstName: 'Emily',
      lastName: 'Davis',
      email: 'emily.davis@company.com',
      department: 'HR',
      role: 'HR Specialist',
      hireDate: '2022-11-05',
      salary: 70000,
      status: 'inactive'
    }
  ])

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [viewingEmployee, setViewingEmployee] = useState<Employee | undefined>()
  const [pendingDelete, setPendingDelete] = useState<Employee | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')

  const departments = [
    { id: '1', name: 'Engineering' },
    { id: '2', name: 'Marketing' },
    { id: '3', name: 'Sales' },
    { id: '4', name: 'HR' },
    { id: '5', name: 'Finance' }
  ]

  const roles = [
    { id: '1', name: 'Senior Developer' },
    { id: '2', name: 'Marketing Manager' },
    { id: '3', name: 'Sales Representative' },
    { id: '4', name: 'HR Specialist' },
    { id: '5', name: 'Finance Manager' }
  ]

  const filteredEmployees = employees.filter(employee => 
    filterStatus === 'all' || employee.status === filterStatus
  )

  const handleCreateEmployee = () => {
    setEditingEmployee(null)
    setIsModalOpen(true)
  }

  const handleEditEmployee = (employee: Employee) => {
    setEditingEmployee(employee)
    setIsModalOpen(true)
  }

  const handleViewEmployee = (employee: Employee) => {
    setViewingEmployee(employee)
  }

  const handleCloseModal = () => {
    setViewingEmployee(undefined)
  }

  const handleDeleteEmployee = (employee: Employee) => {
    setPendingDelete(employee)
  }

  const confirmDelete = () => {
    if (!pendingDelete) return
    setEmployees(prev => prev.filter(emp => emp.id !== pendingDelete.id))
    setPendingDelete(null)
  }

  const handleSubmitEmployee = (data: Partial<Employee>) => {
    if (editingEmployee) {
      setEmployees(prev => prev.map(emp => 
        emp.id === editingEmployee.id ? { ...emp, ...data } : emp
      ))
    } else {
      const newEmployee: Employee = {
        id: Date.now().toString(),
        employeeNumber: `EMP${String(employees.length + 1).padStart(3, '0')}`,
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        email: data.email || '',
        department: data.department || '',
        role: data.role || '',
        hireDate: data.hireDate || '',
        salary: data.salary || 0,
        status: data.status || 'active'
      }
      setEmployees(prev => [...prev, newEmployee])
    }
    setIsModalOpen(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      
      <div className="flex-1 flex flex-col">
        <Header />
        
        <main className="flex-1 p-4 sm:p-6">
          <div className="max-w-7xl mx-auto w-full">
            <div className="mb-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Employees</h1>
                  <p className="text-gray-600">Manage your organization’s employees</p>
                </div>
                <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                  <div className="flex items-center space-x-2">
                    <FunnelIcon className="h-5 w-5 text-gray-400" />
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 min-w-[140px]"
                    >
                      <option value="all">All Status</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="terminated">Terminated</option>
                    </select>
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
            </div>

            {/* Employee Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEmployees.map((employee) => (
                <EmployeeCard
                  key={employee.id}
                  employee={employee}
                  onEdit={handleEditEmployee}
                  onView={handleViewEmployee}
                  onDelete={handleDeleteEmployee}
                />
              ))}
            </div>

            {filteredEmployees.length === 0 && (
              <div className="text-center py-12">
                <UsersIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No employees found</h3>
                <p className="text-gray-500 mb-6">
                  {filterStatus === 'all' 
                    ? 'Get started by adding your first employee.'
                    : `No employees with ${filterStatus} status.`
                  }
                </p>
                <Button
                  variant="primary"
                  onClick={handleCreateEmployee}
                  className="flex items-center space-x-2 mx-auto"
                >
                  <PlusIcon className="h-4 w-4" />
                  <span>Add Employee</span>
                </Button>
              </div>
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
          onClose={handleCloseModal}
          employee={viewingEmployee}
        />
      )}

      <ConfirmDialog
        open={!!pendingDelete}
        title="Remove employee?"
        description={pendingDelete ? `${pendingDelete.firstName} ${pendingDelete.lastName} will be removed from your organization.` : ''}
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  )
}