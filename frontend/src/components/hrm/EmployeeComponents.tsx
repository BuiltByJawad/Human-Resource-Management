'use client'

import { useState } from 'react'
import { PencilIcon, TrashIcon, EyeIcon } from '@heroicons/react/24/outline'
import { Button } from '../ui/FormComponents'
import { Badge } from '../ui/CommonComponents'

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

interface EmployeeCardProps {
  employee: Employee
  onEdit?: (employee: Employee) => void
  onView?: (employee: Employee) => void
  onDelete?: (employee: Employee) => void
  className?: string
}

export function EmployeeCard({ employee, onEdit, onView, onDelete, className = '' }: EmployeeCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success'
      case 'inactive':
        return 'warning'
      case 'terminated':
        return 'error'
      default:
        return 'secondary'
    }
  }

  return (
    <div 
      className={`bg-white shadow rounded-lg p-6 hover:shadow-md transition-shadow ${className}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-lg font-medium text-blue-600">
              {employee.firstName.charAt(0)}{employee.lastName.charAt(0)}
            </span>
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              {employee.firstName} {employee.lastName}
            </h3>
            <p className="text-sm text-gray-500">{employee.email}</p>
            <p className="text-sm text-gray-500">#{employee.employeeNumber}</p>
          </div>
        </div>
        <Badge variant={getStatusColor(employee.status)}>
          {employee.status.charAt(0).toUpperCase() + employee.status.slice(1)}
        </Badge>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm font-medium text-gray-500">Department</p>
          <p className="text-sm text-gray-900">{employee.department}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">Role</p>
          <p className="text-sm text-gray-900">{employee.role}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">Hire Date</p>
          <p className="text-sm text-gray-900">
            {new Date(employee.hireDate).toLocaleDateString()}
          </p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">Salary</p>
          <p className="text-sm text-gray-900">${employee.salary.toLocaleString()}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onView?.(employee)}
          className="flex items-center space-x-1"
        >
          <EyeIcon className="h-4 w-4" />
          <span>View</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onEdit?.(employee)}
          className="flex items-center space-x-1"
        >
          <PencilIcon className="h-4 w-4" />
          <span>Edit</span>
        </Button>
        <Button
          variant="danger"
          size="sm"
          onClick={() => onDelete?.(employee)}
          className="flex items-center space-x-1"
        >
          <TrashIcon className="h-4 w-4" />
          <span>Delete</span>
        </Button>
      </div>
    </div>
  )
}

interface EmployeeFormProps {
  employee?: Employee
  onSubmit: (data: Partial<Employee>) => void
  onCancel: () => void
  departments: Array<{ id: string; name: string }>
  roles: Array<{ id: string; name: string }>
}

export function EmployeeForm({ employee, onSubmit, onCancel, departments, roles }: EmployeeFormProps) {
  const [formData, setFormData] = useState({
    firstName: employee?.firstName || '',
    lastName: employee?.lastName || '',
    email: employee?.email || '',
    employeeNumber: employee?.employeeNumber || '',
    department: employee?.department || '',
    role: employee?.role || '',
    hireDate: employee?.hireDate ? new Date(employee.hireDate).toISOString().split('T')[0] : '',
    salary: employee?.salary || 0,
    status: employee?.status || 'active'
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  const handleChange = (field: keyof typeof formData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            First Name *
          </label>
          <input
            type="text"
            required
            value={formData.firstName}
            onChange={(e) => handleChange('firstName', e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Last Name *
          </label>
          <input
            type="text"
            required
            value={formData.lastName}
            onChange={(e) => handleChange('lastName', e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Email *
        </label>
        <input
          type="email"
          required
          value={formData.email}
          onChange={(e) => handleChange('email', e.target.value)}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Employee Number *
        </label>
        <input
          type="text"
          required
          value={formData.employeeNumber}
          onChange={(e) => handleChange('employeeNumber', e.target.value)}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Department *
          </label>
          <select
            required
            value={formData.department}
            onChange={(e) => handleChange('department', e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select Department</option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.name}>{dept.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Role *
          </label>
          <select
            required
            value={formData.role}
            onChange={(e) => handleChange('role', e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select Role</option>
            {roles.map((role) => (
              <option key={role.id} value={role.name}>{role.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Hire Date *
          </label>
          <input
            type="date"
            required
            value={formData.hireDate}
            onChange={(e) => handleChange('hireDate', e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Salary *
          </label>
          <input
            type="number"
            required
            min="0"
            step="0.01"
            value={formData.salary}
            onChange={(e) => handleChange('salary', parseFloat(e.target.value) || 0)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Status *
        </label>
        <select
          required
          value={formData.status}
          onChange={(e) => handleChange('status', e.target.value)}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="terminated">Terminated</option>
        </select>
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="primary">
          {employee ? 'Update Employee' : 'Create Employee'}
        </Button>
      </div>
    </form>
  )
}