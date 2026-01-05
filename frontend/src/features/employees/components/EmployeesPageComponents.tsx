import Link from 'next/link'
import {
  UsersIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusIcon,
  RocketLaunchIcon,
} from '@heroicons/react/24/outline'

import { Button, Select } from '@/components/ui/FormComponents'
import { DataTable, type Column } from '@/components/ui/DataTable'
import type { Employee } from '@/features/employees/types/employees.types'

interface DepartmentOption {
  id: string
  name: string
}

interface EmployeesToolbarProps {
  totalEmployees: number
  searchTerm: string
  onSearchChange: (value: string) => void
  filterStatus: string
  onFilterStatusChange: (value: string) => void
  filterDepartment: string
  onFilterDepartmentChange: (value: string) => void
  departments: DepartmentOption[]
  onCreateEmployee: () => void
}

export function EmployeesToolbar({
  totalEmployees,
  searchTerm,
  onSearchChange,
  filterStatus,
  onFilterStatusChange,
  filterDepartment,
  onFilterDepartmentChange,
  departments,
  onCreateEmployee,
}: EmployeesToolbarProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">Employees</h1>
          <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
            <UsersIcon className="h-4 w-4 mr-1" />
            {totalEmployees} employees
          </span>
        </div>
        <p className="mt-1 text-sm text-gray-500">Search, filter and manage your team in one place.</p>
      </div>
      <div className="flex flex-wrap items-center gap-3 sm:gap-4">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, hire date or salary"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 w-full sm:w-64"
          />
        </div>
        <div className="flex items-center space-x-2">
          <FunnelIcon className="h-5 w-5 text-gray-400" />
          <div className="w-48">
            <Select
              value={filterDepartment}
              onChange={onFilterDepartmentChange}
              options={[
                { value: 'all', label: 'All Departments' },
                ...(Array.isArray(departments) ? departments : []).map((d) => ({ value: d.id, label: d.name })),
              ]}
            />
          </div>
          <div className="w-40">
            <Select
              value={filterStatus}
              onChange={onFilterStatusChange}
              options={[
                { value: 'all', label: 'All Status' },
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
                { value: 'terminated', label: 'Terminated' },
              ]}
            />
          </div>
        </div>
        <Button variant="primary" onClick={onCreateEmployee} className="flex items-center space-x-2">
          <PlusIcon className="h-4 w-4" />
          <span>Add Employee</span>
        </Button>
      </div>
    </div>
  )
}

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
  onViewEmployee,
  onEditEmployee,
  onDeleteEmployee,
  onSendInvite,
}: EmployeesListSectionProps) {
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
          <Button variant="outline" size="sm" onClick={() => onViewEmployee(employee)} className="text-xs">
            View
          </Button>
          <Button variant="outline" size="sm" onClick={() => onEditEmployee(employee)} className="text-xs">
            Edit
          </Button>
          <Button variant="danger" size="sm" onClick={() => onDeleteEmployee(employee)} className="text-xs">
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
    <>
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>
          {employees.length === 0 ? (
            <div className="text-center py-12">
              <UsersIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No employees found</h3>
              <p className="text-gray-500 mb-6">Try adjusting your search or filters.</p>
            </div>
          ) : (
            <div className="bg-white shadow-sm rounded-xl border border-gray-200">
              <DataTable<Employee>
                data={employees}
                columns={employeeColumns}
                pageSize={employees?.length || 10}
                loading={false}
                searchKeys={[]}
              />
            </div>
          )}

          {employees?.length > 0 && (
            <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 mt-6 rounded-lg shadow-sm">
              <div className="flex flex-1 justify-between sm:hidden">
                <Button variant="outline" onClick={() => onPageChange(pagination.page - 1)} disabled={pagination.page === 1}>
                  Previous
                </Button>
                <Button
                  variant="outline"
                  onClick={() => onPageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.pages}
                >
                  Next
                </Button>
              </div>
              <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span> to{' '}
                    <span className="font-medium">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of{' '}
                    <span className="font-medium">{pagination.total}</span> results
                  </p>
                </div>
                <div>
                  <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                    <button
                      onClick={() => onPageChange(pagination.page - 1)}
                      disabled={pagination.page === 1}
                      className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                    >
                      <span className="sr-only">Previous</span>
                      <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
                    </button>
                    {[...Array(pagination.pages)].map((_, i) => (
                      <button
                        key={i + 1}
                        onClick={() => onPageChange(i + 1)}
                        className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                          pagination.page === i + 1
                            ? 'z-10 bg-blue-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'
                            : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                    <button
                      onClick={() => onPageChange(pagination.page + 1)}
                      disabled={pagination.page === pagination.pages}
                      className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                    >
                      <span className="sr-only">Next</span>
                      <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </>
  )
}
