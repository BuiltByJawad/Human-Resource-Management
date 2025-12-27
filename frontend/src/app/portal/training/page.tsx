import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import type { EmployeeTraining } from '@/services/trainingService'
import { TrainingPageClient } from './TrainingPageClient'

function buildApiBase() {
  return (
    process.env.BACKEND_URL ||
    (process.env.NEXT_PUBLIC_API_URL ? process.env.NEXT_PUBLIC_API_URL.replace(/\/api$/, '') : null) ||
    'http://localhost:5000'
  )
}

async function fetchCurrentUser() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('accessToken')?.value
    if (!token) {
      return { user: null, token: null }
    }

    const response = await fetch(`${buildApiBase()}/api/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    })

    if (!response.ok) {
      return { user: null, token: null }
    }

    const payload = await response.json().catch(() => null)
    const data = payload?.data ?? payload
    return { user: data?.user ?? data ?? null, token }
  } catch {
    return { user: null, token: null }
  }
}

async function fetchInitialCourses(token: string | null): Promise<EmployeeTraining[]> {
  try {
    if (!token) return []
    const base = buildApiBase()
    const response = await fetch(`${base}/api/training/my-courses`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store'
    })
    if (!response.ok) {
      return []
    }
    const payload = await response.json().catch(() => null)
    const data = payload?.data ?? payload
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

export default async function TrainingDashboard() {
  const { user, token } = await fetchCurrentUser()
  const employeeId = user?.employee?.id ?? null
  if (!employeeId) {
    redirect('/dashboard')
  }

  const initialCourses = await fetchInitialCourses(token)
  return <TrainingPageClient initialCourses={initialCourses} />
}
