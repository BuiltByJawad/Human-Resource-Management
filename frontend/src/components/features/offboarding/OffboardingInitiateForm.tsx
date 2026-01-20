import { DatePicker } from '@/components/ui/FormComponents'
import { format } from 'date-fns'
import type { OffboardingEmployeeOption } from '@/services/offboarding/api'

interface OffboardingInitiateFormProps {
  employees: OffboardingEmployeeOption[]
  form: { employeeId: string; exitDate: string; reason: string; notes: string }
  errors: { employeeId?: string; exitDate?: string }
  onFormChange: (next: Partial<{ employeeId: string; exitDate: string; reason: string; notes: string }>) => void
  onErrorClear: (field: 'employeeId' | 'exitDate') => void
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void
  disabled?: boolean
}

export function OffboardingInitiateForm({
  employees,
  form,
  errors,
  onFormChange,
  onErrorClear,
  onSubmit,
  disabled,
}: OffboardingInitiateFormProps) {
  return (
    <section className="bg-white rounded-lg border border-gray-100 shadow p-5">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Initiate Offboarding</h2>
      <form className="grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={onSubmit} noValidate>
        <div className="md:col-span-1">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
            <span>Employee</span>
            <span className="text-red-500">*</span>
          </label>
          <select
            className={`mt-1 w-full rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
              errors.employeeId ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
            }`}
            value={form.employeeId}
            onChange={(e) => {
              onFormChange({ employeeId: e.target.value })
              if (errors.employeeId) onErrorClear('employeeId')
            }}
          >
            <option value="">Select employee</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.name} • {emp.email}
              </option>
            ))}
          </select>
          {errors.employeeId && <p className="mt-1 text-sm text-red-600">{errors.employeeId}</p>}
        </div>
        <div>
          <DatePicker
            label="Exit Date"
            required
            value={form.exitDate}
            onChange={(date) => onFormChange({ exitDate: date ? format(date, 'yyyy-MM-dd') : '' })}
            error={errors.exitDate}
          />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">Reason</label>
          <input
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
            value={form.reason}
            onChange={(e) => onFormChange({ reason: e.target.value })}
            placeholder="Resignation, termination, etc."
          />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">Notes</label>
          <textarea
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
            rows={3}
            value={form.notes}
            onChange={(e) => onFormChange({ notes: e.target.value })}
          />
        </div>
        <div className="md:col-span-2">
          <button
            type="submit"
            className="w-full rounded bg-blue-600 text-white py-2 text-sm font-semibold hover:bg-blue-700"
            disabled={disabled}
          >
            {disabled ? 'Submitting...' : 'Start Offboarding'}
          </button>
        </div>
      </form>
    </section>
  )
}
