'use client'

import { Dialog } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { Employee } from './EmployeeComponents'

interface EmployeeDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  employee: Employee | undefined
}

export default function EmployeeDetailsModal({ isOpen, onClose, employee }: EmployeeDetailsModalProps) {
  if (!employee) return null

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="text-xl font-semibold text-gray-900">
              Employee Details
            </Dialog.Title>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <XMarkIcon className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>

          <div className="space-y-6">
            <div className="flex items-start space-x-6">
              <div className="flex-shrink-0">
                <div className="h-24 w-24 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-2xl font-medium text-blue-600">
                    {employee.firstName.charAt(0)}{employee.lastName.charAt(0)}
                  </span>
                </div>
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-medium text-gray-900">
                  {employee.firstName} {employee.lastName}
                </h3>
                <p className="text-sm text-gray-500">{employee.email}</p>
                <p className="text-sm text-gray-500">#{employee.employeeNumber}</p>
                <div className="flex items-center mt-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    employee.status === 'active' 
                      ? 'bg-green-100 text-green-800' 
                      : employee.status === 'inactive'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                  }`}>
                    {employee.status.charAt(0).toUpperCase() + employee.status.slice(1)}
                  </span>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <h4 className="text-sm font-medium text-gray-500 mb-4">EMPLOYEE INFORMATION</h4>
              <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Department</dt>
                  <dd className="mt-1 text-sm text-gray-900">{employee.department}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Role</dt>
                  <dd className="mt-1 text-sm text-gray-900">{employee.role}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Hire Date</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {new Date(employee.hireDate).toLocaleDateString()}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Salary</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    ${employee.salary.toLocaleString()}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Close
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  )
}
