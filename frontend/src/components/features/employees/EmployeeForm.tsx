"use client"

import { useEffect } from 'react'
import { format } from 'date-fns'
import { useForm, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'

import { Button, Select, Input, DatePicker } from '@/components/ui/FormComponents'
import type { Employee as EmployeeType } from '@/types/hrm'

interface EmployeeFormProps {
  employee?: EmployeeType
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
  salary: yup.number().min(1000, 'Salary must be at least 1000').required('Salary is required'),
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
        hireDate: employee.hireDate ? format(new Date(employee.hireDate), 'yyyy-MM-dd') : '',
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
        <Input label="First Name" required error={errors.firstName?.message} {...register('firstName')} />
        <Input label="Last Name" required error={errors.lastName?.message} {...register('lastName')} />
      </div>

      <Input label="Email" type="email" required error={errors.email?.message} {...register('email')} />

      <Input label="Employee Number" required error={errors.employeeNumber?.message} {...register('employeeNumber')} />

      <div className="grid grid-cols-2 gap-4">
        <Controller
          control={control}
          name="departmentId"
          render={({ field }) => (
            <Select
              label="Department"
              value={field.value}
              onChange={field.onChange}
              options={(Array.isArray(departments) ? departments : []).map((d) => ({ value: d.id, label: d.name }))}
              placeholder="Select Department"
              required
              error={errors.departmentId?.message}
            />
          )}
        />
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

      <div className="grid grid-cols-2 gap-4">
        <Controller
          control={control}
          name="hireDate"
          render={({ field }) => (
            <DatePicker
              label="Hire Date"
              required
              value={field.value}
              onChange={(date) => field.onChange(date ? format(date, 'yyyy-MM-dd') : '')}
              error={errors.hireDate?.message}
            />
          )}
        />
        <Input label="Salary" type="number" required error={errors.salary?.message} {...register('salary')} />
      </div>

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
