import type { BenefitEnrollmentPayload, BenefitPlan, EmployeeOption } from '@/services/benefits/types'

interface BenefitEnrollmentFormProps {
  employees: EmployeeOption[]
  plans: BenefitPlan[]
  values: BenefitEnrollmentPayload
  onChange: (next: BenefitEnrollmentPayload) => void
  onSubmit: (event: React.FormEvent) => void
  disabled?: boolean
}

export function BenefitEnrollmentForm({ employees, plans, values, onChange, onSubmit, disabled }: BenefitEnrollmentFormProps) {
  return (
    <div className="bg-white p-5 rounded-lg shadow border border-gray-100">
      <h2 className="text-lg font-semibold mb-4">Enroll Employee</h2>
      <form className="space-y-4" onSubmit={onSubmit}>
        <div>
          <label className="text-sm font-medium text-gray-700">Employee</label>
          <select
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
            value={values.employeeId}
            onChange={(e) => onChange({ ...values, employeeId: e.target.value })}
            required
          >
            <option value="">Select employee</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.name} • {emp.email}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">Benefit Plan</label>
          <select
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
            value={values.benefitPlanId}
            onChange={(e) => onChange({ ...values, benefitPlanId: e.target.value })}
            required
          >
            <option value="">Select plan</option>
            {plans.map((plan) => (
              <option key={plan.id} value={plan.id}>
                {plan.name} · {plan.type}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">Coverage Start Date</label>
          <input
            type="date"
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
            value={values.coverageStartDate}
            onChange={(e) => onChange({ ...values, coverageStartDate: e.target.value })}
            required
          />
        </div>
        <button
          type="submit"
          disabled={disabled}
          className="w-full rounded bg-blue-600 text-white py-2 text-sm font-semibold hover:bg-blue-700 disabled:opacity-60"
        >
          {disabled ? 'Submitting...' : 'Enroll Employee'}
        </button>
      </form>
    </div>
  )
}
