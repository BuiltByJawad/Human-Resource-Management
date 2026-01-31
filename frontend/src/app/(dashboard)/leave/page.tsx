import { LeavePageClient } from './LeavePageClient'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { fetchCurrentUser, fetchLeaveRequests } from '@/lib/hrmData'

export default async function LeavePage() {
	const cookieStore = await cookies()
	const token = cookieStore.get('accessToken')?.value ?? null
	const user = await fetchCurrentUser(token ?? undefined)
	const employeeId = user?.employee?.id ?? null
	if (!employeeId) {
		redirect('/dashboard')
	}

	const initialRequests = await fetchLeaveRequests({}, token ?? undefined)
	return <LeavePageClient initialRequests={initialRequests} />
}
