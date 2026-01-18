import { cookies } from 'next/headers'
import { BurnoutAnalyticsPageClient } from './BurnoutAnalyticsPageClient'
import { fetchBurnoutAnalyticsServer } from '@/services/analytics/burnout/api'

const FALLBACK_PERIOD = 30

interface BurnoutPageProps {
  searchParams?: { period?: string }
}

export default async function BurnoutAnalyticsPage({ searchParams }: BurnoutPageProps) {
  const cookieStore = await cookies()
  const token = cookieStore.get('accessToken')?.value ?? null

  const periodParam = searchParams?.period
  const parsedPeriod = periodParam ? Number.parseInt(periodParam, 10) : FALLBACK_PERIOD
  const initialPeriod = Number.isNaN(parsedPeriod) ? FALLBACK_PERIOD : parsedPeriod

  const initialData = await fetchBurnoutAnalyticsServer(token, initialPeriod)

  return (
    <BurnoutAnalyticsPageClient
      initialPeriod={initialPeriod}
      initialData={initialData}
      canViewAnalytics={false}
    />
  )
}
