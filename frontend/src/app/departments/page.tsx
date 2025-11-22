'use client'

import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import Sidebar from '@/components/ui/Sidebar'
import Header from '@/components/ui/Header'
import { Department, DepartmentList, DepartmentForm } from '@/components/hrm/DepartmentComponents'
import { useAuthStore } from '@/store/useAuthStore'
import { useToast } from '@/components/ui/ToastProvider'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { PlusIcon } from '@heroicons/react/24/outline'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

export default function DepartmentsPage() {
  const { token } = useAuthStore()
  const { showToast } = useToast()

  const [departments, setDepartments] = useState<Department[]>([])
  const [employees, setEmployees] = useState<any[]>([]) // Using any for now, should be Employee type
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null)

  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [departmentToDelete, setDepartmentToDelete] = useState<Department | null>(null)

  const fetchData = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      // Fetch departments
      try {
        const deptRes = await axios.get(`${API_URL}/departments`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (deptRes.data.success) {
          setDepartments(deptRes.data.data)
        }
      } catch (error: any) {
        if (error.response?.status === 404) {
          setDepartments([])
        } else {
          console.error('Failed to fetch departments', error)
        }
      }

      // Fetch employees for manager selection
      try {
        const empRes = await axios.get(`${API_URL}/employees?limit=100`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        // Check for both success formats as controllers might differ
        if (empRes.data.status === 'success' || empRes.data.success) {
          // Handle nested data structure if present
          const empData = empRes.data.data
          if (empData.employees) {
            setEmployees(empData.employees)
          } else if (Array.isArray(empData)) {
            setEmployees(empData)
          } else {
            setEmployees([])
          }
        }
      } catch (error: any) {
        if (error.response?.status === 404) {
          setEmployees([])
        } else {
          console.error('Failed to fetch employees', error)
        }
      }
    } catch (error) {
      console.error('Unexpected error in fetchData', error)
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleCreate = () => {
    setEditingDepartment(null)
    setIsModalOpen(true)
  }

  const handleEdit = (dept: Department) => {
    setEditingDepartment(dept)
    setIsModalOpen(true)
  }

  const handleDeleteClick = (dept: Department) => {
    setDepartmentToDelete(dept)
    setIsDeleteOpen(true)
  }

  const handleSubmit = async (data: Partial<Department>) => {
    if (!token) return
    setActionLoading(true)
    try {
      if (editingDepartment) {
        await axios.put(`${API_URL}/departments/${editingDepartment.id}`, data, {
          headers: { Authorization: `Bearer ${token}` }
        })
        showToast('Department updated successfully', 'success')
      } else {
        await axios.post(`${API_URL}/departments`, data, {
          headers: { Authorization: `Bearer ${token}` }
        })
        showToast('Department created successfully', 'success')
      }
      setIsModalOpen(false)
      fetchData()
    } catch (error: any) {
      console.error('Operation failed', error)
      let msg = error.response?.data?.message || error.response?.data?.error || 'Operation failed'
      if (typeof msg === 'object') {
        msg = JSON.stringify(msg)
      }
      showToast(msg, 'error')
    } finally {
      setActionLoading(false)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!token || !departmentToDelete) return
    setActionLoading(true)
    try {
      await axios.delete(`${API_URL}/departments/${departmentToDelete.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      showToast('Department deleted successfully', 'success')
      setIsDeleteOpen(false)
      fetchData()
    } catch (error: any) {
      console.error('Delete failed', error)
      let msg = error.response?.data?.message || error.response?.data?.error || 'Delete failed'
      if (typeof msg === 'object') {
        msg = JSON.stringify(msg)
      }
      showToast(msg, 'error')
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="max-w-7xl mx-auto space-y-6">
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
              loading={loading}
            />
          </div>
        </main>
      </div>

      <DepartmentForm
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        initialData={editingDepartment}
        departments={departments}
        employees={employees}
        loading={actionLoading}
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
        loading={actionLoading}
      />
    </div>
  )
}