"use client"

import { useEffect } from 'react'
import { EyeIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline'
import { useForm, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'

import { Badge, type BadgeProps } from '@/components/ui/badge'
import { Button, Select, Input, DatePicker } from '@/components/ui/FormComponents'
import type { Employee } from '@/features/employees/types/employees.types'

interface EmployeeCardProps {
  employee: Employee
  onEdit?: (employee: Employee) => void
  onView?: (employee: Employee) => void
  onDelete?: (employee: Employee) => void
  onSendInvite?: (employee: Employee) => void
  className?: string
}

export function EmployeeCard({ employee, onEdit, onView, onDelete, onSendInvite, className = '' }: EmployeeCardProps) {
  const getStatusVariant = (status: string): BadgeProps['variant'] => {
    switch (status) {
      case 'active':
        return 'default'
      case 'inactive':
        return 'secondary'
      case 'terminated':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  return (
    <div
      className={`bg-white shadow rounded-xl border border-gray-100 p-4 sm:p-5 md:p-6 hover:shadow-md transition-shadow ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-lg font-medium text-blue-600">
              {employee.firstName.charAt(0)}
              {employee.lastName.charAt(0)}
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
        <div className="flex flex-col items-start sm:items-end space-y-1">
          <Badge variant={getStatusVariant(employee.status)}>
            {employee.status.charAt(0).toUpperCase() + employee.status.slice(1)}
          </Badge>
          {employee.user?.verified ? (
            <span className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700 border border-green-100">
              Verified
            </span>
          ) : (
            <div className="flex items-center space-x-2">
              <span className="inline-flex items-center rounded-full bg-yellow-50 px-2.5 py-0.5 text-xs font-medium text-yellow-700 border border-yellow-100">
                Not verified
              </span>
              {onSendInvite && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => onSendInvite(employee)}
                  className="text-xs px-2 py-1"
                >
                  Send invite
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
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
          <p className="text-sm text-gray-900">{new Date(employee.hireDate).toLocaleDateString()}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">Salary</p>
          <p className="text-sm text-gray-900">${Number(employee.salary).toLocaleString('en-US')}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onView?.(employee)}
          className="flex items-center justify-center space-x-1 min-w-[96px]"
        >
          <EyeIcon className="h-4 w-4" />
          <span>View</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onEdit?.(employee)}
          className="flex items-center justify-center space-x-1 min-w-[96px]"
        >
          <PencilIcon className="h-4 w-4" />
          <span>Edit</span>
        </Button>
        <Button
          variant="danger"
          size="sm"
          onClick={() => onDelete?.(employee)}
          className="flex items-center justify-center space-x-1 min-w-[96px]"
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
  onSubmit: (data: EmployeeFormData) => void
  onCancel: () => void
  departments: Array<{ id: string; name: string }>
  roles: Array<{ id: string; name: string }>
}

const employeeSchema = yup.object().shape({
  firstName: yup.string().required('First name is required'),
  lastName: yup.string().required('Last name is required'),
  email: yup.string().email('Invalid email format').required('Email is required'),
  employeeNumber: yup.string().required('Employee number is required'),
  departmentId: yup.string().required('Department is required'),
  roleId: yup.string().required('Role is required'),
  hireDate: yup.string().required('Hire date is required'),
  salary: yup
    .number()
    .min(1000, 'Salary must be at least 1000')
    .required('Salary is required'),
  status: yup.string().oneOf(['active', 'inactive', 'terminated']).required('Status is required'),
})

export type EmployeeFormData = yup.InferType<typeof employeeSchema>

export function EmployeeForm({ employee, onSubmit, onCancel, departments, roles }: EmployeeFormProps) {
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<EmployeeFormData>({
    resolver: yupResolver(employeeSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      employeeNumber: '',
      departmentId: '',
      roleId: '',
      hireDate: '',
      salary: 0,
      status: 'active',
    },
  })

  useEffect(() => {
    if (employee) {
      reset({
        firstName: employee.firstName,
        lastName: employee.lastName,
        email: employee.email,
        employeeNumber: employee.employeeNumber,
        departmentId: employee.department?.id || '',
        roleId: employee.role?.id || '',
        hireDate: employee.hireDate ? new Date(employee.hireDate).toISOString().split('T')[0] : '',
        salary: employee.salary,
        status: employee.status,
      })
    }
  }, [employee, reset])

  const onFormSubmit = (data: EmployeeFormData) => {
    onSubmit(data)
  }

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4 pb-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Input
            label="First Name"
            required
            error={errors.firstName?.message}
            {...register('firstName')}
          />
        </div>
        <div>
          <Input
            label="Last Name"
            required
            error={errors.lastName?.message}
            {...register('lastName')}
          />
        </div>
      </div>

      <div>
        <Input
          label="Email"
          type="email"
          required
          error={errors.email?.message}
          {...register('email')}
        />
      </div>

      <div>
        <Input
          label="Employee Number"
          required
          error={errors.employeeNumber?.message}
          {...register('employeeNumber')}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Controller
            control={control}
            name="departmentId"
            render={({ field }) => (
              <Select
                label="Department"
                value={field.value}
                onChange={field.onChange}
                options={(Array.isArray(departments) ? departments : []).map((d) => ({
                  value: d.id,
                  label: d.name,
                }))}
                placeholder="Select Department"
                required
                error={errors.departmentId?.message}
              />
            )}
          />
        </div>
        <div>
          <Controller
            control={control}
            name="roleId"
            render={({ field }) => (
              <Select
                label="Role"
                value={field.value}
                onChange={field.onChange}
                options={(Array.isArray(roles) ? roles : []).map((r) => ({ value: r.id, label: r.name }))}
                placeholder="Select Role"
                required
                error={errors.roleId?.message}
              />
            )}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Controller
            control={control}
            name="hireDate"
            render={({ field }) => (
              <DatePicker
                label="Hire Date"
                required
                value={field.value}
                onChange={(date) => field.onChange(date ? date.toISOString().split('T')[0] : '')}
                error={errors.hireDate?.message}
              />
            )}
          />
        </div>
        <div>
          <Input
            label="Salary"
            type="number"
            required
            error={errors.salary?.message}
            {...register('salary')}
          />
        </div>
      </div>

      <div>
        <Controller
          control={control}
          name="status"
          render={({ field }) => (
            <Select
              label="Status"
              value={field.value}
              onChange={field.onChange}
              options={[
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
                { value: 'terminated', label: 'Terminated' },
              ]}
              required
              error={errors.status?.message}
            />
          )}
        />
      </div>

      <div className="sticky bottom-0 left-0 right-0 bg-white pt-4 pb-2 flex justify-end gap-3 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="primary">
          {employee ? 'Save Changes' : 'Create Employee'}
        </Button>
      </div>
    </form>
  )
}
