import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import { ShiftsPageClient } from './ShiftsPageClient'
import type { Shift } from '@/features/shifts'
import { fetchCurrentUser } from '@/features/auth/services/auth.api'
import { getShifts } from '@/features/shifts'

export default async function ShiftsPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('accessToken')?.value ?? null
  const user = await fetchCurrentUser(token ?? undefined)
  const employeeId = user?.employee?.id ?? null
  if (!employeeId) {
    redirect('/dashboard')
  }
  const today = new Date()
  const initialShifts = token
    ? await getShifts(today.toISOString(), today.toISOString(), token ?? undefined)
    : []

  return <ShiftsPageClient initialShifts={initialShifts} initialDateISO={today.toISOString()} />
}
