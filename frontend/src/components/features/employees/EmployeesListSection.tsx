"use client"

import { useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { RocketLaunchIcon } from '@heroicons/react/24/outline'

import { Button } from '@/components/ui/FormComponents'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { PaginationFooter } from '@/components/ui/PaginationFooter'
import type { Employee } from './EmployeeCard'

interface EmployeesListSectionProps {
  employees: Employee[]
  loading: boolean
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
  onViewEmployee: (employee: Employee) => void
  onEditEmployee: (employee: Employee) => void
  onDeleteEmployee: (employee: Employee) => void
  onSendInvite?: (employee: Employee) => void
}

export function EmployeesListSection({
  employees,
  loading,
  pagination,
  onPageChange,
  onPageSizeChange,
  onViewEmployee,
  onEditEmployee,
  onDeleteEmployee,
  onSendInvite,
}: EmployeesListSectionProps) {
  const router = useRouter()

  // Prefetch onboarding pages for employees on the current page so navigation feels instant.
  useEffect(() => {
    employees.forEach((employee) => {
      // Guard against missing IDs just in case
      if (!employee.id) return
      try {
        router.prefetch(`/onboarding/${employee.id}`)
      } catch {
        // Best-effort prefetch only; ignore failures
      }
    })
  }, [employees, router])

  const employeeColumns: Column<Employee>[] = [
    {
      key: 'name',
      header: 'Employee',
      accessorKey: 'firstName',
      cell: (employee) => (
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center text-sm font-medium text-blue-600">
            {employee.firstName.charAt(0)}
            {employee.lastName.charAt(0)}
          </div>
          <div className="flex flex-col">
            <span className="font-medium text-gray-900">
              {employee.firstName} {employee.lastName}
            </span>
            <span className="text-xs text-gray-500">{employee.email}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'department',
      header: 'Department',
      accessorKey: 'department.name',
      cell: (employee) => employee.department?.name || 'N/A',
    },
    {
      key: 'role',
      header: 'Role',
      accessorKey: 'role.name',
      cell: (employee) => employee.role?.name || 'N/A',
    },
    {
      key: 'status',
      header: 'Status',
      accessorKey: 'status',
      cell: (employee) => (
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
            employee.status === 'active'
              ? 'bg-green-50 text-green-700 ring-1 ring-green-100'
              : employee.status === 'inactive'
                ? 'bg-yellow-50 text-yellow-700 ring-1 ring-yellow-100'
                : 'bg-red-50 text-red-700 ring-1 ring-red-100'
          }`}
        >
          {employee.status.charAt(0).toUpperCase() + employee.status.slice(1)}
        </span>
      ),
    },
    {
      key: 'verified',
      header: 'Account',
      accessorKey: 'user.verified',
      cell: (employee) =>
        employee.user?.verified ? (
          <span className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700 ring-1 ring-green-100">
            Verified
          </span>
        ) : (
          <span className="inline-flex items-center rounded-full bg-yellow-50 px-2.5 py-0.5 text-xs font-medium text-yellow-700 ring-1 ring-yellow-100">
            Not verified
          </span>
        ),
    },
    {
      key: 'hireDate',
      header: 'Hire date',
      accessorKey: 'hireDate',
      cell: (employee) => {
        if (!employee.hireDate) return 'N/A'
        const datePart = employee.hireDate.slice(0, 10)
        const [year, month, day] = datePart.split('-')
        const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        const monthIndex = Number(month) - 1
        const monthName = MONTHS[monthIndex] ?? month
        return `${day} ${monthName} ${year}`
      },
    },
    {
      key: 'salary',
      header: 'Salary',
      accessorKey: 'salary',
      cell: (employee) => `$${Number(employee?.salary).toLocaleString('en-US')}`,
    },
    {
      key: 'actions',
      header: '',
      cell: (employee) => (
        <div className="ml-auto flex max-w-[260px] flex-wrap items-center justify-end gap-2">
          {!employee?.user?.verified && onSendInvite && (
            <Button variant="primary" size="sm" onClick={() => onSendInvite(employee)} className="text-xs">
              Send invite
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => onViewEmployee(employee)}>
            View
          </Button>
          <Button variant="outline" size="sm" onClick={() => onEditEmployee(employee)}>
            Edit
          </Button>
          <Button variant="danger" size="sm" onClick={() => onDeleteEmployee(employee)}>
            Delete
          </Button>
          <Link href={`/onboarding/${employee.id}`}>
            <Button
              variant="outline"
              size="sm"
              className="text-xs flex items-center gap-1 border-blue-200 text-blue-600 hover:bg-blue-50"
            >
              <RocketLaunchIcon className="h-3 w-3" />
              Onboarding
            </Button>
          </Link>
        </div>
      ),
    },
  ]

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6 space-y-4">
      <DataTable
        data={employees}
        columns={employeeColumns}
        loading={loading}
        pageSize={employees.length || pagination.limit}
      />

      <PaginationFooter
        currentPage={pagination.page}
        totalPages={pagination.pages}
        totalItems={pagination.total}
        pageSize={pagination.limit}
        pageSizeOptions={[10, 20, 30, 50]}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
      />
    </div>
  )
}
