"use client"

import { Modal } from '@/components/ui/Modal'

interface EmployeeOption {
  id: string
  firstName: string
  lastName: string
}

interface AssignCourseModalProps {
  isOpen: boolean
  onClose: () => void
  employees: EmployeeOption[]
  assignForm: { employeeId: string }
  setAssignForm: (next: { employeeId: string }) => void
  onSubmit: () => void
  isSubmitting: boolean
  courseTitle?: string
}

export function AssignCourseModal({
  isOpen,
  onClose,
  employees,
  assignForm,
  setAssignForm,
  onSubmit,
  isSubmitting,
  courseTitle,
}: AssignCourseModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Assign: ${courseTitle || 'Course'}`}
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Select Employee <span className="text-red-500">*</span>
          </label>
          <select
            value={assignForm.employeeId}
            onChange={(e) => setAssignForm({ employeeId: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Choose an employee...</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.firstName} {emp.lastName}
              </option>
            ))}
          </select>
        </div>
        <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse gap-3">
          <button
            type="button"
            onClick={onSubmit}
            disabled={isSubmitting || !assignForm.employeeId}
            className="inline-flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:w-auto sm:text-sm disabled:opacity-50"
          >
            {isSubmitting ? 'Assigning...' : 'Assign Course'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:mt-0 sm:w-auto sm:text-sm"
          >
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  )
}
