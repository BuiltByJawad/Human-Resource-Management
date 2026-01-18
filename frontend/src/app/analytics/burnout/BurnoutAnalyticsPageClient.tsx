"use client"

import { useRouter } from "next/navigation"

import { useBurnoutAnalytics } from "@/hooks/useBurnoutAnalytics"
import type { BurnoutAnalyticsResponse } from "@/services/analytics/burnout/types"
import {
  AccessDeniedPanel,
  BurnoutHeader,
  BurnoutShell,
  BurnoutStatsGrid,
  EmptyState,
  LoadingState,
  RiskScoreCard,
  AtRiskList,
  WorkPatternChart,
} from "@/components/features/analytics/burnout"

interface BurnoutAnalyticsPageClientProps {
  initialPeriod: number
  initialData: BurnoutAnalyticsResponse | null
  canViewAnalytics: boolean
}

export function BurnoutAnalyticsPageClient({
  initialPeriod,
  initialData,
  canViewAnalytics,
}: BurnoutAnalyticsPageClientProps) {
  const router = useRouter()
  const { analyticsQuery, handlePeriodChange, period, resolvedCanView } = useBurnoutAnalytics({
    initialPeriod,
    initialData,
    canViewAnalytics,
  })

  if (resolvedCanView === false) {
    return (
      <BurnoutShell>
        <AccessDeniedPanel onBack={() => router.push("/dashboard")} />
      </BurnoutShell>
    )
  }

  if (analyticsQuery.isLoading) {
    return (
      <BurnoutShell>
        <LoadingState />
      </BurnoutShell>
    )
  }

  if (!analyticsQuery.data) {
    return (
      <BurnoutShell>
        <EmptyState />
      </BurnoutShell>
    )
  }

  const { summary, employees } = analyticsQuery.data
  const atRiskEmployees = employees.filter((employee) => employee.riskLevel === "Critical" || employee.riskLevel === "High")

  return (
    <BurnoutShell>
      <BurnoutHeader period={period} onPeriodChange={handlePeriodChange} onBack={() => router.back()} />

      <BurnoutStatsGrid summary={summary} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <RiskScoreCard summary={summary} />
        </div>

        <div className="lg:col-span-2">
          <AtRiskList employees={atRiskEmployees} />
        </div>
      </div>

      <div className="mt-6">
        <WorkPatternChart employees={employees} />
      </div>
    </BurnoutShell>
  )
}
