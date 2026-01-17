import type { BenefitPlanPayload } from '@/services/benefits/types'

const planTypes = ['Health', 'Dental', 'Vision', 'Retirement', 'Other']

interface BenefitPlanFormProps {
  values: BenefitPlanPayload
  onChange: (next: BenefitPlanPayload) => void
  onSubmit: (event: React.FormEvent) => void
  disabled?: boolean
}

export function BenefitPlanForm({ values, onChange, onSubmit, disabled }: BenefitPlanFormProps) {
  return (
    <div className="bg-white p-5 rounded-lg shadow border border-gray-100">
      <h2 className="text-lg font-semibold mb-4">Create Benefit Plan</h2>
      <form className="space-y-4" onSubmit={onSubmit}>
        <div>
          <label className="text-sm font-medium text-gray-700">Name</label>
          <input
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
            value={values.name}
            onChange={(e) => onChange({ ...values, name: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">Type</label>
          <select
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
            value={values.type}
            onChange={(e) => onChange({ ...values, type: e.target.value })}
          >
            {planTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Cost to Employee</label>
            <input
              type="number"
              min={0}
              step="0.01"
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
              value={values.costToEmployee}
              onChange={(e) => onChange({ ...values, costToEmployee: Number(e.target.value) })}
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Cost to Company</label>
            <input
              type="number"
              min={0}
              step="0.01"
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
              value={values.costToCompany}
              onChange={(e) => onChange({ ...values, costToCompany: Number(e.target.value) })}
              required
            />
          </div>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">Provider</label>
          <input
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
            value={values.provider}
            onChange={(e) => onChange({ ...values, provider: e.target.value })}
          />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">Description</label>
          <textarea
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
            rows={3}
            value={values.description}
            onChange={(e) => onChange({ ...values, description: e.target.value })}
          />
        </div>
        <button
          type="submit"
          disabled={disabled}
          className="w-full rounded bg-blue-600 text-white py-2 text-sm font-semibold hover:bg-blue-700 disabled:opacity-60"
        >
          {disabled ? 'Saving...' : 'Create Plan'}
        </button>
      </form>
    </div>
  )
}
