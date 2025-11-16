'use client'

import { useState } from 'react'
import { BuildingOfficeIcon, UsersIcon } from '@heroicons/react/24/outline'
import { Button } from '../ui/FormComponents'
import { Badge } from '../ui/CommonComponents'

interface Department {
  id: string
  name: string
  description: string
  manager: string
  employeeCount: number
  budget: number
  status: 'active' | 'inactive'
}

interface DepartmentCardProps {
  department: Department
  onEdit?: (department: Department) => void
  onView?: (department: Department) => void
  onDelete?: (department: Department) => void
  className?: string
}

export function DepartmentCard({ department, onEdit, onView, onDelete, className = '' }: DepartmentCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success'
      case 'inactive':
        return 'secondary'
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
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <BuildingOfficeIcon className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900">{department.name}</h3>
            <p className="text-sm text-gray-500 mt-1">{department.description}</p>
          </div>
        </div>
        <Badge variant={getStatusColor(department.status)}>
          {department.status.charAt(0).toUpperCase() + department.status.slice(1)}
        </Badge>
      </div>

      <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-500">
        <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2">
          <UsersIcon className="h-5 w-5 text-slate-400" />
          <div>
            <p className="text-xs uppercase tracking-wide">Employees</p>
            <p className="text-base font-semibold text-slate-900">{department.employeeCount}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2">
          <div className="text-slate-400 text-lg">$</div>
          <div>
            <p className="text-xs uppercase tracking-wide">Budget</p>
            <p className="text-base font-semibold text-slate-900">{department.budget.toLocaleString()}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2">
          <div className="text-slate-400 text-lg">👤</div>
          <div>
            <p className="text-xs uppercase tracking-wide">Manager</p>
            <p className="text-base font-semibold text-slate-900">{department.manager}</p>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onView?.(department)}
        >
          View Details
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onEdit?.(department)}
        >
          Edit
        </Button>
        <Button
          variant="danger"
          size="sm"
          onClick={() => onDelete?.(department)}
        >
          Delete
        </Button>
      </div>
    </div>
  )
}

interface DepartmentFormProps {
  department?: Department
  onSubmit: (data: Partial<Department>) => void
  onCancel: () => void
  employees: Array<{ id: string; name: string }>
}

export function DepartmentForm({ department, onSubmit, onCancel, employees }: DepartmentFormProps) {
  const [formData, setFormData] = useState({
    name: department?.name || '',
    description: department?.description || '',
    manager: department?.manager || '',
    budget: department?.budget || 0,
    status: department?.status || 'active'
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
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Department Name *
        </label>
        <input
          type="text"
          required
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description *
        </label>
        <textarea
          required
          rows={3}
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value)}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Manager
          </label>
          <select
            value={formData.manager}
            onChange={(e) => handleChange('manager', e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select Manager</option>
            {employees.map((employee) => (
              <option key={employee.id} value={employee.name}>{employee.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Budget
          </label>
          <input
            type="number"
            min="0"
            step="1000"
            value={formData.budget}
            onChange={(e) => handleChange('budget', parseFloat(e.target.value) || 0)}
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
        </select>
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="primary">
          {department ? 'Update Department' : 'Create Department'}
        </Button>
      </div>
    </form>
  )
}