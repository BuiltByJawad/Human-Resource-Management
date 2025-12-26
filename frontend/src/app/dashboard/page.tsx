import { cookies } from 'next/headers'

import { DashboardPageClient, type DashboardStats } from './DashboardPageClient'

function buildApiBase() {
  return (
    process.env.BACKEND_URL ||
    (process.env.NEXT_PUBLIC_API_URL ? process.env.NEXT_PUBLIC_API_URL.replace(/\/api$/, '') : null) ||
    'http://localhost:5000'
  )
}

async function fetchInitialStats(token: string | null): Promise<DashboardStats | null> {
  if (!token) {
    return null
  }

  try {
    const response = await fetch(`${buildApiBase()}/api/dashboard/stats`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      cache: 'no-store'
    })

    if (!response.ok) {
      return null
    }

    const payload = await response.json().catch(() => null)
    const data = payload?.data ?? payload
    if (!data) {
      return null
    }

    return {
      totalEmployees: Number(data.totalEmployees) || 0,
      activeEmployees: Number(data.activeEmployees) || 0,
      totalDepartments: Number(data.totalDepartments) || 0,
      pendingLeaveRequests: Number(data.pendingLeaveRequests) || 0,
      totalPayroll: Number(data.totalPayroll) || 0,
      attendanceRate: Number(data.attendanceRate) || 0
    }
  } catch {
    return null
  }
}

export default async function DashboardPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('accessToken')?.value ?? null
  const initialStats = await fetchInitialStats(token)

  return <DashboardPageClient initialStats={initialStats} canFetchStats={!!token} />
}