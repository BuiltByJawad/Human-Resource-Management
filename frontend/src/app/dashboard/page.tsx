import { cookies } from 'next/headers'

import {
  DashboardPageClient,
  type DashboardStats,
  type RecentActivity,
  type UpcomingEvent,
} from './DashboardPageClient'

type JsonRecord = Record<string, unknown>

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null
}

function readRecordField<T>(record: JsonRecord, key: string): T | undefined {
  return record[key] as T | undefined
}

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

    const payload: unknown = await response.json().catch(() => null)
    const root: unknown = isRecord(payload) ? readRecordField<unknown>(payload, 'data') ?? payload : payload
    if (!isRecord(root)) return null

    const data = root

    return {
      totalEmployees: Number(readRecordField<unknown>(data, 'totalEmployees')) || 0,
      activeEmployees: Number(readRecordField<unknown>(data, 'activeEmployees')) || 0,
      totalDepartments: Number(readRecordField<unknown>(data, 'totalDepartments')) || 0,
      pendingLeaveRequests: Number(readRecordField<unknown>(data, 'pendingLeaveRequests')) || 0,
      totalPayroll: Number(readRecordField<unknown>(data, 'totalPayroll')) || 0,
      attendanceRate: Number(readRecordField<unknown>(data, 'attendanceRate')) || 0
    }
  } catch {
    return null
  }
}

async function fetchInitialRecentActivities(token: string | null): Promise<RecentActivity[] | null> {
  if (!token) return null

  try {
    const response = await fetch(`${buildApiBase()}/api/leave?limit=8&page=1`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    })

    if (!response.ok) {
      return null
    }

    const payload: unknown = await response.json().catch(() => null)
    const root: unknown = isRecord(payload) ? readRecordField<unknown>(payload, 'data') ?? payload : payload

    const leaveRequests: unknown[] = Array.isArray(root)
      ? root
      : isRecord(root)
      ? (Array.isArray(readRecordField<unknown>(root, 'leaveRequests'))
          ? (readRecordField<unknown[]>(root, 'leaveRequests') ?? [])
          : [])
      : []

    return leaveRequests.map((leaveUnknown) => {
      const leave = isRecord(leaveUnknown) ? leaveUnknown : ({} as JsonRecord)
      const employeeUnknown = readRecordField<unknown>(leave, 'employee')
      const employee = isRecord(employeeUnknown) ? employeeUnknown : ({} as JsonRecord)

      const firstName = String(readRecordField<unknown>(employee, 'firstName') ?? 'Employee')
      const lastName = String(readRecordField<unknown>(employee, 'lastName') ?? '')
      const employeeName = `${firstName} ${lastName}`.trim().replace(/\s+/g, ' ') || 'Employee'

      const createdAtRaw = readRecordField<unknown>(leave, 'createdAt')
      const createdAt = typeof createdAtRaw === 'string' ? new Date(createdAtRaw) : null
      const timestamp = createdAt
        ? new Intl.DateTimeFormat('en-US', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
          }).format(createdAt)
        : ''

      return {
        id: String(readRecordField<unknown>(leave, 'id') ?? crypto.randomUUID()),
        type: 'leave' as const,
        description: readRecordField<unknown>(leave, 'reason')
          ? `requested leave: ${String(readRecordField<unknown>(leave, 'reason'))}`
          : 'requested leave',
        timestamp,
        employee: employeeName,
      }
    })
  } catch {
    return null
  }
}

async function fetchInitialUpcomingEvents(token: string | null): Promise<UpcomingEvent[] | null> {
  if (!token) return null

  try {
    const response = await fetch(`${buildApiBase()}/api/analytics/events`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    })

    if (!response.ok) {
      return null
    }

    const payload: unknown = await response.json().catch(() => null)
    const root: unknown = isRecord(payload) ? readRecordField<unknown>(payload, 'data') ?? payload : payload
    if (!Array.isArray(root)) return []

    return root.map((eventUnknown) => {
      const event = isRecord(eventUnknown) ? eventUnknown : ({} as JsonRecord)
      const rawDateValue = readRecordField<unknown>(event, 'date')
      const rawDate = typeof rawDateValue === 'string' ? new Date(rawDateValue) : null
      const date = rawDate
        ? new Intl.DateTimeFormat('en-US', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
          }).format(rawDate)
        : ''

      return {
        id: String(readRecordField<unknown>(event, 'id') ?? crypto.randomUUID()),
        title: String(readRecordField<unknown>(event, 'title') ?? 'Upcoming event'),
        date,
        type: String(readRecordField<unknown>(event, 'type') ?? 'deadline'),
      }
    })
  } catch {
    return null
  }
}

export default async function DashboardPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('accessToken')?.value ?? null
  const refreshToken = cookieStore.get('refreshToken')?.value ?? null
  const initialHasSession = !!token || !!refreshToken
  const [initialStats, initialRecentActivities, initialUpcomingEvents] = await Promise.all([
    fetchInitialStats(token),
    fetchInitialRecentActivities(token),
    fetchInitialUpcomingEvents(token),
  ])

  return (
    <DashboardPageClient
      initialStats={initialStats}
      initialHasSession={initialHasSession}
      initialRecentActivities={initialRecentActivities}
      initialUpcomingEvents={initialUpcomingEvents}
    />
  )
}