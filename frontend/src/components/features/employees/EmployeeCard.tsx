"use client"

import { PencilIcon, TrashIcon, EyeIcon } from '@heroicons/react/24/outline'

import { Button } from '@/components/ui/FormComponents'
import { Badge } from '@/components/ui/CommonComponents'
import type { Employee as EmployeeBase } from '@/types/hrm'

function formatIsoDate(iso: string): string {
  if (!iso) return ''
  const datePart = iso.slice(0, 10)
  const [year, month, day] = datePart.split('-')
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const monthIndex = Number(month) - 1
  const monthName = MONTHS[monthIndex] ?? month
  return `${day} ${monthName} ${year}`
}

export type Employee = EmployeeBase

interface EmployeeCardProps {
  employee: Employee
  onEdit?: (employee: Employee) => void
  onView?: (employee: Employee) => void
  onDelete?: (employee: Employee) => void
  onSendInvite?: (employee: Employee) => void
  className?: string
}

export function EmployeeCard({ employee, onEdit, onView, onDelete, onSendInvite, className = '' }: EmployeeCardProps) {
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
    <div className={`bg-white shadow rounded-xl border border-gray-100 p-4 sm:p-5 md:p-6 hover:shadow-md transition-shadow ${className}`}>
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
          <Badge variant={getStatusColor(employee.status)}>
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
          <p className="text-sm text-gray-900">{formatIsoDate(employee.hireDate)}</p>
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
