"use client"

import { useCallback, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

import api from '@/lib/axios'
import DashboardShell from '@/components/ui/DashboardShell'
import { Card, Button, Input } from '@/components/ui/FormComponents'
import { useToast } from '@/components/ui/ToastProvider'
import { useAuthStore } from '@/store/useAuthStore'
import { PERMISSIONS } from '@/constants/permissions'

export type LeaveTypeKey = 'annual' | 'sick' | 'personal' | 'maternity' | 'paternity' | 'unpaid'

export type LeavePolicyPayload = {
  policies?: Partial<
    Record<
      LeaveTypeKey,
      {
        annualEntitlementDays: number
        carryForwardMaxDays?: number
        accrual?: {
          enabled: boolean
          frequency: 'monthly'
        }
      }
    >
  >
  calendar?: {
    holidays?: string[]
  }
}

const LEAVE_TYPES: { key: LeaveTypeKey; label: string; defaultEntitlement: number; defaultCarry: number; accrualDefault: boolean }[] = [
  { key: 'annual', label: 'Annual', defaultEntitlement: 20, defaultCarry: 5, accrualDefault: true },
  { key: 'sick', label: 'Sick', defaultEntitlement: 10, defaultCarry: 0, accrualDefault: false },
  { key: 'personal', label: 'Personal', defaultEntitlement: 5, defaultCarry: 0, accrualDefault: false },
  { key: 'maternity', label: 'Maternity', defaultEntitlement: 90, defaultCarry: 0, accrualDefault: false },
  { key: 'paternity', label: 'Paternity', defaultEntitlement: 14, defaultCarry: 0, accrualDefault: false },
  { key: 'unpaid', label: 'Unpaid', defaultEntitlement: 0, defaultCarry: 0, accrualDefault: false },
]

type EditablePolicy = {
  annualEntitlementDays: string
  carryForwardMaxDays: string
  accrualEnabled: boolean
}

interface LeavePolicyPageClientProps {
  initialLeavePolicy: LeavePolicyPayload
}

const normalizeHolidayList = (value: string): string[] => {
  return value
    .split(/\r?\n/)
    .map((v) => v.trim())
    .filter(Boolean)
}

const isValidIsoDate = (value: string): boolean => /^\d{4}-\d{2}-\d{2}$/.test(value)

export default function LeavePolicyPageClient({ initialLeavePolicy }: LeavePolicyPageClientProps) {
  const router = useRouter()
  const { showToast } = useToast()
  const { hasPermission } = useAuthStore()

  const canManage = hasPermission(PERMISSIONS.MANAGE_LEAVE_POLICIES)

  const initialPolicies = useMemo(() => {
    const policies = initialLeavePolicy.policies ?? {}
    const map: Record<LeaveTypeKey, EditablePolicy> = {} as Record<LeaveTypeKey, EditablePolicy>

    for (const type of LEAVE_TYPES) {
      const existing = policies[type.key]
      map[type.key] = {
        annualEntitlementDays: String(existing?.annualEntitlementDays ?? type.defaultEntitlement),
        carryForwardMaxDays: String(existing?.carryForwardMaxDays ?? type.defaultCarry),
        accrualEnabled: existing?.accrual?.enabled ?? type.accrualDefault,
      }
    }

    return map
  }, [initialLeavePolicy])

  const [policies, setPolicies] = useState<Record<LeaveTypeKey, EditablePolicy>>(initialPolicies)
  const [holidaysText, setHolidaysText] = useState(
    (initialLeavePolicy.calendar?.holidays ?? []).join('\n')
  )
  const [isSaving, setIsSaving] = useState(false)

  const updatePolicyField = useCallback((type: LeaveTypeKey, field: keyof EditablePolicy, value: string | boolean) => {
    setPolicies((prev) => ({
      ...prev,
      [type]: {
        ...prev[type],
        [field]: value as any,
      },
    }))
  }, [])

  const handleSave = useCallback(async () => {
    if (!canManage) {
      showToast('You do not have permission to manage leave policies', 'error')
      return
    }

    const holidays = normalizeHolidayList(holidaysText)
    const invalidHoliday = holidays.find((h) => !isValidIsoDate(h))
    if (invalidHoliday) {
      showToast(`Invalid holiday date: ${invalidHoliday} (use YYYY-MM-DD)`, 'error')
      return
    }

    const payload: LeavePolicyPayload = {
      policies: {},
      calendar: { holidays },
    }

    for (const type of LEAVE_TYPES) {
      const current = policies[type.key]
      const entitlement = Number(current.annualEntitlementDays)
      const carryForward = Number(current.carryForwardMaxDays)

      if (!Number.isFinite(entitlement) || entitlement < 0) {
        showToast(`${type.label}: Annual entitlement must be a valid number`, 'error')
        return
      }

      if (!Number.isFinite(carryForward) || carryForward < 0) {
        showToast(`${type.label}: Carry-forward max must be a valid number`, 'error')
        return
      }

      payload.policies![type.key] = {
        annualEntitlementDays: entitlement,
        carryForwardMaxDays: carryForward,
        accrual: {
          enabled: current.accrualEnabled,
          frequency: 'monthly',
        },
      }
    }

    setIsSaving(true)
    try {
      const res = await api.put('/org/leave-policy', payload)
      if (res.data?.success) {
        showToast('Leave policy saved', 'success')
        router.refresh()
      } else {
        showToast('Failed to save leave policy', 'error')
      }
    } catch (error: any) {
      const message =
        error?.response?.data?.error?.message ||
        error?.response?.data?.message ||
        error?.message ||
        'Failed to save leave policy'
      showToast(message, 'error')
    } finally {
      setIsSaving(false)
    }
  }, [canManage, holidaysText, policies, router, showToast])

  return (
    <DashboardShell>
      <div className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Leave Policy</h1>
          <p className="text-sm text-gray-600 mb-8">Configure leave entitlements, carry-forward rules, and holidays.</p>

          <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={() => router.push('/settings')}>
            Back to Settings
          </Button>
          <Button variant="primary" onClick={handleSave} loading={isSaving} disabled={!canManage}>
            Save Policy
          </Button>
        </div>

        {!canManage ? (
          <Card title="Access Restricted">
            <p className="text-sm text-gray-600">You do not have permission to manage leave policies.</p>
          </Card>
        ) : null}

        <Card title="Leave Types">
          <div className="space-y-6">
            {LEAVE_TYPES.map((t) => {
              const current = policies[t.key]
              return (
                <div key={t.key} className="rounded-lg border border-gray-200 p-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-gray-900">{t.label}</h4>
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={current.accrualEnabled}
                        onChange={(e) => updatePolicyField(t.key, 'accrualEnabled', e.target.checked)}
                      />
                      Accrual enabled
                    </label>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                    <Input
                      label="Annual Entitlement (days)"
                      inputMode="numeric"
                      value={current.annualEntitlementDays}
                      onChange={(e) => updatePolicyField(t.key, 'annualEntitlementDays', e.target.value)}
                      disabled={!canManage}
                    />
                    <Input
                      label="Carry-forward Max (days)"
                      inputMode="numeric"
                      value={current.carryForwardMaxDays}
                      onChange={(e) => updatePolicyField(t.key, 'carryForwardMaxDays', e.target.value)}
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

        <Card title="Holiday Calendar">
          <p className="text-sm text-gray-600 mb-3">One date per line in YYYY-MM-DD format. Holidays are excluded from business day calculations.</p>
          <textarea
            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            rows={8}
            value={holidaysText}
            onChange={(e) => setHolidaysText(e.target.value)}
            placeholder="2026-01-01\n2026-03-26"
            disabled={!canManage}
          />
        </Card>
          </div>
        </div>
      </div>
    </DashboardShell>
  )
}
