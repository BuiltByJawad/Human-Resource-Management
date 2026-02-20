"use client"

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'

import { LeavePolicyHeader } from '@/components/features/settings/leave-policy/LeavePolicyHeader'
import { LeavePolicyAccessCard } from '@/components/features/settings/leave-policy/LeavePolicyAccessCard'
import { LeaveTypesCard } from '@/components/features/settings/leave-policy/LeaveTypesCard'
import { HolidayCalendarCard } from '@/components/features/settings/leave-policy/HolidayCalendarCard'
import { useLeavePolicyPage } from '@/hooks/useLeavePolicyPage'
import type { LeavePolicyPayload } from '@/services/leave-policy/types'

interface LeavePolicyPageClientProps {
  initialLeavePolicy: LeavePolicyPayload
}

export default function LeavePolicyPageClient({ initialLeavePolicy }: LeavePolicyPageClientProps) {
  const router = useRouter()
  const {
    canManage,
    policies,
    holidaysText,
    isSaving,
    leaveTypes,
    setHolidaysText,
    updatePolicyField,
    handleSave,
  } = useLeavePolicyPage({ initialLeavePolicy })

  const handleSaveAndRefresh = useCallback(async () => {
    const ok = await handleSave()
    if (ok) router.refresh()
  }, [handleSave, router])

  return (
    <>
      <div className="p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Leave Policy</h1>
          <p className="text-sm text-gray-600 mb-8">Configure leave entitlements, carry-forward rules, and holidays.</p>

          <div className="space-y-6">
            <LeavePolicyHeader
              onBack={() => router.push('/settings')}
              onSave={handleSaveAndRefresh}
              isSaving={isSaving}
              canManage={canManage}
            />

            <LeavePolicyAccessCard canManage={canManage} />

            <LeaveTypesCard
              leaveTypes={leaveTypes}
              policies={policies}
              canManage={canManage}
              onUpdatePolicy={updatePolicyField}
            />

            <HolidayCalendarCard
              holidaysText={holidaysText}
              onChange={setHolidaysText}
              canManage={canManage}
            />
          </div>
        </div>
      </div>
    </>
  )
}
