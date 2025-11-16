'use client'

import { useState } from 'react'
import Sidebar from '@/components/ui/Sidebar'
import Header from '@/components/ui/Header'
import { DepartmentCard, DepartmentForm } from '@/components/hrm/DepartmentComponents'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/FormComponents'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { useToast } from '@/components/ui/ToastProvider'

import { PlusIcon, FunnelIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline'

interface Department {
  id: string
  name: string
  description: string
  manager: string
  employeeCount: number
  budget: number
  status: 'active' | 'inactive'
}

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([
    {
      id: '1',
      name: 'Engineering',
      description: 'Software development and technical operations',
      manager: 'John Smith',
      employeeCount: 45,
      budget: 5000000,
      status: 'active'
    },
    {
      id: '2',
      name: 'Marketing',
      description: 'Brand management and marketing campaigns',
      manager: 'Sarah Johnson',
      employeeCount: 25,
      budget: 2000000,
      status: 'active'
    },
    {
      id: '3',
      name: 'Sales',
      description: 'Sales operations and customer acquisition',
      manager: 'Michael Brown',
      employeeCount: 35,
      budget: 3000000,
      status: 'active'
    },
    {
      id: '4',
      name: 'Human Resources',
      description: 'Employee management and organizational development',
      manager: 'Emily Davis',
      employeeCount: 15,
      budget: 1500000,
      status: 'active'
    },
    {
      id: '5',
      name: 'Finance',
      description: 'Financial planning and accounting',
      manager: 'Robert Wilson',
      employeeCount: 20,
      budget: 2500000,
      status: 'inactive'
    }
  ])

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingDepartment, setEditingDepartment] = useState<Department | undefined>()
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [pendingDelete, setPendingDelete] = useState<Department | null>(null)
  const { addToast } = useToast()

  const employees = [
    { id: '1', name: 'John Smith' },
    { id: '2', name: 'Sarah Johnson' },
    { id: '3', name: 'Michael Brown' },
    { id: '4', name: 'Emily Davis' },
    { id: '5', name: 'Robert Wilson' }
  ]

  const filteredDepartments = departments.filter(department => 
    filterStatus === 'all' || department.status === filterStatus
  )

  const handleCreateDepartment = () => {
    setEditingDepartment(undefined)
    setIsModalOpen(true)
  }

  const handleEditDepartment = (department: Department) => {
    setEditingDepartment(department)
    setIsModalOpen(true)
  }

  const handleViewDepartment = (department: Department) => {
    console.log('View department:', department)
  }

  const handleDeleteDepartment = (department: Department) => {
    setPendingDelete(department)
  }

  const confirmDelete = () => {
    if (!pendingDelete) return
    setDepartments(prev => prev.filter(dept => dept.id !== pendingDelete.id))
    addToast({
      title: 'Department removed',
      description: `${pendingDelete.name} has been deleted.`,
      type: 'success',
    })
    setPendingDelete(null)
  }

  const handleSubmitDepartment = (data: Partial<Department>) => {
    if (editingDepartment) {
      setDepartments(prev => prev.map(dept => 
        dept.id === editingDepartment.id ? { ...dept, ...data } : dept
      ))
      addToast({
        title: 'Department updated',
        description: `${data.name || editingDepartment.name} saved successfully.`,
        type: 'success',
      })
    } else {
      const newDepartment: Department = {
        id: Date.now().toString(),
        name: data.name || '',
        description: data.description || '',
        manager: data.manager || '',
        employeeCount: data.employeeCount || 0,
        budget: data.budget || 0,
        status: data.status || 'active'
      }
      setDepartments(prev => [...prev, newDepartment])
      addToast({
        title: 'Department added',
        description: `${newDepartment.name} has been created.`,
        type: 'success',
      })
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
                  <h1 className="text-2xl font-bold text-gray-900">Departments</h1>
                  <p className="text-gray-600">Manage your organization’s departments and teams</p>
                </div>
                <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                  <div className="flex items-center space-x-2">
                    <FunnelIcon className="h-5 w-5 text-gray-400" />
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white min-w-[140px]"
                    >
                      <option value="all">All Status</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                  <Button
                    variant="primary"
                    onClick={handleCreateDepartment}
                    className="flex items-center space-x-2"
                  >
                    <PlusIcon className="h-4 w-4" />
                    <span>Add Department</span>
                  </Button>
                </div>
              </div>
            </div>

            {/* Departments Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDepartments.map((department) => (
                <DepartmentCard
                  key={department.id}
                  department={department}
                  onEdit={handleEditDepartment}
                  onView={handleViewDepartment}
                  onDelete={handleDeleteDepartment}
                />
              ))}
            </div>

            {filteredDepartments.length === 0 && (
              <div className="text-center py-12">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <BuildingOfficeIcon className="h-6 w-6 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No departments found</h3>
                <p className="text-gray-500 mb-6">
                  {filterStatus === 'all' 
                    ? 'Get started by adding your first department.'
                    : `No departments with ${filterStatus} status.`
                  }
                </p>
                <Button
                  variant="primary"
                  onClick={handleCreateDepartment}
                  className="flex items-center space-x-2 mx-auto"
                >
                  <PlusIcon className="h-4 w-4" />
                  <span>Add Department</span>
                </Button>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Department Form Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingDepartment ? 'Edit Department' : 'Add New Department'}
        size="lg"
      >
        <DepartmentForm
          department={editingDepartment}
          onSubmit={handleSubmitDepartment}
          onCancel={() => setIsModalOpen(false)}
          employees={employees}
        />
      </Modal>

      <ConfirmDialog
        open={!!pendingDelete}
        title="Remove department?"
        description={pendingDelete ? `${pendingDelete.name} will be removed from your organization.` : ''}
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  )
}