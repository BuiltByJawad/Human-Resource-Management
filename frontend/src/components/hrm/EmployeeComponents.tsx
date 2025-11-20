import { useState } from 'react'
import { PencilIcon, TrashIcon, EyeIcon } from '@heroicons/react/24/outline'
import { Button, Select, Input } from '../ui/FormComponents'
import { Badge } from '../ui/CommonComponents'

export interface Employee {
  id: string
  employeeNumber: string
  firstName: string
  lastName: string
  email: string
  department: { id: string, name: string } | null
  role: { id: string, name: string } | null
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
          <p className="text-sm text-gray-900">{employee.department?.name || 'N/A'}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">Role</p>
          <p className="text-sm text-gray-900">{employee.role?.name || 'N/A'}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">Hire Date</p>
          <p className="text-sm text-gray-900">
            {new Date(employee.hireDate).toLocaleDateString()}
          </p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">Salary</p>
          <p className="text-sm text-gray-900">${Number(employee.salary).toLocaleString()}</p>
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
  onSubmit: (data: any) => void
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
    departmentId: employee?.department?.id || '',
    roleId: employee?.role?.id || '',
    hireDate: employee?.hireDate ? new Date(employee.hireDate).toISOString().split('T')[0] : '',
    salary: employee?.salary || 0,
    status: employee?.status || 'active'
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required'
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required'
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Invalid email format'
    }
    if (!formData.employeeNumber.trim()) newErrors.employeeNumber = 'Employee number is required'
    if (!formData.departmentId) newErrors.departmentId = 'Department is required'
    if (!formData.roleId) newErrors.roleId = 'Role is required'
    if (!formData.hireDate) newErrors.hireDate = 'Hire date is required'
    if (formData.salary < 0) newErrors.salary = 'Salary cannot be negative'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateForm()) {
      onSubmit(formData)
    }
  }

  const handleChange = (field: keyof typeof formData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Input
            label="First Name"
            required
            value={formData.firstName}
            onChange={(e) => handleChange('firstName', e.target.value)}
            error={errors.firstName}
          />
        </div>
        <div>
          <Input
            label="Last Name"
            required
            value={formData.lastName}
            onChange={(e) => handleChange('lastName', e.target.value)}
            error={errors.lastName}
          />
        </div>
      </div>

      <div>
        <Input
          label="Email"
          type="email"
          required
          value={formData.email}
          onChange={(e) => handleChange('email', e.target.value)}
          error={errors.email}
        />
      </div>

      <div>
        <Input
          label="Employee Number"
          required
          value={formData.employeeNumber}
          onChange={(e) => handleChange('employeeNumber', e.target.value)}
          error={errors.employeeNumber}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Select
            label="Department"
            required
            value={formData.departmentId}
            onChange={(value) => handleChange('departmentId', value)}
            options={departments.map(d => ({ value: d.id, label: d.name }))}
            placeholder="Select Department"
            error={errors.departmentId}
          />
        </div>
        <div>
          <Select
            label="Role"
            required
            value={formData.roleId}
            onChange={(value) => handleChange('roleId', value)}
            options={roles.map(r => ({ value: r.id, label: r.name }))}
            placeholder="Select Role"
            error={errors.roleId}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Input
            label="Hire Date"
            type="date"
            required
            value={formData.hireDate}
            onChange={(e) => handleChange('hireDate', e.target.value)}
            error={errors.hireDate}
          />
        </div>
        <div>
          <Input
            label="Salary"
            type="number"
            required
            value={formData.salary.toString()}
            onChange={(e) => handleChange('salary', parseFloat(e.target.value) || 0)}
            error={errors.salary}
          />
        </div>
      </div>

      <div>
        <Select
          label="Status"
          required
          value={formData.status}
          onChange={(value) => handleChange('status', value)}
          options={[
            { value: 'active', label: 'Active' },
            { value: 'inactive', label: 'Inactive' },
            { value: 'terminated', label: 'Terminated' }
          ]}
          error={errors.status}
        />
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