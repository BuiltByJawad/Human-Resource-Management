import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/FormComponents'
import type { ShiftEmployee, ShiftFormState, ShiftType } from '@/services/shifts/types'

interface CreateShiftModalProps {
  isOpen: boolean
  onClose: () => void
  shiftForm: ShiftFormState
  onChange: (next: ShiftFormState) => void
  onSubmit: () => void
  isSubmitting: boolean
  employees: ShiftEmployee[]
}

const SHIFT_TYPES: ShiftType[] = ['Regular', 'Overtime', 'OnCall']

export const CreateShiftModal = ({
  isOpen,
  onClose,
  shiftForm,
  onChange,
  onSubmit,
  isSubmitting,
  employees,
}: CreateShiftModalProps) => (
  <Modal isOpen={isOpen} onClose={onClose} title="Schedule New Shift">
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Employee <span className="text-red-500">*</span>
        </label>
        <select
          value={shiftForm.employeeId}
          onChange={(e) => onChange({ ...shiftForm, employeeId: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Select employee...</option>
          {employees.map((emp) => (
            <option key={emp.id} value={emp.id}>
              {emp.firstName} {emp.lastName}
            </option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Start Time"
          type="datetime-local"
          required
          value={shiftForm.startTime}
          onChange={(e) => onChange({ ...shiftForm, startTime: e.target.value })}
        />
        <Input
          label="End Time"
          type="datetime-local"
          required
          value={shiftForm.endTime}
          onChange={(e) => onChange({ ...shiftForm, endTime: e.target.value })}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Shift Type</label>
        <select
          value={shiftForm.type}
          onChange={(e) => onChange({ ...shiftForm, type: e.target.value as ShiftType })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          {SHIFT_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>
      <Input
        label="Location"
        value={shiftForm.location}
        onChange={(e) => onChange({ ...shiftForm, location: e.target.value })}
        placeholder="e.g., Office, Remote, Site A"
      />
      <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse gap-3">
        <button
          type="button"
          onClick={onSubmit}
          disabled={isSubmitting}
          className="inline-flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:w-auto sm:text-sm disabled:opacity-50"
        >
          {isSubmitting ? 'Scheduling...' : 'Schedule Shift'}
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
