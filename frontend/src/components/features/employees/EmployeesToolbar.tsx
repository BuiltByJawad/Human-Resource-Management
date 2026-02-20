"use client"

import { UsersIcon, MagnifyingGlassIcon, FunnelIcon, PlusIcon } from '@heroicons/react/24/outline'

import { Button, Select } from '@/components/ui/FormComponents'

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
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:gap-2">
          <FunnelIcon className="h-5 w-5 text-gray-400" />
          <div className="w-full sm:w-48">
            <Select
              value={filterDepartment}
              onChange={onFilterDepartmentChange}
              options={[
                { value: 'all', label: 'All Departments' },
                ...(Array.isArray(departments) ? departments : []).map((d) => ({ value: d.id, label: d.name })),
              ]}
            />
          </div>
          <div className="w-full sm:w-40">
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
        <Button variant="primary" onClick={onCreateEmployee} className="flex w-full items-center justify-center space-x-2 sm:w-auto">
          <PlusIcon className="h-4 w-4" />
          <span>Add Employee</span>
        </Button>
      </div>
    </div>
  )
}
