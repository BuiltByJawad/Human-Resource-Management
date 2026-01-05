import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import { ShiftsPageClient } from './ShiftsPageClient'
import type { Shift } from '@/features/shifts'
import { getShifts } from '@/features/shifts'
import { fetchEmployeesForManagers } from '@/features/employees'

function getWeekRange(): { startDate: string; endDate: string } {
  const now = new Date()
  const dayOfWeek = now.getDay()
  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - dayOfWeek)
  startOfWeek.setHours(0, 0, 0, 0)

  const endOfWeek = new Date(startOfWeek)
  endOfWeek.setDate(startOfWeek.getDate() + 6)
  endOfWeek.setHours(23, 59, 59, 999)

  return {
    startDate: startOfWeek.toISOString(),
    endDate: endOfWeek.toISOString()
  }
}

export default async function ShiftsPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('accessToken')?.value ?? null
  if (!token) {
    redirect('/auth/login')
  }

  const { startDate, endDate } = getWeekRange()

  const [shifts, employees] = await Promise.all([
    token ? getShifts(startDate, endDate, token ?? undefined) : [],
    fetchEmployeesForManagers(token ?? undefined)
  ])

  return <ShiftsPageClient initialShifts={shifts as Shift[]} employees={employees} />
}
