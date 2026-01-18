import { Card, Input } from '@/components/ui/FormComponents'
import type { EditablePolicy, LeavePolicyTypeConfig, LeaveTypeKey } from '@/services/leave-policy/types'

interface LeaveTypesCardProps {
  leaveTypes: LeavePolicyTypeConfig[]
  policies: Record<LeaveTypeKey, EditablePolicy>
  canManage: boolean
  onUpdatePolicy: (type: LeaveTypeKey, field: keyof EditablePolicy, value: string | boolean) => void
}

export const LeaveTypesCard = ({
  leaveTypes,
  policies,
  canManage,
  onUpdatePolicy,
}: LeaveTypesCardProps) => (
  <Card title="Leave Types">
    <div className="space-y-6">
      {leaveTypes.map((type) => {
        const current = policies[type.key]
        return (
          <div key={type.key} className="rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-gray-900">{type.label}</h4>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={current.accrualEnabled}
                  onChange={(e) => onUpdatePolicy(type.key, 'accrualEnabled', e.target.checked)}
                />
                Accrual enabled
              </label>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <Input
                label="Annual Entitlement (days)"
                inputMode="numeric"
                value={current.annualEntitlementDays}
                onChange={(e) => onUpdatePolicy(type.key, 'annualEntitlementDays', e.target.value)}
                disabled={!canManage}
              />
              <Input
                label="Carry-forward Max (days)"
                inputMode="numeric"
                value={current.carryForwardMaxDays}
                onChange={(e) => onUpdatePolicy(type.key, 'carryForwardMaxDays', e.target.value)}
                disabled={!canManage}
              />
            </div>

            <p className="mt-3 text-xs text-gray-500">
              Frequency is monthly. New hires are prorated automatically based on hire date.
            </p>
          </div>
        )
      })}
    </div>
  </Card>
)
